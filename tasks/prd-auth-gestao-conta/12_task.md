---
status: completed
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>front/guard</domain>
<type>implementation</type>
<scope>middleware</scope>
<complexity>low</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 12.0: Auth guard — middleware + layout (app)/

## Visão Geral

Proteger as rotas autenticadas em duas camadas: `src/middleware.ts` com o helper `next-auth/middleware` (matcher nas rotas do app) e `src/app/(app)/layout.tsx` que revalida a sessão via `getServerSession` e redireciona para `/login` se ausente.

<requirements>
- `src/middleware.ts` protege `/dashboard/:path*`, `/veiculos/:path*`, `/abastecimento/:path*`, `/manutencao/:path*`, `/relatorios/:path*`, `/configuracoes/:path*`
- `src/app/(app)/layout.tsx` é um Server Component que checa sessão e `redirect("/login")` se null
- O grupo `(app)` não prefixa URL; rotas das fases 3-7 serão colocadas nele
- Placeholder temporário `src/app/(app)/dashboard/page.tsx` para viabilizar o smoke test
</requirements>

## Subtarefas

- [x] 12.1 Criar `src/middleware.ts` usando `export { default } from "next-auth/middleware"` + `config.matcher`
- [x] 12.2 Criar `src/app/(app)/layout.tsx` com `getServerSession(authOptions)` e `redirect`
- [x] 12.3 Criar `src/app/(app)/dashboard/page.tsx` placeholder (ex.: "Olá, {session.userId} — em construção")
- [ ] 12.4 Rodar `npm run dev` e validar manualmente: sem sessão em `/dashboard` → redirect; com sessão → render
- [x] 12.5 Rodar `npm run lint`

## Detalhes de Implementação

```ts
// src/middleware.ts
export { default } from "next-auth/middleware";
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/veiculos/:path*",
    "/abastecimento/:path*",
    "/manutencao/:path*",
    "/relatorios/:path*",
    "/configuracoes/:path*",
  ],
};
```

```ts
// src/app/(app)/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/infrastructure/auth/nextauth.config";

export default async function AppLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <>{children}</>;
}
```

## Critérios de Sucesso

- Acesso a `/dashboard` sem estar logado redireciona para `/login` (via middleware).
- Após login, `/dashboard` renderiza o placeholder.
- Lint verde.
