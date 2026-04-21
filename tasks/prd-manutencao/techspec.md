# TechSpec — Manutenção de Veículos (Fase 5)

## Resumo Executivo

A Fase 5 segue a mesma arquitetura Clean DDD da Fase 4 (Abastecimento): camadas Domain → Application → Infrastructure → API Route → Frontend. As diferenças principais em relação ao fuelup são: (1) sem recálculo de cadeia — o único side-effect de persistência é atualizar `currentOdometer` do veículo quando o campo é informado; (2) cada `Maintenance` agrega uma lista de `MaintenanceItem` que são substituídos atomicamente em edições; (3) `totalPrice` é calculado e persistido no registro pai para consulta eficiente na Fase 6. A estratégia de rollback e atomicidade usa `PrismaTransactionRunner`, já existente.

---

## Arquitetura do Sistema

### Visão Geral dos Componentes

```
Frontend (React/Next.js)
  ├── /manutencao              → MaintenanceForm (criar)
  ├── /manutencao/[id]         → MaintenanceForm (editar/detalhe)
  └── /veiculos/[id]           → VehicleDetailView → aba "Manutenções" → MaintenanceHistoryList

API Routes (Next.js App Router)
  ├── /api/maintenances        → GET (list), POST (create)
  └── /api/maintenances/[id]   → GET, PUT, DELETE

Application Layer
  └── UseCases: register / get / list / update / delete

Domain Layer
  ├── maintenance.entity.ts
  ├── maintenance-item.entity.ts
  ├── value-objects: maintenance-date, item-quantity, item-price
  └── maintenance.repository.ts (interface)

Infrastructure
  ├── prisma-maintenance.repository.ts
  └── PrismaTransactionRunner.saveMaintenance() (novo método)
```

---

## Design de Implementação

### Modelos de Dados

**Schema Prisma (já existente — sem migration necessária):**

```prisma
model Maintenance {
  id         String            @id @default(cuid())
  vehicleId  String
  userId     String
  date       DateTime
  odometer   Int?              // quando informado, atualiza vehicle.currentOdometer
  location   String?           // repurposed: usado como "descrição geral" da manutenção
  totalPrice Float
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  vehicle    Vehicle           @relation(...)
  user       User              @relation(...)
  items      MaintenanceItem[]
}

model MaintenanceItem {
  id            String      @id @default(cuid())
  maintenanceId String
  description   String
  quantity      Float
  unitPrice     Float
  subtotal      Float
  maintenance   Maintenance @relation(..., onDelete: Cascade)
}
```

> **Decisão:** o campo `location` do schema é reproposto como "descrição geral" da manutenção no nível de domínio e UI. Renomear o campo no schema é não-destrutivo mas desnecessário para o MVP — o mapeamento é feito na camada de repositório.

**Vehicle (campo relevante):**
- `currentOdometer: Int` — atualizado para `max(currentOdometer, maintenance.odometer)` quando odômetro informado.

### Entidades de Domínio

**`maintenance.entity.ts`**

```typescript
export class Maintenance {
  private constructor(
    readonly id: string,
    readonly vehicleId: string,
    readonly userId: string,
    readonly date: MaintenanceDate,
    readonly items: MaintenanceItem[],
    readonly totalPrice: number,       // sempre soma dos subtotais dos itens
    readonly odometer?: Odometer,
    readonly description?: string,     // mapeado de location
    readonly createdAt?: Date,
  ) {}

  static create(props: CreateMaintenanceProps): Maintenance { ... }
  static rehydrate(props: RehydrateMaintenanceProps): Maintenance { ... }
}
```

**`maintenance-item.entity.ts`**

```typescript
export class MaintenanceItem {
  private constructor(
    readonly id: string,
    readonly maintenanceId: string,
    readonly description: string,
    readonly quantity: ItemQuantity,
    readonly unitPrice: ItemPrice,
    readonly subtotal: number,         // quantity.value * unitPrice.value, calculado na criação
  ) {}

  static create(props: CreateItemProps): MaintenanceItem { ... }
  static rehydrate(props: RehydrateItemProps): MaintenanceItem { ... }
}
```

