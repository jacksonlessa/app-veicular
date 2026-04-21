# Task 3.0 Review — Função pura `recalculateChain` + testes unitários

## Verdict: APPROVED

## Findings

### Critical
Nenhum.

### High
Nenhum.

### Medium
Nenhum.

### Low

- **Teste (e) não simula exatamente o cenário descrito:** O título diz "exclusão do primeiro cheio zera o km/l do segundo", mas o teste verifica que o _terceiro_ registro (f3) ainda recebe km/l calculado (10 km/l), porque f2 se torna o novo "primeiro cheio" e f3 o segundo. O comportamento testado está correto para a `recalculateChain`, mas o nome/comentário do teste pode confundir o leitor. Considere renomear para algo como "após exclusão do primeiro cheio, o segundo passa a não ter referência anterior (null) e o terceiro calcula normalmente".

- **`seqId` é módulo-level e mutável:** A variável `let seqId = 0` no arquivo de teste é incrementada a cada `makeFuelup` sem reset entre testes. Em execução paralela (vitest workers) ou reordenação de testes isso é inofensivo (ids são apenas strings distintas), mas pode surpreender quem inspecionar os ids gerados. Uma alternativa mais robusta seria usar `crypto.randomUUID()` ou um closure de fábrica isolado por describe.

## Summary

A implementação está plenamente conforme com a task 3.0, o PRD e a TechSpec:

- `recalculateChain` é função pura sem I/O, sem dependência de repositório.
- A assinatura e lógica coincidem exatamente com o pseudocódigo especificado na task.
- Todos os 6 cenários obrigatórios (a–f) estão cobertos; além deles, foram adicionados dois testes extras ("não muta a entrada" e "saída preserva todos os outros campos") que reforçam os critérios de sucesso da task.
- 8/8 testes passam; `eslint` retorna sem alertas.
- `Fuelup.rehydrate` é chamado corretamente com todos os campos de `FuelupProps`; nenhum campo é silenciosamente descartado.
- A regra clássica de consumo por tanque cheio (parciais entram no denominador) está implementada corretamente na subtarefa 3.3/3.5.

## Required Actions Before Completion
Nenhuma ação bloqueante. As observações de nível Low são sugestões de melhoria e não impedem o avanço para as próximas tasks.
