# Validation — Feature: Manutenção

**Data:** 2026-04-21
**Revisão:** Fase 5 completa (tasks 1.0–10.0; task 11.0 = este documento)
**Suite de testes:** 530 testes, 51 arquivos — 0 falhas (`npx vitest run`)
**Lint:** `npm run lint` — 0 erros (warnings pré-existentes em arquivos fora do escopo da feature)
**TypeScript:** `tsc --noEmit` — limpo (erro de build pré-existente em `NoopMailer` não relacionado à feature)

---

## Smoke Test Manual — Cenários

> Ambiente de desenvolvimento: `npm run dev` com banco MySQL local.
> Os cenários abaixo descrevem o fluxo esperado e o resultado verificável.

### C1 — Criar manutenção via botão no VehicleCard

**Ação:**
1. Logar como usuário A.
2. No dashboard, clicar em "Manutenção" no card do veículo.
3. Preencher: data, 3 itens (descrição, quantidade, valor unitário).
4. Verificar que subtotais e total do rodapé atualizam em tempo real.
5. Submeter o formulário.

**Resultado esperado:**
- Redirect para `/veiculos/[id]?tab=manutencao`.
- Nova manutenção aparece na aba "Manutenções" com data, total correto.
- Botão "+ Adicionar item" e remoção individual funcionam.

---

### C2 — Manutenção com odômetro atualiza veículo

**Ação:**
1. Criar manutenção com odômetro maior que o `currentOdometer` atual do veículo.
2. Verificar `currentOdometer` no banco ou via API do veículo.

**Resultado esperado:**
- `vehicle.currentOdometer` atualizado para o novo valor.
- O VehicleCard no dashboard reflete o novo odômetro.

---

### C3 — Manutenção sem odômetro não altera veículo

**Ação:**
1. Criar manutenção sem preencher o campo odômetro.
2. Verificar `currentOdometer` do veículo.

**Resultado esperado:**
- `vehicle.currentOdometer` permanece inalterado.

---

### C4 — Expandir card de manutenção mostra itens

**Ação:**
1. Na aba "Manutenções" em `/veiculos/[id]`, clicar no card de uma manutenção.

**Resultado esperado:**
- Card expande exibindo grid com colunas: Descrição / Qtd / Unit / Subtotal.
- Valores monetários formatados em R$.
- Links "Editar" e botão "Excluir" visíveis.

---

### C5 — Editar manutenção

**Ação:**
1. Clicar em "Editar" na lista de manutenções.
2. Modificar um item (alterar quantidade) e adicionar um novo item.
3. Salvar.

**Resultado esperado:**
- Redirect para `/veiculos/[id]?tab=manutencao`.
- Manutenção atualizada com novos itens e novo total.
- Total recalculado corretamente.

---

### C6 — Excluir manutenção com confirmação inline

**Ação:**
1. Clicar em "Excluir" em uma manutenção.
2. Confirmar no prompt inline ("Sim").

**Resultado esperado:**
- Manutenção removida da lista sem reload de página.
- Se era a única manutenção, `EmptyState` exibido com CTA "Registrar manutenção".

---

### C7 — Validação: submeter sem itens

**Ação:**
1. Acessar `/manutencao`.
2. Remover todos os itens (só há 1 inicial — tentar submeter com o item mas campos vazios).

**Resultado esperado:**
- Validação client-side exibe erros nos campos obrigatórios.
- Formulário não submete para a API.

---

### C8 — Pré-seleção de veículo via query param

**Ação:**
1. Navegar para `/manutencao?vehicleId=[id-do-veiculo]`.

**Resultado esperado:**
- Select de veículo pré-selecionado com o veículo correto.

---

### C9 — Estado vazio na aba Manutenções

**Ação:**
1. Navegar para `/veiculos/[id]` de um veículo sem manutenções.
2. Clicar na aba "Manutenções".

**Resultado esperado:**
- `EmptyState` exibido com mensagem e CTA para `/manutencao?vehicleId=`.

---

### C10 — Bloqueio por ownership (cross-account)

**Ação:**
1. Em janela anônima, criar conta B e logar.
2. Fazer `GET /api/maintenances/[id]` onde `[id]` pertence à conta A.

**Resultado esperado:**
- API retorna 403 ou 404.
- Dado da conta A não exposto.

---

### C11 — Acesso sem sessão → redirect para login

**Ação:**
1. Deslogar.
2. Tentar acessar `/manutencao` diretamente.

**Resultado esperado:**
- Redirect automático para `/login`.

---

## Resultados dos Testes Automatizados

```
Test Files  51 passed (51)
     Tests  530 passed (530)
  Start at  21:04:58
  Duration  4.58s
```

