# Manual – Como Criar uma Nova Ordem de Produção

> Versão: 2025-06-27\
> Módulo: Produção\
> Pré-requisitos: permissões no módulo **PRODUÇÃO** (ação _CRIAR_)

---

## 1. Conceitos-chave

| Termo         | Definição rápida                                                          |
| ------------- | ------------------------------------------------------------------------- |
| **OP**        | Ordem de Produção – conjunto de instruções para manipular um medicamento  |
| **Insumo**    | Matéria-prima utilizada na fórmula                                        |
| **Embalagem** | Recipiente/cápsula onde o produto será acondicionado                      |
| **Etapa**     | Fase do processo produtivo (ex.: Pesagem, Mistura, Controle de Qualidade) |
| **CQ**        | Controle de Qualidade – testes que liberam ou reprovam a OP               |

---

## 2. Fluxo Resumido

1. **Cadastro** → tela _Nova Ordem de Produção_ (`/admin/producao/nova`).
2. **Produção** → operadores avançam status _pendente → em_preparacao →
   em_manipulacao_.
3. **Controle de Qualidade** → farmacêutico registra testes
   (aprovado/reprovado).
4. **Finalização** → status _finalizada_ libera a OP para PDV.
5. **Venda** → PDV v2 busca OP pronta (tipo_venda = MANIPULADO).

---

## 3. Passo a Passo no Sistema

### 3.1 Abrir a tela "Nova OP"

1. Menu lateral → _Produção_ → botão **+ Nova Ordem**.
2. Página divide-se em 4 etapas (wizard no topo):
   1. Informações Básicas
   2. Insumos
   3. Embalagens
   4. Etapas de Produção

### 3.2 Informações Básicas

| Campo                      | Observações                                              |
| -------------------------- | -------------------------------------------------------- |
| Pedido Relacionado         | Opcional. Puxa pedidos _aprovado_ do módulo Atendimento. |
| Prioridade                 | Baixa / Normal / Alta / Urgente                          |
| Data Prevista de Entrega   | Visível no dashboard.                                    |
| Responsável                | Usuário interno que coordenará a OP.                     |
| Farmacêutico Responsável   | Obrigatório para CQ.                                     |
| Forma Farmacêutica         | Ex.: Cápsula, Pomada.                                    |
| Quantidade Total + Unidade | Ex.: 100, cápsulas                                       |
| Tempo & Custo Estimados    | Opcional, alimenta indicadores.                          |
| Observações / Instruções   | Texto livre.                                             |

Clique **Próximo**.

### 3.3 Insumos

1. Botão **Adicionar Insumo** abre linha de seleção.
2. Selecione insumo → informe quantidade & unidade.
3. Campo "Observações" é opcional.
4. Repita para todos os insumos.

### 3.4 Embalagens

Mesma lógica dos insumos — escolha embalagem/cápsula adequada.

### 3.5 Etapas

1. Por padrão há "Preparação". Edite ou adicione novas.
2. Cada etapa precisa: número, nome, tempo estimado, descrição.
3. A ordem numérica define sequência exibida no dashboard.

### 3.6 Salvar

• Clique **Criar Ordem**.\
• O sistema gera `numero_ordem` automático (ex.: OP-2025-005).\
• Você é redirecionado para **Produção › Central Operacional**.

---

## 4. Acompanhar e Avançar Status

| Status                              | Quem altera  | Ação na UI                                        |
| ----------------------------------- | ------------ | ------------------------------------------------- |
| pendente → em_preparacao            | Operador     | Botão **Iniciar Preparação** na lista ou detalhes |
| em_preparacao → em_manipulacao      | Operador     | **Iniciar Manipulação**                           |
| em_manipulacao → controle_qualidade | Operador     | **Enviar para CQ**                                |
| controle_qualidade → finalizada     | Farmacêutico | **Aprovar Ordem** após todos testes aprovados     |
| Qualquer fase → cancelada           | Gerente      | **Cancelar** via menu …                           |

Cada mudança gera registro em **Histórico de Status**.

---

## 5. Controle de Qualidade (CQ)

1. Na tela de detalhes, clique **Controle de Qualidade**.
2. "Novo Teste" → preencha Tipo, Resultado (pendente/aprovado/reprovado),
   valores esperado/obtido e responsável.
3. Todos os testes precisam estar **Aprovados** para liberar a OP.
4. Reprovado → botão **Reprovar Ordem** altera status para cancelada.

---

## 6. Integração com PDV v2

1. No PDV, selecione **Tipo de Venda = MANIPULADO**.
2. Pesquise a OP finalizada; itens são carregados automaticamente (read-only).
3. Concluir venda gera movimentos de estoque e vincula `vendas.origem_id` à OP.

---

## 7. Modelagem de Dados (Resumo)

```
ordens_producao
ordem_producao_insumos        ← FK ordem_producao_id
ordem_producao_embalagens     ← FK ordem_producao_id
ordem_producao_etapas         ← FK ordem_producao_id
ordem_producao_qualidade      ← FK ordem_producao_id
historico_status_ordens       ← FK ordem_producao_id
```

Cada tabela possui gatilho `set_updated_at` + RLS habilitado.

---

## 8. Dicas de Teste Rápido

| Ação                  | Comando SQL (↗Supabase SQL editor)                                    |
| --------------------- | --------------------------------------------------------------------- |
| Contar OPs            | `SELECT count(*) FROM ordens_producao;`                               |
| Limpar OPs            | `DELETE FROM ordens_producao WHERE TRUE;`                             |
| Ver insumos de uma OP | `SELECT * FROM ordem_producao_insumos WHERE ordem_producao_id = '…';` |

---

## 9. Referências

• Página _Produção › Nova OP_ (src/pages/admin/producao/nova.tsx)\
• Edge-function padrão para CQ: _supabase/functions/…_\
• Migrations: `20250627_criar_tabelas_ordem_producao_relacionadas.sql`

---

> Documento gerado automaticamente após implantação do fluxo completo.
