---
status: completed
parallelizable: false
blocked_by: ["8.0", "9.0"]
---

<task_context>
<domain>front/pages</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 10.0: Páginas `/abastecimento` (criar) e `/abastecimento/[id]` (editar)

## Visão Geral

Implementa as duas páginas de entrada/edição de abastecimento. Ambas residem em `src/app/(app)/abastecimento/`, portanto são protegidas pelo auth guard do layout `(app)`. Reusam `FuelupForm` (task 9.0) e conversam com `/api/fuelups` (task 8.0) via fetch.

<requirements>
- `/abastecimento?vehicleId=…` — nova entrada; veículo vem do query param (vindo do `VehicleCard` do dashboard)
- `/abastecimento/[id]` — edita existente; carrega dados via `GET /api/fuelups/[id]` no client side
- Em sucesso: redireciona para `/veiculos/[vehicleId]` (aba Abastecimentos) com toast/feedback
- Em erro: mostra mensagem inline
- Na página de edição: botão "Excluir" com `confirm()` nativo antes de chamar `DELETE /api/fuelups/[id]`
- Layout `max-w-[430px]`, mobile-first
</requirements>

## Subtarefas

- [x] 10.1 Criar `src/app/(app)/abastecimento/page.tsx` (Client Component) — lê `vehicleId` via `useSearchParams`, renderiza `FuelupForm` com `onSubmit → POST /api/fuelups`
- [x] 10.2 Criar `src/app/(app)/abastecimento/[id]/page.tsx` (Client Component) — carrega fuelup existente via `useEffect + fetch`, renderiza `FuelupForm` com `initialValues`
- [x] 10.3 Implementar botão "Excluir" na página de edição com `confirm()` e `DELETE`
- [x] 10.4 Feedback de sucesso (bloco verde com check ou redirecionamento com delay ~1.2s conforme protótipo)
- [x] 10.5 Tratamento de erros: mostra `error` retornado pela API em banner inline
- [x] 10.6 Testar navegador: criar abastecimento, editar, excluir
- [x] 10.7 `npm run lint` verde

## Detalhes de Implementação

**Página de criar (trecho):**

```tsx
"use client";
export default function AbastecimentoNovoPage() {
  const params = useSearchParams();
  const vehicleId = params.get("vehicleId");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: FuelupFormValues) {
    const res = await fetch("/api/fuelups", {
      method: "POST",
      body: JSON.stringify({ vehicleId, ...values }),
    });
    if (!res.ok) return setError((await res.json()).error);
    router.push(`/veiculos/${vehicleId}?tab=abastecimentos`);
  }
  return <FuelupForm onSubmit={onSubmit} submitLabel="Salvar abastecimento" />;
}
```

**Página de edição:** mesmo padrão + `useEffect` inicial para carregar o fuelup; `onSubmit` chama `PUT /api/fuelups/[id]`.

**Nota de UX do protótipo:** o `FuelScreen` exibe uma mensagem de sucesso com check verde e volta para o dashboard após ~1.2s. Para o MVP, um redirect limpo já atende.

## Critérios de Sucesso

- Fluxo criar: dashboard → "Abastecer" no VehicleCard → `/abastecimento?vehicleId=…` → preencher → salvar → aba Abastecimentos com entrada nova
- Fluxo editar: aba Abastecimentos → clicar em item → `/abastecimento/[id]` → alterar → salvar → volta para aba com dado atualizado
- Fluxo excluir: confirmar → item some do histórico
- Mensagens de erro legíveis no UI quando API retorna 4xx
- Layout fiel ao protótipo (revisão visual manual)
- `npm run lint` verde
