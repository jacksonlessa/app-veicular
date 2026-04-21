# TechSpec — Fase 1: Domínio e Infraestrutura Base

## Resumo Executivo

Esta fase constrói o núcleo Clean DDD do RodagemApp: Value Objects imutáveis, Entities, contratos de repositório, uma service de regra de negócio do abastecimento e a infraestrutura mínima (Prisma repos, NextAuth Credentials + argon2, interface de Mailer) que a Fase 2 consumirá. Não há endpoints de negócio nem UI — o entregável é código de domínio testado e um `authorize()` de NextAuth funcional ponta-a-ponta (verificável manualmente com um registro semeado no banco).

Decisões centrais: organização de `src/domain/` **por contexto** (`account/`, `vehicle/`, `fuel/`, `maintenance/`, `shared/`); **hierarquia de `DomainError`** com subclasses específicas; **argon2id** com parâmetros OWASP; **NoopMailer** como implementação default em dev e testes; **repositórios incrementais** (Account/User completos, demais stub com `NotImplementedError`); **`eslint-plugin-boundaries`** como gate obrigatório em CI; **Vitest** como runner de testes (zero-config com Next 15 + TS).

## Arquitetura do Sistema

### Visão Geral dos Componentes

```
src/
├── domain/
│   ├── shared/
│   │   ├── value-objects/
│   │   │   ├── email.vo.ts
│   │   │   └── invite-token.vo.ts
│   │   └── errors/
│   │       ├── domain.error.ts              # classe base abstrata
│   │       ├── invalid-value.error.ts
│   │       └── business-rule.error.ts
│   ├── account/
│   │   ├── entities/account.entity.ts
│   │   ├── entities/user.entity.ts
│   │   └── repositories/
│   │       ├── account.repository.ts        # interface
│   │       └── user.repository.ts           # interface
│   ├── vehicle/
│   │   ├── value-objects/{odometer,plate,vehicle-name}.vo.ts
│   │   ├── entities/vehicle.entity.ts
│   │   └── repositories/vehicle.repository.ts
│   ├── fuel/
│   │   ├── value-objects/{fuel-amount,fuel-price,fuel-date,kml}.vo.ts
│   │   ├── entities/fuelup.entity.ts
│   │   ├── services/fuelup.service.ts       # regra dos 3 campos + km/l
│   │   └── repositories/fuelup.repository.ts
│   └── maintenance/
│       ├── value-objects/{maintenance-date,item-quantity,item-price}.vo.ts
│       ├── entities/{maintenance,maintenance-item}.entity.ts
│       └── repositories/maintenance.repository.ts
│
├── application/
│   └── ports/
│       └── mailer.ts                        # interface Mailer + SendInvitePayload
│
├── infrastructure/
│   ├── database/
│   │   ├── prisma.client.ts                 # (da Fase 0) singleton
│   │   └── repositories/
│   │       ├── prisma-account.repository.ts
│   │       ├── prisma-user.repository.ts
│   │       ├── prisma-vehicle.repository.ts # stub parcial
│   │       ├── prisma-fuelup.repository.ts  # stub parcial
│   │       └── prisma-maintenance.repository.ts # stub parcial
│   ├── auth/
│   │   ├── nextauth.config.ts
│   │   └── password-hasher.ts               # argon2id wrapper
│   └── mailer/
│       └── noop.mailer.ts                   # Mailer default em dev/testes
│
└── app/
    └── api/auth/[...nextauth]/route.ts      # atualiza para usar nextauth.config

prisma/
└── schema.prisma                            # (da Fase 0 — sem mudanças)

tests/
└── unit/                                    # mirror da estrutura de src/domain
```

**Responsabilidades:**

- `domain/` — puro, zero imports de outras camadas.
- `application/ports/mailer.ts` — contrato que o domínio/use cases dependem; implementação injetada.
- `infrastructure/database/repositories/*` — implementam os contratos do domínio usando `prisma.client.ts`.
- `infrastructure/auth/nextauth.config.ts` — exporta o objeto `AuthOptions` consumido pelo route handler; `authorize()` delega em `UserRepository` + `PasswordHasher`.
- `infrastructure/mailer/noop.mailer.ts` — apenas loga a tentativa de envio; é o default até a Fase 2/7.

### Fluxo de Dados

Apenas um fluxo ponta-a-ponta é exercitado nesta fase: **login com credentials**.

```
POST /api/auth/callback/credentials
  → NextAuth authorize(credentials)
    → userRepository.findByEmail(Email)
    → passwordHasher.verify(hash, plain) [argon2id]
    → retorna { id, email, accountId } ou null
  → sessão criada com session.accountId
```

