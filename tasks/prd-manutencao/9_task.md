---
status: pending
parallelizable: false
blocked_by: ["7.0", "8.0"]
---

<task_context>
<domain>front/pages</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies></dependencies>
</task_context>

# Tarefa 9.0: Páginas `/manutencao` (criar) e `/manutencao/[id]` (editar)

## Visão Geral

Cria as duas páginas de formulário que consomem o `MaintenanceForm` (task 8.0) contra as API routes (task 7.0). Segue o padrão das páginas de abastecimento (`/abastecimento` e `/abastecimento/[id]`).

<requirements>
- `/manutencao` — página de criação; pré-seleciona `vehicleId` via query param `?vehicleId=`
- `/manutencao/[id]` — página de edição; carrega dados via `GET /api/maintenances/[id]` e preenche o formulário
- Auth guard via layout `(app)/` (já existente)
- Estado de carregamento enquanto busca os dados na edição
- Tratar erro 404 (manutenção não encontrada) redirecionando para `/dashboard`
</requirements>

## Subtarefas

- [ ] 9.1 Criar `src/app/(app)/manutencao/page.tsx` renderizando `<MaintenanceForm />`
- [ ] 9.2 Criar `src/app/(app)/manutencao/[id]/page.tsx` com fetch dos dados e `<MaintenanceForm defaultValues={...} maintenanceId={id} />`
- [ ] 9.3 Adicionar `loading.tsx` em `manutencao/[id]/` (skeleton simples)
- [ ] 9.4 Testar no browser: criar manutenção, editar, verificar redirecionamento pós-save
- [ ] 9.5 Testar com `vehicleId` via query param na criação

## Detalhes de Implementação

**`/manutencao/page.tsx`:**

```tsx
export default function NewMaintenancePage({ searchParams }: { searchParams: { vehicleId?: string } }) {
  return (
    <MaintenanceForm defaultValues={{ vehicleId: searchParams.vehicleId ?? "", items: [{ description: "", quantity: 1, unitPrice: 0 }] }} />
  );
}
```

**`/manutencao/[id]/page.tsx`:**

```tsx
// Client component — fetch no mount
"use client";
export default function EditMaintenancePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<MaintenanceDTO | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/maintenances/${params.id}`)
      .then((r) => { if (r.status === 404) router.replace("/dashboard"); return r.json(); })
      .then(setData);
  }, [params.id]);

  if (!data) return <Skeleton />;
  return <MaintenanceForm defaultValues={toFormValues(data)} maintenanceId={params.id} />;
}
```

`toFormValues(dto)` mapeia `MaintenanceDTO → MaintenanceFormValues` (date para string ISO, items sem `id`/`subtotal` calculados).

## Critérios de Sucesso

- Página de criação renderiza formulário vazio (com 1 item inicial) e pré-seleciona veículo via query param
- Página de edição preenche todos os campos incluindo itens existentes
- 404 redireciona para `/dashboard`
- `npm run build` e `npm run lint` verdes
