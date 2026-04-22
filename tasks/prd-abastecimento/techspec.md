# TechSpec — Fase 4: Abastecimento

## Resumo Executivo

O domínio de abastecimento já está substancialmente pronto: `Fuelup` entity, todos os Value Objects (`FuelAmount`, `FuelPrice`, `FuelDate`, `Kml`, `Odometer`), a interface `FuelupRepository` e o serviço `FuelupService.compute()` (que aplica a regra dos 3 campos e calcula km/l) foram construídos na Fase 1. O `PrismaFuelupRepository` existe como stub lançando `NotImplementedError`. Esta fase preenche as três camadas faltantes — persistência, application (use cases) e entrega (API + UI) — seguindo o mesmo padrão já estabelecido em Fase 2 (Auth) e Fase 3 (Veículos).

A decisão arquitetural central é tratar a **recomputação em cascata de km/l** como responsabilidade do use case de `register/update/delete`: toda mutação dispara uma operação que percorre os abastecimentos do veículo em ordem cronológica e recalcula `kmPerLiter` + `currentOdometer` do veículo, tudo dentro de uma transação via `TransactionRunner` (extendendo o port criado na Fase 2 com duas novas operações). A UI reusa shadcn e segue fidelidade ao `FuelScreen` do protótipo.

## Arquitetura do Sistema

### Visão Geral dos Componentes

- **Domain (já existe):** `Fuelup`, `FuelupService.compute()`, `FuelupRepository`, VOs.
- **Infrastructure:** implementar `PrismaFuelupRepository` (6 métodos) e estender `TransactionRunner` com `saveFuelup` e `deleteFuelup`.
- **Application (novo):** 5 use cases em `src/application/usecases/fuelup/` — `register`, `list`, `get`, `update`, `delete`. Cada um valida autorização por `accountId` (o fuelup pertence a um veículo que pertence à conta da sessão).
- **API (novo):** `src/app/api/fuelups/route.ts` (GET/POST) e `src/app/api/fuelups/[id]/route.ts` (GET/PUT/DELETE), seguindo o mesmo padrão de `vehicles/`.
- **Frontend (novo):** página `/abastecimento` (criar), `/abastecimento/[id]` (editar), aba "Abastecimentos" em `/veiculos/[id]`, componente `FuelupForm` e hook client-side `useFuelupCalculator` que reflete a lógica do `FuelupService` para UX em tempo real.

**Fluxo de dados — criar um abastecimento:**
```
UI → fetch POST /api/fuelups → route handler
  → getServerSession → registerFuelupUseCase.execute
    → vehicleRepo.findById (valida owner)
    → fuelupRepo.findByVehicle (ordenado por data/odometer)
    → FuelupService.compute (regra 3 campos + km/l do novo)
    → recompute cascade (todos após o novo)
    → txRunner.saveFuelup (insert fuelup + update subsequentes + update vehicle.currentOdometer)
  → 201 { fuelupId }
```

## Design de Implementação

### Interfaces Principais

**`FuelupRepository`** (já existe, sem mudanças):
```ts
export interface FuelupRepository {
  findById(id: string): Promise<Fuelup | null>;
  findByVehicle(vehicleId: string): Promise<Fuelup[]>;
  findByVehiclePaginated(vehicleId: string, page: number, pageSize: number): Promise<{ items: Fuelup[]; total: number }>;
  findLastByVehicle(vehicleId: string): Promise<Fuelup | null>;
  create(fuelup: Fuelup): Promise<Fuelup>;
  update(fuelup: Fuelup): Promise<Fuelup>;
  delete(id: string): Promise<void>;
}
```

**`TransactionRunner`** (estender com):
```ts
saveFuelup(data: {
  upsert: Fuelup;                // fuelup criado ou editado
  recomputed: Fuelup[];          // abastecimentos posteriores recalculados
  vehicleId: string;
  newCurrentOdometer: number;    // maior odômetro entre todos os fuelups do veículo
}): Promise<void>;

deleteFuelup(data: {
  fuelupId: string;
  recomputed: Fuelup[];
  vehicleId: string;
  newCurrentOdometer: number;
}): Promise<void>;
```

**`RegisterFuelupUseCase`** (novo):
```ts
interface RegisterFuelupInput {
  accountId: string;
  userId: string;
  vehicleId: string;
  date: Date;
  odometer: number;
  fuelType: string;
  fullTank: boolean;
  liters?: number;
  pricePerLiter?: number;
  totalPrice?: number;
}
interface RegisterFuelupOutput { fuelupId: string }
```

