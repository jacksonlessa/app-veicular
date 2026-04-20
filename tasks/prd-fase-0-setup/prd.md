# PRD — Fase 0: Setup do Projeto

## Visão Geral

A Fase 0 estabelece a fundação técnica e visual do **RodagemApp**, um web app de controle de gastos e manutenção de veículos pessoais. Sem entregar funcionalidades de negócio, esta fase cria o ambiente de desenvolvimento, a arquitetura de código (Clean DDD), o design system baseado no protótipo `docs/RodagemApp.html` (tema Âmbar) e as ferramentas que serão usadas nas Fases 1–8.

O problema resolvido é a ausência total de um esqueleto executável: sem Fase 0, cada feature subsequente precisaria reconfigurar stack, estrutura e design do zero. Os beneficiários diretos são os desenvolvedores do projeto — que ganham um repositório pronto para produzir features — e, indiretamente, os usuários finais, que receberão telas visualmente consistentes com o protótipo desde a primeira entrega.

## Objetivos

- Entregar um repositório Next.js + TypeScript que compila, roda localmente em `http://localhost:3000` e exibe uma página inicial em branco estilizada com o tema Âmbar.
- Estabelecer a estrutura de pastas Clean DDD (`domain/`, `application/`, `infrastructure/`, `app/`, `components/`) vazia mas consistente com o escopo.
- Disponibilizar o banco de dados SQLite local com o schema Prisma completo migrado (tabelas `accounts`, `users`, `invites`, `vehicles`, `fuelups`, `maintenances`, `maintenance_items`).
- Configurar o design system (Tailwind v4 + shadcn/ui + fonte Plus Jakarta Sans + tokens Âmbar) pronto para uso em todas as fases seguintes.
- Ter NextAuth.js instalado e inicializado (sem fluxos funcionais, apenas o scaffolding).

**Métricas de sucesso:** `npm run dev` sobe sem erros; `npx prisma migrate dev` aplica migrations; uma página de teste usando um componente shadcn renderiza com o tema Âmbar corretamente aplicado.

## Histórias de Usuário

- Como **desenvolvedor**, eu quero clonar o repositório e rodar `npm install && npm run dev` para subir o projeto localmente sem configuração adicional além de um `.env`.
- Como **desenvolvedor**, eu quero importar componentes shadcn já estilizados com o tema Âmbar para escrever telas da Fase 3 em diante sem reconfigurar cores ou tipografia.
- Como **desenvolvedor**, eu quero uma base de dados SQLite local já migrada para trabalhar offline, sem depender do MySQL em produção.
- Como **reviewer de código**, eu quero que ESLint e Prettier estejam configurados para que os PRs sigam um padrão único desde a primeira linha de código.

## Funcionalidades Principais

### F1 — Inicialização do projeto Next.js

- **O quê:** Projeto Next.js (App Router) com TypeScript e aliases de import.
- **Por quê:** É a base de todo o app; define a plataforma de execução.
- **RF-1.1** O projeto deve usar Next.js App Router com TypeScript em modo strict.
- **RF-1.2** O alias `@/*` deve resolver para `src/*`.
- **RF-1.3** ESLint e Prettier devem estar configurados e executáveis via npm scripts.

### F2 — Estrutura Clean DDD

- **O quê:** Pastas vazias (com `.gitkeep` ou README stub) representando as 4 camadas.
- **Por quê:** Garante que todas as fases subsequentes sigam a arquitetura definida no escopo (seção 13).
- **RF-2.1** Devem existir `src/domain/`, `src/application/`, `src/infrastructure/`, `src/app/`, `src/components/`.
- **RF-2.2** O domínio não deve importar nada de outras camadas (validado por lint ou convenção documentada).

### F3 — Banco de dados (SQLite em dev)

- **O quê:** Prisma configurado apontando para SQLite local; schema completo definido; migration inicial aplicada.
- **Por quê:** Permite trabalhar offline e simplifica o onboarding. MySQL é reservado à Fase 8.
- **RF-3.1** Todas as 7 tabelas do escopo devem estar declaradas no `schema.prisma` com os campos e FKs corretos.
- **RF-3.2** `npx prisma migrate dev` deve criar um `dev.db` executável.
- **RF-3.3** O `prisma.client.ts` deve ser exportado como singleton em `src/infrastructure/database/`.

### F4 — Autenticação (scaffolding)

