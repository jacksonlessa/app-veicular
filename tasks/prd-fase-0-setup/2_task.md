---
status: pending
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>infra</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 2.0: Criar estrutura de pastas Clean DDD

## Visão Geral

Criar a árvore de diretórios da arquitetura Clean DDD definida no escopo (seção 13), todas vazias e versionadas via `.gitkeep`. Nenhuma implementação de domínio — isto é Fase 1.

<requirements>
- Pastas: `src/domain/`, `src/application/`, `src/infrastructure/`, `src/components/ui/`, `src/lib/`
- Cada pasta vazia deve conter `.gitkeep` para aparecer no git
- Regra de dependência entre camadas documentada no README (na task 8.0)
</requirements>

## Subtarefas

- [ ] 2.1 Criar `src/domain/.gitkeep`
- [ ] 2.2 Criar `src/application/.gitkeep`
- [ ] 2.3 Criar `src/infrastructure/database/.gitkeep`
- [ ] 2.4 Criar `src/components/ui/.gitkeep`
- [ ] 2.5 Criar `src/lib/.gitkeep`

## Detalhes de Implementação

Sem código TypeScript. Apenas arquivos vazios `.gitkeep`. A task 3.0 substituirá `src/infrastructure/database/.gitkeep` pelo `prisma.client.ts`.

## Critérios de Sucesso

- Estrutura de pastas visível no git status
- `find src -type d` lista as pastas esperadas