A suite cobre:
- `MaintenanceDate`, `ItemQuantity`, `ItemPrice` VOs — validações de borda (futuro, zero, negativo)
- `Maintenance.create()` — rejeita lista vazia, calcula `totalPrice` correto
- `MaintenanceItem.create()` — subtotal = quantity × unitPrice
- `RegisterMaintenanceUseCase` — 7 cenários (sucesso com/sem odômetro, ownership, itens vazios)
- `UpdateMaintenanceUseCase` — 6 cenários (incluindo exclusão da própria manutenção no cálculo de odômetro)
- `DeleteMaintenanceUseCase` — 8 cenários (com/sem odômetro, recalculateOdometer false/true)
- `GetMaintenanceUseCase` + `ListMaintenancesUseCase` — 11 cenários (NotFoundError, ForbiddenError)
- `PrismaMaintenanceRepository` — 9 cenários de integração (findById, findByVehicle, ordenação, itens)
- `computeNewOdometer` (multi-fonte) — cobre union de fuelups + manutenções + initOdometer

---

## Débitos Técnicos Registrados

Os itens abaixo foram identificados nas reviews das tasks 1.0–10.0 e não bloquearam aprovação.

### Backend

| ID | Origem | Descrição | Prioridade |
|----|--------|-----------|------------|
| DT-01 | Task 1 (M1) | `deleteMaintenance` tem guarda dupla `recalculateOdometer && newCurrentOdometer !== undefined` — se chamador passar `recalculateOdometer: true` sem `newCurrentOdometer`, atualização é silenciosamente ignorada. Deveria lançar erro defensivo. | Média |
| DT-02 | Task 3 (L1) | `MaintenanceDate.create()` aceita `string \| Date` divergindo do contrato `Date` do TechSpec. Risco baixo em runtime. | Baixa |
| DT-03 | Task 3 (L2) | `maintenanceId` tem default `""` em `Maintenance.create()` — campo deveria ser gerado como cuid() ou recebido obrigatório. | Baixa |
| DT-04 | Task 2 (M1) | Nenhum teste de integração cobre o caminho `null odometer → undefined` no repositório (verificado apenas por inspeção de código). | Baixa |
| DT-05 | Task 5 (M1) | `compute-maintenance-odometer.ts` duplica lógica de `compute-new-odometer.ts`. Ambos coexistem — consolidar em um utilitário compartilhado. | Média |

### Frontend

| ID | Origem | Descrição | Prioridade |
|----|--------|-----------|------------|
| DT-06 | Task 8 (M1) | `odometer` no schema usa `.positive()` (rejeita 0). Odômetro 0 é legítimo para veículo novo — corrigir para `.nonnegative()`. | Média |
| DT-07 | Task 8 (M2) | `MaintenanceForm` usa `useState` manual em vez de `useFieldArray` (react-hook-form). Diverge do TechSpec; acumula débito para integração com `formState.isDirty`. | Média |
| DT-08 | Task 8 (M3) | Botão de remover item oculto silenciosamente quando há 1 item — sem feedback visual ao usuário. | Baixa |
| DT-09 | Task 8 (L1) | `key={index}` no map de itens pode causar comportamento de foco inesperado ao remover do meio. Usar UUID estável por item. | Baixa |
| DT-10 | Task 9 (M1) | `loading.tsx` exibido apenas em navegação server-side. Client-side mostra parágrafo de texto simples. | Baixa |
| DT-11 | Task 10 (L1) | Botão "Histórico" foi movido para link de header no `VehicleCard` — row de ações com Abastecer/Manutenção/Histórico não está exatamente como o protótipo. Requer confirmação de design. | Baixa |

---

## Cobertura dos Requisitos do PRD

| Requisito | Status |
|-----------|--------|
| RF-01 Registrar manutenção com lista de itens | ✅ Implementado |
| RF-02 Adicionar/remover itens dinamicamente com total em tempo real | ✅ Implementado |
| RF-03 Editar manutenção (substituição total de itens) | ✅ Implementado |
| RF-04 Excluir manutenção com confirmação | ✅ Implementado |
| RF-05 Histórico por veículo na aba Manutenções (expansível) | ✅ Implementado |
| Odômetro atualiza `currentOdometer` do veículo | ✅ Implementado |
| Isolamento multi-tenant (ownership por accountId) | ✅ Implementado |
| EmptyState quando sem manutenções | ✅ Implementado |
| Botão "Manutenção" no VehicleCard | ✅ Implementado |

**Status geral: Fase 5 concluída. Todos os requisitos funcionais do PRD cobertos.**
