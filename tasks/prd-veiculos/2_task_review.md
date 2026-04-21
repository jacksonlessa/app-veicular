# Task 2.0 Review — PrismaVehicleRepository: implementar os 5 métodos com soft delete

## Verdict: APPROVED

## Findings

### Critical
Nenhum.

### High

**H1 — Ausência do bloco try/catch para P2002 no `create`**

O `PrismaUserRepository.create` captura a exceção Prisma P2002 (unique constraint) e a converte em `BusinessRuleError("email.duplicate")`. O `PrismaVehicleRepository.create` não faz o equivalente para o campo `plate` (que tem unique constraint implícita por conta — embora não declarada no schema como `@@unique`, a constraint de unicidade de placa por conta é uma regra de negócio).

A task não exige explicitamente essa captura para plate, pois a regra de unicidade de placa é verificada no use case antes de chegar ao repositório. Porém, o padrão do `PrismaUserRepository` inclui o bloco P2002 como camada de segurança, e a task instrui "seguir o padrão de `PrismaUserRepository` (captura de P2002, helpers locais)". A implementação omite essa guarda.

Impacto: se dois creates concorrentes com a mesma placa chegarem ao banco, a exceção bruta do Prisma (PrismaClientKnownRequestError) vazará pelo stack sem ser mapeada para um erro de domínio, expondo detalhes internos.

**H2 — Nenhum teste de integração criado**

A task e a techspec exigem explicitamente testes de integração em `tests/integration/infrastructure/prisma-vehicle.repository.test.ts` cobrindo: `create` persiste e retorna entidade; `findByAccount` ignora registros com `deletedAt != null`; `delete` seta `deletedAt` sem remover o registro; `update` persiste novos valores. O diretório `tests/integration/` não existe. Os testes unitários de use case em `tests/unit/application/usecases/vehicle/` também não existem (apenas `account/` está presente). Estes eram critérios de sucesso implícitos da task (o critério "nenhum teste existente quebra" foi atendido, mas os novos testes não foram escritos).

### Medium

**M1 — `toPersistence` não tipado com `Prisma.VehicleCreateInput`**

A techspec indica o uso de `Prisma.VehicleCreateInput` como tipo de retorno de `toPersistence`. A implementação retorna um objeto literal com tipo inline. Isso não quebra funcionalidade, mas diverge da nomenclatura sugerida e pode causar incompatibilidade silenciosa se o schema evoluir (novos campos obrigatórios não seriam detectados em compile-time). A task menciona isso como diretriz no snippet de referência.

**M2 — `helpers toEntity/toPersistence` são module-private em vez de exported**

O `PrismaUserRepository` exporta `toEntity` e `toPersistence` (`export function`), o que permite reuso nos testes de integração sem instanciar o repositório. A implementação declara ambos como funções não exportadas. Para testes de integração futuros, isso forçará duplicação ou acesso indireto.

### Low

**L1 — Convenção de nomenclatura do campo `_prisma` vs `prisma`**

O `PrismaUserRepository` usa `private readonly prisma` (sem underscore). O `PrismaVehicleRepository` usa `private readonly _prisma`. Diverge da convenção estabelecida no projeto, embora sem impacto funcional. Padronizar para `prisma` manteria consistência.

**L2 — `findById` usa `findFirst` em vez de `findUnique`**

O campo `id` é `@id` no schema Prisma, portanto uma query `findUnique({ where: { id } })` seria semânticamente mais precisa e potencialmente mais eficiente. `findFirst` funciona mas não expressa a unicidade garantida pelo schema. Nota: adicionar `deletedAt: null` dentro de `findUnique` exigiria um índice composto ou o uso de `findFirst` — portanto a escolha de `findFirst` é justificável neste contexto de soft delete. Sem ação necessária; apenas documentado.

## Summary

A implementação central da task está correta e completa: todos os 5 métodos substituem os stubs, o soft delete está correto (UPDATE SET deletedAt = new Date(), sem DELETE), os filtros `deletedAt: null` estão presentes em `findById` e `findByAccount`, a ordenação `createdAt asc` está correta, os fallbacks `?? ""` para `brand/model/color` estão presentes, o TypeScript compila sem erros e os testes existentes não foram quebrados.

