# PRD — Auth e Gestão de Conta

**Slug:** `auth-gestao-conta`
**Fase:** 2
**Status:** Draft
**Data:** 2026-04-20

---

## Visão Geral

O RodagemApp precisa de uma porta de entrada segura e controlada. Qualquer pessoa pode criar uma conta própria pelo cadastro público; após isso, o dono da conta pode convidar até mais um usuário para compartilhar o acesso aos veículos e registros. Sem essa fase, nenhuma funcionalidade do app é acessível — ela é o pré-requisito de tudo.

---

## Objetivos

- Permitir que qualquer usuário crie uma conta independente em menos de 2 minutos.
- Permitir que um usuário existente convide um segundo membro para sua conta via e-mail.
- Garantir que apenas usuários autenticados acessem as rotas protegidas do app.
- Impor o limite de 2 usuários por conta no momento do convite.

---

## Histórias de Usuário

**Registro:**
- Como visitante, quero criar uma conta com nome, e-mail e senha para começar a usar o app.
- Como visitante, quero receber feedback imediato se meu e-mail já está cadastrado, para não criar duplicatas.

**Login:**
- Como usuário cadastrado, quero fazer login com e-mail e senha para acessar minha conta.
- Como usuário autenticado, quero que qualquer tentativa de acesso a rota protegida sem sessão me redirecione para `/login`.

**Convite:**
- Como usuário autenticado, quero convidar outra pessoa pelo e-mail para que ela acesse os mesmos veículos e registros da minha conta.
- Como usuário convidado, quero receber um e-mail com link único para criar minha senha e entrar na conta.
- Como usuário autenticado, quero que o sistema me impeça de enviar um convite se a conta já tiver 2 usuários.

---

## Funcionalidades Principais

### RF-01 — Cadastro de Novo Usuário e Conta

Formulário público em `/cadastro` com campos: nome completo, e-mail e senha. Ao submeter:

1. Valida formato de e-mail e força mínima de senha.
2. Verifica se o e-mail já existe — retorna erro descritivo se sim.
3. Cria uma nova `Account` e o primeiro `User` vinculado a ela atomicamente.
4. Inicia sessão automaticamente e redireciona para `/dashboard`.

### RF-02 — Login com E-mail e Senha

Formulário em `/login` integrado ao NextAuth.js (provider credentials):

1. Autentica e-mail e senha contra o banco.
2. Em caso de sucesso, cria sessão com `account_id` e `user_id`.
3. Em caso de falha, exibe mensagem genérica (não revela se o e-mail existe).
4. Redireciona para `/dashboard` após login.

### RF-03 — Auth Guard nas Rotas Protegidas

O layout `(app)/` valida a presença de sessão ativa a cada requisição:

1. Sem sessão → redireciona para `/login`.
2. Com sessão válida → renderiza a página solicitada.

### RF-04 — Criação de Convite

Disponível para qualquer usuário autenticado (sem distinção de papel):

1. Usuário informa o e-mail do convidado e confirma a ação.
2. Sistema verifica se a conta já tem 2 usuários — bloqueia com mensagem clara se sim.
3. Sistema verifica se o e-mail já pertence a um usuário da conta — bloqueia se sim.
4. Gera um token único de convite com validade de 48 horas.
5. Envia e-mail ao endereço informado com o link `/convite/[token]`.

### RF-05 — Aceitação de Convite

Fluxo em `/convite/[token]`:

1. Valida o token: existe, não expirou, não foi usado.
2. Token inválido ou expirado → exibe mensagem de erro com orientação.
3. Token válido → exibe formulário para o convidado definir nome e senha.
4. Ao submeter: cria o `User` vinculado à `Account` do convite, marca o token como usado, inicia sessão e redireciona para `/dashboard`.

---

## Experiência do Usuário

- **Visual:** todas as telas seguem o protótipo `LoginScreen` do arquivo `docs/RodagemApp.html` — tipografia Plus Jakarta Sans, tema Âmbar, layout mobile-first `max-w-[430px]`.
- **Feedback:** erros de validação aparecem inline nos campos; erros de servidor aparecem como mensagem no topo do formulário.
- **Fluxo de convite:** confirmar → enviar e-mail (não há pré-visualização ou fila — o e-mail é enviado imediatamente após a confirmação).
- **Consistência:** usuário convidado tem a mesma interface e acesso que o criador da conta.

---

## Restrições Técnicas de Alto Nível

- Autenticação via **NextAuth.js** com provider credentials (e-mail/senha). Sem OAuth nessa fase.
- Senhas armazenadas com hash (bcrypt) — nunca em texto plano.
- Token de convite deve ser criptograficamente seguro (mínimo 32 bytes aleatórios) e ter TTL de 48 horas.
- Limite de **2 usuários por conta** validado no servidor, não apenas no cliente.
- Envio de e-mail via `mailer.ts` (infraestrutura já definida na Fase 1).
- Sessão deve carregar `account_id` para que todas as queries subsequentes sejam corretamente isoladas por conta.

---

## Não-Objetivos (Fora de Escopo)

- Recuperação de senha (esqueci minha senha).
- Login via OAuth / SSO (Google, GitHub, etc.).
- Exclusão ou desativação de conta/usuário.
- Troca de e-mail ou senha após cadastro.
- Gerenciamento de permissões granulares entre usuários da mesma conta.
- Conformidade LGPD (consentimento explícito, política de privacidade, direito ao esquecimento).
- Reenvio de convite expirado (o usuário deve criar um novo convite).

---

## Questões em Aberto

- Quando o token de convite expira, o registro na tabela `invites` é deletado ou marcado como expirado? (impacta auditoria futura)
- O e-mail de convite deve ter um template HTML estilizado (tema Âmbar) ou texto puro é suficiente para o MVP?
