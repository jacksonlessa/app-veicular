# Task 11.0 Review — Página `/veiculos/[id]` com aba Abastecimentos + integração no dashboard

## Verdict: APPROVED

## Findings

### Critical
Nenhum.

### High

**H1 — `VehicleDetailPage` busca todos os veículos e filtra em memória (desvio de spec)**
Arquivo: `src/app/(app)/veiculos/[id]/page.tsx` linha 19.

A task (subtarefa 11.1) especifica "Server Component que carrega dados via `GET /api/vehicles/[id]`". A implementação chama `listVehiclesUseCase.execute` e localiza o veículo por `Array.find`. Não existe `getVehicleUseCase` nem `GET /api/vehicles/[id]`. O comportamento funcional é correto e o impacto prático no MVP é mínimo, mas:
- Carrega todos os veículos da conta a cada acesso à página de detalhe.
- Se uma conta acumular muitos veículos futuramente, seria ineficiente.
- O back-link retorna para `/dashboard` em vez de `history.back()`, o que pode quebrar o fluxo quando o usuário chega pela URL direta de outro ponto (aceitável para o MVP).

Recomendação: criar `getVehicleUseCase` (trivial — já existe o repositório) e usá-lo aqui. Não é bloqueante para o MVP, mas é débito técnico de arquitetura.

### Medium

**M1 — Dashboard busca `pageSize=200` em vez de `pageSize=1` para obter o último km/l**
Arquivo: `src/app/(app)/dashboard/page.tsx` linha 27.

A task especifica `?pageSize=1` para buscar apenas o fuelup mais recente. A implementação pede até 200 itens, inverte o array em memória e procura o último com `kmPerLiter != null`. Isso funciona corretamente mas carrega dados desnecessários.

O motivo provável foi garantir que o km/l encontrado seja o mais recente *com valor preenchido*, não necessariamente o fuelup mais recente. Essa lógica está correta semanticamente. No entanto, `pageSize=1` retornaria o fuelup mais novo e, se ele tiver `kmPerLiter = null`, o dashboard mostraria "—" mesmo havendo um valor anterior — o que pode ser comportamento indesejado. Ainda assim, o desvio deveria ter sido documentado ou alinhado com a spec.

**M2 — `FuelupHistoryList` ordena no cliente, não confia na ordenação do servidor**
Arquivo: `src/components/fuelups/FuelupHistoryList.tsx` linhas 45–49.

A API retorna os itens ordenados por `date ASC, odometer ASC, createdAt ASC` (conforme techspec). O componente os reordena descrescentemente no cliente. Isso é correto, mas a ordenação poderia ser feita diretamente na API (`order=desc`) ou o componente poderia simplesmente inverter o array (`[...data.items].reverse()`), eliminando a necessidade de um sort completo. Baixo risco, mas duplicação de lógica de ordenação.

### Low

**L1 — `pageSize=100` no `FuelupHistoryList` sem paginação visual**
O componente busca até 100 abastecimentos sem scroll infinito ou paginação. Para o MVP é aceitável (PRD menciona "poucas centenas por ano"), mas vale documentar como limite.

**L2 — Aba "Manutenção" renderiza conteúdo de EmptyState inline em vez de componente `EmptyState` reutilizável**
A task pede "renderiza `EmptyState` 'Em breve (Fase 5)'". A implementação usa JSX inline. Sem impacto funcional.

## Summary

A implementação atende todos os requisitos funcionais da task 11.0: a página `/veiculos/[id]` está criada e acessível, a aba "Abastecimentos" lista o histórico clicável com data/odômetro/litros/total/km/l, a aba "Manutenção" está presente e desabilitada, o botão "Abastecer" aponta para `/abastecimento?vehicleId=…`, o `VehicleCard` exibe km/l e o dashboard passa o valor correto. O lint está verde (0 erros).

O único ponto de alto impacto (H1) é um desvio arquitetural da spec (ausência de `getVehicleUseCase`), mas não quebra nenhuma regra de negócio nem requisito do PRD — é débito técnico registrável. Todos os critérios de sucesso da task estão satisfeitos.

## Required Actions Before Completion
Nenhuma ação bloqueante. Os itens H1 e M1 são recomendações de melhoria para backlogs futuros:
- (Opcional, sugerido) Criar `getVehicleUseCase` e usá-lo em `VehicleDetailPage` para eliminar busca desnecessária de todos os veículos.
- (Opcional) Documentar a decisão de usar `pageSize=200` no dashboard em vez de `pageSize=1`, justificando a semântica de "último km/l com valor preenchido".
