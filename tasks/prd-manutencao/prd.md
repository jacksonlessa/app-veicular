# PRD — Manutenção de Veículos (Fase 5)

## Visão Geral

O módulo de Manutenção permite que usuários do RodagemApp registrem serviços e peças realizados em seus veículos, detalhando cada item com descrição, quantidade, valor unitário e subtotal calculado. Resolve o problema de não ter visibilidade sobre quanto se gasta em manutenção ao longo do tempo, complementando os dados de abastecimento para uma visão completa do custo de propriedade do veículo.

---

## Objetivos

- Permitir o registro de manutenções com múltiplos itens por entrada.
- Calcular automaticamente o subtotal por item e o total da manutenção.
- Exibir o histórico de manutenções por veículo na aba dedicada da tela do veículo.
- Habilitar a tela de Relatórios (Fase 6) a consumir totais de manutenção por período.

**Definição de sucesso:** usuário consegue registrar, editar e consultar uma manutenção com itens em menos de 2 minutos, sem erros de cálculo.

---

## Histórias de Usuário

- Como **proprietário de veículo**, quero registrar uma manutenção com a lista de serviços/peças realizados para saber exatamente quanto gastei.
- Como **proprietário de veículo**, quero editar ou excluir um registro de manutenção caso tenha errado algum dado.
- Como **proprietário de veículo**, quero ver o histórico de manutenções do meu veículo em ordem cronológica para acompanhar o que já foi feito.
- Como **usuário compartilhado da conta**, quero visualizar e registrar manutenções nos veículos da conta à qual fui convidado.

---

## Funcionalidades Principais

### RF-01 — Registrar manutenção

O usuário acessa `/manutencao`, preenche:
- **Veículo** (seleção obrigatória entre veículos da conta)
- **Data** da manutenção (obrigatória)
- **Odômetro** no momento do serviço (opcional; quando informado, atualiza o odômetro atual do veículo)
- **Descrição geral** da manutenção (ex.: "Revisão dos 30.000 km") (opcional)
- **Lista de itens**: cada item possui descrição (obrigatória), quantidade (obrigatória, > 0) e valor unitário (obrigatório, > 0); subtotal é calculado automaticamente.

Ao menos um item é obrigatório para salvar o registro. O total da manutenção é a soma dos subtotais de todos os itens, exibido fixo no rodapé do formulário.

### RF-02 — Adicionar e remover itens dinamicamente

O usuário pode adicionar quantos itens quiser clicando em "+ Adicionar item". Cada item pode ser removido individualmente. O total do rodapé atualiza em tempo real a cada alteração.

### RF-03 — Editar manutenção

O usuário acessa `/manutencao/[id]` para editar qualquer campo, incluindo adicionar ou remover itens. A edição salva todos os itens novamente (substituição completa).

### RF-04 — Excluir manutenção

A partir da tela de detalhe ou do histórico, o usuário pode excluir um registro. A exclusão remove a manutenção e todos os seus itens.

### RF-05 — Histórico por veículo

Na tela `/veiculos/[id]`, a aba "Manutenções" lista os registros em ordem cronológica decrescente. Cada entrada é expansível e exibe a lista de itens com seus subtotais e o total da manutenção.

---

## Experiência do Usuário

**Referência visual:** `MaintScreen` no protótipo `docs/RodagemApp.html`.

- **Formulário (`/manutencao`):** grid de 4 colunas para os itens (Descrição / Qtd / Unit / Subtotal). Botão "+ Adicionar item" abaixo da lista. Total fixo no rodapé com destaque visual (fundo âmbar).
- **Linha de item (`MaintenanceItemRow`):** campos de texto/número inline; subtotal calculado e exibido em tempo real sem ação do usuário.
- **Histórico (`/veiculos/[id]`, aba Manutenções):** cards expansíveis mostrando data, descrição geral e total; ao expandir, lista os itens com quantidade, valor unitário e subtotal.
- **Estados vazios:** quando não há manutenções, exibir `EmptyState` com CTA para registrar a primeira.
- **Layout:** `max-w-[430px]`, mobile-first, tema Âmbar fixo, fonte Plus Jakarta Sans.

---

## Restrições Técnicas de Alto Nível

- O acesso é restrito a usuários autenticados pertencentes à mesma conta do veículo (isolamento multi-tenant por `account_id`).
- Os dados de manutenção devem ser persistidos de forma que a Fase 6 (Relatórios) possa agregar totais por veículo e período sem reprocessamento.
- Conformidade com LGPD: dados de manutenção são dados pessoais indiretamente (associados ao veículo do usuário) — sem compartilhamento externo, armazenados apenas no banco da conta.
- O schema Prisma já prevê as tabelas `maintenances` e `maintenance_items`; a Fase 5 deve respeitar essa estrutura sem alterações destrutivas.
- As API Routes devem validar que o `vehicleId` informado pertence à conta da sessão autenticada.

---

## Não-Objetivos (Fora de Escopo)

- **Agendamento de manutenções futuras** — não há alertas ou lembretes nesta fase.
- **Categorização de itens** (peças, mão de obra, fluidos) — classificação fica para fase futura.
- **Upload de nota fiscal ou comprovante** — sem anexos nesta versão.
- **Integração com oficinas ou fornecedores externos** — fora do MVP.
- **Relatórios e gráficos** — pertencem à Fase 6.
- **Exportação de dados** — fora do MVP.

---

## Questões em Aberto

Nenhuma questão em aberto — todas as dúvidas foram resolvidas antes da redação final:
- Odômetro: quando informado, atualiza o odômetro atual do veículo.
- Limite de itens: sem limite máximo.
- Descrição geral: campo opcional.