Nenhum outro caso de uso é disparado em runtime nesta fase.

## Design de Implementação

### Interfaces Principais

**Value Object base (pattern compartilhado):**

```typescript
// src/domain/shared/value-objects/value-object.ts
export abstract class ValueObject<T> {
  protected constructor(public readonly value: T) {}
  equals(other: ValueObject<T>): boolean {
    return other?.constructor === this.constructor && other.value === this.value;
  }
}
```

**Exemplo de VO:**

```typescript
// src/domain/shared/value-objects/email.vo.ts
export class Email extends ValueObject<string> {
  private static readonly RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  static create(input: string): Email {
    const v = input?.trim().toLowerCase();
    if (!v || !Email.RE.test(v)) throw new InvalidValueError("Email", input);
    return new Email(v);
  }
}
```

**Fuelup Service:**

```typescript
// src/domain/fuel/services/fuelup.service.ts
export type FuelupInput = {
  liters?: FuelAmount;
  pricePerLiter?: FuelPrice;
  totalPrice?: FuelPrice;
  currentOdometer: Odometer;
  currentFullTank: boolean;
  previous?: { odometer: Odometer; fullTank: boolean } | null;
};
export type FuelupComputed = {
  liters: FuelAmount;
  pricePerLiter: FuelPrice;
  totalPrice: FuelPrice;
  kml: Kml | null;
};
export class FuelupService {
  static compute(input: FuelupInput): FuelupComputed;
}
```

Regras:
- Exatamente 2 de 3 (`liters`, `pricePerLiter`, `totalPrice`) → calcula o terceiro. 0, 1 ou 3 → `BusinessRuleError("fuelup.three_fields")`.
- `kml = (current.odometer - previous.odometer) / liters` **somente se** `previous != null && previous.fullTank && currentFullTank && current.odometer > previous.odometer`. Caso contrário → `null`. Primeiro abastecimento sempre `null`.
- `Kml` VO valida `> 0 && <= 50`.

**Repository interfaces (só o mínimo para Fase 2):**

```typescript
// src/domain/account/repositories/user.repository.ts
export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;     // usado em Fase 2
}

// src/domain/account/repositories/account.repository.ts
export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  create(account: Account): Promise<Account>;  // usado em Fase 2
}
```

`VehicleRepository`, `FuelupRepository`, `MaintenanceRepository` declaram assinaturas completas (para guiar fases futuras) mas só `findById` (quando necessário ao session callback) é implementado; demais métodos lançam `NotImplementedError` nas classes Prisma.

**Port Mailer:**

```typescript
// src/application/ports/mailer.ts
export type SendInvitePayload = {
  to: Email;
  inviterName: string;
  accountName: string;
  acceptUrl: string;
};
export interface Mailer {
  sendInvite(payload: SendInvitePayload): Promise<void>;
}
```

**PasswordHasher:**

```typescript
// src/infrastructure/auth/password-hasher.ts
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}
export class Argon2PasswordHasher implements PasswordHasher { /* argon2id */ }
```

Parâmetros argon2id (OWASP 2024): `memoryCost: 19_456`, `timeCost: 2`, `parallelism: 1`, `type: argon2.argon2id`.

### Modelos de Dados

Schema Prisma **não muda** (todas as tabelas foram criadas na Fase 0). Mapeamento Row↔Entity vive em cada repositório Prisma em funções locais `toEntity(row)` / `toPersistence(entity)`. Entities expõem factory `rehydrate(props)` que **não** revalida regras (assume que os dados vêm do banco já consistentes), além de `create(input)` que valida.

### Endpoints de API

Nenhum endpoint novo. A rota existente `GET/POST /api/auth/[...nextauth]` é atualizada para importar `authOptions` de `infrastructure/auth/nextauth.config.ts`:

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**`authOptions` (resumo):**

```typescript
export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = Email.create(creds?.email ?? "");
        const user = await userRepository.findByEmail(email);
        if (!user) return null;
        const ok = await hasher.verify(user.passwordHash, creds!.password);
        return ok ? { id: user.id, email: user.email.value, accountId: user.accountId } : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.accountId = (user as any).accountId; return token; },
    async session({ session, token }) { (session as any).accountId = token.accountId; return session; },
  },
  pages: { signIn: "/login" },
};
```

Instâncias de `userRepository` e `hasher` são resolvidas por um factory simples em `infrastructure/container.ts` (função, não DI framework).

## Pontos de Integração