`UpdateFuelupUseCase`, `DeleteFuelupUseCase`, `ListFuelupsUseCase`, `GetFuelupUseCase` seguem o mesmo estilo. Todos recebem `accountId` da sessão e validam ownership antes de operar.

### Modelos de Dados

**Schema Prisma** (já existe — não altera):
```prisma
model Fuelup {
  id            String   @id @default(cuid())
  vehicleId     String
  userId        String
  date          DateTime
  odometer      Int
  fuelType      String
  fullTank      Boolean
  liters        Float
  pricePerLiter Float
  totalPrice    Float
  kmPerLiter    Float?
  createdAt     DateTime @default(now())
  vehicle       Vehicle  @relation(fields: [vehicleId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
}
```

**Ordenação canônica** (usada em toda a cadeia de cálculo): `ORDER BY date ASC, odometer ASC, createdAt ASC`. Dois fuelups com mesma data+odômetro+createdAt são um erro — o VO `Odometer` já rejeita repetidos monotonicamente.

**DTO de resposta do histórico:**
```ts
type FuelupListItemDto = {
  id: string;
  date: string;          // ISO
  odometer: number;
  fuelType: string;
  fullTank: boolean;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  kmPerLiter: number | null;
};
```

### Endpoints de API

- `GET /api/fuelups?vehicleId=…&page=1&pageSize=20` — lista paginada, escopada por `accountId` da sessão. 401 se anônimo, 403 se o veículo não é da conta.
- `POST /api/fuelups` — body = `RegisterFuelupInput` sem `accountId`/`userId` (tirados da sessão). Validação Zod no boundary. 201 → `{ fuelupId }`.
- `GET /api/fuelups/[id]` — retorna detalhe do fuelup (404 se não pertence à conta).
- `PUT /api/fuelups/[id]` — mesmos campos de POST; dispara recálculo em cascata.
- `DELETE /api/fuelups/[id]` — 204 após apagar e recalcular em cascata.

Todas as rotas declaram `export const runtime = "nodejs"`, usam `getServerSession(authOptions)`, delegam ao use case e mapeiam erros via `mapDomainError`. `BusinessRuleError` codes esperados: `fuelup.three_fields`, `fuelup.total_mismatch`, `odometer.not_increasing`, `fuelup.not_found`, `vehicle.not_found`, `vehicle.not_owned`.

### Componente de Cálculo em Cascata

**Função `recalculateChain(fuelups: Fuelup[])`** — pura, no `src/application/usecases/fuelup/_shared/recalculate-chain.ts`:

1. Recebe a lista completa do veículo já ordenada canônicamente, **após** a inclusão/edição/remoção.
2. Itera do mais antigo ao mais novo; mantém referência do último `fullTank = true` visto.
3. Para cada fuelup com `fullTank = true` e que já tenha um tanque cheio anterior, calcula `km/l = (odômetro_atual − odômetro_último_cheio) / soma_litros_desde_o_último_cheio_inclusive`. (Regra clássica: se houve parciais no meio, eles entram no denominador.)
4. Retorna os fuelups com `kmPerLiter` atualizado (novos objetos via `Fuelup.rehydrate`).
5. Se o conjunto entrada é idêntico à saída (mesmos ids, mesmos km/l), o use case evita escrever no DB (otimização para GET-only paths — não se aplica a create/update/delete).

**Nota:** `FuelupService.compute` continua sendo usado pelo use case para validar a regra dos 3 campos e calcular totais do fuelup **sendo criado/editado**, mas o km/l final é atribuído pela `recalculateChain`, que é a fonte de verdade em cenários com parciais intercalados.

### Mappers (PrismaFuelupRepository)

```ts
function toEntity(raw: PrismaFuelup): Fuelup {
  return Fuelup.rehydrate({
    id: raw.id,
    vehicleId: raw.vehicleId,
    userId: raw.userId,
    date: FuelDate.create(raw.date),
    odometer: Odometer.create(raw.odometer),
    fuelType: raw.fuelType,
    fullTank: raw.fullTank,
    liters: FuelAmount.create(raw.liters),
    pricePerLiter: FuelPrice.create(raw.pricePerLiter),
    totalPrice: FuelPrice.create(raw.totalPrice),
    kmPerLiter: raw.kmPerLiter !== null ? Kml.create(raw.kmPerLiter) : null,
    createdAt: raw.createdAt,
  });
}
```

