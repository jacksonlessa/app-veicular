# TechSpec — Fase 0: Setup do Projeto

## Resumo Executivo

Esta fase instala e configura o esqueleto completo do **RodagemApp** sem implementar nenhuma regra de negócio. O entregável é um repositório Next.js 15 (App Router) + TypeScript strict, com Prisma apontando para SQLite local, NextAuth.js em scaffolding, Tailwind CSS v4 + shadcn/ui aplicando o tema Âmbar do protótipo `docs/RodagemApp.html`, e a estrutura Clean DDD de pastas pronta para receber as Fases 1–7.

Decisões centrais: **npm** como gerenciador de pacotes, **Node 20 LTS** fixado via `.nvmrc`, **SQLite em dev / MySQL só na Fase 8**, **tema Âmbar único (sem seletor)**, **arquitetura em camadas validada por convenção** (sem `eslint-plugin-boundaries` neste momento), **uma página `/` mínima de smoke test** renderizando logo + Button shadcn para validar o design system.

## Arquitetura do Sistema

### Visão Geral dos Componentes

```
src/
├── domain/               (vazio — Fase 1)
├── application/          (vazio — Fase 1)
├── infrastructure/
│   └── database/
│       └── prisma.client.ts     # singleton PrismaClient
├── app/
│   ├── layout.tsx               # carrega fonte Plus Jakarta Sans, <html lang="pt-BR">
│   ├── page.tsx                 # smoke test: logo + Button shadcn
│   ├── globals.css              # @import tailwind + CSS variables Âmbar
│   └── api/
│       └── auth/[...nextauth]/route.ts   # handler vazio de NextAuth
├── components/
│   └── ui/                      # shadcn/ui components + Logo
└── lib/
    └── utils.ts                 # cn() helper (shadcn)

prisma/
├── schema.prisma                # datasource sqlite + 7 models
└── migrations/
    └── <timestamp>_init/migration.sql
```

**Responsabilidades:**
- `prisma.client.ts` — exporta `PrismaClient` singleton (evita múltiplas conexões em hot-reload).
- `app/layout.tsx` — root layout, aplica a fonte e CSS variables.
- `app/api/auth/[...nextauth]/route.ts` — placeholder com `NextAuth({ providers: [] })`.
- `components/ui/*` — componentes shadcn + `Logo.tsx` custom.
- `lib/utils.ts` — `cn()` para merge de classes Tailwind.

### Fluxo de Dados

Nenhum fluxo funcional na Fase 0. A página `/` é estática e não consulta banco.

## Design de Implementação

### Configurações Principais

**`package.json` (dependências-chave):**

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "@prisma/client": "^5.x",
    "next-auth": "^4.24.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "class-variance-authority": "^0.7.x",
    "lucide-react": "^0.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^19.x",
    "prisma": "^5.x",
    "tailwindcss": "^4.x",
    "@tailwindcss/postcss": "^4.x",
    "eslint": "^9.x",
    "eslint-config-next": "^15.x",
    "prettier": "^3.x"
  }
}
```

**`tsconfig.json` (trechos relevantes):**

```json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**`.nvmrc`:** `20`

**`prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Account {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  users     User[]
  vehicles  Vehicle[]
  invites   Invite[]
}

model User {
  id           String   @id @default(cuid())
  accountId    String
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  account      Account  @relation(fields: [accountId], references: [id])
  fuelups      Fuelup[]
  maintenances Maintenance[]
}

model Invite {
  id        String   @id @default(cuid())
  accountId String
  email     String
  token     String   @unique
  status    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  account   Account  @relation(fields: [accountId], references: [id])
}

model Vehicle {
  id              String   @id @default(cuid())
  accountId       String
  name            String
  brand           String?
  model           String?
  color           String?
  plate           String?
  initOdometer    Int
  currentOdometer Int
  createdAt       DateTime @default(now())
  account         Account  @relation(fields: [accountId], references: [id])
  fuelups         Fuelup[]
  maintenances    Maintenance[]
}

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

model Maintenance {
  id         String   @id @default(cuid())
  vehicleId  String
  userId     String
  date       DateTime
  odometer   Int
  location   String?
  totalPrice Float
  createdAt  DateTime @default(now())
  vehicle    Vehicle  @relation(fields: [vehicleId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
  items      MaintenanceItem[]
}

model MaintenanceItem {
  id            String      @id @default(cuid())
  maintenanceId String
  description   String
  quantity      Float
  unitPrice     Float
  subtotal      Float
  maintenance   Maintenance @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)
}
```

