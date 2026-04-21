# Task 9.0 Review — Container wiring + error-handler helper

## Verdict: APPROVED

## Findings

### Critical
_None._

### High
_None._

### Medium

**M-01 — Stray `.tmp` file untracked in the repository**
File: `src/application/ports/password-hasher.ts.tmp.106195.1776737728238`
This artifact was left behind by an editor/tool write operation and appears in `git status` as an untracked file. It is not harmful (contents are identical to the real file) but must be deleted before the next commit to keep the tree clean.

**M-02 — Lint warnings in test files introduced by this task**
Files: `tests/unit/application/usecases/account/accept-invite.usecase.test.ts` (line 1: `beforeEach` unused import) and `tests/unit/application/usecases/account/invite-user.usecase.test.ts` (line 1: `vi` unused; line 8: `BusinessRuleError` unused).
These are warnings, not errors, and do not break anything. However they violate the no-dead-code rule from CLAUDE.md and should be cleaned up.

### Low

**L-01 — `password-hasher.ts` port duplicates re-export in `password-hasher.ts` (infra)**
`src/application/ports/password-hasher.ts` was newly created as the canonical port definition. `src/infrastructure/auth/password-hasher.ts` still contains `export type { PasswordHasher }` on line 4 (a re-export of the same interface). This is a side effect of the port extraction and creates a redundant public surface on the infrastructure layer. The re-export can be removed once callers are verified to import from `@/application/ports/password-hasher` directly.

**L-02 — `NoopMailer` logs only `to` and `accountName`, not the `acceptUrl`**
File: `src/infrastructure/mailer/noop.mailer.ts`
The TechSpec states the dev workflow relies on copying the invite link from the terminal. The current log line omits `acceptUrl`, making it impossible to obtain the link during development without additional instrumentation. The log should include `payload.acceptUrl`.

## Summary

All five subtasks are complete and correct:

- `container.ts` exports all five required symbols (`inviteRepository`, `tokenGenerator`, `registerAccountUseCase`, `inviteUserUseCase`, `acceptInviteUseCase`) and reads `baseUrl` from `NEXTAUTH_URL ?? APP_BASE_URL ?? "http://localhost:3000"` as specified.
- Constructor argument order in the container matches the positional constructors of all three use cases exactly.
- `src/app/api/_lib/error-handler.ts` implements `mapDomainError` verbatim to the spec: `InvalidValueError → 400`, `invite.not_found → 404`, `invite.expired_or_used → 410`, generic `BusinessRuleError → 409`, unknown errors → `500` with `console.error`.
- The error-handler test covers all five code paths, mocks `next/server` correctly, and verifies response shape and status codes. All 372 tests pass (`npm test` green).
- Lint produces zero errors (24 pre-existing warnings, 3 of which are in test files touched by this task).
- `TokenGenerator` port and `RandomHexTokenGenerator` impl are consistent (32 bytes → 64-char hex), and `NoopMailer` satisfies the `Mailer` port.

The two medium findings (stray `.tmp` file and unused imports in test files) are house-keeping items that should be addressed before the next PR but do not block acceptance of this task's functionality.

## Required Actions Before Completion

1. **Delete** `src/application/ports/password-hasher.ts.tmp.106195.1776737728238`.
2. **Remove** unused imports `beforeEach` from `accept-invite.usecase.test.ts` and `vi`/`BusinessRuleError` from `invite-user.usecase.test.ts`.
3. *(Recommended)* Add `acceptUrl` to the `NoopMailer` log line so the invite link is visible in the terminal during development.
4. *(Recommended)* Remove the `export type { PasswordHasher }` re-export from `src/infrastructure/auth/password-hasher.ts`.
