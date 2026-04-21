# Validation — Auth e Gestão de Conta (Fase 2)

**Slug:** `auth-gestao-conta`
**Data:** 2026-04-21
**Ambiente:** desenvolvimento local (`http://localhost:3000`)

---

## Pré-requisitos

```bash
# 1. Instalar dependências
npm install

# 2. Banco de dados: garantir que existe e está migrado
npx prisma migrate deploy
# ou, em dev:
npx prisma db push

# 3. Subir o servidor de desenvolvimento
npm run dev
```

O terminal deve mostrar `ready started server on 0.0.0.0:3000`.

---

## Cenário 1: Cadastro de Novo Usuário e Conta

**Pré-condição:** nenhum usuário com o e-mail `alice@exemplo.com` existe no banco.

**Ação — via navegador:**

1. Abrir `http://localhost:3000/cadastro`.
2. Preencher:
   - Nome: `Alice Teste`
   - E-mail: `alice@exemplo.com`
   - Senha: `senha1234`
3. Clicar em "Criar conta".

**Ação — via curl:**

```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Teste","email":"alice@exemplo.com","password":"senha1234"}' \
  | jq .
```

**Resultado esperado:**

- HTTP `201 Created`.
- Corpo: `{ "userId": "<cuid>", "accountId": "<cuid>" }`.
- Via navegador: redireciona automaticamente para `/dashboard` (sessão iniciada).

---

## Cenário 2: Login com Credenciais Válidas

**Pré-condição:** usuário `alice@exemplo.com` cadastrado (Cenário 1).

**Ação — via navegador:**

1. Abrir `http://localhost:3000/login`.
2. Preencher e-mail `alice@exemplo.com` e senha `senha1234`.
3. Clicar em "Entrar".

**Ação — via curl (obter CSRF token antes):**

```bash
# 1. Obter CSRF token
CSRF=$(curl -s http://localhost:3000/api/auth/csrf | jq -r .csrfToken)

# 2. Fazer login
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=alice@exemplo.com&password=senha1234&csrfToken=${CSRF}&callbackUrl=%2Fdashboard"

# 3. Verificar sessão
curl -b cookies.txt http://localhost:3000/api/auth/session | jq .
```

**Resultado esperado:**

- Via navegador: redireciona para `/dashboard`.
- Via curl: `GET /api/auth/session` retorna `{ "user": { "name": "Alice Teste", "email": "alice@exemplo.com" }, "accountId": "<cuid>", "userId": "<cuid>" }`.
- Cookie `next-auth.session-token` presente.

---

## Cenário 3: Criar Convite para Novo Usuário

**Pré-condição:** usuário Alice autenticado (cookie de sessão presente em `cookies.txt`).

**Ação — via curl:**

```bash
curl -s -b cookies.txt -X POST http://localhost:3000/api/invites \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@exemplo.com"}' \
  | jq .
```

**Resultado esperado:**

- HTTP `201 Created`.
- Corpo: `{ "inviteId": "<cuid>" }`.
- **No terminal onde `npm run dev` está rodando**, deve aparecer um log do `NoopMailer` similar a:

```
[NoopMailer] sendInvite → to=bob@exemplo.com link=http://localhost:3000/convite/<token-hex-64-chars>
```

Copiar o link completo do log para o próximo cenário.

---

## Cenário 4: Validar Token e Aceitar Convite

**Pré-condição:** convite criado (Cenário 3); `TOKEN` = o token hex copiado do log do NoopMailer.

**Ação 4a — Validar token via GET:**

```bash
TOKEN="<token-hex-copiado-do-log>"

curl -s http://localhost:3000/api/invites/${TOKEN} | jq .
```

**Resultado esperado (4a):**

- HTTP `200 OK`.
- Corpo: `{ "email": "bob@exemplo.com", "accountName": "Alice Teste" }`.

**Ação 4b — Aceitar convite via POST:**

```bash
curl -s -X POST http://localhost:3000/api/invites/${TOKEN} \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Teste","password":"outrasenha1234"}' \
  | jq .
```

**Resultado esperado (4b):**

- HTTP `201 Created`.
- Corpo: `{ "userId": "<cuid>", "accountId": "<cuid>" }` (mesmo `accountId` da Alice).

**Ação 4c — Aceitar convite via navegador:**

1. Abrir o link copiado do terminal em uma janela anônima/privada:
   `http://localhost:3000/convite/<TOKEN>`
2. Deve exibir o formulário de boas-vindas com e-mail `bob@exemplo.com` pré-indicado.
3. Preencher nome e senha; submeter.
4. Redireciona para `/dashboard` já autenticado como Bob.

