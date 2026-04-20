# RodagemApp

Controle de gastos e manutenção de veículos pessoais.

## Pre-requisitos

- Node 20 LTS (`nvm use`)
- npm (incluso com Node.js)

## Setup local

1. `nvm use`
2. `npm install`
3. `cp .env.example .env.local` e ajustar se necessário
4. `npx prisma migrate dev`
5. `npm run dev`

Acesse [http://localhost:3000](http://localhost:3000) para ver o app.

## Scripts

| Script | Descricao |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de producao |
| `npm run start` | Servidor de producao |
| `npm run lint` | Verificacao ESLint |
| `npm run format` | Formatacao Prettier |

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e ajuste os valores:

```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="<gere um segredo seguro>"
NEXTAUTH_URL="http://localhost:3000"
```

`.env.local` **nao e versionado** — nunca o commite.

## Arquitetura

O projeto segue Clean DDD com dependencia unidirecional entre camadas:

```
presentation (app/, components/) -> application -> domain <- infrastructure
```

- `domain/` — entidades e regras de negocio puras; **nao importa nada de outras camadas**
- `application/` — use cases, orquestra dominio e infraestrutura
- `infrastructure/` — banco de dados (Prisma), servicos externos
- `app/` — rotas Next.js (App Router), controllers finos
- `components/` — componentes React reutilizaveis (Atomic Design)

### Estrutura de pastas

```
src/
├── domain/              # entidades, value objects, repositorios (interfaces)
├── application/         # use cases
├── infrastructure/
│   └── database/
│       └── prisma.client.ts
├── app/                 # rotas Next.js
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── auth/[...nextauth]/route.ts
├── components/
│   └── ui/              # shadcn/ui + componentes custom
└── lib/
    └── utils.ts         # cn() helper

prisma/
├── schema.prisma
└── migrations/
```

## Banco de dados

SQLite em desenvolvimento (arquivo `prisma/dev.db`, gerado localmente apos `prisma migrate dev`).
MySQL e reservado para producao (Fase 8).

Para resetar o banco:

```bash
npx prisma migrate reset
```

Para visualizar os dados:

```bash
npx prisma studio
```
