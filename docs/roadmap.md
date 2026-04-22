# Roadmap — App de Controle Veicular MVP
_Abril 2026_

---

## Referência de Design

O arquivo `docs/RodagemApp.html` é o protótipo visual oficial do projeto (nome do app: **RodagemApp**). Todas as telas devem seguir fielmente esse modelo em:

- **Tipografia:** Plus Jakarta Sans (400/500/600/700/800) via `next/font/google`
- **Estilização:** Tailwind CSS v4 + shadcn/ui — os tokens do protótipo (`--accent`, `--teal`, `--surface`, etc.) devem ser mapeados para CSS variables do Tailwind em `globals.css`
- **Componentes:** shadcn/ui fornece a base (`Button`, `Input`, `Select`, `Card`, `Badge`, `Tabs`, `Switch`) — customizar via `cn()` e variantes para fidelidade visual ao protótipo. Componentes não cobertos pelo shadcn (`Header`, `BottomNav`, `Logo`, `EmptyState`, `KmlChart`) são criados em `components/ui/`
- **Tema:** Âmbar (único, fixo) — tokens do protótipo mapeados diretamente em `globals.css`, sem suporte a troca de tema
- **Telas já prototipadas** (implementar com fidelidade):
  - `LoginScreen` → `/login`
  - `DashboardScreen` + `VehicleCard` → `/dashboard`
  - `FuelScreen` → `/abastecimento` (inclui regra dos 3 campos com badge "calculado")
  - `MaintScreen` → `/manutencao` (inclui lista dinâmica de itens + total)
  - `HistoryScreen` (abas Abastecimento / Manutenção) → `/veiculos/[id]`
  - `ReportsScreen` + `KmlChart` (SVG inline) → `/relatorios`
- **Layout:** `max-w-[430px]`, centralizado, mobile-first

> Ao implementar cada fase, abrir o HTML no browser como referência antes de codificar.

---

## Fase 0 — Setup do Projeto ✅
- [x] Inicializar projeto Next.js com TypeScript e App Router
- [x] Configurar ESLint, Prettier, path aliases (`@/`)
- [x] Instalar e configurar Prisma + conexão com MySQL (DigitalOcean)
- [x] Criar schema Prisma (`accounts`, `users`, `invites`, `vehicles`, `fuelups`, `maintenances`, `maintenance_items`)
- [x] Rodar migrations iniciais
- [x] Configurar NextAuth.js (provider credentials com email/senha)
- [x] Configurar estrutura de pastas Clean DDD (`domain/`, `application/`, `infrastructure/`, `app/`)
- [x] Configurar variáveis de ambiente (`.env.local`, `.env.example`)
- [x] Instalar e configurar Tailwind CSS v4
- [x] Instalar e configurar shadcn/ui (`npx shadcn@latest init`)
- [x] Adicionar componentes shadcn necessários: `button`, `input`, `select`, `card`, `badge`, `tabs`, `switch`, `label`, `separator`
- [x] Instalar fonte Plus Jakarta Sans via `next/font/google`
- [x] Mapear tokens do tema Âmbar para CSS variables do Tailwind em `globals.css` (`--bg: #F0EEE8`, `--surface: #fff`, `--accent: oklch(0.58 0.19 38)`, etc.)
- [x] Criar componentes customizados não cobertos pelo shadcn → `components/ui/` (`Header`, `BottomNav`, `Logo`, `EmptyState`)
- [ ] Deploy inicial na Vercel (ambiente staging)

---

## Fase 1 — Domínio e Infraestrutura Base ✅

### Domain layer
- [x] Value Objects: `email.vo.ts`, `invite-token.vo.ts`
- [x] Value Objects: `odometer.vo.ts`, `plate.vo.ts`, `vehicle-name.vo.ts`
- [x] Value Objects: `fuel-amount.vo.ts`, `fuel-price.vo.ts`, `fuel-date.vo.ts`, `kml.vo.ts`
- [x] Value Objects: `maintenance-date.vo.ts`, `item-quantity.vo.ts`, `item-price.vo.ts`
- [x] Entities: `account.entity.ts`, `vehicle.entity.ts`, `fuelup.entity.ts`
- [x] Entities: `maintenance.entity.ts`, `maintenance-item.entity.ts`
- [x] Repository interfaces (contratos)
- [x] `fuelup.service.ts` — regra dos 3 campos + cálculo de km/l

### Infrastructure layer
- [x] `prisma.client.ts` — singleton
- [x] `prisma-account.repository.ts`
- [x] `prisma-vehicle.repository.ts`
- [x] `prisma-fuelup.repository.ts`
- [x] `prisma-maintenance.repository.ts`
- [x] `nextauth.config.ts` — autenticação com email/senha + session com account_id
- [x] `mailer.ts` — envio de e-mail de convite

---

## Fase 2 — Auth e Gestão de Conta ✅

