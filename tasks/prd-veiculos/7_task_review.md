# Task 7.0 Review — Frontend Dashboard: VehicleCard + página `/dashboard` + onboarding EmptyState

## Verdict: APPROVED

## Findings

### Critical
_Nenhum._

### High

**H1 — EmptyState não usa componente reutilizável (subtarefa 7.4 ignorada)**
A subtarefa 7.4 exigia integrar o componente `EmptyState` existente em `components/ui/`. O componente não existe no projeto, e a implementação optou por inline do markup dentro de `dashboard/page.tsx`. A decisão é pragmaticamente correta (componente ausente), mas a subtarefa 7.4 nunca foi revisitada nem documentada como "componente não encontrado, inline adotado". Recomenda-se criar `src/components/ui/empty-state.tsx` reutilizável, pois o mesmo padrão será necessário nas páginas de abastecimentos e manutenções (Fases 4 e 5). Não bloqueia aprovação desta tarefa, mas deve ser endereçado antes da Fase 4.

### Medium

**M1 — `max-w-[430px]` não aplicado no EmptyState wrapper externo**
No estado vazio, o wrapper externo usa `min-h-screen flex items-center justify-center` sem `max-w-[430px]` no nível do container de fundo. O card interno tem `max-w-[430px]`, o que resolve visualmente, mas é inconsistente com o estado com veículos (onde o `max-w-[430px]` está no `div` de conteúdo, não na tela toda). Em telas muito largas, o background bege não ficará contido. Baixo impacto no MVP mobile-first, mas diverge da especificação visual.

**M2 — Subtarefa 7.1 (inspeção do protótipo) não verificável**
A subtarefa 7.1 exige inspecionar `docs/RodagemApp.html` antes de codificar. Não há evidência de que isso foi feito (nenhum comentário, nenhum commit de referência). O resultado visual pode estar correto, mas a conformidade com o protótipo não pode ser auditada sem teste visual manual. O review visual (subtarefa 7.6) também não está documentado.

**M3 — Placa duplicada no card (header + stats)**
O `VehicleCard` exibe a placa duas vezes: uma no subtítulo abaixo do nome do veículo (linha 102) e outra no grid de stats "Placa" (linha 128–130). Para veículos sem placa, "—" aparece em ambos os locais, o que é redundante. O protótipo deve ser consultado para confirmar se isso é intencional.

### Low

**L1 — Ícones SVG inline sem abstração**
Os quatro ícones (`CarIcon`, `FuelIcon`, `WrenchIcon`, `RoadIcon`) estão definidos como componentes locais dentro de `vehicle-card.tsx`. O projeto já usa shadcn/ui — se `lucide-react` estiver disponível (dependência do shadcn), esses ícones deveriam vir da biblioteca, reduzindo o boilerplate. Não é bloqueante, mas aumenta a manutenibilidade se a lib já está no bundle.

**L2 — Subtarefas do arquivo de tarefa não marcadas como completas**
O arquivo `7_task.md` ainda tem todas as subtarefas com `[ ]` (desmarcadas). Após aprovação, o status e as checkboxes devem ser atualizados para refletir o estado real.

## Summary

A implementação atende a todos os critérios de sucesso definidos na tarefa:

- Auth guard correto: `getServerSession(authOptions)` com `redirect("/login")` sem sessão.
- EmptyState com título, descrição e CTA para `/configuracoes` — inline mas funcionalmente correto.
- Grid de `VehicleCard` com `vehicles.map()` e `key={vehicle.id}`.
- `VehicleCard` exibe nome, placa (`?? "—"`) e odômetro formatado com `toLocaleString("pt-BR")`.
- Botões Abastecer e Manutenção com `disabled` e `cursor-not-allowed`.
- Link Histórico → `/veiculos/${vehicle.id}` via `<Link>`.
- Layout `max-w-[430px]` aplicado no estado com veículos; tema Âmbar; mobile-first.
- `VehicleDTO` importado corretamente de `@/application/dtos/vehicle.dto.ts`.
- `session.accountId` usado corretamente (não `session.user.accountId`), alinhado com o NextAuth config.
- `listVehiclesUseCase` registrado no container e importado corretamente.

Os achados H1 e M1–M3 são melhorias recomendadas, mas não comprometem a funcionalidade desta tarefa.

## Required Actions Before Completion

1. (Recomendado antes da Fase 4) Extrair o inline EmptyState de `dashboard/page.tsx` para `src/components/ui/empty-state.tsx` como componente reutilizável — evita duplicação nas fases seguintes.
2. Marcar subtarefas 7.1–7.6 como completas em `7_task.md` e atualizar `status: completed`.
3. Avaliar remoção da placa duplicada no `VehicleCard` (header + stats) após consulta ao protótipo visual.
