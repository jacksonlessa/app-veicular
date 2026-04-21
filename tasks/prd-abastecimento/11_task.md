---
status: completed
parallelizable: true
blocked_by: ["8.0"]
---

<task_context>
<domain>front/pages</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 11.0: Página `/veiculos/[id]` com aba Abastecimentos + integração no dashboard

## Visão Geral

Cria a página de detalhe do veículo (`HistoryScreen` no protótipo), inicialmente apenas com a aba "Abastecimentos" — a aba "Manutenção" fica como placeholder até a Fase 5. Também integra a Fase 4 no dashboard: o botão "Abastecer" do `VehicleCard` passa a linkar para `/abastecimento?vehicleId=…` e o card exibe o km/l médio do veículo.

<requirements>
- `src/app/(app)/veiculos/[id]/page.tsx` (nova página protegida)
- Aba "Abastecimentos" ativa por default; aba "Manutenção" renderiza `EmptyState` "Em breve (Fase 5)"
- Lista ordenada decrescente (mais recente primeiro) com: data, odômetro, litros, total, km/l
- Cada item é clicável e navega para `/abastecimento/[id]`
- Query param `?tab=abastecimentos` seleciona a aba (para o redirect da task 10.0 funcionar)
- No `VehicleCard` do dashboard: botão "Abastecer" aponta para `/abastecimento?vehicleId=…`
- No `VehicleCard`: se o veículo tem ao menos um fuelup com `kmPerLiter`, exibir "X,X km/l" (último valor); senão mostrar "—"
</requirements>

## Subtarefas

- [x] 11.1 Criar `src/app/(app)/veiculos/[id]/page.tsx` — Server Component que carrega dados via `GET /api/vehicles/[id]` e renderiza `VehicleDetailView` (client)
- [x] 11.2 Criar `src/components/vehicles/VehicleDetailView.tsx` (Client) com shadcn `Tabs`
- [x] 11.3 Criar `src/components/fuelups/FuelupHistoryList.tsx` — consume `GET /api/fuelups?vehicleId=…`, renderiza lista clicável, cada item vira `<Link href={/abastecimento/${id}}>`
- [x] 11.4 Atualizar `src/components/ui/vehicle-card.tsx`: botão "Abastecer" usa `<Link href={/abastecimento?vehicleId=${id}}>`; adicionar campo `lastKmPerLiter?: number | null` ao prop e renderizar
- [x] 11.5 Atualizar `src/app/(app)/dashboard/page.tsx` para buscar o último km/l de cada veículo (via `GET /api/fuelups?vehicleId=…&pageSize=1`) e passar ao `VehicleCard`
- [x] 11.6 Testar navegador: dashboard → card mostra km/l → clicar em "Abastecer" → criar → voltar → aba mostra novo item → clicar → editar
- [x] 11.7 `npm run lint` verde

## Detalhes de Implementação

**Estrutura de `/veiculos/[id]`:**

```tsx
// Server: carrega vehicle via GET /api/vehicles/[id]; se 404, redirect
// Client: VehicleDetailView com tabs
<Tabs defaultValue={searchParams.tab ?? "abastecimentos"}>
  <TabsList>
    <TabsTrigger value="abastecimentos">Abastecimentos</TabsTrigger>
    <TabsTrigger value="manutencao" disabled>Manutenção (em breve)</TabsTrigger>
  </TabsList>
  <TabsContent value="abastecimentos">
    <FuelupHistoryList vehicleId={id} />
  </TabsContent>
</Tabs>
```

**Dashboard km/l médio:** buscar `?pageSize=1` de cada veículo em paralelo (Promise.all no Server Component do dashboard) para pegar o `kmPerLiter` mais recente. Alternativa mais simples: adicionar um novo endpoint `/api/vehicles/[id]/summary` — NÃO fazer nesta fase para não inchar o escopo.

**Fidelidade ao protótipo:** `HistoryScreen` exibe cada item em card com grid mostrando data/odômetro/litros/total e km/l em destaque no lado direito. Reproduzir aproximadamente.

## Critérios de Sucesso

- Página `/veiculos/[id]` acessível e renderiza aba Abastecimentos com histórico
- Aba Manutenção visível mas desabilitada
- Dashboard mostra km/l atualizado no card após criar um abastecimento
- Botão "Abastecer" abre `/abastecimento?vehicleId=…` com veículo pré-selecionado
- `npm run lint` verde
