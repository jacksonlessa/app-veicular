# Task 8.0 Review — Frontend Configurações: VehicleForm + DeleteDialog + página `/configuracoes`

## Verdict: CHANGES REQUIRED

## Findings

### Critical

**C1 — DeleteDialog não fecha após exclusão bem-sucedida**

Em `delete-dialog.tsx`, o botão "Remover" chama `handleConfirm()` diretamente. Após o `fetch` retornar 2xx e `router.refresh()` ser chamado, o diálogo permanece aberto porque não há mecanismo para fechá-lo: o componente não usa estado controlado (`open`/`setOpen`) nem envolve o botão em `AlertDialog.Close`. O usuário fica preso num diálogo que não fecha.

Correção mínima: controlar o estado `open` do `AlertDialog.Root` ou encadear a ação do botão "Remover" com `AlertDialog.Close` que emita o `handleConfirm` via `onClick`.

Exemplo de abordagem com estado controlado:
```tsx
const [open, setOpen] = useState(false);
// ...
// após res.ok:
setOpen(false);
router.refresh();
// ...
<AlertDialog.Root open={open} onOpenChange={setOpen}>
```

### High

**H1 — `VehicleForm` usa estado local não sincronizado ao reabrir em modo edição**

O `resetForm()` usa o valor de `vehicle` capturado no closure do render inicial. Se o Server Component atualizar os dados do veículo após um `router.refresh()` (por exemplo, após editar e reabrir), o estado inicial (`useState(vehicle?.name ?? "")`) não se reinicializa automaticamente porque o componente não é remontado — os `useState` retêm seus valores. O `resetForm` corretamente usa `vehicle?.name ?? ""`, mas como o componente React mantém identidade entre re-renders do pai (mesmo `key`), uma segunda abertura após refresh pode exibir valores desatualizados se o React reaproveitar a instância.

Mitigação recomendada: adicionar `key={vehicle?.id ?? "new"}` no componente `VehicleForm` no ponto de uso, para forçar remontagem ao trocar de veículo.

**H2 — Erro no DeleteDialog não é limpo entre aberturas**

O estado `error` no `DeleteDialog` não é limpo quando o diálogo é reaberto. Se o usuário tentar excluir, receber um erro, fechar e reabrir o diálogo, o erro anterior permanecerá visível. Não há `onOpenChange` para resetar `error` ao fechar.

### Medium

**M1 — `VehicleForm` não usa `react-hook-form` + `zodResolver` conforme TechSpec**

A TechSpec especifica explicitamente `react-hook-form + zodResolver` para o `VehicleForm`. A implementação usa estado local com `useState` e validação manual inline. Embora funcional, isso é um desvio do padrão estabelecido na spec. O projeto tem `react-hook-form` listado como dependência? Verificar — se sim, o desvio deve ser justificado ou corrigido para manter consistência com o padrão.

Observação: se o projeto não usa `react-hook-form` em nenhum outro lugar, este ponto cai para Low. Mas a TechSpec e a task spec explicitamente pedem esse padrão.

**M2 — Validação de formato de placa ausente no formulário client-side**

O PRD (RF-02) e a TechSpec definem que a placa deve ser validada nos formatos AAA-9999 ou Mercosul (AAA9A99). O `VehicleForm` aceita qualquer string no campo placa sem validação de formato. Embora o backend valide via `Plate` VO e retorne 400, o formulário não exibe um erro de campo específico para placa inválida — cai no catch genérico "Verifique os dados informados." A UX seria melhor com validação client-side ou com mapeamento preciso do erro 400 de placa.

**M3 — Tratamento de erro 400 (backend Zod) é genérico demais**

A tarefa pede: "400 (Zod backend) → exibir erros de campo". A implementação exibe "Verifique os dados informados." sem mostrar qual campo falhou. Não há mapeamento de `data.issues` ou `data.errors` para campos individuais.

### Low

**L1 — Subtarefa 8.1 (inspecionar protótipo HTML) não verificável por revisão de código**

A subtarefa 8.1 pede inspeção visual do `RodagemApp.html`. Não há evidência de que foi realizada (screenshot, comentário, ou nota). Não bloqueia, mas deve ser registrado.

**L2 — `DeleteDialog` não desabilita o botão "Remover" ao carregar e permite clique duplo**

Quando `loading = true`, o botão "Remover" recebe `disabled={loading}`. Isso está correto. Porém, não há feedback visual de "Removendo…" ao mesmo tempo que o diálogo permanece aberto (ver C1) — o usuário pode clicar "Cancelar" durante o loading e o estado fica inconsistente. Resolver C1 antes de avaliar este ponto.

**L3 — Inline SVGs duplicados sem abstração**

`CarIcon`, `PlusIcon`, `EditIcon`, `TrashIcon` são definidos diretamente em `configuracoes/page.tsx`. O projeto pode já ter um pacote de ícones (`lucide-react`, por exemplo). Verificar se há duplicação desnecessária em relação ao que já existe no projeto.

**L4 — Ausência de `aria-label` ou texto acessível no botão de trigger do `DeleteDialog`**

O botão "Excluir" passado como `trigger` não tem `aria-label` adicional para identificar de qual veículo se trata (ex: "Excluir Gol Branco"). Quando há múltiplos veículos, leitores de tela verão dois botões "Excluir" sem distinção. Recomendado: `aria-label={Excluir ${vehicle.name}}`.

## Summary

A implementação cobre corretamente os pontos mais críticos da tarefa: auth guard com redirect para `/login`, modo criar (POST) e editar (PUT) no `VehicleForm`, uso de `currentOdometer` no modo edição (não `initOdometer`), tratamento do erro 409, botão "Adicionar veículo" desabilitado quando `vehicles.length >= 2`, e `router.refresh()` após mutações bem-sucedidas no `VehicleForm`.

O único defeito crítico é que o `DeleteDialog` não fecha após a exclusão bem-sucedida — `router.refresh()` é chamado mas o diálogo permanece visível, bloqueando a interface.

Há também dois issues de alta prioridade: estado de formulário potencialmente desatualizado ao reabrir em modo edição, e erro não limpo entre aberturas do `DeleteDialog`.

## Required Actions Before Completion

1. **[OBRIGATÓRIO — C1]** Corrigir `delete-dialog.tsx`: após exclusão bem-sucedida, fechar o `AlertDialog` antes ou junto com `router.refresh()`. Usar estado controlado `open`/`setOpen` + `onOpenChange` para também limpar `error` ao fechar (resolve H2 juntos).

2. **[OBRIGATÓRIO — H1]** Adicionar `key={vehicle.id}` nas instâncias de `<VehicleForm vehicle={vehicle} ...>` dentro do `.map()` em `configuracoes/page.tsx` para garantir remontagem ao trocar de veículo.

3. **[RECOMENDADO — M1]** Avaliar se `react-hook-form` + `zodResolver` estão disponíveis no projeto. Se sim, refatorar `VehicleForm` para usar o padrão especificado, ou documentar a decisão de desvio.

4. **[RECOMENDADO — M2/M3]** Melhorar feedback de erros de validação no formulário: ao menos exibir mensagem específica para placa inválida (parse de `data.issues` da resposta 400).