`toPersistence` é análogo ao de `PrismaVehicleRepository` — desembrulha VOs.

## Pontos de Integração

- **NextAuth session** (Fase 2): provê `session.accountId` e `session.userId` — usados em toda rota e propagados ao use case.
- **Container DI** (`src/infrastructure/container.ts`): registrar `fuelupRepository`, `registerFuelupUseCase`, `listFuelupsUseCase`, `getFuelupUseCase`, `updateFuelupUseCase`, `deleteFuelupUseCase`; estender `PrismaTransactionRunner` com os dois novos métodos.
- **VehicleRepository** (já existe): usado pelos use cases para validar ownership (`findById(vehicleId)` + comparar `vehicle.accountId === input.accountId`). Também é atualizado ao final de cada mutação para refletir o maior odômetro.
- **Sem integrações externas nesta fase.**

## Análise de Impacto

| Componente Afetado | Tipo de Impacto | Descrição & Nível de Risco | Ação Requerida |
|---|---|---|---|
| `PrismaFuelupRepository` | Implementação nova | Stubs `NotImplementedError` serão substituídos. Baixo risco. | Implementar + integration test |
| `TransactionRunner` port | Extensão de API | Adiciona `saveFuelup`, `deleteFuelup`. Baixo risco, interface aditiva. | Atualizar implementação Prisma + fakes nos testes |
| `container.ts` | Wiring | Adiciona 5 novos use cases + repo + métodos tx. Baixo risco. | Atualizar sem quebrar os existentes |
| `Vehicle` (tabela) | Mudança de dado | `currentOdometer` é atualizado a cada abastecimento. Médio risco se dois writers simultâneos. | Escrever dentro da mesma transação |
| Dashboard (`/dashboard`) | UI | Exibir km/l médio por veículo no `VehicleCard`. Baixo risco. | Adicionar lookup de último km/l |
| `/veiculos/[id]` | UI nova | Nova aba "Abastecimentos" com histórico. | Criar página (ainda não existe) |
| Fase 6 (Relatórios) | Dependência downstream | Cálculo de km/l consolidado e totalPrice agregado vão depender desta persistência. | — |
| Fase 5 (Manutenção) | Zero | Independente. | — |

## Abordagem de Testes

### Testes Unitários

- **Domínio (já coberto):** `Fuelup`, `FuelupService`, VOs — nenhuma mudança nesses testes.
- **`recalculateChain`:** suíte dedicada cobrindo: (a) sequência só com tanques cheios; (b) parciais entre dois cheios (soma de litros); (c) primeiro tanque cheio sem anterior → `kmPerLiter = null`; (d) edição retroativa invalida km/l de todos os posteriores; (e) exclusão do primeiro cheio zera o km/l do segundo.
- **Use cases:** cada use case testa seus erros (`vehicle.not_owned`, `fuelup.not_found`, `odometer.not_increasing`, `fuelup.three_fields`, `fuelup.total_mismatch`) e happy path. Fakes de `FuelupRepository`, `VehicleRepository` e `FakeTransactionRunner` seguem o padrão estabelecido em `tests/unit/application/usecases/account/`.
- **Frontend (componentes críticos):** `FuelupForm` com `useFuelupCalculator` — testes de comportamento do badge "calculado" e do toggle tanque cheio.

### Testes de Integração

- **`tests/integration/infrastructure/prisma-fuelup.repository.test.ts`** — cobre os 7 métodos do repositório contra SQLite em memória/arquivo (mesma infra usada em `prisma-vehicle.repository.test.ts`), incluindo ordem estável (`date`, `odometer`, `createdAt`).
- **`tests/integration/application/register-fuelup.usecase.test.ts`** — use case ponta-a-ponta com `PrismaTransactionRunner` real, valida que `fuelups.kmPerLiter` e `vehicles.currentOdometer` são atualizados atomicamente.

Cobertura mínima esperada: **80% statements nos novos arquivos**, sem mocks de repositórios reais nos testes de integração.

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Estender `TransactionRunner`** (port + `PrismaTransactionRunner` + fakes nos testes existentes).
2. **Implementar `PrismaFuelupRepository`** + integration test (todos os 7 métodos).
3. **Criar `recalculateChain` puro** + suíte unitária.
4. **Use cases (unit tests primeiro, TDD):** `register` → `update` → `delete` → `list` → `get`.
5. **Wiring no `container.ts`.**
6. **Rotas API** (GET/POST `/api/fuelups`, GET/PUT/DELETE `/api/fuelups/[id]`) com schema Zod no boundary.
7. **UI:** componente `useFuelupCalculator` (client), `FuelupForm.tsx`, página `/abastecimento`, página `/abastecimento/[id]`, aba "Abastecimentos" em `/veiculos/[id]`.
8. **Integração no dashboard:** botão "Abastecer" do `VehicleCard` → `/abastecimento?vehicleId=…` e exibição do km/l médio.
9. **Smoke test manual** + documentação em `tasks/prd-abastecimento/validation.md`.

