# Resumo de Tarefas de Implementação — Fase 2: Auth e Gestão de Conta

## Tarefas

- [x] 1.0 Setup: instalar zod e estender tipos de sessão do NextAuth
- [x] 2.0 Domínio Invite: entidade + InviteRepository interface + testes
- [x] 3.0 Estender UserRepository.countByAccount (interface + Prisma + teste)
- [x] 4.0 TokenGenerator port + impl crypto.randomBytes + teste
- [ ] 5.0 PrismaInviteRepository + teste
- [ ] 6.0 RegisterAccountUseCase + teste
- [ ] 7.0 InviteUserUseCase + teste
- [ ] 8.0 AcceptInviteUseCase + teste
- [ ] 9.0 Container wiring + helper error-handler (domínio → HTTP)
- [ ] 10.0 API route POST /api/auth/register
- [ ] 11.0 API routes /api/invites (POST) e /api/invites/[token] (GET/POST)
- [ ] 12.0 Auth guard: middleware.ts + app/(app)/layout.tsx
- [ ] 13.0 Páginas e forms: /cadastro, /login, /convite/[token]
- [ ] 14.0 Smoke test manual + atualização de docs de validação

## Grafo de Dependências

```
1.0 ──┬── 2.0 ──┬── 5.0 ─────────────────┐
      │         ├── 7.0 ─────────────────┤
      │         └── 8.0 ─────────────────┤
      ├── 3.0 ──┤                        │
      │         └── 6.0 ─────────────────┤
      ├── 4.0 ── (usado por 7.0)         │
      │                                  ▼
      │                          9.0 ──┬── 10.0 ──┐
      │                                └── 11.0 ──┤
      └── 12.0 ──────────────────────────────────┤
                                             13.0 → 14.0
```

## Lanes Paralelas

- **Lane domain-A:** 2.0 → 5.0 (após 1.0)
- **Lane domain-B:** 3.0 (após 1.0)
- **Lane infra-port:** 4.0 (após 1.0)
- **Lane use-cases:** 6.0, 7.0, 8.0 (cada um após seus pré-requisitos)
- **Lane front-guard:** 12.0 (após 1.0, em paralelo a todo o back)
- **Lane api:** 10.0, 11.0 (ambas após 9.0)
- **Lane front-pages:** 13.0 → 14.0 (após 10.0/11.0/12.0)

## Caminho Crítico

`1.0 → 2.0 → 5.0 → 9.0 → 11.0 → 13.0 → 14.0`