### Use cases e DTOs
- [x] `invite-user.usecase.ts`
- [x] `accept-invite.usecase.ts`
- [x] DTOs de account/user

### API Routes
- [x] `POST /api/auth/register` — cadastro de novo usuário + nova conta
- [x] `GET/POST /api/invites` — criar convite
- [x] `GET /api/invites/[token]` — validar token
- [x] `POST /api/invites/[token]` — aceitar convite (cria usuário na conta)

### Páginas
- [x] `/cadastro` — formulário de registro
- [x] `/login` — formulário de login (NextAuth) · _referência: `LoginScreen` no protótipo_
- [x] `/convite/[token]` — aceitar convite e criar senha
- [x] Auth guard no layout `(app)/`

---

## Fase 3 — Veículos ✅

### Use cases e DTOs
- [x] `create-vehicle.usecase.ts` (valida limite de 2 por conta)
- [x] `vehicle.dto.ts`

### API Routes
- [x] `GET /api/vehicles` — lista veículos da conta
- [x] `POST /api/vehicles` — cria veículo
- [x] `GET/PUT/DELETE /api/vehicles/[id]` — detalhe, edição, remoção

### Páginas / Componentes
- [x] `VehicleCard.tsx` — card do dashboard · _referência: `VehicleCard` no protótipo (grid 3 stats + botões Abastecer/Manutenção/Histórico)_
- [x] Dashboard (`/dashboard`) — exibe cards dos veículos com dados resumidos · _referência: `DashboardScreen` no protótipo_
- [x] Tela de configurações: cadastrar e editar veículos

---

## Fase 4 — Abastecimento ✅

### Use cases e DTOs
- [x] `register-fuelup.usecase.ts`
- [x] `fuelup.dto.ts`

### API Routes
- [x] `GET /api/fuelups?vehicleId=` — histórico
- [x] `POST /api/fuelups` — registrar
- [x] `GET/PUT/DELETE /api/fuelups/[id]`

### Páginas / Componentes
- [x] `FuelupForm.tsx` — formulário com regra dos 3 campos (cálculo em tempo real) · _referência: `FuelScreen` no protótipo (badge "calculado" no campo derivado, `Toggle` tanque cheio)_
- [x] `/abastecimento` — nova entrada
- [x] `/abastecimento/[id]` — editar entrada
- [x] Aba Abastecimento na tela do veículo (`/veiculos/[id]`) · _referência: aba "Abastecimentos" em `HistoryScreen`_

---

## Fase 5 — Manutenção ✅

### Use cases e DTOs
- [x] `register-maintenance.usecase.ts`
- [x] `maintenance.dto.ts`

### API Routes
- [x] `GET /api/maintenances?vehicleId=` — histórico
- [x] `POST /api/maintenances` — registrar (com itens)
- [x] `GET/PUT/DELETE /api/maintenances/[id]`

### Páginas / Componentes
- [x] `MaintenanceForm.tsx` — formulário com lista dinâmica de itens · _referência: `MaintScreen` no protótipo (grid 4 colunas: desc/qtd/unit/subtotal + total fixo no rodapé)_
- [x] `MaintenanceItemRow.tsx` — linha de item com cálculo de subtotal
- [x] `/manutencao` — nova entrada
- [x] `/manutencao/[id]` — editar / ver detalhe
- [x] Aba Manutenção na tela do veículo · _referência: aba "Manutenções" em `HistoryScreen` (expansível com lista de itens)_

---

## Fase 6 — Relatórios

### Use cases
- [ ] `get-reports.usecase.ts`

### API Routes
- [ ] `GET /api/reports?vehicleId=&period=`

### Páginas / Componentes
- [ ] `KmlChart.tsx` — gráfico SVG de evolução km/l · _referência: `KmlChart` no protótipo (SVG inline com gradiente, sem dependência de biblioteca externa)_
- [ ] `/relatorios` — total gasto combustível (mês/ano), total manutenção (ano), gráfico km/l · _referência: `ReportsScreen` no protótipo (seletor de veículo no header, grid de `StatCard`)_

---

## Fase 7 — Configurações e Convite

- [ ] `/configuracoes` — perfil do usuário (nome, e-mail, senha)
- [ ] Convidar usuário para a conta (formulário + envio de e-mail)
- [ ] Listagem de usuários da conta

---

## Fase 8 — Qualidade e Deploy

- [ ] Testes unitários: Value Objects e `fuelup.service.ts`
- [ ] Testes de integração: use cases críticos
- [ ] Validação de formulários no front (Zod / React Hook Form)
- [ ] Tratamento de erros global (API + UI)
- [ ] Revisão de segurança (OWASP básico, LGPD)
- [ ] Variáveis de ambiente em produção na Vercel
- [ ] Deploy final + smoke test em produção

---

## Resumo de Dependências

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4
                                   ↘ Fase 5
                  Fase 4 + Fase 5 → Fase 6
                  Fase 2          → Fase 7
                  Todas           → Fase 8
```
