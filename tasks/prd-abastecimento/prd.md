# PRD — Fase 4: Abastecimento

## Visão Geral

Fase 4 do MVP do RodagemApp implementa o registro e o histórico de abastecimentos dos veículos cadastrados pela conta. Hoje, o usuário-alvo simplesmente **não registra** seus abastecimentos — não há planilha, app ou caderno. Isso impede qualquer visão de consumo (km/l), gasto mensal ou padrão por veículo, que são os motivadores centrais do MVP.

A feature entrega uma tela mobile-first (`FuelScreen` do protótipo) onde qualquer usuário da conta lança um abastecimento em poucos segundos, com a **regra dos 3 campos** (litros, preço/litro, total — o terceiro é calculado automaticamente) e o **toggle de tanque cheio**, que define se aquele abastecimento participa do cálculo de km/l. O histórico por veículo e a edição/exclusão de lançamentos fazem parte desta fase.

Esta fase é pré-requisito para a Fase 6 (Relatórios): sem abastecimentos registrados, não há dados para gráficos de consumo nem totais de gasto com combustível.

## Objetivos

- Permitir que **100% dos usuários da conta** registrem um abastecimento em até 3 interações (data, odômetro, 2 dos 3 valores monetários).
- Expor o consumo km/l automaticamente no próximo abastecimento de tanque cheio, sem nenhuma interação adicional do usuário.
- Garantir que o histórico de abastecimentos do veículo seja consultável e editável pelos dois membros da conta.
- Servir como fonte de dados confiável para os relatórios da Fase 6 (total gasto por mês/ano e evolução de km/l).

**Métricas-chave de sucesso:**
- Ao menos 1 abastecimento registrado por veículo ativo na primeira semana de uso.
- Zero abastecimentos com soma de `litros × preço/litro ≠ total` persistidos (validação de integridade).
- Tempo médio de preenchimento do formulário < 30s.

## Histórias de Usuário

- **Como** dono do veículo, **eu quero** registrar um abastecimento informando data, odômetro, litros e preço/litro **para que** o app calcule automaticamente o total pago e meu consumo no próximo tanque cheio.
- **Como** segundo membro da conta (cônjuge / sócio), **eu quero** abrir o app e lançar um abastecimento que fiz **para que** o controle fique compartilhado sem depender de uma única pessoa.
- **Como** usuário que só sabe o valor total pago e os litros, **eu quero** preencher só esses dois campos **para que** o preço/litro apareça calculado, sem eu precisar fazer a divisão de cabeça.
- **Como** usuário que fez um abastecimento parcial (não encheu o tanque), **eu quero** desmarcar o toggle "tanque cheio" **para que** aquele lançamento não gere um cálculo enganoso de km/l.
- **Como** usuário que digitou um valor errado, **eu quero** editar ou excluir um abastecimento do histórico **para que** meus relatórios não fiquem distorcidos.
- **Como** usuário consultando o histórico, **eu quero** ver os abastecimentos de um veículo em ordem cronológica com os principais valores (data, odômetro, total, km/l) **para que** eu possa acompanhar minha evolução.

## Funcionalidades Principais

### 4.1 Formulário de abastecimento (`/abastecimento`)

Tela de registro de novo abastecimento seguindo o protótipo `FuelScreen`.

**Requisitos funcionais:**
1. **RF-01** O formulário deve exigir: `veículo` (seletor quando há mais de um), `data`, `odômetro atual (km)`, e **dois** dos três campos monetários (`litros`, `preço/litro`, `total`).
2. **RF-02** O terceiro campo monetário deve ser calculado automaticamente e exibido com badge **"calculado"**, em tempo real, conforme o usuário digita.
3. **RF-03** A qualquer momento o usuário pode "liberar" o campo calculado, passando o papel de derivado para outro — sem preferência fixa de qual fica calculado por padrão.
4. **RF-04** Um toggle **"tanque cheio"** controla se o abastecimento será considerado no cálculo de km/l. Toggle ligado por padrão.
5. **RF-05** O campo `odômetro` é **obrigatório** em todos os abastecimentos (independentemente do toggle).
6. **RF-06** Validação: odômetro deve ser ≥ ao maior odômetro já registrado para aquele veículo (exibir erro inline se violado).
7. **RF-07** Validação: litros > 0, preço/litro > 0, total > 0, data não futura.
8. **RF-08** Ao salvar, redirecionar para o dashboard ou para a aba de Abastecimentos do veículo com feedback de sucesso.

### 4.2 Cálculo de km/l

**Requisitos funcionais:**
9. **RF-09** O km/l de um abastecimento só é calculado quando `tanque cheio = true` **e** existe um abastecimento anterior de tanque cheio para o mesmo veículo.
10. **RF-10** Fórmula: `km_percorridos = odômetro_atual − odômetro_anterior_cheio`; `km/l = km_percorridos / litros_do_abastecimento_atual`.
11. **RF-11** Abastecimentos com `tanque cheio = false` **não têm** km/l e **não interrompem** o cálculo — o próximo abastecimento de tanque cheio ainda referencia o último tanque cheio anterior, somando os litros intermediários (regra clássica de consumo por tanque cheio).
12. **RF-12** O km/l calculado deve ser persistido no registro do abastecimento para consulta no histórico e nos relatórios.

### 4.3 Histórico e edição

