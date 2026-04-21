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
| `npm test` | Roda suíte de testes (Vitest) |
| `npm run seed:dev` | Insere Account + User de desenvolvimento no banco |

## Desenvolvimento

### Seed de dados

O script `scripts/seed-dev.ts` cria uma `Account` e um `User` de desenvolvimento com senha hasheada via argon2. O script e idempotente — pode ser rodado multiplas vezes sem duplicar registros.

```bash
npx prisma migrate dev   # garante que o banco esta atualizado
npm run seed:dev         # insere dev@rodagem.app / dev123456
```

Variaveis de ambiente opcionais para o seed:

```
SEED_EMAIL=outro@exemplo.com
SEED_PASSWORD=outrasenha
```

### Validar login (apos subir o servidor)

1. Obtenha o CSRF token:

```bash
curl http://localhost:3000/api/auth/csrf
# retorna: {"csrfToken":"<TOKEN>"}
```

2. Autentique com as credenciais semeadas:

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=dev@rodagem.app&password=dev123456&csrfToken=<TOKEN>"
```

3. Verifique a sessao (deve conter `accountId`):

```bash
curl -b cookies.txt http://localhost:3000/api/auth/session
# retorna: { "user": { "email": "dev@rodagem.app", ... }, "accountId": "seed-account", ... }
```

### Rodar testes

```bash
npm test                 # roda todos os testes
npm run test:coverage    # roda com relatorio de cobertura
```

### Lint de fronteiras entre camadas

O ESLint esta configurado com `eslint-plugin-boundaries` para proibir imports cruzados entre camadas (Clean DDD). O arquivo `eslint.config.mjs` define as regras como `error`:

- `domain/` nao pode importar de `application/`, `infrastructure/`, `app/` ou `components/`
- `application/` nao pode importar de `infrastructure/` ou `app/`

```bash
npm run lint   # deve falhar se houver violacao de fronteira
```

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
