# PRD — Veículos (Fase 3)

_RodagemApp · Abril 2026_

---

## Visão Geral

Abastecimentos e manutenções — o núcleo do RodagemApp — só fazem sentido quando vinculados a um veículo. Sem o cadastro de veículos, nenhum registro de gasto pode ser criado. Esta fase entrega o gerenciamento completo de veículos: cadastro, edição, exclusão e visualização em dashboard, permitindo que qualquer usuário da conta comece a registrar seus gastos imediatamente após criar seu primeiro veículo.

---

## Objetivos

- Permitir que qualquer usuário da conta cadastre até 2 veículos e gerencie seus dados básicos.
- Exibir no dashboard um card resumido por veículo, com atalhos para as ações principais.
- Garantir que novos usuários (sem veículos) sejam guiados pelo onboarding antes de qualquer outra ação.
- Proteger o histórico de gastos ao excluir veículos via soft delete com confirmação explícita.

---

## Histórias de Usuário

- Como **usuário com conta nova**, quero ser guiado a cadastrar meu primeiro veículo assim que acessar o sistema, para que eu possa começar a registrar gastos sem precisar descobrir onde fazer isso.
- Como **usuário**, quero cadastrar até 2 veículos na minha conta, para controlar os gastos de mais de um carro/moto.
- Como **usuário**, quero ver no dashboard um card para cada veículo com seus dados resumidos e atalhos rápidos, para acessar as funções de abastecimento, manutenção e histórico sem navegar em menus.
- Como **usuário**, quero editar os dados de um veículo (nome, placa, odômetro), para corrigir informações ou atualizar o hodômetro manualmente.
- Como **usuário convidado**, quero gerenciar veículos da mesma forma que o dono da conta, para contribuir com os registros sem depender de terceiros.
- Como **usuário**, quero remover um veículo com uma confirmação clara, para evitar exclusões acidentais e entender que o histórico será preservado.

---

## Funcionalidades Principais

### F1 — Cadastro de Veículo

Permite criar um veículo associado à conta do usuário autenticado.

- **RF-01** O sistema deve aceitar os campos: nome do veículo, placa e odômetro inicial.
- **RF-02** A placa deve ser única por conta e válida nos formatos padrão antigo (AAA-9999) ou Mercosul (AAA9A99).
- **RF-03** O sistema deve impedir o cadastro quando a conta já possui 2 veículos ativos, exibindo mensagem de limite atingido.
- **RF-04** Após o cadastro, o usuário é redirecionado ao dashboard.

### F2 — Onboarding de Primeiro Veículo

Garante que usuários sem veículos cadastrados sejam direcionados ao formulário antes de qualquer outra ação.

- **RF-05** Ao acessar o dashboard sem veículos ativos, o sistema deve exibir uma tela de estado vazio (EmptyState) com call-to-action para cadastrar o primeiro veículo.
- **RF-06** O onboarding não bloqueia o acesso a outras áreas do app, apenas orienta o usuário.

### F3 — Edição de Veículo

Permite atualizar os dados de um veículo existente.

- **RF-07** Os campos nome, placa e odômetro devem ser editáveis.
- **RF-08** As mesmas validações do cadastro se aplicam na edição (placa única, formato de placa válido, odômetro numérico positivo).

### F4 — Exclusão de Veículo (Soft Delete)

Remove logicamente um veículo, preservando o histórico de registros vinculados.

- **RF-09** A exclusão deve exigir confirmação explícita do usuário (diálogo/modal com aviso claro).
- **RF-10** O veículo excluído não aparece mais no dashboard nem nas listas de seleção.
- **RF-11** Registros históricos (abastecimentos, manutenções) vinculados ao veículo excluído são preservados no banco e não são exibidos ao usuário na interface.

### F5 — Dashboard com VehicleCard

Exibe os veículos ativos da conta em cards resumidos conforme o protótipo `DashboardScreen`.

