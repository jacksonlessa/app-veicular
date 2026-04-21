# Task 13.0 Review — Páginas /cadastro, /login, /convite/[token]

## Verdict: APPROVED

## Findings

### Critical
_Nenhum._

### High
_Nenhum._

### Medium

**M-01 — `React.ReactNode` sem import explícito em `layout.tsx`**

`src/app/(auth)/layout.tsx` utiliza `React.ReactNode` na assinatura do componente sem importar `React`. O projeto compila e passa no lint sem erro (o plugin Next.js + `"jsx": "preserve"` no tsconfig injeta o namespace globalmente), mas o padrão do repositório é usar a forma inline `{ children: React.ReactNode }` somente quando React está importado, ou substituir por `import type { ReactNode } from "react"`. Pode gerar confusão para novos colaboradores.

**Sugestão:**
```tsx
import type { ReactNode } from "react";
export default function AuthLayout({ children }: { children: ReactNode }) { … }
```

### Low

**L-01 — SVG inline duplicado nos três formulários**

O bloco de SVG para show/hide de senha (dois ícones de olho, ~6 linhas cada) é copiado literalmente em `LoginForm.tsx`, `RegisterForm.tsx` e `AcceptInviteForm.tsx`. Extrair um `PasswordToggleButton` em `src/components/auth/PasswordToggleButton.tsx` eliminaria a duplicação e facilitaria qualquer ajuste visual futuro.

**L-02 — Subtarefa 13.7 pendente (validação no navegador)**

A subtarefa de teste manual em navegador não foi marcada como concluída. Conforme o escopo da revisão, isso será coberto na task 14.0 e não bloqueia aprovação.

## Summary

A implementação atende integralmente às subtarefas 13.1–13.6 e 13.8. Todos os requisitos de PRD e TechSpec para a camada de páginas e componentes estão cobertos:

- Route group `(auth)` com layout centralizado e `max-w-[430px]` correto.
- `LoginForm` chama `signIn("credentials", { redirect: false })`, trata erro e redireciona via `window.location.href` — compatível com o fluxo descrito.
- `RegisterForm` faz `fetch("/api/auth/register")`, trata os códigos de erro esperados (`email.duplicate`, `validation`) e dispara `signIn` com `redirect: true` após sucesso.
- `ConvitePage` é Server Component, usa `inviteRepository` e `accountRepository` diretamente do container (conforme exemplo do TechSpec), delega ao `AcceptInviteForm` ou `InviteError`.
- `AcceptInviteForm` faz `POST /api/invites/[token]` e trata os erros `invite.expired_or_used` e `invite.not_found`.
- `InviteError` cobre os dois estados (`not_found` / `expired_or_used`) com mensagem orientativa e link para login.
- shadcn `Input`, `Button`, `Label`, `Card` utilizados em todos os formulários.
- Lint verde (0 erros nos arquivos da task).
- TypeScript sem erros de compilação.

Os dois pontos de melhoria encontrados (M-01 e L-01) não violam contratos de API, regras de negócio ou segurança — podem ser tratados em refactor futuro.

## Required Actions Before Completion
_Nenhuma ação bloqueante. Os itens M-01 e L-01 são recomendações de qualidade para endereçar oportunisticamente._
