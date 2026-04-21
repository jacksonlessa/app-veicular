---
status: pending
parallelizable: false
blocked_by: ["7.0"]
---

<task_context>
<domain>front/vehicles</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies></dependencies>
</task_context>

# Tarefa 10.0: `MaintenanceHistoryList` + aba Manutenções em `VehicleDetailView` + botão no `VehicleCard`

## Visão Geral

Habilita a aba "Manutenções" na tela do veículo e integra o componente de histórico. Também adiciona o botão "Manutenção" no `VehicleCard` do dashboard (link para `/manutencao?vehicleId=`). Referência visual: aba "Manutenções" em `HistoryScreen` e `VehicleCard` no protótipo.

<requirements>
- `MaintenanceHistoryList`: client component que faz `GET /api/maintenances?vehicleId=X`, exibe lista expansível (Accordion) com itens
- Card colapsado: data formatada + descrição (se houver) + total em reais
- Card expandido: grid com linhas de item (Descrição / Qtd / Unit / Subtotal), link "Editar" e botão "Excluir" com confirmação inline
- Excluir chama `DELETE /api/maintenances/[id]` e atualiza lista localmente
- `EmptyState` quando sem manutenções (com CTA "Registrar manutenção" → `/manutencao?vehicleId=`)
- `VehicleDetailView`: remover `disabled` da aba "Manutenções" e renderizar `<MaintenanceHistoryList vehicleId={vehicle.id} />`
- `VehicleCard`: adicionar botão "Manutenção" ao lado de "Abastecer" e "Histórico"
</requirements>

## Subtarefas

- [ ] 10.1 Criar `src/components/maintenances/MaintenanceHistoryList.tsx`
- [ ] 10.2 Implementar Accordion com shadcn/ui (`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`)
- [ ] 10.3 Implementar confirmação de exclusão inline (estado local `deletingId`) e chamada DELETE
- [ ] 10.4 Adicionar `EmptyState` quando lista vazia
- [ ] 10.5 Atualizar `VehicleDetailView.tsx`: remover `disabled`, importar e renderizar `MaintenanceHistoryList`
- [ ] 10.6 Atualizar `VehicleCard.tsx`: adicionar botão "Manutenção"
- [ ] 10.7 Testar no browser: criar manutenção, verificar na aba, expandir item, excluir

## Detalhes de Implementação

**`MaintenanceHistoryList.tsx` (estrutura):**

```tsx
"use client";
export function MaintenanceHistoryList({ vehicleId }: { vehicleId: string }) {
  const [maintenances, setMaintenances] = useState<MaintenanceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/maintenances?vehicleId=${vehicleId}`)
      .then((r) => r.json())
      .then(setMaintenances)
      .finally(() => setLoading(false));
  }, [vehicleId]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/maintenances/${id}`, { method: "DELETE" });
    setMaintenances((prev) => prev.filter((m) => m.id !== id));
    setDeletingId(null);
  };

  if (loading) return <Skeleton />;
  if (maintenances.length === 0) return <EmptyState message="Nenhuma manutenção registrada" cta={{ label: "Registrar manutenção", href: `/manutencao?vehicleId=${vehicleId}` }} />;

  return (
    <Accordion type="multiple">
      {maintenances.map((m) => (
        <AccordionItem key={m.id} value={m.id}>
          <AccordionTrigger>
            {/* data + descrição + R$ total */}
          </AccordionTrigger>
          <AccordionContent>
            {/* grid itens + botões editar/excluir */}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

**Grid de itens expandido:**

| Descrição | Qtd | Unit | Subtotal |
|---|---|---|---|
| texto | número | R$ x,xx | R$ x,xx |

**Confirmação de exclusão inline:**

```tsx
{deletingId === m.id ? (
  <div>
    <span>Confirmar exclusão?</span>
    <Button onClick={() => handleDelete(m.id)}>Sim</Button>
    <Button onClick={() => setDeletingId(null)}>Não</Button>
  </div>
) : (
  <Button onClick={() => setDeletingId(m.id)}>Excluir</Button>
)}
```

**`VehicleCard.tsx` — botão a adicionar:**

```tsx
<Link href={`/manutencao?vehicleId=${vehicle.id}`}>
  <Button variant="outline" size="sm">Manutenção</Button>
</Link>
```

## Critérios de Sucesso

- Aba "Manutenções" funcional e sem prop `disabled`
- Lista expansível mostra itens corretamente
- Exclusão remove da lista sem reload de página
- `EmptyState` exibido quando sem dados
- Botão "Manutenção" no `VehicleCard` navega corretamente
- `npm run build` e `npm run lint` verdes
