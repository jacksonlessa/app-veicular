# TechSpec — Veículos (Fase 3)

_RodagemApp · Abril 2026_

---

## Resumo Executivo

A Fase 3 implementa o CRUD completo de veículos sobre a infraestrutura de domínio já existente (entidade `Vehicle`, Value Objects `Plate`, `Odometer`, `VehicleName` e interface `VehicleRepository` — todos presentes desde a Fase 1). O trabalho central é: (1) adicionar `deletedAt` ao schema Prisma para soft delete, (2) implementar `PrismaVehicleRepository` (hoje com stubs `NotImplementedError`), (3) criar os quatro use cases de veículos, (4) expor as rotas de API REST e (5) construir as telas de dashboard e configurações seguindo o protótipo `RodagemApp.html`.

A estratégia de busca de dados segue o padrão Next.js App Router: Server Components chamam use cases diretamente (sem round-trip HTTP); mutações (criar, editar, excluir) passam pelas API routes.

---

## Arquitetura do Sistema

### Visão Geral dos Componentes

```
Browser
  └─ /dashboard           (Server Component) → ListVehiclesUseCase
  └─ /configuracoes       (Server Component + Client islands) → API routes
       └─ VehicleForm     (Client Component — criar/editar)
       └─ DeleteDialog     (Client Component — confirmar exclusão)

API Routes
  └─ GET  /api/vehicles          → ListVehiclesUseCase
  └─ POST /api/vehicles          → CreateVehicleUseCase
  └─ PUT  /api/vehicles/[id]     → UpdateVehicleUseCase
  └─ DELETE /api/vehicles/[id]   → DeleteVehicleUseCase

Application Layer
  └─ ListVehiclesUseCase
  └─ CreateVehicleUseCase
  └─ UpdateVehicleUseCase
  └─ DeleteVehicleUseCase

Domain Layer (já implementado)
  └─ Vehicle entity
  └─ Plate VO / Odometer VO / VehicleName VO
  └─ VehicleRepository (interface)

Infrastructure Layer
  └─ PrismaVehicleRepository  ← implementar (hoje: stubs)
  └─ prisma/schema.prisma     ← adicionar deletedAt
```

---

## Design de Implementação

### Migração de Schema

Adicionar campo de soft delete ao modelo `Vehicle`:

```prisma
model Vehicle {
  // ... campos existentes
  deletedAt DateTime?   // ← NOVO
}
```

Gerar migração: `npx prisma migrate dev --name add_vehicle_deleted_at`

Todas as queries no `PrismaVehicleRepository` devem filtrar `deletedAt: null`.

### Interfaces Principais

#### VehicleRepository (interface existente — sem alteração)

```typescript
// src/domain/vehicle/repositories/vehicle.repository.ts
interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findByAccount(accountId: string): Promise<Vehicle[]>;
  create(vehicle: Vehicle): Promise<Vehicle>;
  update(vehicle: Vehicle): Promise<Vehicle>;
  delete(id: string): Promise<void>;      // soft delete
}
```

#### Use Case Inputs/Outputs

```typescript
// CreateVehicleUseCase
interface CreateVehicleInput {
  accountId: string;
  name: string;
  plate?: string;
  initOdometer: number;
}
interface CreateVehicleOutput { vehicleId: string }

// UpdateVehicleUseCase
interface UpdateVehicleInput {
  vehicleId: string;
  accountId: string;   // para verificar ownership
  name?: string;
  plate?: string | null;
  currentOdometer?: number;
}
interface UpdateVehicleOutput { vehicle: VehicleDTO }

// DeleteVehicleUseCase
interface DeleteVehicleInput { vehicleId: string; accountId: string }

// ListVehiclesUseCase
interface ListVehiclesInput  { accountId: string }
interface ListVehiclesOutput { vehicles: VehicleDTO[] }
```

#### VehicleDTO

```typescript
// src/application/dtos/vehicle.dto.ts
interface VehicleDTO {
  id: string;
  name: string;
  plate: string | null;
  initOdometer: number;
  currentOdometer: number;
  createdAt: string;   // ISO 8601
}
```

### Modelos de Dados

O schema já define o modelo `Vehicle` com todos os campos necessários. A única alteração é `deletedAt DateTime?`.

**Campos do formulário MVP:**

