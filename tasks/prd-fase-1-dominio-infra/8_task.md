---
status: completed
parallelizable: true
blocked_by: ["2.0"]
---

<task_context>
<domain>back/application</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 8.0: Mailer port (application) + NoopMailer

## Visão Geral

Definir o contrato `Mailer` na camada de aplicação (port) e fornecer a implementação default `NoopMailer` que apenas loga. O provider concreto (SMTP/Resend/etc.) fica para a Fase 2/7.

<requirements>
- Interface `Mailer` em `src/application/ports/mailer.ts` com `sendInvite(payload)`
- Tipo `SendInvitePayload` consumindo `Email` como `to`
- `NoopMailer` em `src/infrastructure/mailer/noop.mailer.ts` que implementa `Mailer` e loga via `console.log` em formato estruturado
- Teste unitário trivial para `NoopMailer` (não lança e loga com prefixo esperado)
- Nenhum provider concreto de e-mail é instalado aqui
</requirements>

## Subtarefas

- [x] 8.1 Criar `src/application/ports/mailer.ts` com `Mailer` + `SendInvitePayload`
- [x] 8.2 Criar `src/infrastructure/mailer/noop.mailer.ts`
- [x] 8.3 Criar teste em `tests/unit/infrastructure/mailer/noop.mailer.test.ts`
- [x] 8.4 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

```ts
// src/application/ports/mailer.ts
import { Email } from "@/domain/shared/value-objects/email.vo";

export type SendInvitePayload = {
  to: Email;
  inviterName: string;
  accountName: string;
  acceptUrl: string;
};

export interface Mailer {
  sendInvite(payload: SendInvitePayload): Promise<void>;
}
```

```ts
// src/infrastructure/mailer/noop.mailer.ts
export class NoopMailer implements Mailer {
  async sendInvite(payload: SendInvitePayload): Promise<void> {
    console.log(`[mailer:noop] sendInvite to=${payload.to.value} account=${payload.accountName}`);
  }
}
```

Nota: o log **não** deve incluir o token ou a URL completa — apenas email e account (LGPD).

## Critérios de Sucesso

- `Mailer` é apenas uma interface (zero runtime)
- `NoopMailer.sendInvite` resolve sem erro e imprime log com o prefixo `[mailer:noop]`
- Teste com `vi.spyOn(console, "log")` confirma o formato do log e ausência de dados sensíveis
- `npm run lint` não acusa violação de boundaries (application não importa de infrastructure)