- **Prisma/SQLite** — já presente desde Fase 0. Repositórios consomem `prisma.client.ts`. Erros de unique constraint (email duplicado) são traduzidos para `BusinessRuleError("email.duplicate")` no `prisma-user.repository.ts`.
- **argon2 (npm)** — nova dependência (`argon2@^0.31`). Roda em Node runtime (não edge). NextAuth precisa rodar em runtime Node — garantir `export const runtime = "nodejs"` no route handler.
- **Mailer externo** — **não integra** nesta fase. `NoopMailer` só loga.

## Análise de Impacto

| Componente Afetado | Tipo de Impacto | Descrição & Risco | Ação Requerida |
|---|---|---|---|
| `src/domain/*` | Criação inicial (100% novo) | Sem impacto em código existente. Baixo risco. | Revisão de design |
| `src/infrastructure/database/repositories/*` | Criação | Consome `prisma.client` existente. Baixo risco. | — |
| `src/app/api/auth/[...nextauth]/route.ts` | Atualização | Passa de `providers: []` (stub) para Credentials funcional. Médio risco (regressão de auth scaffold). | Smoke test manual |
| `package.json` | Novas deps: `argon2`, `vitest`, `@vitest/coverage-v8`, `eslint-plugin-boundaries` | Baixo risco. | `npm install` |
| ESLint config | Nova regra `boundaries/element-types` | Pode quebrar `npm run lint` até código seguir regras. Médio risco. | Tunar rules durante dev |
| Schema Prisma | **Sem mudança** | — | — |

## Abordagem de Testes

### Testes Unitários (Vitest)

**Setup:** `vitest.config.ts` com `environment: "node"`, `coverage.provider: "v8"`, alias `@/` espelhando `tsconfig`.

**Cobertura obrigatória:**

1. **Todos os VOs** — caminho feliz, entradas inválidas (null, string vazia, fora de range, formato errado), normalização (trim/lowercase onde aplicável), `equals()`.
2. **Entities com lógica** — `Maintenance.addItem` recalcula `totalPrice`; `MaintenanceItem.subtotal = quantity × unitPrice`; `Account.addUser` respeita invariante de email único dentro da account (se aplicável à entity).
3. **FuelupService.compute** — matriz de testes:
   - 0/1/3 campos dos 3 → erro.
   - 2 campos × 3 combinações → calcula o terceiro, tolerância de ponto flutuante 1e-6.
   - `previous=null` → `kml=null`.
   - `previous.fullTank=false` ou `currentFullTank=false` → `kml=null`.
   - Ambos tanque cheio, `odometer` crescente → `kml` válido.
   - `odometer` decrescente ou igual → erro `BusinessRuleError("odometer.not_increasing")`.
4. **Argon2PasswordHasher** — `hash() + verify()` round-trip; `verify()` com senha errada → `false`; hash gerado não contém a senha em claro.
5. **Mapeadores Prisma** — `toEntity(row)` ↔ `toPersistence(entity)` round-trip para Account, User, Vehicle (sem tocar no DB; usa objetos POJO).

**Mocks:** apenas interfaces externas (nunca Prisma direto nos testes de domain — Prisma só aparece em testes de repositório, que ficam fora desta fase).

### Testes de Integração

Fora de escopo — Fase 8. Não se testa o `authorize()` contra Prisma real aqui (custo alto, valor baixo dado que suas partes estão cobertas unitariamente).

### Validação Manual

1. Seed manual: inserir uma `Account` + `User` com `passwordHash` gerado via `npx tsx scripts/hash.ts "senha123"`.
2. `POST /api/auth/callback/credentials` com `email` + `password` corretos → retorna cookie de sessão.
3. `GET /api/auth/session` retorna `{ user: {...}, accountId: "..." }`.
4. `npm run lint` falha ao adicionar um `import "@/infrastructure/..."` em qualquer arquivo de `src/domain/`.

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Deps + Vitest** — instalar `argon2`, `vitest`, `@vitest/coverage-v8`, `@types/node` (se faltar), `eslint-plugin-boundaries`; criar `vitest.config.ts`; adicionar scripts `test` e `test:coverage`.
2. **`eslint-plugin-boundaries`** — configurar elementos (`domain`, `application`, `infrastructure`, `app`, `components`) e regras de fronteira. Rodar `npm run lint` para baseline.
3. **Shared domain** — `ValueObject` base, hierarquia de `DomainError`, `Email`, `InviteToken` + testes.
4. **Account context** — VOs (se algum), `Account` e `User` entities + testes; interfaces de repositório.
5. **Vehicle context** — VOs (`Plate`, `Odometer`, `VehicleName`), `Vehicle` entity + testes; interface de repositório.
6. **Fuel context** — VOs, `Fuelup` entity, **`FuelupService`** (coração da fase) + suíte extensiva de testes; interface de repositório.
7. **Maintenance context** — VOs, `Maintenance` + `MaintenanceItem` entities (com `addItem` e `total`) + testes; interface de repositório.
8. **Application port** — `Mailer` interface + `SendInvitePayload`.
9. **Infra auth** — `Argon2PasswordHasher` + testes; `nextauth.config.ts` com `authorize()`.
10. **Infra repositories** — `prisma-account.repository.ts` e `prisma-user.repository.ts` completos; `prisma-vehicle/fuelup/maintenance.repository.ts` como classes com `findById` (se necessário) e demais métodos lançando `NotImplementedError`. Testes de mapeadores (POJO).
11. **Infra mailer** — `NoopMailer` (log) + teste trivial.
12. **Container** — `infrastructure/container.ts` exportando singletons (`userRepository`, `hasher`, `mailer`).
13. **Route handler** — atualizar `app/api/auth/[...nextauth]/route.ts` para usar `authOptions`.
14. **Validação manual** dos 4 critérios acima.