| Campo | Schema | VO | Obrigatório |
|---|---|---|---|
| `name` | `name String` | `VehicleName` (max 60 chars) | Sim |
| `plate` | `plate String?` | `Plate` (AAA-9999 ou AAA9A99) | Não |
| `initOdometer` | `initOdometer Int` | `Odometer` (>= 0) | Sim |

Os campos `brand`, `model`, `color` permanecem opcionais no schema e não são expostos no formulário MVP.

### Lógica dos Use Cases

#### CreateVehicleUseCase

```
1. findByAccount(accountId) → contar ativos
2. se count >= 2 → throw BusinessRuleError("vehicle.limit_reached")
3. se plate informada → Plate.create(plate) → InvalidValueError se inválida
4. VehicleName.create(name), Odometer.create(initOdometer)
5. Vehicle.create({ id: cuid(), accountId, name, plate, initOdometer, currentOdometer: initOdometer })
6. repository.create(vehicle) → retorna VehicleDTO
```

#### UpdateVehicleUseCase

```
1. repository.findById(vehicleId) → null → BusinessRuleError("vehicle.not_found")
2. vehicle.accountId !== accountId → BusinessRuleError("vehicle.not_found")  // sem expor que existe
3. construir novos VOs para campos alterados
4. invariant: newOdometer >= vehicle.initOdometer.value
5. Vehicle.rehydrate({ ...currentProps, name: newName, plate: newPlate, currentOdometer: newOdometer })
6. repository.update(updatedVehicle)
```

#### DeleteVehicleUseCase

```
1. repository.findById(vehicleId) → null → BusinessRuleError("vehicle.not_found")
2. vehicle.accountId !== accountId → BusinessRuleError("vehicle.not_found")
3. repository.delete(vehicleId)   // soft delete: SET deletedAt = now()
```

#### ListVehiclesUseCase

```
1. repository.findByAccount(accountId)  // filtra deletedAt IS NULL, ORDER BY createdAt ASC
2. mapeia para VehicleDTO[]
```

### PrismaVehicleRepository — Implementação

Seguir o padrão de `PrismaUserRepository`:

```typescript
// Helpers de mapeamento
function toEntity(raw: PrismaVehicle): Vehicle {
  return Vehicle.rehydrate({
    id: raw.id,
    accountId: raw.accountId,
    name: VehicleName.create(raw.name),
    plate: raw.plate ? Plate.create(raw.plate) : null,
    brand: raw.brand ?? "",
    model: raw.model ?? "",
    color: raw.color ?? "",
    initOdometer: Odometer.create(raw.initOdometer),
    currentOdometer: Odometer.create(raw.currentOdometer),
    createdAt: raw.createdAt,
  });
}

// findByAccount filtra deletedAt: null, ordena por createdAt asc
// delete faz: prisma.vehicle.update({ where: { id }, data: { deletedAt: new Date() } })
```

### Endpoints de API

| Método | Rota | Use Case | Auth | Resp. sucesso |
|---|---|---|---|---|
| `GET` | `/api/vehicles` | `ListVehiclesUseCase` | session | 200 `{ vehicles: VehicleDTO[] }` |
| `POST` | `/api/vehicles` | `CreateVehicleUseCase` | session | 201 `{ vehicleId }` |
| `PUT` | `/api/vehicles/[id]` | `UpdateVehicleUseCase` | session | 200 `{ vehicle: VehicleDTO }` |
| `DELETE` | `/api/vehicles/[id]` | `DeleteVehicleUseCase` | session | 204 |

Todas as rotas:
1. Verificam sessão NextAuth via `getServerSession()` — sem sessão → 401.
2. Extraem `accountId` da sessão (não do body).
3. Usam o helper `mapDomainError` existente em `src/app/api/_lib/error-handler.ts`.
4. Validam body com Zod antes de chamar o use case.

**Schemas Zod:**

```typescript
const CreateVehicleSchema = z.object({
  name: z.string().min(1).max(60),
  plate: z.string().optional(),
  initOdometer: z.number().int().nonnegative(),
});

const UpdateVehicleSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  plate: z.string().nullable().optional(),
  currentOdometer: z.number().int().nonnegative().optional(),
});
```

**Mapeamento de erros de domínio adicionais:**

```typescript
// em mapDomainError, adicionar:
"vehicle.limit_reached" → 409
"vehicle.not_found"     → 404
```