**Value Objects (em `domain/maintenance/value-objects/`):**

| VO | Regra |
|----|-------|
| `MaintenanceDate` | não pode ser data futura |
| `ItemQuantity` | número > 0, até 4 casas decimais |
| `ItemPrice` | número > 0, até 2 casas decimais (reais) |

### Interface do Repositório

```typescript
// domain/maintenance/repositories/maintenance.repository.ts
export interface MaintenanceRepository {
  findById(id: string): Promise<Maintenance | null>;
  findByVehicleId(vehicleId: string): Promise<Maintenance[]>;
  // create/update/delete geridos via TransactionRunner (mesma estratégia do fuelup)
}
```

### Transaction Runner — novo método

```typescript
// Adicionado em PrismaTransactionRunner
async saveMaintenance(data: SaveMaintenanceData): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    if (data.mode === "update") {
      await tx.maintenanceItem.deleteMany({ where: { maintenanceId: data.maintenance.id } });
    }
    const record = await tx.maintenance.upsert({
      where: { id: data.maintenance.id },
      create: { ...maintenanceFields, items: { create: data.items } },
      update: { ...maintenanceFields, items: { create: data.items } },
    });
    if (data.newCurrentOdometer !== undefined) {
      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: { currentOdometer: data.newCurrentOdometer },
      });
    }
  });
}

async deleteMaintenance(data: DeleteMaintenanceData): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    await tx.maintenance.delete({ where: { id: data.id } });
    // recalcula currentOdometer do veículo se necessário
    if (data.recalculateOdometer) {
      await tx.vehicle.update({ where: { id: data.vehicleId }, data: { currentOdometer: data.newCurrentOdometer } });
    }
  });
}
```

### Endpoints de API

**`GET /api/maintenances?vehicleId=<id>`**
- Auth: sessão obrigatória; valida que `vehicleId` pertence ao `accountId` da sessão.
- Resposta: `MaintenanceDTO[]` ordenados por `date DESC`.

**`POST /api/maintenances`**

```typescript
// Body (Zod schema)
{
  vehicleId: string,
  date: string,           // ISO 8601
  odometer?: number,      // inteiro >= vehicle.initOdometer
  description?: string,   // mapeado para location
  items: [{
    description: string,
    quantity: number,     // > 0
    unitPrice: number,    // > 0
  }]                      // mínimo 1 item
}
// Resposta: MaintenanceDTO — status 201
```

**`GET /api/maintenances/[id]`**
- Auth + ownership check via accountId do veículo.
- Resposta: `MaintenanceDTO` com itens.

**`PUT /api/maintenances/[id]`**
- Mesma estrutura do POST; substitui todos os itens.
- Resposta: `MaintenanceDTO` atualizado.

**`DELETE /api/maintenances/[id]`**
- Remove manutenção + itens (cascade); recalcula `currentOdometer` do veículo.
- Resposta: `204 No Content`.

**DTO de resposta:**

```typescript
type MaintenanceDTO = {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number | null;
  description: string | null;
  totalPrice: number;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  createdAt: string;
};
```

### Use Cases

| Use Case | Responsabilidade |
|----------|-----------------|
| `register-maintenance.usecase.ts` | Valida ownership do veículo, constrói entidade, calcula `totalPrice`, computa `newCurrentOdometer` se odômetro informado, chama `txRunner.saveMaintenance()` |
| `get-maintenance.usecase.ts` | Busca por ID, valida ownership |
| `list-maintenances.usecase.ts` | Lista por veículo, valida ownership |
| `update-maintenance.usecase.ts` | Carrega manutenção existente, valida ownership, substitui itens, recalcula total e odômetro |
| `delete-maintenance.usecase.ts` | Valida ownership, chama `txRunner.deleteMaintenance()` com recálculo de odômetro |

