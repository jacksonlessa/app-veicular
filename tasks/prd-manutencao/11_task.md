---
status: completed
parallelizable: false
blocked_by: ["9.0", "10.0"]
---

<task_context>
<domain>docs</domain>
<type>documentation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies></dependencies>
</task_context>

# Tarefa 11.0: Smoke test manual + `validation.md`

## Visão Geral

Executa o smoke test end-to-end da feature completa no browser e documenta os resultados em `tasks/prd-manutencao/validation.md`. Segue o padrão do `validation.md` da Fase 4.

<requirements>
- Smoke test cobre todos os fluxos principais do PRD
- Documento `validation.md` com resultado de cada cenário (PASS/FAIL) e observações
- Listar tech debt ou desvios do protótipo identificados durante o teste
- Nenhum cenário crítico pode estar em FAIL para considerar a fase concluída
</requirements>

## Subtarefas

- [ ] 11.1 Executar o app localmente (`npm run dev`)
- [ ] 11.2 Executar smoke test completo seguindo os cenários abaixo
- [ ] 11.3 Criar `tasks/prd-manutencao/validation.md` com resultado de cada cenário
- [ ] 11.4 Marcar tasks.md com todos os checkboxes concluídos

## Cenários do Smoke Test

### Criação
- [ ] Acessar `/manutencao?vehicleId=X` — formulário carrega com veículo pré-selecionado e 1 item inicial
- [ ] Preencher data, adicionar 3 itens — subtotal de cada item e total do rodapé atualizam em tempo real
- [ ] Tentar submeter sem itens — erro de validação visível
- [ ] Submeter formulário válido — redireciona para `/veiculos/X?tab=manutencao`

### Histórico
- [ ] Aba "Manutenções" exibe manutenção recém-criada
- [ ] Card colapsado mostra data, descrição e total correto
- [ ] Expandir card mostra itens com quantidades, valores e subtotais corretos

### Edição
- [ ] Clicar "Editar" — abre `/manutencao/[id]` com todos os campos preenchidos
- [ ] Remover um item, adicionar outro — total atualiza
- [ ] Salvar — retorna para aba com dados atualizados

### Exclusão
- [ ] Clicar "Excluir" — confirmação inline aparece
- [ ] Confirmar — manutenção removida da lista sem reload

### Odômetro
- [ ] Criar manutenção com odômetro maior que o atual — `currentOdometer` do veículo atualiza no dashboard
- [ ] Criar manutenção sem odômetro — `currentOdometer` do veículo não muda

### Estado vazio
- [ ] Remover todas as manutenções — `EmptyState` exibido com CTA "Registrar manutenção"

### Botão VehicleCard
- [ ] Botão "Manutenção" no card do dashboard navega para `/manutencao?vehicleId=X`

### Segurança
- [ ] Tentar acessar `/api/maintenances/[id]` de outro account — retorna 403

## Critérios de Sucesso

- Todos os cenários críticos marcados como PASS no `validation.md`
- `validation.md` criado em `tasks/prd-manutencao/validation.md`
- Tech debt documentado (mesmo que vazio)