### Páginas e Componentes

#### `/dashboard` — Server Component

```
src/app/(app)/dashboard/page.tsx
- getServerSession() → redireciona /login se sem sessão
- chama ListVehiclesUseCase diretamente (sem fetch HTTP)
- se vehicles.length === 0 → renderiza <EmptyState />
- caso contrário → grid de <VehicleCard /> para cada veículo
```

#### `VehicleCard` — Client Component

```
src/components/ui/vehicle-card.tsx
Props: vehicle: VehicleDTO
- Exibe: nome, placa, odômetro atual
- Botões: Abastecer (disabled, href futuro), Manutenção (disabled, href futuro), Histórico → /veiculos/[id]
- Seguir fidelmente DashboardScreen/VehicleCard do protótipo RodagemApp.html
```

#### `/configuracoes` — Página de gestão de veículos

```
src/app/(app)/configuracoes/page.tsx  (Server Component)
- Lista veículos ativos com botões Editar e Excluir
- Botão "Adicionar veículo" (desabilitado se count >= 2)
- VehicleForm em modal/sheet (Client Component) para criar e editar
- DeleteDialog (shadcn AlertDialog) para confirmar exclusão
```

#### `VehicleForm` — Client Component

```
src/components/vehicles/vehicle-form.tsx
- Campos: Nome, Placa (opcional), Odômetro
- react-hook-form + resolverZod (já usado no projeto)
- POST /api/vehicles (criar) ou PUT /api/vehicles/[id] (editar)
- router.refresh() após sucesso para re-renderizar Server Component
```

#### `DeleteDialog` — Client Component

```
src/components/vehicles/delete-dialog.tsx
- shadcn AlertDialog com aviso claro de remoção
- DELETE /api/vehicles/[id]
- router.refresh() após sucesso
```

#### `EmptyState` — já existe em `components/ui/`

Verificar props disponíveis; passar título e CTA para cadastrar primeiro veículo.

---

## Pontos de Integração

Nenhuma integração externa nova. Dependências internas:

- **NextAuth session** — `account_id` já presente na sessão (configurado na Fase 2).
- **Prisma singleton** — importado de `src/infrastructure/database/prisma.client.ts`.
- **Container** — adicionar `vehicleRepository`, `createVehicleUseCase`, `updateVehicleUseCase`, `deleteVehicleUseCase`, `listVehiclesUseCase` a `src/infrastructure/container.ts`.

---

## Análise de Impacto

| Componente Afetado | Tipo de Impacto | Descrição & Nível de Risco | Ação Requerida |
|---|---|---|---|
| `prisma/schema.prisma` | Mudança de schema | Adiciona `deletedAt DateTime?` ao modelo `Vehicle`. Risco baixo (coluna nullable). | Gerar e aplicar migration |
| `PrismaVehicleRepository` | Implementação nova | Substitui stubs por implementação real. Sem impacto em outros módulos. | Implementar e testar |
| `src/infrastructure/container.ts` | Adição | Registrar repositório e 4 use cases novos. | Adicionar exports |
| `src/app/api/_lib/error-handler.ts` | Extensão | Adicionar mapeamentos para `vehicle.limit_reached` e `vehicle.not_found`. | Editar função `mapDomainError` |
| `src/app/(app)/dashboard/page.tsx` | Novo arquivo | Página principal do app autenticado. | Criar |
| Fases 4 e 5 (futuro) | Dependência futura | Usarão `vehicle.currentOdometer` — campo já existe no schema. | Nenhuma ação agora |

---

## Abordagem de Testes

### Testes Unitários

**Value Objects** (já existem — não alterar):
- `Plate`: testar padrão antigo, Mercosul, inválido.
- `Odometer`: testar zero, positivo, negativo.
- `VehicleName`: testar limite de 60 chars, string vazia.

**Vehicle entity:**
- `create()` com currentOdometer < initOdometer → `BusinessRuleError("vehicle.odometer_invalid")`.
- `rehydrate()` com props válidas → sucesso.

**Use Cases** (mocks do repositório):
- `CreateVehicleUseCase`: limit_reached quando 2 veículos ativos; placa inválida; criação bem-sucedida.
- `UpdateVehicleUseCase`: not_found; ownership errado (mesmo erro); odômetro inválido; atualização bem-sucedida.
- `DeleteVehicleUseCase`: not_found; ownership errado; soft delete bem-sucedido.
- `ListVehiclesUseCase`: lista vazia; lista com 2 veículos.

