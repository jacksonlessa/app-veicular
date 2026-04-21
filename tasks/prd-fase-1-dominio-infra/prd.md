# PRD — Fase 1: Domínio e Infraestrutura Base

## Visão Geral

A Fase 1 constrói o **núcleo de negócio** e a **camada de infraestrutura mínima** do RodagemApp sobre o esqueleto entregue pela Fase 0. Não há telas nem endpoints de negócio nesta fase — o que se produz são os blocos reutilizáveis que todas as fases seguintes consumirão: Value Objects (regras de validação), Entities (agregados de domínio), contratos de repositório, a service de regra de negócio do abastecimento e a ligação concreta com Prisma, NextAuth e o mailer.

O problema resolvido é a inexistência da "gramática" do domínio: sem VOs e Entities, a Fase 2 (auth) e as Fases 3–5 (CRUD) seriam forçadas a espalhar regras de validação e cálculo pelas API Routes e componentes, violando o Clean DDD acordado. Beneficiários diretos são os desenvolvedores das fases seguintes, que encontram uma linguagem de domínio pronta; indiretamente, os usuários finais, que recebem validação e cálculos consistentes em todo o app.

## Objetivos

- Entregar um `src/domain/` completo com todos os VOs, Entities e contratos de repositório listados no roadmap (linhas 48–56).
- Entregar a regra de negócio crítica do abastecimento (`fuelup.service.ts`) com regra dos 3 campos e cálculo condicional de km/l.
- Entregar um `src/infrastructure/` mínimo suficiente para a Fase 2 (auth): `prisma.client.ts` singleton, repositórios Prisma de `account` e `user` completos; repositórios de `vehicle`, `fuelup` e `maintenance` como classes criadas com apenas os métodos estritamente necessários para auth/session (os demais serão acrescentados em suas respectivas fases).
- Configurar NextAuth.js com Credentials Provider funcional (email/senha via argon2), incluindo `session.account_id`.
- Definir o contrato `Mailer` (interface) em `src/application/` sem provider concreto — implementação real fica para Fase 2/7.
- Garantir que a dependência unidirecional entre camadas seja validada automaticamente via `eslint-plugin-boundaries`.
- Entregar cobertura de testes unitários para 100% dos VOs, Entities com lógica e `fuelup.service.ts`.

**Métricas de sucesso:** `npm test` passa com suíte completa; `npm run lint` falha se um arquivo de `domain/` importar algo de `infrastructure/` ou `app/`; um usuário cadastrado manualmente no banco consegue autenticar via NextAuth usando email/senha (validação manual, sem tela).

## Histórias de Usuário

- Como **desenvolvedor da Fase 2**, eu quero um `AccountRepository` e um `UserRepository` prontos para escrever os use cases `register` e `accept-invite` sem tocar em Prisma diretamente.
- Como **desenvolvedor da Fase 4**, eu quero uma `FuelupService` que encapsule a regra dos 3 campos e o cálculo de km/l para escrever o `register-fuelup.usecase.ts` apenas orquestrando chamadas.
- Como **desenvolvedor de qualquer fase**, eu quero que instanciar um VO inválido (ex.: email mal formatado, placa com caracteres proibidos) lance erro imediatamente, para que a validação viva no domínio e não se repita em cada API Route.
- Como **reviewer**, eu quero que o lint impeça imports cruzados entre camadas para não precisar revisar manualmente a cada PR.
- Como **usuário final** (impacto indireto), eu quero que cálculos de consumo sejam confiáveis — um km/l só é calculado quando faz sentido (dois tanques cheios consecutivos), evitando números enganosos.

## Funcionalidades Principais

### F1 — Value Objects

- **O quê:** Classes imutáveis que validam e normalizam valores primitivos do domínio, lançando erro quando inválidos.
- **Por quê:** Centraliza regras de validação; elimina validação redundante nas camadas superiores.
- **RF-1.1** Criar `email.vo.ts` e `invite-token.vo.ts` em `src/domain/shared/value-objects/`.
- **RF-1.2** Criar VOs de veículo: `odometer.vo.ts`, `plate.vo.ts`, `vehicle-name.vo.ts`.
- **RF-1.3** Criar VOs de abastecimento: `fuel-amount.vo.ts`, `fuel-price.vo.ts`, `fuel-date.vo.ts`, `kml.vo.ts`.
- **RF-1.4** Criar VOs de manutenção: `maintenance-date.vo.ts`, `item-quantity.vo.ts`, `item-price.vo.ts`.
- **RF-1.5** Cada VO deve expor `equals()`, `value` (getter) e um construtor/factory que valida a entrada.
- **RF-1.6** 100% dos VOs devem ter testes unitários cobrindo caminho feliz, caminhos inválidos e bordas.