**`src/app/globals.css` (tokens do tema Âmbar):**

```css
@import "tailwindcss";

@theme {
  --color-bg: #F0EEE8;
  --color-surface: #FFFFFF;
  --color-surface-2: #F8F7F3;
  --color-border: #E5E2DA;
  --color-text: #1A1814;
  --color-text-2: #6B6760;
  --color-text-3: #A8A39C;
  --color-accent: oklch(0.58 0.19 38);
  --color-accent-light: oklch(0.94 0.06 38);
  --color-teal: oklch(0.58 0.14 188);
  --color-teal-light: oklch(0.94 0.05 188);
  --color-green: oklch(0.62 0.15 145);
  --color-red: oklch(0.58 0.18 20);
  --radius: 14px;
  --radius-sm: 8px;
  --font-sans: "Plus Jakarta Sans", system-ui, sans-serif;
}

body { background: var(--color-bg); color: var(--color-text); }
```

**`src/infrastructure/database/prisma.client.ts`:**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**`src/app/api/auth/[...nextauth]/route.ts`:**

```typescript
import NextAuth from "next-auth";

const handler = NextAuth({ providers: [] });
export { handler as GET, handler as POST };
```

### Endpoints de API

- `GET/POST /api/auth/[...nextauth]` — scaffolding; responde 200 sem providers reais.

### Variáveis de Ambiente

**`.env.example`:**

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="changeme"
NEXTAUTH_URL="http://localhost:3000"
```

**`.gitignore`** (trecho): `.env.local`, `.env`, `node_modules/`, `.next/`, `prisma/dev.db*`.

## Pontos de Integração

Nenhuma integração externa na Fase 0. Prisma conecta a SQLite local; NextAuth não tem providers configurados; Vercel fica para Fase 8.

## Análise de Impacto

| Componente Afetado | Tipo de Impacto | Descrição & Risco | Ação Requerida |
|---|---|---|---|
| Repositório | Criação inicial | Primeiro commit estrutura todo o projeto. Baixo risco. | Revisão de scaffolding |
| `prisma/dev.db` | Novo arquivo local | Gerado em cada máquina após `migrate dev`. Baixo risco. | Incluir no `.gitignore` |
| Tema visual global | Novo design system | Tokens Âmbar aplicados globalmente via CSS vars. Baixo risco. | Verificar em browser |

## Abordagem de Testes

### Testes Unitários

Não há regra de negócio para testar. A Fase 0 conclui quando os **critérios de aceitação manuais** passam:

1. `npm install` instala sem erros.
2. `npx prisma migrate dev --name init` aplica a migration e gera `dev.db`.
3. `npm run dev` sobe em `http://localhost:3000` sem warnings críticos.
4. A página `/` renderiza o logo **RodagemApp** e um `<Button>` shadcn com fundo Âmbar (`oklch(0.58 0.19 38)`).
5. A fonte Plus Jakarta Sans é aplicada (verificável via DevTools).
6. `GET /api/auth/session` retorna `{}` ou JSON válido (não 500).
7. `npm run lint` e `npm run build` passam.

### Testes de Integração