Localização: `tests/unit/application/usecases/vehicle/`

### Testes de Integração

**`PrismaVehicleRepository`** com banco SQLite in-memory (padrão do projeto):
- `create()` persiste e retorna entidade.
- `findByAccount()` ignora registros com `deletedAt != null`.
- `delete()` seta `deletedAt` sem remover o registro.
- `update()` persiste novos valores.

Localização: `tests/integration/infrastructure/prisma-vehicle.repository.test.ts`

---

## Sequenciamento de Desenvolvimento

1. **Migration Prisma** — adicionar `deletedAt` ao Vehicle (pré-requisito de tudo).
2. **`PrismaVehicleRepository`** — implementar os 5 métodos com soft delete.
3. **Use cases** — na ordem: `list` → `create` → `update` → `delete`.
4. **Container** — registrar repositório e use cases.
5. **API routes** — `/api/vehicles` e `/api/vehicles/[id]`.
6. **Testes unitários e de integração** — cobrir use cases e repositório.
7. **Frontend — Dashboard** — `VehicleCard` + `EmptyState` + página `/dashboard`.
8. **Frontend — Configurações** — `VehicleForm` + `DeleteDialog` + página `/configuracoes`.

### Dependências Técnicas

- Fase 2 completa (NextAuth configurado, `account_id` na session) — **concluída**.
- Fases 4 e 5 **não são bloqueantes** para esta fase; os atalhos no `VehicleCard` ficam desabilitados.

---

## Monitoramento e Observabilidade

Projeto MVP sem infraestrutura de observabilidade dedicada. Aplicar:

- `console.error` em erros inesperados nas API routes (padrão existente em `mapDomainError`).
- Erros de domínio esperados (`vehicle.limit_reached`, `vehicle.not_found`) retornam apenas o código HTTP — sem log de servidor.

---

## Considerações Técnicas

### Decisões Principais

**Soft delete no repositório, não no domínio:** O campo `deletedAt` é exclusivo da camada de persistência. A entidade `Vehicle` não possui esse campo — o domínio não conhece o mecanismo de arquivamento. O `PrismaVehicleRepository.delete()` executa um `UPDATE SET deletedAt = now()` e `findByAccount()` filtra `deletedAt: null`.

**`Vehicle.rehydrate()` para updates:** A entidade é imutável. O use case de update busca a entidade existente, constrói novos VOs com os valores atualizados, e chama `Vehicle.rehydrate()` com o merge de props para criar uma nova instância — sem expor mutabilidade no domínio.

**Verificação de ownership via `accountId` da sessão:** O `vehicleId` vem da URL; o `accountId` vem exclusivamente da sessão NextAuth. Use cases verificam que `vehicle.accountId === accountId` antes de qualquer operação — não expondo se o veículo existe ou pertence a outra conta (retornam `vehicle.not_found` em ambos os casos).

**Contagem de limite via `findByAccount()`:** Com máximo de 2 veículos, carregar a lista completa para contar é aceitável. Não justifica uma query `COUNT` separada no MVP.

### Riscos Conhecidos

- **`brand`, `model`, `color` como string vazia no `toEntity()`:** O schema aceita `null` para esses campos, mas a entidade `Vehicle` declara `brand: string` (não nullable). O helper `toEntity()` deve usar `raw.brand ?? ""` — verificar se isso conflita com invariantes futuras.
- **`router.refresh()` vs revalidação:** Server Components em Next.js 14+ exigem `router.refresh()` ou `revalidatePath()` após mutações client-side. Confirmar o padrão já usado nas páginas de auth existentes antes de implementar.

### Conformidade com Padrões

- Entidade `Vehicle` e VOs seguem o padrão `domain/shared/value-objects/value-object.ts`.
- Repositório segue o padrão `PrismaUserRepository` (helpers `toEntity`/`toPersistence`, captura de P2002).
- Use cases seguem o padrão `RegisterAccountUseCase` (input/output tipados, erros de domínio, sem acoplamento a HTTP).
- API routes seguem o padrão das rotas de `/api/invites` (Zod + `mapDomainError` + `getServerSession`).
