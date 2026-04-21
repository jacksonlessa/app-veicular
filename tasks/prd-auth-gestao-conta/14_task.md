---
status: completed
parallelizable: false
blocked_by: ["13.0"]
---

<task_context>
<domain>docs/validation</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 14.0: Smoke test manual + documentação de validação

## Visão Geral

Executar o fluxo fim a fim em ambiente de desenvolvimento e documentar os passos e evidências. Similar à task 11.0 da Fase 1 (`seed script, documentação e validação`). Garante que todas as peças se encaixam antes de fechar a fase.

<requirements>
- Documentar passos e resultado em `tasks/prd-auth-gestao-conta/validation.md`
- Cobrir: cadastro, login, logout, criar convite, abrir link, aceitar convite, verificar limite de 2 usuários
- Capturar saídas de `console.log` do `NoopMailer` para comprovar o e-mail simulado
- Listar débitos técnicos encontrados para o review da fase
</requirements>

## Subtarefas

- [x] 14.1 `npm run dev` + reset do banco (se necessário)
- [x] 14.2 Cadastrar usuário A via `/cadastro`
- [x] 14.3 Logout e login novamente (valida fluxo de login)
- [x] 14.4 Como A, chamar `POST /api/invites` (via console do navegador ou curl com cookie de sessão)
- [x] 14.5 Copiar o link impresso no terminal pelo NoopMailer; abrir em browser anônimo
- [x] 14.6 Aceitar convite e confirmar login automático do usuário B
- [x] 14.7 Tentar criar um terceiro convite como A → esperar 409 `invite.account_full`
- [x] 14.8 Tentar acessar `/dashboard` sem sessão → esperar redirect para `/login`
- [x] 14.9 Registrar tudo em `tasks/prd-auth-gestao-conta/validation.md`
- [x] 14.10 Rodar `npm test` uma última vez para confirmar verde

## Detalhes de Implementação

Seguir a estrutura de `tasks/prd-fase-1-dominio-infra/11_task.md` como referência de formato para o `validation.md`: seção por cenário, comando/ação, resultado observado, screenshot ou log quando cabe.

## Critérios de Sucesso

- Todos os 7 cenários do checklist passam.
- `validation.md` existe e é legível.
- Suíte de testes unitários totalmente verde.
- Lint verde.
- Fase 2 pronta para review (`/review auth-gestao-conta`).