**Lógica de `newCurrentOdometer` (sem cadeia):**

```typescript
// diferente do fuelup: não há cadeia de km/l para recalcular
// basta max(todas manutenções + fuelups existentes do veículo)
const allOdometers = [
  ...allFuelups.map(f => f.odometer),
  ...otherMaintenances.map(m => m.odometer).filter(Boolean),
  input.odometer,
].filter(Boolean);
const newCurrentOdometer = Math.max(...allOdometers, vehicle.initOdometer);
```

---

## Frontend

### Componentes

**`MaintenanceItemRow.tsx`** — linha de item no formulário

```typescript
// Props
type MaintenanceItemRowProps = {
  index: number;
  onRemove: (index: number) => void;
  // controlled via react-hook-form Field Array
};
// Exibe: input descrição | input quantidade | input valor unit | span subtotal (calculado)
// Subtotal = watch(`items.${index}.quantity`) * watch(`items.${index}.unitPrice`)
```

**`MaintenanceForm.tsx`** — formulário de criar/editar

- Usa `react-hook-form` com `useFieldArray` para a lista dinâmica de itens.
- Zod schema local para validação client-side (mesmo contrato do endpoint).
- Total no rodapé = `sum(items.map(i => i.quantity * i.unitPrice))` via `watch`.
- Submit chama `POST /api/maintenances` (criar) ou `PUT /api/maintenances/[id]` (editar).
- Redireciona para `/veiculos/[id]?tab=manutencao` após sucesso.

**`MaintenanceHistoryList.tsx`** — lista na aba do veículo

- Client component; faz `fetch("/api/maintenances?vehicleId=X")` no mount.
- Renderiza items com `shadcn/ui` `Accordion` (expansível).
- Card colapsado: data + descrição + total.
- Card expandido: grid com linhas de item (Descrição / Qtd / Unit / Subtotal).
- Link de editar → `/manutencao/[id]`.
- Botão de excluir com confirmação inline (sem modal extra).

### Páginas

| Rota | Componente | Notas |
|------|-----------|-------|
| `/manutencao` | `MaintenanceForm` (modo criar) | Pré-seleciona veículo via query param `?vehicleId=` |
| `/manutencao/[id]` | `MaintenanceForm` (modo editar) | Carrega dados via `GET /api/maintenances/[id]` |

**`VehicleDetailView.tsx` — alteração:**

```diff
- <TabsTrigger value="manutencao" disabled>Manutenção</TabsTrigger>
+ <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
  ...
  <TabsContent value="manutencao">
-   {/* Coming in Phase 5 */}
+   <MaintenanceHistoryList vehicleId={vehicle.id} />
  </TabsContent>
```

---

## Pontos de Integração

- **`VehicleRepository.update()`** — já suporta `currentOdometer`; chamado dentro de `saveMaintenance` transaction.
- **`PrismaTransactionRunner`** — recebe novo método `saveMaintenance` / `deleteMaintenance`; não altera métodos existentes.
- **`container.ts`** — registrar `PrismaMaintenanceRepository` e os 5 novos use cases.
- **Fase 6 (Relatórios)** — consumirá `maintenances.totalPrice` diretamente via `findMany` com filtro de período; nenhuma denormalização adicional necessária.

---

## Análise de Impacto

| Componente Afetado | Tipo de Impacto | Descrição & Risco | Ação Requerida |
|---|---|---|---|
| `PrismaTransactionRunner` | Adição de métodos | Novos `saveMaintenance` / `deleteMaintenance`. Baixo risco — não altera métodos existentes. | Implementar e testar isoladamente |
| `VehicleDetailView.tsx` | Edição pontual | Remover `disabled` da aba + adicionar `MaintenanceHistoryList`. Baixo risco. | Testar navegação entre abas |
| `container.ts` | Adição de bindings | Registrar repositório e use cases novos. Sem impacto nos existentes. | — |
| `vehicle.currentOdometer` | Side effect compartilhado | Fuelups e manutenções competem pela atualização do odômetro. Médio risco — lógica de `max()` deve incluir ambas as fontes. | Implementar `computeNewOdometer` com union das duas coleções |

