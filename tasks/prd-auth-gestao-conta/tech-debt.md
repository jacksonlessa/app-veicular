# Débitos Técnicos — Fase 2: Auth e Gestão de Conta

## TD-1: Rate limiting nas rotas públicas de auth (prerequisite para deploy público)

**Prioridade:** Alta (bloqueante para produção)

As rotas abaixo não possuem rate limiting e estão expostas a ataques de força bruta e enumeração:

- `POST /api/auth/register`
- `POST /api/invites/[token]` (aceitar convite)
- `POST /api/auth/[...nextauth]` (login via credentials)

**Solução sugerida:** Middleware de rate limiting por IP com `upstash/ratelimit` ou `@vercel/kv` + sliding window. Implementar antes de expor o app publicamente.

## TD-2: Mailer real (prerequisite para convites funcionarem em produção)

A implementação atual usa `NoopMailer` que apenas loga no console. A guard em `container.ts` lança erro se `NODE_ENV === "production"` para prevenir deploy acidental.

**Solução sugerida:** Integrar Resend, SendGrid ou SES. Extrair `SmtpMailer` em `src/infrastructure/mailer/`.

## TD-3: TransactionRunner MVP simplificado

O `PrismaTransactionRunner` encapsula dois tipos de operações atômicas específicas do domínio de conta. Ao crescer o domínio, avaliar um padrão mais genérico (Unit of Work ou repositórios com suporte a `tx`).
