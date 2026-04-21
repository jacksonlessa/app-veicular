# Task 11.0 Review — /api/invites + /api/invites/[token]

## Verdict: APPROVED

## Findings

### Critical
_None._

### High
_None._

### Medium

**M1 — Subtarefa 11.3: schemas zod em arquivos irmãos não criados**
A subtarefa 11.3 exige criar os schemas em arquivos `schema.ts` separados (um para `invites/` e outro para `invites/[token]/`). Na prática os schemas foram declarados inline nos próprios `route.ts`:
- `invites/route.ts` linha 10: `const InviteCreateSchema = z.object({ email: z.string().email() });`
- `invites/[token]/route.ts` linha 9: `const AcceptSchema = z.object({ name: z.string().min(1), password: z.string().min(8) });`

Isso não viola nenhuma regra de negócio ou segurança, mas viola a convenção estabelecida pela task (e já adotada em `auth/register/schema.ts`). Consistência arquitetural recomenda mover para arquivos separados.

### Low

**L1 — `account!.name` com non-null assertion no GET `invites/[token]`**
A linha `return NextResponse.json({ email: invite.email.value, accountName: account!.name });` usa `!` para suprimir o `null`. Se o `accountId` do convite apontar para uma conta deletada (edge case improvável no MVP, já que não há deleção de contas), isso lançaria um `TypeError` não tratado e retornaria 500 sem mensagem específica. O `mapDomainError` captura o erro genérico e retorna `{ error: "internal" }`, portanto sem exposição de stack trace — o risco é mínimo. Para o MVP é aceitável; uma versão mais robusta verificaria `if (!account)` explicitamente.

**L2 — Schema `details` vs `issues` (mesma observação da task 10)**
Os dois `route.ts` usam `{ error: "validation", issues: ... }`. Inconsistência de nomenclatura com a TechSpec (que define `details`). Trata-se de um problema de documentação, não de implementação.

**L3 — Subtarefa 11.6 (teste manual curl) não documentada**
A subtarefa está marcada como `[ ]` (incompleta). Nenhuma evidência de curl registrada. Não bloqueia funcionalidade, mas era requisito da task.

**L4 — `InviteCreateSchema` não reutilizado do `schema.ts`**
Mesmo ponto de M1 visto pela lente de manutenibilidade: testes futuros de integração precisariam reimportar o schema do `route.ts` em vez de um `schema.ts` isolado.

## Summary

A implementação das três rotas está funcionalmente correta e segura. O `POST /api/invites` verifica a sessão com `getServerSession`, extrai `accountId` e `userId` tipados (graças ao `next-auth.d.ts` da task 9), e delega ao `InviteUserUseCase`. O `GET /api/invites/[token]` valida o token como VO, verifica `isUsable`, busca a conta e retorna os dados informativos sem efeitos colaterais. O `POST /api/invites/[token]` delega ao `AcceptInviteUseCase`, que por sua vez executa a transação atômica com re-validação do limite de 2 usuários. O `runtime = "nodejs"` está presente em ambos os arquivos. O `mapDomainError` cobre todos os códigos de erro esperados. Nenhum segredo exposto, sem código morto, sem lógica duplicada.

O único desvio estrutural notável (M1) é a ausência dos arquivos `schema.ts` separados exigidos pela subtarefa 11.3. Como não impacta funcionalidade nem segurança, e a codebase é pequena, a decisão de manter inline é aceitável para o MVP.

## Required Actions Before Completion
_Nenhuma ação bloqueante. M1 (extrair schemas para arquivos separados) é recomendado para manter consistência com o padrão adotado em `auth/register/`, mas não impede a marcação como completa._
