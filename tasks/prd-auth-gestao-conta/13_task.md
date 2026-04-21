---
status: completed
parallelizable: false
blocked_by: ["10.0", "11.0", "12.0"]
---

<task_context>
<domain>front/pages</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 13.0: Páginas — /cadastro, /login, /convite/[token]

## Visão Geral

Implementar as três telas públicas com fidelidade visual ao protótipo `LoginScreen` em `docs/RodagemApp.html` (tipografia Plus Jakarta Sans, tokens âmbar, `max-w-[430px]`). Todas residem no route group `(auth)` para indicar que são públicas.

<requirements>
- `/login` usa `signIn("credentials", { email, password, redirect: true, callbackUrl: "/dashboard" })`
- `/cadastro` faz `fetch("/api/auth/register")` e em sucesso dispara `signIn`
- `/convite/[token]` é Server Component: carrega dados via `GET /api/invites/[token]` (ou repositório direto) e renderiza form ou mensagem de erro
- Validação client via zod (`zod/mini`) + mensagens inline
- Layout mobile-first `max-w-[430px]`
- Componentes `RegisterForm`, `LoginForm`, `AcceptInviteForm` em `src/components/auth/`
</requirements>

## Subtarefas

- [x] 13.1 Criar `src/app/(auth)/layout.tsx` (wrapper centralizado, sem guard)
- [x] 13.2 Criar `src/app/(auth)/login/page.tsx` + `src/components/auth/LoginForm.tsx`
- [x] 13.3 Criar `src/app/(auth)/cadastro/page.tsx` + `src/components/auth/RegisterForm.tsx`
- [x] 13.4 Criar `src/app/(auth)/convite/[token]/page.tsx` + `src/components/auth/AcceptInviteForm.tsx` + `InviteError.tsx`
- [x] 13.5 Usar shadcn `Input`, `Button`, `Label`, `Card` já instalados
- [x] 13.6 Abrir `docs/RodagemApp.html` como referência e reproduzir layout/cores do `LoginScreen`
- [ ] 13.7 Rodar `npm run dev` e testar navegador: layout fiel + fluxos funcionando
- [x] 13.8 Rodar `npm run lint`

## Detalhes de Implementação

**RegisterForm:**
```tsx
"use client";
// form com react-hook-free (useState simples) ou um helper mínimo
async function onSubmit() {
  const res = await fetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
  if (!res.ok) return setError(await res.json());
  await signIn("credentials", { email: form.email, password: form.password, callbackUrl: "/dashboard" });
}
```

**LoginForm:**
```tsx
"use client";
// chama signIn diretamente; em caso de retorno null, exibe "credenciais inválidas"
```

**/convite/[token]/page.tsx** (Server):
```tsx
export default async function Page({ params }) {
  const invite = await inviteRepository.findByToken(InviteToken.create(params.token));
  if (!invite || !invite.isUsable(new Date()))
    return <InviteError status={!invite ? "not_found" : "expired_or_used"} />;
  const account = await accountRepository.findById(invite.accountId);
  return <AcceptInviteForm token={params.token} email={invite.email.value} accountName={account!.name} />;
}
```

## Critérios de Sucesso

- Fluxo completo em navegador:
  1. `/cadastro` → cria conta → redireciona para `/dashboard`.
  2. Logout → `/login` → autentica → `/dashboard`.
  3. A partir do dashboard (ou via curl no MVP), criar convite; abrir link logado como outro browser → `/convite/[token]` renderiza form → aceitar → `/dashboard`.
- Lint verde.
- Layout fiel ao protótipo (revisão visual manual).