- **RF-12** Cada `VehicleCard` deve exibir: nome do veículo, placa, odômetro atual e 3 atalhos (Abastecer, Manutenção, Histórico).
- **RF-13** Os atalhos Abastecer e Manutenção navegam para os formulários correspondentes (fases 4 e 5); enquanto não implementados, podem estar desabilitados ou ausentes.
- **RF-14** O atalho Histórico navega para `/veiculos/[id]`.
- **RF-15** Cards são listados na ordem de criação (mais antigo primeiro).

### F6 — Tela de Configurações de Veículos

Centraliza o gerenciamento (criar, editar, excluir) fora do fluxo principal do dashboard.

- **RF-16** Deve haver uma área de configurações acessível pelo menu/header onde o usuário pode cadastrar novos veículos, editar existentes e removê-los.

---

## Experiência do Usuário

**Personas:** Qualquer usuário autenticado da conta (dono ou convidado) tem as mesmas permissões de gerenciamento de veículos.

**Fluxo principal — novo usuário:**
Dashboard → EmptyState → Formulário de cadastro → Dashboard com VehicleCard

**Fluxo principal — usuário com veículos:**
Dashboard → VehicleCard com atalhos → ações de abastecimento/manutenção/histórico

**Fluxo de edição/exclusão:**
Configurações → Lista de veículos → Editar ou Excluir (com confirmação)

**UI/UX:**
- Seguir fielmente o protótipo `DashboardScreen` e `VehicleCard` do arquivo `docs/RodagemApp.html`.
- Layout `max-w-[430px]`, mobile-first, fonte Plus Jakarta Sans, tema Âmbar.
- O componente `EmptyState` já previsto em `components/ui/` deve ser utilizado na tela de onboarding.
- O diálogo de confirmação de exclusão deve deixar claro que o veículo será removido, mas sem detalhar internamente o mecanismo de soft delete para o usuário.

---

## Restrições Técnicas de Alto Nível

- **Autenticação:** Todas as rotas de API devem exigir sessão válida via NextAuth. O `account_id` da sessão deve ser usado para isolar dados entre contas.
- **Limite de veículos:** Máximo de 2 veículos ativos por conta — regra validada no backend (use case), não apenas no frontend.
- **Soft delete:** O campo `deletedAt` (ou equivalente) deve ser respeitado em todas as queries de listagem.
- **LGPD:** Dados de placa e nome do veículo são considerados dados pessoais indiretamente identificáveis — devem ser acessíveis apenas a usuários autenticados da mesma conta.
- **Dependência de fases futuras:** Os atalhos "Abastecer" e "Manutenção" no VehicleCard apontarão para rotas das Fases 4 e 5; a Fase 3 não implementa essas telas, apenas os links.
- **Odômetro:** O campo odômetro no cadastro/edição é livre (entrada manual). Nas Fases 4 e 5, o registro de abastecimento ou manutenção atualizará automaticamente o odômetro do veículo.

---

## Não-Objetivos (Fora de Escopo)

- Registro, edição ou exclusão de abastecimentos e manutenções (Fases 4 e 5).
- Upload ou exibição de foto do veículo.
- Compartilhamento de veículo entre contas distintas.
- Diferenciação de permissões entre dono da conta e usuários convidados para gerenciar veículos.
- Histórico de odômetro automático (o campo é editável manualmente; atualização automática via abastecimento é responsabilidade da Fase 4).
- Aumento dinâmico do limite de 2 veículos por conta.
- Paginação da listagem de veículos (máximo 2, não necessário no MVP).

---

## Questões em Aberto

Nenhuma questão em aberto — todas resolvidas durante refinamento:

| # | Questão | Decisão |
|---|---------|---------|
| Q1 | Veículos excluídos ficam ocultos ou em área de arquivados? | Completamente ocultos na UI; histórico preservado no banco sem exposição ao usuário. |
| Q2 | Odômetro no VehicleCard: valor manual ou último abastecimento? | Manual no cadastro/edição; Fases 4 e 5 atualizam o campo automaticamente ao registrar abastecimento ou manutenção. |
| Q3 | Validação de formato de placa? | Sim — aceitar padrão antigo (AAA-9999) e Mercosul (AAA9A99); implementar como Value Object `plate.vo.ts`. |