- **O quê:** NextAuth.js instalado e `[...nextauth]/route.ts` criado com provider vazio.
- **Por quê:** Estabelece a presença da lib; fluxos funcionais são da Fase 2.
- **RF-4.1** NextAuth.js deve estar instalado e importável.
- **RF-4.2** A rota `/api/auth/[...nextauth]` deve existir e responder sem erro 500.

### F5 — Design System

- **O quê:** Tailwind v4 + shadcn/ui + tema Âmbar + Plus Jakarta Sans.
- **Por quê:** Garante fidelidade visual ao protótipo `docs/RodagemApp.html` em todas as telas futuras.
- **RF-5.1** Tailwind v4 deve estar configurado e funcional.
- **RF-5.2** shadcn/ui deve estar inicializado com os componentes `button`, `input`, `select`, `card`, `badge`, `tabs`, `switch`, `label`, `separator` adicionados.
- **RF-5.3** A fonte Plus Jakarta Sans deve ser carregada via `next/font/google` (pesos 400, 500, 600, 700, 800).
- **RF-5.4** Os tokens do tema Âmbar do protótipo (`--bg: #F0EEE8`, `--surface: #FFFFFF`, `--accent: oklch(0.58 0.19 38)`, etc.) devem estar mapeados como CSS variables consumíveis pelo Tailwind em `globals.css`.
- **RF-5.5** Componentes custom não cobertos pelo shadcn (`Header`, `BottomNav`, `Logo`, `EmptyState`) devem ser criados em `src/components/ui/` seguindo o visual do protótipo.

### F6 — Variáveis de ambiente

- **O quê:** `.env.local` e `.env.example` com as chaves esperadas.
- **Por quê:** Segredos fora do versionamento; facilita onboarding.
- **RF-6.1** `.env.example` deve listar `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` com valores vazios/exemplo.
- **RF-6.2** `.env.local` deve estar no `.gitignore`.

## Experiência do Usuário

Não há UX de usuário final na Fase 0. A "experiência" é a do desenvolvedor (DX):

- `git clone && npm install && cp .env.example .env.local && npx prisma migrate dev && npm run dev` deve resultar em um servidor rodando sem erros.
- Uma página de demonstração em `/` pode exibir o logo **RodagemApp** + um `<Button>` shadcn com a cor Âmbar, validando o design system.
- O README deve documentar esses passos.

## Restrições Técnicas de Alto Nível

- **Stack fixo:** Next.js (App Router), TypeScript, Prisma, NextAuth.js, Tailwind v4, shadcn/ui — conforme seção 11 do escopo.
- **Banco de dados em dev:** SQLite local. MySQL no DigitalOcean fica para Fase 8.
- **Hospedagem:** deploy na Vercel é exclusivo da Fase 8. Fase 0 opera apenas localmente.
- **Design:** fidelidade ao protótipo `docs/RodagemApp.html`, tema Âmbar único e fixo (sem seletor de tema).
- **Arquitetura:** Clean DDD com dependência unidirecional `presentation → application → domain ← infrastructure`.
- **LGPD:** nenhum tratamento de dados pessoais nesta fase (sem coleta); mas `.env.local` e segredos devem estar fora do versionamento desde o início.

## Não-Objetivos (Fora de Escopo)

- **Tudo que não for setup:** CRUD de veículos, abastecimentos, manutenções, relatórios, convites, dashboards — todos pertencem a fases posteriores.
- **Deploy na Vercel** — exclusivo da Fase 8.
- **Conexão com MySQL em produção** — exclusivo da Fase 8.
- **Implementação de Value Objects, Entities, Use Cases ou Repositórios** — Fase 1.
- **Telas funcionais** (login, dashboard, formulários) — Fases 2 em diante. Uma página de smoke test mínima é permitida apenas para validar o design system.
- **Suporte a múltiplos temas** — apenas Âmbar.
- **Configuração de CI/CD, testes automatizados, observabilidade** — Fase 8.
- **Envio de e-mails (mailer)** — Fase 2.

## Questões em Aberto

- **Gerenciador de pacotes:** usar `npm`, `pnpm` ou `bun`? (default sugerido: `npm`).
- **Versão do Node.js:** fixar via `.nvmrc`? Qual versão LTS?
- **Página smoke test:** manter uma rota `/` pública de demonstração do tema ou deixar o `app/page.tsx` em branco/404?
- **Seed de dados:** criar um `prisma/seed.ts` vazio agora ou apenas na fase em que for necessário?
- **Lint de dependência entre camadas:** adotar `eslint-plugin-boundaries` já na Fase 0 ou documentar a regra e validar manualmente?
