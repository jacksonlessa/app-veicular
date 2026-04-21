# Resumo de Tarefas de Implementação — Fase 1: Domínio e Infraestrutura Base

## Tarefas

- [x] 1.0 Setup de Vitest, argon2 e eslint-plugin-boundaries
- [x] 2.0 Shared domain: ValueObject, DomainError, Email, InviteToken
- [x] 3.0 Account context: entities Account e User + repo interfaces
- [x] 4.0 Vehicle context: VOs + Vehicle entity + repo interface
- [x] 5.0 Fuel context: VOs + Fuelup entity + repo interface
- [x] 6.0 FuelupService: regra dos 3 campos + cálculo condicional de km/l
- [x] 7.0 Maintenance context: VOs + Maintenance e MaintenanceItem + repo interface
- [x] 8.0 Mailer port (application) + NoopMailer
- [x] 9.0 Repositórios Prisma (Account/User completos, demais com stubs)
- [ ] 10.0 Infra auth: Argon2PasswordHasher, nextauth.config e container
- [ ] 11.0 Validação manual: seed script e login funcional

## Grafo de Dependências

```
1.0 ── 2.0 ──┬── 3.0 ──────────────────┐
             ├── 4.0 ──────────────────┤
             ├── 5.0 ── 6.0 ───────────┼── 9.0 ── 10.0 ── 11.0
             ├── 7.0 ──────────────────┤
             └── 8.0 ──────────────────┘
```

## Lanes Paralelas

- **Lane domain-A:** 3.0 (após 2.0)
- **Lane domain-B:** 4.0 (após 2.0)
- **Lane domain-C:** 5.0 → 6.0 (após 2.0)
- **Lane domain-D:** 7.0 (após 2.0)
- **Lane application:** 8.0 (após 2.0)
- **Lane infra:** 9.0 → 10.0 → 11.0 (após todo o domínio)

## Caminho Crítico

`1.0 → 2.0 → 5.0 → 6.0 → 9.0 → 10.0 → 11.0`