---

## Cenário 5: Limite de Conta — 3º Convite Bloqueado

**Pré-condição:** conta já possui 2 usuários (Alice + Bob, após Cenário 4). Alice está autenticada.

**Ação:**

```bash
curl -s -b cookies.txt -X POST http://localhost:3000/api/invites \
  -H "Content-Type: application/json" \
  -d '{"email":"charlie@exemplo.com"}' \
  | jq .
```

**Resultado esperado:**

- HTTP `409 Conflict`.
- Corpo: `{ "error": "invite.account_full" }`.
- Nenhum convite é persistido; nenhuma entrada de log no NoopMailer.

---

## Cenário 6: Auth Guard — Acesso Sem Sessão Bloqueado

**Pré-condição:** sem cookies de sessão ativos (navegação anônima ou sem o arquivo `cookies.txt`).

**Ação — via navegador:**

1. Abrir `http://localhost:3000/dashboard` sem estar logado.

**Ação — via curl:**

```bash
curl -si http://localhost:3000/dashboard | head -5
```

**Resultado esperado:**

- Redireciona para `/login` (HTTP 307 ou 302).
- Via navegador: tela de login exibida.
- Via curl: `Location: /login` no header de resposta.

---

## Cenário 7: Token de Convite Inválido

**Pré-condição:** nenhuma.

**Ação — via navegador:**

1. Abrir `http://localhost:3000/convite/abc123`.

**Ação — via curl:**

```bash
curl -s http://localhost:3000/api/invites/abc123 | jq .
```

**Resultado esperado:**

- Via navegador: página de erro exibida (componente `InviteError`) com mensagem indicando que o link é inválido ou expirado.
- Via curl (API): HTTP `400 Bad Request` com `{ "error": "validation", "field": "token" }` (o VO `InviteToken` rejeita tokens com formato inválido antes mesmo de consultar o banco).

---

## Cenário 8: E-mail Duplicado no Cadastro

**Pré-condição:** Alice (`alice@exemplo.com`) já existe.

**Ação:**

```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Outra Alice","email":"alice@exemplo.com","password":"senha1234"}' \
  | jq .
```

**Resultado esperado:**

- HTTP `409 Conflict`.
- Corpo: `{ "error": "email.duplicate" }`.

---

## Verificação dos Testes Automatizados

```bash
# Suite completa (deve passar 100%)
npm test

# Lint (deve retornar 0 errors)
npm run lint

# Build de produção (deve compilar sem erros)
npm run build
```

**Resultado esperado:**

- `npm test`: `32 test files | 372 tests passed`.
- `npm run lint`: `0 errors` (warnings sobre parâmetros prefixados com `_` são esperados e não bloqueantes).
- `npm run build`: compilação sem erros TypeScript.

---

## Débitos Técnicos

| # | Débito | Impacto | Fase prevista |
|---|--------|---------|---------------|
| 1 | **Transações MVP sem repo-level tx support** — `RegisterAccountUseCase` e `AcceptInviteUseCase` recebem o `PrismaClient` diretamente para chamar `$transaction`. Os repositórios não possuem overload `create(entity, tx?)`. Em caso de rollback manual, é necessário chamar métodos de repositório sem a instância transacional. | Baixo (SQLite serializado em dev; MySQL em prod tem janela de inconsistência pequena). | Fase 7 (refactor de repos) |
| 2 | **NoopMailer sem envio real de e-mail** — convites só existem no terminal de desenvolvimento. Usuários em produção não receberiam o link. | Alto em produção. | Fase 8 (integração SMTP/Resend) |
| 3 | **Sem rate limiting nas rotas de registro e convite** — `POST /api/auth/register` e `POST /api/invites` podem ser chamados sem limite de frequência, expondo o app a ataques de força bruta e enumeração de e-mails. | Médio. | Fase 8 |
| 4 | **Expiração de convites não é ativa** — tokens `pending` passados de `expiresAt` permanecem com `status = "pending"` no banco. A verificação `isUsable(now)` em runtime os rejeita corretamente, mas não há cron job para marcar como `"expired"`. Queries que listam convites ativos precisam sempre filtrar `expiresAt > now`. | Baixo (sem listagem de convites no MVP). | Fase 7+ |
| 5 | **Race condition residual no limite de 2 usuários** — dois convites aceitos simultaneamente podem passar da verificação `countByAccount < 2`. Em SQLite (dev) é serializado; em MySQL (prod) o `SELECT` dentro de `$transaction` reduz a janela mas não a elimina sem `SELECT FOR UPDATE`. | Baixo para MVP (contas pequenas, tráfego baixo). | Fase 8 |
