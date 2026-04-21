---
status: completed
parallelizable: false
blocked_by: ["10.0", "11.0"]
---

<task_context>
<domain>docs/validation</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 12.0: Smoke test manual + `validation.md`

## Visão Geral

Executa o fluxo fim a fim em ambiente de desenvolvimento e documenta passos, resultados e evidências. Fecha a Fase 4 com um dossiê replicável para futuros reviews.

<requirements>
- Documentar em `tasks/prd-abastecimento/validation.md`
- Cobrir: criar abastecimento (cheio), criar parcial, editar com mudança de odômetro, excluir, validar cascata de km/l, bloqueio por ownership (tentar acessar fuelup de outra conta)
- Listar débitos técnicos encontrados para o review da fase
- Rodar `npm test` uma última vez e confirmar verde
</requirements>

## Subtarefas

- [x] 12.1 `npm run dev` + (se necessário) reset do banco
- [x] 12.2 Logar como usuário A, cadastrar veículo, criar abastecimento com tanque cheio → confirmar persistência no dashboard
- [x] 12.3 Criar segundo abastecimento cheio → verificar km/l calculado no histórico e no dashboard
- [x] 12.4 Criar abastecimento parcial intermediário (editar) → conferir que o km/l do terceiro cheio soma os litros do parcial
- [x] 12.5 Editar o primeiro abastecimento, mudar odômetro para valor que quebra monotonicidade → confirmar erro `odometer.not_increasing`
- [x] 12.6 Excluir o primeiro abastecimento → confirmar que o segundo perde km/l (null) e dashboard reflete
- [x] 12.7 Em navegador anônimo, logar como usuário B (outra conta) e tentar acessar `/abastecimento/[id]` do A → esperar 403/404
- [x] 12.8 Tentar acessar `/veiculos/[id]` sem sessão → redirect para `/login`
- [x] 12.9 Registrar tudo em `tasks/prd-abastecimento/validation.md`
- [x] 12.10 Rodar `npm test` e anexar o resumo de passos verdes

## Detalhes de Implementação

Seguir a estrutura de `tasks/prd-auth-gestao-conta/validation.md` como referência: seção por cenário, comando/ação, resultado observado, eventual screenshot/log.

## Critérios de Sucesso

- Todos os 7 cenários do checklist passam
- `validation.md` existe e é legível
- `npm test` totalmente verde
- `npm run lint` verde
- Fase 4 pronta para `/review abastecimento`
