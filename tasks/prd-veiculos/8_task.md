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

# Tarefa 8.0: Frontend Configurações — VehicleForm + DeleteDialog + página `/configuracoes`

## Visão Geral

Implementar a página `/configuracoes` onde o usuário gerencia seus veículos (criar, editar, excluir). A página é um Server Component com ilhas Client para o formulário e o diálogo de exclusão. Todas as mutações passam pelas API routes criadas na task 5.0.

<requirements>
- Página `/configuracoes` lista veículos ativos com botões Editar e Excluir por veículo
- Botão "Adicionar veículo" desabilitado quando conta já tem 2 veículos
- `VehicleForm` em modal/sheet para criar e editar (mesmos campos: nome, placa opcional, odômetro)
- `DeleteDialog` com `AlertDialog` do shadcn — confirma exclusão antes de chamar `DELETE /api/vehicles/[id]`
- Após mutações: `router.refresh()` para re-renderizar o Server Component
- Sem sessão → redirecionar para `/login`
- Fidelidade visual ao protótipo (verificar `RodagemApp.html` para a tela de configurações)
</requirements>

## Subtarefas

- [ ] 8.1 Abrir `docs/RodagemApp.html` no browser e inspecionar a tela de configurações/veículos
- [ ] 8.2 Criar `src/components/vehicles/vehicle-form.tsx` — Client Component (criar e editar)
- [ ] 8.3 Criar `src/components/vehicles/delete-dialog.tsx` — Client Component com AlertDialog
- [ ] 8.4 Criar `src/app/(app)/configuracoes/page.tsx` — Server Component
- [ ] 8.5 Integrar `VehicleForm` e `DeleteDialog` na página `/configuracoes`
- [ ] 8.6 Verificar auth guard: sem sessão → `redirect("/login")`
- [ ] 8.7 Testar visualmente: criar veículo, editar, excluir com confirmação, limite de 2 veículos

## Detalhes de Implementação

### `VehicleForm` — Client Component

```typescript
// src/components/vehicles/vehicle-form.tsx
"use client";
// Props: vehicle?: VehicleDTO (se presente → modo edição), onSuccess?: () => void

// Campos (react-hook-form + zodResolver):
//   name: string (obrigatório, max 60)
//   plate: string (opcional)
//   initOdometer | currentOdometer: number (obrigatório, >= 0)
//     - no modo criar → initOdometer
//     - no modo editar → currentOdometer

// Submit:
//   criar → POST /api/vehicles
//   editar → PUT /api/vehicles/[vehicle.id]
// Após sucesso → router.refresh() + fechar modal
```

**Nota:** No modo edição, o campo de odômetro corresponde a `currentOdometer` (não `initOdometer`, que é imutável). `initOdometer` não deve ser exibido no formulário de edição.

### `DeleteDialog` — Client Component

```typescript
// src/components/vehicles/delete-dialog.tsx
"use client";
// Props: vehicleId: string, vehicleName: string, trigger: ReactNode

// shadcn AlertDialog:
//   Título: "Remover veículo"
//   Descrição: "Tem certeza que deseja remover {vehicleName}? Esta ação não pode ser desfeita."
//   Botão cancelar + botão confirmar (vermelho/destrutivo)
//   Confirmar → DELETE /api/vehicles/[vehicleId]
//   Sucesso → router.refresh()
```

### `/configuracoes` — Server Component

```typescript
// src/app/(app)/configuracoes/page.tsx
// - getServerSession() → sem sessão → redirect("/login")
// - listVehiclesUseCase.execute({ accountId }) → vehicles
// - Renderizar lista com botão Editar (abre VehicleForm em modo edição) e DeleteDialog
// - Botão "Adicionar veículo": disabled se vehicles.length >= 2
```

### Schema Zod para o formulário

Reutilizar a mesma lógica do backend para validação client-side (evitar duplicação — importar de um local compartilhado se o projeto já tiver esse padrão, ou definir inline):

```typescript
const vehicleFormSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(60),
  plate: z.string().optional(),
  odometer: z.number({ invalid_type_error: "Informe um número" }).int().nonnegative(),
});
```

### Tratamento de erros de API no formulário

- 409 (`vehicle.limit_reached`) → exibir mensagem "Limite de 2 veículos por conta atingido"
- 400 (Zod backend) → exibir erros de campo
- Outros → mensagem genérica de erro

## Critérios de Sucesso

- `/configuracoes` exibe lista de veículos com botões Editar e Excluir
- Criar veículo: formulário abre, submit chama POST, página atualiza com novo card
- Editar veículo: formulário abre pré-preenchido, submit chama PUT, página atualiza
- Excluir veículo: DeleteDialog exibe nome do veículo, confirmar chama DELETE, veículo some da lista
- Botão "Adicionar veículo" desabilitado quando há 2 veículos ativos
- Após excluir o 2º veículo, botão "Adicionar veículo" volta a ficar habilitado
- Sem sessão → redireciona para `/login`
- Visual fiel ao protótipo do `RodagemApp.html`
