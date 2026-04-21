---
status: completed
parallelizable: true
blocked_by: ["5.0"]
---

<task_context>
<domain>front/pages</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 7.0: Frontend Dashboard — VehicleCard + página `/dashboard` + onboarding EmptyState

## Visão Geral

Implementar a página `/dashboard` como Server Component e o componente `VehicleCard`, seguindo fielmente o protótipo `DashboardScreen` do arquivo `docs/RodagemApp.html`. Usuários sem veículos veem o `EmptyState` com CTA para cadastrar o primeiro veículo.

<requirements>
- Página `/dashboard` é Server Component (busca dados via use case direto, sem fetch HTTP)
- Sem veículos ativos → exibir `EmptyState` com CTA para `/configuracoes`
- Com veículos → grid de `VehicleCard` por veículo, na ordem de criação
- `VehicleCard` exibe: nome, placa, odômetro atual, 3 atalhos (Abastecer disabled, Manutenção disabled, Histórico → `/veiculos/[id]`)
- Fidelidade visual ao protótipo: `max-w-[430px]`, mobile-first, tema Âmbar, Plus Jakarta Sans
- Sem sessão → redirecionar para `/login`
</requirements>

## Subtarefas

- [ ] 7.1 Abrir `docs/RodagemApp.html` no browser e inspecionar `DashboardScreen` e `VehicleCard` antes de codificar
- [ ] 7.2 Criar `src/components/ui/vehicle-card.tsx` — Client Component com props `vehicle: VehicleDTO`
- [ ] 7.3 Criar `src/app/(app)/dashboard/page.tsx` — Server Component que chama `listVehiclesUseCase` diretamente
- [ ] 7.4 Integrar `EmptyState` existente na página (verificar props disponíveis em `components/ui/`)
- [ ] 7.5 Verificar auth guard: sem sessão → `redirect("/login")`
- [ ] 7.6 Testar visualmente no browser: estado vazio, 1 veículo, 2 veículos

## Detalhes de Implementação

### `/dashboard` — estrutura geral

```typescript
// src/app/(app)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { listVehiclesUseCase } from "@/infrastructure/container";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { vehicles } = await listVehiclesUseCase.execute({
    accountId: session.user.accountId,
  });

  if (vehicles.length === 0) {
    return <EmptyState ... />;
  }

  return (
    <div className="...">
      {vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
    </div>
  );
}
```

### `VehicleCard` — props e estrutura

```typescript
// src/components/ui/vehicle-card.tsx
"use client";

interface VehicleCardProps { vehicle: VehicleDTO }

export function VehicleCard({ vehicle }: VehicleCardProps) {
  // Exibir: nome, placa (ou "—" se null), odômetro atual formatado
  // Botões:
  //   - Abastecer: disabled (Fase 4)
  //   - Manutenção: disabled (Fase 5)
  //   - Histórico: Link href={`/veiculos/${vehicle.id}`}
}
```

### EmptyState

Verificar o componente em `src/components/ui/empty-state.tsx` (ou similar). Passar:
- Título: "Nenhum veículo cadastrado"
- Descrição: "Cadastre seu primeiro veículo para começar a registrar gastos"
- CTA: botão/link para `/configuracoes`

### Referência visual obrigatória

Antes de implementar, abrir `docs/RodagemApp.html` no browser e verificar:
- Grid de cards no `DashboardScreen`
- Layout exato do `VehicleCard` (ícones, tipografia, espaçamento, cores dos botões)
- Estado vazio (se prototipado)

## Critérios de Sucesso

- `/dashboard` sem sessão redireciona para `/login`
- `/dashboard` com conta sem veículos exibe `EmptyState` com CTA funcional
- `/dashboard` com veículos exibe um `VehicleCard` por veículo
- `VehicleCard` exibe nome, placa e odômetro corretamente
- Botões Abastecer e Manutenção estão presentes mas desabilitados (sem erros visuais)
- Link Histórico navega para `/veiculos/[id]` (página pode não existir ainda — sem erro 500)
- Visual fiel ao protótipo `DashboardScreen` do `RodagemApp.html`
- Layout `max-w-[430px]` centralizado, mobile-first
