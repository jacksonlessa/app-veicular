# Validation — Feature: Abastecimento

**Data:** 2026-04-21
**Revisão:** Fase 4 completa (tasks 1.0–11.0)
**Suite de testes:** 484 testes, 45 arquivos — 0 falhas (`npx vitest run`)
**Lint:** `npm run lint` — 0 erros (warnings pré-existentes em arquivos fora do escopo da feature)

---

## Smoke Test Manual — Cenários

> Ambiente de desenvolvimento: `npm run dev` com banco MySQL local.
> Os cenários abaixo descrevem o fluxo esperado e o resultado verificável.

### C1 — Criar abastecimento com tanque cheio

**Ação:**
1. Logar como usuário A.
2. Navegar para `/veiculos/[id]` → clicar em "Abastecer".
3. Preencher: data, odômetro maior que o inicial, litros + preço por litro (total calculado automaticamente), `fullTank = true`.
4. Submeter o formulário.

**Resultado esperado:**
- Redirect para `/veiculos/[id]` aba Abastecimentos.
- Novo registro aparece na lista com km/l `—` (primeiro tanque cheio, sem referência anterior).
- `vehicle.currentOdometer` atualizado no banco.

**Observação:** O campo total é derivado pelo `useFuelupCalculator` — qualquer dois dos três campos (litros, preço/litro, total) calculam o terceiro. O cálculo ocorre no cliente antes do envio.

---

### C2 — Criar segundo abastecimento cheio → verificar km/l

**Ação:**
1. Com o mesmo veículo, criar um segundo abastecimento `fullTank = true` com odômetro maior.
2. Navegar para a aba Abastecimentos.

**Resultado esperado:**
- O segundo abastecimento exibe km/l calculado = `(odômetro₂ - odômetro₁) / litros₂`.
- O VehicleCard no topo exibe o mesmo valor de km/l.
- O dashboard exibe o km/l desse veículo.

---

### C3 — Abastecimento parcial intermediário afeta km/l do próximo cheio

**Ação:**
1. Criar um abastecimento `fullTank = false` (parcial) entre os dois abastecimentos cheios (data/odômetro intermediário, via edição).
2. Recarregar o histórico.

**Resultado esperado:**
- O terceiro abastecimento cheio recalcula seu km/l somando os litros do parcial no denominador:
  `km/l = (odômetro₃ - odômetroÚltimoCheioPrévio) / (litrosParcial + litros₃)`.
- Os abastecimentos parciais exibem km/l `—` (não calculado).

---

### C4 — Editar odômetro para valor que quebra monotonicidade

**Ação:**
1. Abrir o segundo abastecimento em `/abastecimento/[id]`.
2. Alterar o odômetro para um valor menor que o primeiro abastecimento.
3. Tentar salvar.

**Resultado esperado:**
- API retorna 400 com code `odometer.not_increasing`.
- A página exibe a mensagem de erro inline (sem reload).
- O registro não é alterado no banco.

---

### C5 — Excluir o primeiro abastecimento → cascata de km/l

**Ação:**
1. Abrir o primeiro abastecimento (tanque cheio) em `/abastecimento/[id]`.
2. Clicar em "Excluir" e confirmar.

**Resultado esperado:**
- Redirect para `/veiculos/[id]` aba Abastecimentos.
- O segundo abastecimento (que antes tinha km/l calculado) passa a exibir km/l `—` (perdeu a referência de odômetro anterior).
- `vehicle.currentOdometer` reflete o odômetro do abastecimento mais recente restante.

---

### C6 — Bloqueio por ownership (usuário B tenta acessar recurso do usuário A)

**Ação:**
1. Em janela anônima, criar conta de usuário B e logar.
2. Navegar diretamente para `/abastecimento/[id]` onde `[id]` pertence ao usuário A.

**Resultado esperado:**
- A API retorna 403 (`vehicle.not_owned`) ou 404 (`fuelup.not_found`).
- A página exibe mensagem de erro ou redireciona — o dado do usuário A não é exposto.

---

### C7 — Acesso sem sessão → redirect para login

**Ação:**
1. Deslogar (ou usar janela anônima sem conta).
2. Tentar acessar `/veiculos/[id]` diretamente.

**Resultado esperado:**
- Redirect automático para `/login` (middleware de autenticação do Next.js + NextAuth).
- Nenhum dado de veículo exposto sem autenticação.

---

## Resultados dos Testes Automatizados

```
Test Files  45 passed (45)
     Tests  484 passed (484)
  Start at  18:54:31
  Duration  7.12s
```

Todos os testes unitários e de integração passam sem falhas. A suite cobre:

- `recalculateChain` — 8 cenários (função pura, incluindo parciais e exclusão de cheios)
- `RegisterFuelupUseCase` — 7 cenários (incluindo validação de odômetro e derivação de campos)
- `UpdateFuelupUseCase` — 7 cenários (edição retroativa, mudança de fullTank, odômetro inválido)
- `DeleteFuelupUseCase` — 3 cenários (cascata, exclusão do único fuelup)
- `ListFuelupsUseCase` + `GetFuelupUseCase` — 10 cenários (paginação, ownership)
- `PrismaFuelupRepository` — 13 cenários de integração
- `useFuelupCalculator` — 13 cenários (derivação dos 3 campos, arredondamento, edge cases)