### F2 — Entities

- **O quê:** Agregados que representam conceitos centrais (`Account`, `Vehicle`, `Fuelup`, `Maintenance`, `MaintenanceItem`).
- **Por quê:** Modelam identidade, ciclo de vida e invariantes que transcendem um único campo.
- **RF-2.1** `account.entity.ts` e `vehicle.entity.ts` em `src/domain/<contexto>/entities/`.
- **RF-2.2** `fuelup.entity.ts`, `maintenance.entity.ts`, `maintenance-item.entity.ts`.
- **RF-2.3** Entities devem usar VOs em seus campos (ex.: `Vehicle.plate: Plate`).
- **RF-2.4** Entities com lógica própria (ex.: `Maintenance.addItem`, `Maintenance.total`) devem ter testes unitários.
- **RF-2.5** O limite de 2 veículos por conta **não** é validado aqui — isso é use case da Fase 3.

### F3 — Contratos de Repositório

- **O quê:** Interfaces TypeScript que declaram as operações de persistência, sem acoplar a Prisma.
- **Por quê:** Permite testar use cases com mocks e desacopla o domínio do ORM.
- **RF-3.1** Declarar `AccountRepository`, `UserRepository`, `VehicleRepository`, `FuelupRepository`, `MaintenanceRepository` em `src/domain/<contexto>/repositories/`.
- **RF-3.2** Cada contrato deve listar **apenas** os métodos necessários até a Fase 2 (ex.: `findByEmail`, `create`); métodos adicionais ficam por conta das respectivas fases.

### F4 — Fuelup Service (regra dos 3 campos + km/l)

- **O quê:** Função/classe que, dados 2 dos 3 campos (litros, valor total, preço/litro), calcula o terceiro, e calcula km/l apenas quando o abastecimento anterior **e** o atual são marcados como "tanque cheio".
- **Por quê:** É a regra de negócio mais sensível do MVP; precisa estar isolada, testável e reutilizável.
- **RF-4.1** `fuelup.service.ts` em `src/domain/fuel/services/`.
- **RF-4.2** Dado exatamente 2 dos 3 campos, calcular o terceiro; com 0, 1 ou 3 campos informados, lançar erro de domínio.
- **RF-4.3** Calcular `kml` como `(odometerAtual - odometerAnterior) / litros` **somente se** o abastecimento anterior existir, estiver marcado como `tanqueCheio = true` e o atual também for `tanqueCheio = true`. Caso contrário, `kml = null`.
- **RF-4.4** Cobertura de testes unitários ≥ 95% nesta service, incluindo todas as combinações de tanque cheio/não cheio.

### F5 — Infraestrutura Prisma

- **O quê:** `prisma.client.ts` singleton + classes de repositório que implementam os contratos.
- **Por quê:** Traduz VOs/Entities para rows Prisma.
- **RF-5.1** `prisma.client.ts` em `src/infrastructure/database/` (já criado na Fase 0 — confirmar singleton + log config).
- **RF-5.2** `prisma-account.repository.ts` e `prisma-user.repository.ts` completos (métodos necessários à Fase 2).
- **RF-5.3** `prisma-vehicle.repository.ts`, `prisma-fuelup.repository.ts`, `prisma-maintenance.repository.ts` criados como classes que implementam o contrato, com apenas os métodos estritamente necessários para auth/session implementados. Demais métodos podem lançar `NotImplemented` e serão concluídos em suas respectivas fases.
- **RF-5.4** Mapeamento entre row Prisma e Entity via funções `toEntity` / `toPersistence` explícitas.

### F6 — NextAuth (Credentials + argon2)

- **O quê:** `nextauth.config.ts` com Credentials Provider funcional.
- **Por quê:** A Fase 2 não deve redefinir config de auth; apenas plugar páginas e use cases.
- **RF-6.1** Provider único: `CredentialsProvider` (email + senha).
- **RF-6.2** Verificação de senha via **argon2** (não bcrypt).
- **RF-6.3** `session` deve conter `user.id`, `user.email` e `session.accountId` (para multi-tenant).
- **RF-6.4** `authorize()` deve consumir `UserRepository.findByEmail` — sem queries Prisma diretas.

