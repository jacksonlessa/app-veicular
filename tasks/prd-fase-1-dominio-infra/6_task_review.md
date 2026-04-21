# Task 6.0 Review — FuelupService: regra dos 3 campos + cálculo condicional de km/l

## Verdict: APPROVED

## Findings

### Critical

Nenhum.

### High

Nenhum.

### Medium

**[M1] Arredondamento feito no serviço, não nos VOs — ambiguidade arquitetural aceitável**

A task diz "Arredondar apenas ao instanciar VOs finais (ex.: FuelPrice com 2 casas, FuelAmount com 3 casas)". A implementação faz `Math.round(... * 100) / 100` manualmente antes de chamar `FuelPrice.create()` e `Math.round(... * 1000) / 1000` antes de `FuelAmount.create()`. Os VOs não arredondam internamente — apenas validam.

A semântica do contrato ("ao instanciar") é satisfeita: o valor arredondado é o que chega ao VO. Porém, se outro ponto do código instanciar esses VOs diretamente sem passar por `FuelupService`, o arredondamento não ocorrerá. Para a Fase 1 isso é inofensivo — o risco fica para fases futuras que instanciem `FuelPrice`/`FuelAmount` em outros serviços. Recomendável migrar o arredondamento para os `static create()` dos VOs nas fases de manutenção do domínio.

**[M2] Teste duplicado de lançamento de erro usa `toThrow` + `toThrowError` separados em dois `expect`**

Nos casos `odômetro decrescente` (linha 229-247) e `0 campos preenchidos` (linha 17-30), o teste invoca `FuelupService.compute()` duas vezes sobre o mesmo input, primeiro verificando o tipo (`BusinessRuleError`) e depois a mensagem. Isso não é um bug de comportamento, mas aumenta o tempo de execução e cria duplicação de setup. Padrão preferível: `expect(() => ...).toThrow(BusinessRuleError)` e extrair a asserção de código para a mesma chamada ou usar `expect.assertions`. Impacto real: zero — testes passam e cobrem os cenários corretamente.

### Low

**[L1] Comentários inline triviais**

Linhas 40, 46, 52 e 60 contêm comentários (`// Calculate totalPrice = ...`, `// Calculate kml conditionally`) que repetem o que o código já expressa claramente. Sem impacto funcional, mas adiciona ruído. Manter ou remover conforme convenção do projeto.

**[L2] Ausência de teste para `odômetro igual` + `previous.fullTank = false`**

O teste `"odômetro decrescente com previous.fullTank = false → não lança erro"` cobre a guarda de fullTank para odômetro decrescente. Não existe teste equivalente para odômetro **igual** quando `previous.fullTank = false`. Como a guarda de odômetro só é avaliada dentro do bloco `if (... && previous.fullTank && currentFullTank)`, o caminho é coberto implicitamente pela lógica, mas o caso não é documentado explicitamente na suíte. Impacto: cobertura de branch já está em 100%, portanto não há risco de regressão.

## Summary

A implementação atende integralmente a todos os requisitos críticos da task:

1. **Regra dos 3 campos** — validação `filled !== 2` está correta. O filtro usa `v !== undefined && v !== null` (mais preciso que `Boolean`, evitando falso positivo com `0`). Rejeita 0, 1 e 3 campos com `BusinessRuleError("fuelup.three_fields")`. Todos os 5 cenários cobertos.

2. **kml condicional** — a guard `previous != null && previous != undefined && previous.fullTank && currentFullTank` é correta e exaustiva. O cálculo `(currentOdometer - previousOdometer) / liters` só ocorre quando todas as condições são verdadeiras. Primeiro abastecimento (`previous = null | undefined`) retorna `kml = null`. Todos os 5 cenários de guarda cobertos.

3. **`BusinessRuleError("odometer.not_increasing")`** — lançado quando `previous.odometer.value >= currentOdometer.value` (inclui igual e decrescente). Lançado **somente** dentro do bloco que já verificou `fullTank` em ambos os lados, portanto não há falso positivo para casos onde `previous.fullTank = false`.

4. **Tipos e assinaturas** — `FuelupInput` e `FuelupComputed` correspondem exatamente ao contrato do TechSpec. Nenhum `any`, sem imports fora do domínio.

5. **Cobertura** — 20 testes, 100% de cobertura em `fuelup.service.ts`, suíte verde. Lint sem erros.

Os achados M1 e M2 são melhorias arquiteturais e de estilo sem impacto funcional. Nenhum finding é bloqueante.

## Required Actions Before Completion

Nenhuma ação obrigatória. Os findings de nível Medium e Low são melhorias recomendadas para iterações futuras, não bloqueantes para conclusão da task 6.0.