### Dependências Técnicas

- Fase 0 concluída (repo, Prisma, NextAuth stub, DDD folders).
- Node 20 LTS (argon2 precompilado).
- Nenhum serviço externo.

## Monitoramento e Observabilidade

Fora de escopo. Único log estruturado: `NoopMailer.sendInvite` imprime `[mailer:noop] sendInvite to=<email>` em `stdout` para facilitar debug em dev.

## Considerações Técnicas

### Decisões Principais

- **Organização por contexto (`domain/account/`, `domain/vehicle/`, etc.)** — favorece coesão e paralelização entre fases subsequentes. Alternativa rejeitada: pastas horizontais (`entities/`, `value-objects/`) — gera acoplamento conceitual cruzado.
- **Hierarquia de `DomainError`** — `DomainError` (abstrata) → `InvalidValueError` (VO), `BusinessRuleError` (regra com code). Alternativa rejeitada: erro único com `code` string — perde type-narrowing no consumidor.
- **argon2id com params OWASP** — balanço custo/segurança conhecido; evita definir valores ad-hoc.
- **NoopMailer como default** — permite a Fase 2 testar fluxos de convite sem escolher provider; Fase 7 decide o provider real.
- **`eslint-plugin-boundaries` agora (não Fase 8)** — quanto antes, menor a dívida técnica; evita refactor tardio.
- **Vitest sobre Jest** — inicialização mais rápida, ESM-first, integra com Vite/SWC sem configuração extra; Next 15 não exige Jest.
- **Repositórios parciais com `NotImplementedError`** — mantém a classe "visível" no container sem entregar código inchado. Fases 3/4/5 preenchem sem precisar criar a classe.
- **Sem `zod` no domínio** — validação viva nos VOs; zod entra só na borda (DTOs) a partir da Fase 2.

### Riscos Conhecidos

- **`argon2` em ambientes Next edge** — o package usa binding nativo; NextAuth callbacks precisam rodar em Node runtime. Mitigação: forçar `export const runtime = "nodejs"` no route handler e testar localmente antes de configurar Vercel (Fase 8).
- **`eslint-plugin-boundaries` excessivamente restritivo** — pode flagar imports legítimos durante bootstrap. Mitigação: configurar em modo `warn` no primeiro commit e subir para `error` após fase estabilizar.
- **Floating-point em `FuelupService`** — divisões com decimais podem introduzir drift. Mitigação: armazenar valores em unidades base (centavos para dinheiro, mililitros para volume) **ou** aceitar float e padronizar tolerância 1e-6 nos testes. Decisão atual: manter `Float` no Prisma (Fase 0) e arredondar apenas na apresentação; VOs validam com tolerância.
- **Primeiro abastecimento sem `previous`** — risco de `null` silencioso. Mitigação: `FuelupService` documenta contrato e testes cobrem explicitamente.

### Requisitos Especiais

- **Segurança:** senhas **nunca** aparecem em logs; `Argon2PasswordHasher.verify` sempre é `await`ed (evita leak por side-channel). Erros de `authorize()` retornam `null` genérico (sem distinguir "user não existe" de "senha errada").
- **LGPD:** `NoopMailer` loga email mas não payload de convite completo; `authorize()` não loga credenciais.

### Conformidade com Padrões

- **Clean DDD** — validado por `eslint-plugin-boundaries` (regra obrigatória em CI).
- **TypeScript strict** — mantido da Fase 0; VOs e Entities sem `any`.
- **Tratamento de erros** — domínio lança `DomainError`; camadas externas traduzem.
- **Testes** — Vitest, coverage mínima 90% nos módulos de domínio tocados nesta fase.
- **Commits** — seguir padrão das Fases anteriores (`<type>(fase-1-dominio-infra:N): ...`).