### F7 — Mailer (scaffolding de interface)

- **O quê:** Contrato `Mailer` em `src/application/ports/mailer.ts` com método `sendInvite(params)`.
- **Por quê:** Permite a Fase 2 injetar o mailer sem travar a decisão do provider concreto agora.
- **RF-7.1** Definir interface `Mailer` + DTO de payload.
- **RF-7.2** **Não** implementar provider concreto (Nodemailer/Resend/etc.) — fica para Fase 2/7.
- **RF-7.3** Fornecer `NoopMailer` (implementação que apenas loga) para uso em dev/testes.

### F8 — Lint de fronteira entre camadas

- **O quê:** `eslint-plugin-boundaries` configurado para proibir imports proibidos.
- **Por quê:** Converte a convenção Clean DDD em regra automatizada.
- **RF-8.1** Instalar e configurar `eslint-plugin-boundaries`.
- **RF-8.2** Regras: `domain/` não importa de `application/`, `infrastructure/` ou `app/`; `application/` não importa de `infrastructure/` ou `app/`.
- **RF-8.3** `npm run lint` deve falhar quando uma regra for violada.

## Experiência do Usuário

Não há UX de usuário final nesta fase. A DX alvo é:

- Rodar `npm test` e ver uma suíte verde cobrindo VOs, Entities e `fuelup.service.ts`.
- Rodar `npm run lint` e ver erro claro ao tentar importar `@/infrastructure/...` dentro de `src/domain/`.
- Inserir manualmente um `User` no banco (com senha argon2 pré-hasheada) e conseguir autenticar via `POST /api/auth/callback/credentials` sem 500.

## Restrições Técnicas de Alto Nível

- **Clean DDD unidirecional:** `app → application → domain ← infrastructure`, validado por `eslint-plugin-boundaries`.
- **Hash de senha:** argon2 (argon2id), não bcrypt.
- **NextAuth:** apenas Credentials Provider nesta fase.
- **Persistência:** Prisma + SQLite local (MySQL só na Fase 8).
- **Mailer:** apenas interface + noop; provider concreto fora de escopo.
- **Testes:** unitários obrigatórios para tudo que for criado nesta fase (VOs, Entities com lógica, services, mapeadores críticos).
- **LGPD:** a `sendInvite` (scaffolding) deve aceitar payload mínimo; qualquer log não pode incluir senha em claro; argon2 armazena apenas o hash.

## Não-Objetivos (Fora de Escopo)

- **Use cases de aplicação** (`invite-user`, `accept-invite`, `register-fuelup`, etc.) — Fase 2 em diante.
- **API Routes de negócio** — Fase 2 em diante.
- **Telas / componentes UI** — Fase 2 em diante.
- **Implementação concreta de Mailer** (SMTP/Resend/Nodemailer) — Fase 2/7.
- **Providers OAuth no NextAuth** — fora do MVP.
- **Métodos de repositório não necessários à Fase 2** para `vehicle`, `fuelup`, `maintenance` — serão adicionados nas Fases 3/4/5.
- **Validação de limite de 2 veículos por conta** — Fase 3.
- **Testes de integração** com Prisma real — Fase 8.
- **Deploy / MySQL em produção** — Fase 8.

## Questões em Aberto

- **Parâmetros argon2:** quais valores de `memoryCost`, `timeCost`, `parallelism` adotar? (sugestão: defaults da lib `argon2` para Node).
- **Formato de erros de domínio:** criar uma hierarquia de `DomainError` (ex.: `InvalidEmailError`, `InvalidPlateError`) ou um único `DomainError` com `code`?
- **Geração de IDs:** `cuid`/`uuid`/`ulid`? Já existe definição da Fase 0 ou fica para o TechSpec desta fase?
- **`NoopMailer`** — útil apenas em testes, ou também registrado como default em dev? (afeta DI da Fase 2).
- **Organização de pastas dentro de `src/domain/`:** por contexto (`account/`, `vehicle/`, `fuel/`, `maintenance/`) ou horizontal (`entities/`, `value-objects/`, `services/`)? Precisa ser decidida no TechSpec.
- **Fuelup sem abastecimento anterior:** confirmar que o primeiro abastecimento de um veículo sempre resulta em `kml = null`, mesmo quando marcado como tanque cheio.
