---
status: completed
parallelizable: true
blocked_by: []
---

<task_context>
<domain>front/maintenance</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies></dependencies>
</task_context>

# Tarefa 8.0: `MaintenanceItemRow` + `MaintenanceForm` + Zod schema client-side

## Visão Geral

Cria os dois componentes de formulário e o schema de validação client-side. Pode ser desenvolvida inteiramente em paralelo com o backend. Referência visual: `MaintScreen` em `docs/RodagemApp.html`.

<requirements>
- `MaintenanceItemRow`: linha do grid de itens com campos inline e subtotal calculado em tempo real
- `MaintenanceForm`: formulário completo com `useFieldArray` (react-hook-form), total no rodapé atualizado em tempo real, submit para POST ou PUT
- `maintenance-form.schema.ts`: schema Zod client-side com mesmo contrato do endpoint
- Ao menos 1 item obrigatório (validado no schema)
- Subtotal por item = `quantity × unitPrice` exibido como `span` somente-leitura
- Total no rodapé = soma de todos os subtotais, fixo na parte inferior (fundo âmbar)
- Redirecionar para `/veiculos/[id]?tab=manutencao` após sucesso
- `EmptyState` não se aplica aqui (formulário sempre tem ao menos 1 item inicial)
</requirements>

## Subtarefas

- [x] 8.1 Criar `src/components/maintenances/maintenance-form.schema.ts`
- [x] 8.2 Criar `src/components/maintenances/MaintenanceItemRow.tsx`
- [x] 8.3 Criar `src/components/maintenances/MaintenanceForm.tsx` com `useFieldArray`
- [x] 8.4 Validar visual contra `MaintScreen` no protótipo HTML
- [x] 8.5 Testar adição/remoção de itens e atualização do total em tempo real (browser)

## Detalhes de Implementação

**`maintenance-form.schema.ts`:**

```ts
export const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  date: z.string().min(1, "Data obrigatória"),
  odometer: z.coerce.number().int().positive().optional().or(z.literal("")),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Descrição obrigatória"),
    quantity: z.coerce.number().positive("Quantidade deve ser > 0"),
    unitPrice: z.coerce.number().positive("Valor unitário deve ser > 0"),
  })).min(1, "Adicione ao menos um item"),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;
```

**`MaintenanceItemRow.tsx`:**

```tsx
// Props: index, onRemove, control (react-hook-form)
// Campos: Input descrição, Input quantidade, Input valor unitário, span subtotal
// Subtotal calculado via:
const qty = watch(`items.${index}.quantity`) ?? 0;
const price = watch(`items.${index}.unitPrice`) ?? 0;
const subtotal = (Number(qty) * Number(price)).toFixed(2);
```

**`MaintenanceForm.tsx` (estrutura):**

```tsx
const { fields, append, remove } = useFieldArray({ control, name: "items" });

// Total no rodapé:
const items = watch("items");
const total = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);

// Ao montar: append um item inicial vazio se fields.length === 0

// Submit:
const onSubmit = async (data) => {
  const url = maintenanceId ? `/api/maintenances/${maintenanceId}` : "/api/maintenances";
  const method = maintenanceId ? "PUT" : "POST";
  const res = await fetch(url, { method, body: JSON.stringify(data) });
  if (res.ok) router.push(`/veiculos/${data.vehicleId}?tab=manutencao`);
};
```

**Grid de itens (referência protótipo):**

| Descrição | Qtd | Unit (R$) | Subtotal |
|---|---|---|---|
| Input texto | Input número | Input número | Span somente-leitura |

Rodapé fixo: `Total: R$ {total.toFixed(2)}` com fundo `var(--accent)`.

## Critérios de Sucesso

- Grid 4 colunas fiel ao protótipo
- Subtotal por item e total geral atualizam em tempo real sem reload
- Validação client-side: erro visível se sem itens ou campos obrigatórios vazios
- Submit chama a API correta (POST criar, PUT editar) e redireciona após sucesso
- `npm run build` e `npm run lint` verdes