---

## Débitos Técnicos Registrados

Os itens abaixo foram identificados nas reviews das tasks 1.0–11.0 e não bloquearam aprovação. São candidatos a tasks de manutenção em fases futuras.

### Arquitetura / Backend

| ID | Origem | Descrição | Prioridade |
|----|--------|-----------|------------|
| DT-01 | Task 11 (H1) | `VehicleDetailPage` busca todos os veículos e filtra em memória em vez de usar `getVehicleUseCase`. Ausência de `GET /api/vehicles/[id]`. | Alta |
| DT-02 | Task 4 (M2) | `odometer.not_increasing` usa `findLastByVehicle` (último canônico por odômetro), não o maior odômetro absoluto. Pode não detectar inserções retroativas fora de ordem. | Média |
| DT-03 | Task 6 (M1) | Função `toDto` duplicada entre `ListFuelupsUseCase` e `GetFuelupUseCase`. Deveria ser exportada de `_shared/`. | Média |
| DT-04 | Task 1/4/5 (M1) | TechSpec descreve `saveFuelup(data: { upsert: Fuelup; ... })` mas a implementação usa `SaveFuelupData` com `mode + fuelup DTO plano`. TechSpec não foi atualizada. | Baixa |
| DT-05 | Task 6 (L1) | `GetFuelupUseCase` lança `vehicle.not_owned` quando veículo é `null`, mas `ListFuelupsUseCase` lança `vehicle.not_found`. Inconsistência dificulta logging. | Baixa |
| DT-06 | Task 3 (L1) | `recalculateChain` não documenta o comportamento de parciais antes do primeiro `fullTank` (litros acumulados sem ser consumidos). | Baixa |

### Frontend

| ID | Origem | Descrição | Prioridade |
|----|--------|-----------|------------|
| DT-07 | Task 11 (M1) | Dashboard usa `pageSize=200` e filtra em memória para obter o último km/l com valor. Deveria usar `pageSize=1` com lógica clara ou documentar a decisão. | Média |
| DT-08 | Task 11 (M2) | `FuelupHistoryList` reordena itens no cliente (sort completo) em vez de inverter o array já ordenado pelo servidor. | Baixa |
| DT-09 | Task 10 (M1) | `vehicleId` no body do PUT é populado via estado interno do `FuelupForm` — dependência implícita. | Baixa |
| DT-10 | Task 10 (M2) | Sem feedback visual de sucesso antes do redirect (PRD RF-08 menciona mensagem com check verde). Redirect imediato é comportamento atual. | Baixa |
| DT-11 | Task 10 (L1) | Título do `FuelupForm` está fixo como "Registrar abastecimento" mesmo na página de edição. | Baixa |
| DT-12 | Task 10 (L2) | `vehicles={[]}` passado explicitamente — seletor de veículo nunca aparece mesmo com múltiplos veículos. Adequado para o fluxo atual (vehicleId pré-fixado via URL). | Baixa |
| DT-13 | Task 9 (M1) | Semântica de `locked` no `useFuelupCalculator` diverge da TechSpec (implementação: campo calculado; spec: campo editado por último). | Baixa |
| DT-14 | Task 9 (L2) | Erro de validação 2-de-3 campos aparece no path `["liters"]` em vez de path neutro (`["_fuelFields"]`). | Baixa |
| DT-15 | Task 11 (L1) | `pageSize=100` no `FuelupHistoryList` sem paginação visual. Limite documentado aqui. | Baixa |
| DT-16 | Task 11 (L2) | Aba "Manutenção" usa JSX inline em vez do componente `EmptyState` reutilizável. | Baixa |

---

## Cobertura dos Requisitos do PRD

| Requisito | Status |
|-----------|--------|
| RF-01 Registrar abastecimento (3 campos) | Implementado |
| RF-02 Cálculo automático do terceiro campo | Implementado |
| RF-03 Validar 2-de-3 campos preenchidos | Implementado |
| RF-04 Abastecimento parcial (fullTank=false) | Implementado |
| RF-05 Calcular km/l por tanque cheio + parciais | Implementado |
| RF-06 Recalcular cadeia após edição/exclusão | Implementado |
| RF-07 Validar monotonicidade do odômetro | Implementado |
| RF-08 Editar abastecimento | Implementado |
| RF-09 Excluir abastecimento | Implementado |
| RF-10 Listar abastecimentos por veículo (paginado) | Implementado |
| RF-11 Ownership — bloquear acesso cross-account | Implementado |
| RF-12 Dashboard com km/l do veículo | Implementado |

**Status geral: Fase 4 concluída. Todos os requisitos funcionais do PRD cobertos.**