Fora do escopo — Fase 8.

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Bootstrap Next.js** — `npx create-next-app@latest . --typescript --app --src-dir --tailwind --eslint --no-turbopack --import-alias "@/*"`.
2. **Node/Prettier** — criar `.nvmrc`, `.prettierrc`, scripts `format` no `package.json`.
3. **Estrutura DDD** — criar pastas `src/{domain,application,infrastructure,components/ui,lib}` com `.gitkeep`.
4. **Prisma** — `npm i @prisma/client prisma`, `npx prisma init --datasource-provider sqlite`, escrever `schema.prisma`, rodar `migrate dev`, criar `prisma.client.ts`.
5. **NextAuth scaffolding** — `npm i next-auth`, criar `app/api/auth/[...nextauth]/route.ts`.
6. **Fonte** — `next/font/google` para Plus Jakarta Sans em `layout.tsx`.
7. **Tailwind + tokens** — reescrever `globals.css` com `@theme` e tokens Âmbar.
8. **shadcn/ui** — `npx shadcn@latest init` e `npx shadcn@latest add button input select card badge tabs switch label separator`.
9. **Componente Logo** — criar `components/ui/Logo.tsx` replicando o protótipo.
10. **Smoke test** — reescrever `app/page.tsx` com Logo + Button.
11. **.env** — criar `.env.example` e `.env.local`, ajustar `.gitignore`.
12. **README** — documentar passos de setup (`clone → install → env → migrate → dev`).
13. **Validação manual** dos 7 critérios de aceitação.

### Dependências Técnicas

- Node.js 20 LTS instalado localmente.
- Acesso à internet para baixar pacotes npm e fontes Google.
- Nenhum serviço externo (MySQL, Vercel, SMTP) necessário.

## Monitoramento e Observabilidade

Fora do escopo. Sem métricas, logs estruturados ou dashboards nesta fase.

## Considerações Técnicas

### Decisões Principais

- **SQLite em dev vs MySQL:** escolhido SQLite para zero-setup local. Risco de divergência de SQL é mitigado porque usaremos apenas recursos comuns ao Prisma Client (não SQL cru). A migração para MySQL é trivial (apenas troca de `provider` e `DATABASE_URL`) e acontece na Fase 8.
- **Tailwind v4 + `@theme`:** aproveita o novo suporte a CSS-first config, eliminando `tailwind.config.ts` para tokens. shadcn/ui é compatível.
- **Tema único Âmbar:** remove complexidade de theme switcher; os 6 temas do protótipo ficam como referência visual histórica.
- **NextAuth como scaffolding:** instalar agora evita refactor de pastas na Fase 2; sem providers configurados, não há risco funcional.
- **Pastas vazias com `.gitkeep`:** garante que a estrutura Clean DDD apareça no git desde o primeiro commit.
- **Sem `eslint-plugin-boundaries`:** custo de configuração superior ao benefício nesta fase; a regra é documentada no `README` e reforçada em code review. Pode ser adicionada na Fase 8.

### Riscos Conhecidos

- **Tailwind v4 ainda é recente** — shadcn pode pedir ajustes no `components.json`. Mitigação: seguir a documentação oficial shadcn vigente na data de execução.
- **Divergência visual entre protótipo e shadcn** — alguns componentes (Toggle/Switch, Badge) têm visual levemente diferente. Mitigação: customizar via `className` e `cva` para aproximar do protótipo.
- **Prisma singleton em dev** — hot reload pode criar múltiplas conexões. Mitigação: o padrão `globalThis` no `prisma.client.ts` resolve.

### Requisitos Especiais

- Nenhum requisito de performance, segurança ou monitoramento específico nesta fase.

### Conformidade com Padrões

- **Arquitetura Clean DDD** — pastas criadas conforme seção 13 do escopo.
- **TypeScript strict** — ligado no `tsconfig.json`.
- **Tratamento de erros** — não aplicável (sem lógica de negócio).
- **Padrão de commits / lint** — ESLint (Next defaults) + Prettier configurados.
- **LGPD** — nenhum dado pessoal coletado; `.env.local` fora do versionamento.