**Requisitos funcionais:**
13. **RF-13** A aba "Abastecimentos" em `/veiculos/[id]` (referência: `HistoryScreen`) deve listar todos os abastecimentos do veículo em ordem cronológica decrescente, exibindo data, odômetro, litros, total e km/l (quando houver).
14. **RF-14** Cada item do histórico deve ser clicável, abrindo a tela `/abastecimento/[id]` para visualização e edição.
15. **RF-15** A tela de edição deve permitir alterar todos os campos do abastecimento e salvar.
16. **RF-16** A tela de edição deve permitir excluir o abastecimento, com confirmação obrigatória antes de persistir.
17. **RF-17** Ao editar ou excluir um abastecimento, os km/l dos abastecimentos subsequentes do mesmo veículo devem ser recalculados automaticamente para manter a consistência.

### 4.4 API

**Requisitos funcionais:**
18. **RF-18** `GET /api/fuelups?vehicleId=…` retorna o histórico do veículo (escopado pela `accountId` da sessão).
19. **RF-19** `POST /api/fuelups` cria um abastecimento, aplicando validações RF-06/RF-07 e cálculo de km/l (RF-09 a RF-12).
20. **RF-20** `GET /api/fuelups/[id]`, `PUT /api/fuelups/[id]`, `DELETE /api/fuelups/[id]` operam apenas em abastecimentos cujo veículo pertence à conta da sessão (autorização por `accountId`).
21. **RF-21** Qualquer usuário autenticado da conta pode criar, ler, editar ou excluir abastecimentos dos veículos da sua conta — **sem distinção de permissões** entre dono e convidado.

## Experiência do Usuário

- **Personas:** o titular da conta (cadastrou o veículo) e o segundo membro convidado. Ambos têm as mesmas permissões.
- **Layout:** mobile-first, `max-w-[430px]`, fidelidade ao protótipo `FuelScreen` — Plus Jakarta Sans, paleta âmbar, shadcn/ui.
- **Fluxo principal:** Dashboard → "Abastecer" no `VehicleCard` → `/abastecimento` com veículo pré-selecionado → preencher → salvar → voltar.
- **Feedback visual:** o campo derivado deve exibir claramente o badge "calculado" para não confundir o usuário sobre o que ele está digitando; o toggle "tanque cheio" deve ter estado visual óbvio (ligado/desligado).
- **Mensagens de erro:** inline, próximas ao campo. Exemplo: "Odômetro não pode ser menor que o último registrado (142.500 km)".
- **Acessibilidade:** inputs com `label` associados, navegação por teclado funcional, contraste dentro do tema âmbar.

## Restrições Técnicas de Alto Nível

- **Autorização:** toda operação em `/api/fuelups*` deve ser escopada pela `accountId` da sessão NextAuth (já estabelecida na Fase 2). Tentativas de acesso a recursos de outra conta devem retornar 404/403.
- **Consistência de dados:** a soma de `litros × preço/litro` deve sempre bater com `total` na persistência (tolerância de arredondamento a definir na TechSpec).
- **Recálculo em cascata:** editar ou excluir um abastecimento antigo pode invalidar km/l de abastecimentos posteriores; o sistema deve recalcular deterministicamente.
- **Value Objects existentes:** `fuel-amount.vo.ts`, `fuel-price.vo.ts`, `fuel-date.vo.ts`, `kml.vo.ts`, `odometer.vo.ts` já previstos na Fase 1 — devem ser reutilizados.
- **LGPD:** fora de escopo nesta fase (não será tratado agora).
- **Performance:** o histórico é por veículo e o limite prático é pequeno (poucas centenas de lançamentos/ano, 2 veículos por conta); não há requisitos especiais de paginação ou cache nesta fase.

## Não-Objetivos (Fora de Escopo)

- **Relatórios e gráficos** (total mensal, evolução de km/l) → Fase 6.
- **Importação em lote** (CSV, planilha) — usuário registra um por um.
- **Integração com bombas, notas fiscais ou OCR** de cupom fiscal.
- **Alertas** de consumo anormal, preço alto ou intervalo longo sem abastecer.
- **Histórico compartilhado entre contas** ou exportação de dados.
- **Múltiplos combustíveis por abastecimento** (ex.: flex com mistura gasolina+etanol no mesmo evento) — o MVP trata o abastecimento como um único combustível.
- **Cálculo de km/l com tanque não cheio** — explicitamente desativado pelo toggle.
- **Suporte offline / PWA** — fora do MVP.
- **Controle granular de permissões** (ex.: só o dono edita) — todos os membros têm os mesmos direitos.

## Questões em Aberto

- **Edição do toggle "tanque cheio"**: ao alterar retroativamente o toggle de um abastecimento antigo, qual é a política de recálculo dos km/l subsequentes? (Provavelmente igual à de editar odômetro — recalcular toda a cadeia.)
- **Exclusão do abastecimento mais antigo**: se o usuário excluir o primeiro tanque cheio da história, o segundo tanque cheio perde seu km/l (não há referência anterior). Confirmar que o comportamento esperado é simplesmente deixar `km/l = null` nesse caso.
- **Arredondamento**: quantas casas decimais para litros (3?), preço/litro (3?), total (2?) e km/l (1 ou 2?) — detalhar na TechSpec.
- **Tipo de combustível** (gasolina / etanol / diesel): o protótipo não deixa claro se há um seletor. Se não houver, o km/l não distingue combustíveis — aceitável para o MVP?
- **Campo "liberado" no RF-03**: como o usuário libera um campo calculado — tocando no badge, apagando o valor, ou existe um botão explícito? Definir na TechSpec.