### Dependências Técnicas

- Bloqueia: Fase 6 (Relatórios).
- Depende de: Fase 2 (sessão + `accountId`), Fase 3 (veículos cadastrados), Fase 1 (VOs e serviço — já prontos).
- **Nenhuma infraestrutura externa.**

## Monitoramento e Observabilidade

- **Logs:** cada mutação (`register`, `update`, `delete`) loga `accountId` + `vehicleId` + `fuelupId` em nível `info`. Erros de domínio vão ao `console.error` via `mapDomainError`.
- **Sem métricas Prometheus** (o MVP ainda não tem esse pipeline).
- Incluir nos logs de erro do TransactionRunner o tamanho da cadeia recalculada para detectar anomalias (ex.: veículo com 1000 abastecimentos).

## Considerações Técnicas

### Decisões Principais

- **Recálculo em cascata dentro de uma transação** — alternativa descartada: recomputação preguiçosa no GET. Rejeitada por complicar a API e quebrar a invariant de que `kmPerLiter` persistido é sempre correto; o custo extra de uma transação é negligível no MVP (≤ poucas dezenas de fuelups por veículo).
- **Estender `TransactionRunner` com operações tipadas** (em vez de expor `run(fn)` genérico) — mantém o port da Fase 2 coerente: toda operação atômica é declarada explicitamente.
- **Cálculo client-side espelha `FuelupService.compute`** — duplicação controlada para UX em tempo real; a fonte de verdade continua no servidor, que valida com o mesmo serviço.
- **Todos os usuários da conta podem editar/excluir qualquer abastecimento** — alinhado ao PRD (sem distinção de permissões).
- **Nenhum soft-delete em `Fuelup`** — diferente de `Vehicle` (que tem `deletedAt`), abastecimento é apagado fisicamente. Justificativa: não há requisito de histórico de exclusão; e soft-delete complicaria o cálculo em cascata (teria que filtrar `deletedAt IS NULL` em todos os paths).

### Riscos Conhecidos

- **Race condition em mutações simultâneas no mesmo veículo:** dois usuários criam abastecimento ao mesmo tempo, ambos leem o mesmo estado e gravam. **Mitigação:** a transação encapsula leitura + recálculo + escrita; para o MVP (2 usuários por conta, baixa frequência), SQLite/MySQL com isolation default é aceitável. Documentar como débito técnico para revisitar em produção.
- **Performance do recálculo em cascata** quando a cadeia crescer (ex.: edição de um abastecimento de 2 anos atrás): carrega todos os fuelups do veículo em memória. Aceitável para o MVP (poucos registros/ano). Se um veículo passar de ~1000 registros, migrar para batch update.
- **Arredondamento divergente entre front e back:** JS usa IEEE-754; o `FuelupService` arredonda explicitamente (`Math.round(x * 100) / 100` para preços, `* 1000 / 1000` para litros). O cálculo client-side deve replicar exatamente esse arredondamento.
- **Exclusão do primeiro tanque cheio da história:** confirmado no PRD — o segundo tanque cheio passa a ter `kmPerLiter = null`. A `recalculateChain` já cobre esse caso.

### Requisitos Especiais

- **Idempotência não é requerida** — POST cria sempre um novo registro; PUT sobrescreve; DELETE é idempotente por definição.
- **Nenhum dado considerado sensível para LGPD nesta fase** (confirmado no PRD).

### Conformidade com Padrões

- Clean Architecture / DDD: use cases dependem de ports (`FuelupRepository`, `TransactionRunner`), nunca de infraestrutura concreta. ✅
- Zod validation no boundary HTTP (padrão da Fase 2/3). ✅
- shadcn/ui + Tailwind tokens âmbar (padrão de UI do projeto). ✅
- Testes unitários com fakes em memória + testes de integração com Prisma real (padrão de Fase 3). ✅
- Runtime `nodejs` em todas as rotas da API. ✅