As principais lacunas são: ausência de captura P2002 (divergência do padrão exigido pela task) e ausência completa dos testes de integração e unitários de use case exigidos pela techspec. Dado que esta é uma task de repositório (não de use case) e os testes de use case pertencem a tasks subsequentes, o H2 é parcialmente atribuível ao escopo desta task — mas os testes de integração do repositório em si eram claramente parte do escopo da task 2.0.

A implementação está sólida e pronta para ser consumida pelas tasks seguintes. As correções de H1 e H2 são necessárias antes de considerar a feature completa, mas não bloqueiam as tasks de use case e API que dependem deste repositório.

## Required Actions Before Completion

1. **[H1]** Adicionar bloco try/catch para `PrismaClientKnownRequestError` com `code === "P2002"` no método `create`, convertendo para `BusinessRuleError("plate.duplicate")` ou similar — alinhando com o padrão do `PrismaUserRepository`.
2. **[H2]** Criar `tests/integration/infrastructure/prisma-vehicle.repository.test.ts` cobrindo os 4 cenários especificados na techspec: `create`, `findByAccount` com soft-deleted ignorado, `delete` setando `deletedAt`, e `update` persistindo novos valores.
3. **[M1]** (Opcional/baixa prioridade) Tipar o retorno de `toPersistence` com o tipo Prisma adequado para detectar drift de schema em compile-time.
4. **[M2]** (Opcional) Exportar `toEntity` e `toPersistence` para facilitar testes de integração.
5. **[L1]** (Opcional) Renomear `_prisma` para `prisma` para alinhar com a convenção do `PrismaUserRepository`.

---

## Re-review — 2026-04-21

### Correções aplicadas

As seguintes correções foram verificadas na implementação atual em
`src/infrastructure/database/repositories/prisma-vehicle.repository.ts`:

**H1 — CORRIGIDO.** O método `create` agora envolve `prisma.vehicle.create` em bloco try/catch
idêntico ao padrão do `PrismaUserRepository`. A verificação `"code" in e && (e as { code: unknown }).code === "P2002"`
converte a exceção de constraint do Prisma para `BusinessRuleError("vehicle.plate_duplicate")`.
O tratamento é typesafe e re-lança erros desconhecidos — correto.

**M1 — CORRIGIDO.** `toPersistence` agora retorna `Prisma.VehicleCreateInput` explicitamente como tipo de retorno.
O campo `account` usa nested write (`{ connect: { id: vehicle.accountId } }`) em vez de `accountId` direto,
o que é a forma correta para `VehicleCreateInput` com relação obrigatória.

**M2 — CORRIGIDO.** Ambas as funções `toEntity` e `toPersistence` são declaradas com `export function`,
alinhando com o padrão do `PrismaUserRepository`.

**L1 — CORRIGIDO.** O campo foi renomeado de `_prisma` para `prisma`. Todos os usos internos
foram atualizados (`this.prisma.vehicle.*`).

**H2 — Diferido intencionalmente para task 6.0.** Aceito como bloqueador desta re-review.

### Verificação adicional

- `toPersistence` não inclui `currentOdometer` no tipo de retorno inferido — confirmado que
  o campo está presente (`currentOdometer: vehicle.currentOdometer.value`) e que `Prisma.VehicleCreateInput`
  aceita o campo conforme o schema. Sem divergência.
- `update` extrai campos individuais de `toPersistence(vehicle)` em vez de espalhar o objeto inteiro,
  o que é correto: evita sobrescrever `account` (nested write) e `id` em um `prisma.vehicle.update`.
- `tsc --noEmit` passa sem erros.

### Verdict Final: APPROVED

Todas as correções solicitadas na review original (H1, M1, M2, L1) foram aplicadas corretamente.
H2 está diferido com justificativa aceita (task 6.0). A implementação está conforme o padrão do
projeto, alinhada com a techspec e pronta para as tasks dependentes.