---

## Abordagem de Testes

### Testes Unitários

- **Value Objects**: `MaintenanceDate` (rejeita futuro), `ItemQuantity` (rejeita ≤ 0), `ItemPrice` (rejeita ≤ 0).
- **`Maintenance.create()`**: rejeita lista de itens vazia; `totalPrice` sempre igual à soma dos subtotais.
- **`MaintenanceItem.create()`**: subtotal calculado corretamente.
- **`computeNewOdometer`** (utilitário compartilhado): corretamente retorna `max` entre fuelups, manutenções e `initOdometer`.

### Testes de Integração

- `POST /api/maintenances` — cria manutenção com itens e atualiza `currentOdometer` do veículo.
- `PUT /api/maintenances/[id]` — substitui todos os itens atomicamente.
- `DELETE /api/maintenances/[id]` — remove com cascade e recalcula odômetro.
- Tentativa de acessar manutenção de outro `accountId` retorna 403.

---

## Sequenciamento de Desenvolvimento

1. **Domain** — Value Objects + entidades `Maintenance` e `MaintenanceItem` + interface de repositório.
2. **Infrastructure** — `PrismaMaintenanceRepository` + métodos `saveMaintenance`/`deleteMaintenance` no `TransactionRunner` + registro no `container.ts`.
3. **Application** — 5 use cases + `maintenance.dto.ts`.
4. **API Routes** — `schema.ts` Zod + handlers GET/POST + GET/PUT/DELETE por ID.
5. **Frontend** — `MaintenanceItemRow` → `MaintenanceForm` → `/manutencao` e `/manutencao/[id]` → `MaintenanceHistoryList` → habilitar aba em `VehicleDetailView`.

### Dependências Técnicas

- Fase 1 deve ter criado os Value Objects de manutenção (`maintenance-date.vo.ts`, `item-quantity.vo.ts`, `item-price.vo.ts`) e as entidades. Se não existirem, criar na etapa 1.
- Schema Prisma já contempla `maintenances` e `maintenance_items` — sem nova migration necessária.

---

## Considerações Técnicas

### Decisões Principais

| Decisão | Escolha | Alternativa Rejeitada |
|---|---|---|
| Atualização de itens | Substituição total (delete + recreate) | Patch individual por item — mais complexo, sem benefício no MVP |
| `totalPrice` | Persistido no registro `Maintenance` | Calculado na query — inviável para agregações da Fase 6 sem índice |
| `location` → `description` | Mapeamento na camada de repositório | Migration de rename — desnecessária, campo é opcional e sem uso anterior |
| Odômetro multi-fonte | `max()` entre fuelups E manutenções | Tabela separada de histórico de odômetro — over-engineering para MVP |

### Riscos Conhecidos

- **Concorrência no odômetro:** se dois registros (fuelup e manutenção) forem criados simultaneamente para o mesmo veículo, a transação de um pode sobrescrever o `currentOdometer` do outro com valor incorreto. Mitigação: a lógica de `max()` é idempotente — o maior valor sempre vence, independente da ordem de execução.
- **Itens órfãos:** se a transaction falhar após `deleteMany(items)` mas antes do `upsert(maintenance)`, o Prisma reverte via rollback automático. Sem risco real.

### Conformidade com Padrões

- Segue Clean DDD (Domain → Application → Infrastructure) idêntico à Fase 4.
- Validação Zod nas API Routes e nos formulários (react-hook-form).
- Isolamento multi-tenant via `accountId` validado em todos os use cases.
- LGPD: sem exposição de dados fora da conta; sem logs de PII.
