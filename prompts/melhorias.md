# Plano de Melhorias — Sistema de Farmácia

## Visão Geral

Este documento consolida as melhorias planejadas para o sistema de farmácia,
priorizando funcionalidades críticas para operação de manipulados, revenda e
conformidade fiscal. Cada melhoria está categorizada por domínio funcional,
contendo objetivo, requisitos detalhados e prioridade.

## Legenda de Prioridades

- **Crítica** – bloqueia processos essenciais ou requisitos legais.
- **Alta** – impacto direto na experiência do usuário ou eficiência operacional.
- **Média** – otimização de usabilidade, performance ou funcionalidades de
  apoio.

---

### 1. Modernização de Interfaces ✅ CONCLUÍDO

| ID  | Descrição                                     | Objetivo                                                                                           | Requisitos                                                              | Prioridade | Status       |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------- | ------------ |
| 1.1 | Modernização da Página de Histórico de Vendas | Atualizar interface e funcionalidades da página de histórico, melhorando experiência de navegação. | —                                                                       | Alta       | ✅ Concluído |
| 1.2 | Refatoração da Página de Fechamento de Vendas | Modernizar interface com suporte a modo claro/escuro e otimizar performance.                       | • Tema light/dark<br/>• Melhorar usabilidade<br/>• Otimizar performance | Média      | ✅ Concluído |

**Data de Conclusão:** Janeiro 2025\
**Implementações Realizadas:**

- ✅ Página de fechamento de vendas totalmente modernizada com suporte a tema
  claro/escuro
- ✅ Hero section com gradiente suave seguindo padrões do sistema
- ✅ Componentes otimizados com React.memo, useCallback e useMemo
- ✅ Interface responsiva e acessível
- ✅ AlertDialog para confirmação de finalização
- ✅ Estados de loading aprimorados
- ✅ Componentização adequada com shadcn/ui components

### 2. Fluxo de Produtos Manipulados

| ID  | Descrição                                               | Objetivo                                                                                               | Requisitos                                                                                                                                                                                           | Prioridade | Status  |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------- |
| 2.1 | Digitação Manual de Receitas                            | Ativar funcionalidade de inserção manual de receitas (atualmente desabilitada).                        | • Remover `disabled` da aba<br/>• Criar formulário de entrada manual<br/>• Integração com fluxo de validação existente<br/>• Conectar ao sistema de salvamento                                       | Crítica    | Ausente |
| 2.2 | Fluxo de Ordem de Produção                              | Implementar fluxo completo de produção: criação → lista de produção → PDV.                             | —                                                                                                                                                                                                    | Crítica    | Parcial |
| 2.3 | PDV para Produtos Manipulados                           | Garantir que o PDV processe apenas pedidos manipulados.                                                | Fluxo: receita → produção → PDV                                                                                                                                                                      | Crítica    | Parcial |
| 2.4 | Cálculo de Densidade e Recipiente                       | Converter massa em volume usando densidade e sugerir cápsula ou frasco adequado.                       | • Campo densidade no cadastro de produto<br/>• Funções de cálculo % p/v<br/>• Tabela parametrizada de cápsulas/recipientes<br/>• Validação automática na fórmula                                     | Crítica    | Ausente |
| 2.5 | Cadastro de Formas Farmacêuticas & Processos            | Configurar formas farmacêuticas, parâmetros de rótulo, processos de produção e políticas de desconto.  | • CRUD `formas_farmaceuticas`<br/>• Tabela `forma_processos` (drag-and-drop)<br/>• Coluna JSONB `rotulo_config`<br/>• UI em abas (Geral, Rótulo, Processos)<br/>• Validação de desconto/valor mínimo | Crítica    | Ausente |
| 2.6 | Tipos de Item no PDV e Integração com Ordem de Produção | Implementar no PDV v2 um fluxo que force a seleção de tipo de venda e vinculação com Ordem de Produção | • Enum `tipo_venda` (MANIPULADO, ALOPÁTICO, etc.)<br/>• Integração com Ordens Prontas<br/>• Carrinho read-only para OPs<br/>• Rastreabilidade                                                        | Crítica    | Ausente |

### 3. Sistema de Estoque e Rastreabilidade

| ID  | Descrição                                   | Objetivo                                                                        | Requisitos                                                                                                | Prioridade | Status  |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------- | ------- |
| 3.1 | Histórico de Movimentação de Lotes          | Registrar todos os movimentos de lote e disponibilizar rastreabilidade completa | • Tabela `estoque_movimentos`<br/>• Triggers de saldo<br/>• UI de histórico<br/>• Clientes impactados     | Crítica    | Ausente |
| 3.2 | Código Interno de Lote e Sistema de Rótulos | Gerar código interno único e permitir impressão de rótulos configuráveis        | • Sequence de código<br/>• Templates HTML/CSS<br/>• Sistema de impressão<br/>• Status QUARENTENA/LIBERADO | Crítica    | Ausente |

### 4. Sistema de Produtos e Busca

| ID  | Descrição            | Objetivo                                                                | Requisitos                                                                                         | Prioridade | Status  |
| --- | -------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------- | ------- |
| 4.1 | Sistema de Sinônimos | Permitir múltiplos nomes para produtos e melhorar busca em todo sistema | • Tabela `produto_sinonimos`<br/>• Busca integrada<br/>• UI de gerenciamento<br/>• Validação única | Alta       | Ausente |

### 5. Comunicação Interna

| ID  | Descrição    | Objetivo                                                    | Requisitos                                                                                              | Prioridade | Status  |
| --- | ------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- | ------- |
| 5.1 | Chat Interno | Sistema de comunicação 1:1 em tempo real para colaboradores | • Conversas persistentes<br/>• Realtime via Supabase<br/>• Status online/offline<br/>• RLS de segurança | Média      | Ausente |

---

## Detalhes Técnicos Expandidos

### 2.6 - Tipos de Item no PDV e Integração com Ordem de Produção (CRÍTICA)

**Contexto do Print:** o sistema legado permite selecionar um **Tipo de Item**
(PRODUTO, RECEITA, DELIVERY, PBM, etc.) antes de incluir produtos no PDV. A
cliente explicou que **produtos alopáticos (revenda)** **NÃO** devem ser
vendidos por esse PDV; somente itens provenientes de **ordens de produção**
(manipulados) podem ser finalizados aqui.

**Objetivo:** implementar no PDV v2 um fluxo que:

1. Force o operador a selecionar o **Tipo de Venda** "Manipulado" (default) e
   vincular uma **Ordem de Produção** pronta.
2. Impeça a inclusão manual de produtos alopáticos; só carregar itens da ordem.
3. Grave no banco a origem da venda (OP) para rastreabilidade.
4. Mantenha compatibilidade futura para outros tipos (Delivery, PBM) mas
   inicialmente desabilitados.

**Requisitos Funcionais:**

1. **Enum `tipo_venda`** no front (e tabela) com valores iniciais:
   - `MANIPULADO` (default)
   - `ALOPATICO` (desabilitado)
   - `DELIVERY` (placeholder)
   - `PBM` (placeholder)
2. Ao selecionar `MANIPULADO`, o operador deve buscar **Ordens de Produção** com
   status `PRONTA` e filial = caixa atual.
3. Selecionada a ordem, o PDV:
   - Carrega automaticamente todos os itens (quantidade, preço já calculado).
   - Bloqueia edição de quantidade ou exclusão de itens.
   - Exibe badge "Origem: OP-{numero}" no cabeçalho.
4. Botão **Finalizar Venda** grava:
   - `vendas.tipo_venda = 'MANIPULADO'`
   - `vendas.origem_id = ordem_producao_id`
   - Itens conforme ordem.
   - Gera movimentos de estoque (tipo `VENDA`) referenciando os lotes definidos
     da OP.
5. Se o operador tentar mudar para `ALOPATICO`, mostrar toast "Venda de produto
   alopático deve ser realizada no módulo Revenda" e manter em `MANIPULADO`.
6. Para futuras fases, `DELIVERY` e `PBM` ficarão cinza com tooltip "Em breve".
7. **Permissões:** ação `PDV_VENDER_MANIPULADO` para concluir venda;
   `PDV_TROCAR_TIPO` futuro.

**Estimativa:** 8-9 horas de desenvolvimento + 1 hora de QA.

### 2.1 - Digitação Manual de Receitas (CRÍTICA)

**Estado Atual:**

- Funcionalidade existe mas está **desabilitada** na interface
- Aba "Digitação Manual" com `disabled` no `TabsTrigger`
- Mostra apenas placeholder "Esta funcionalidade estará disponível em breve"

**Infraestrutura Pronta:**

- ✅ `receitaService.ts` completo
- ✅ Interfaces `IAExtractedData` e `Medication` definidas
- ✅ Fluxo de validação implementado (`validatePrescriptionData`)
- ✅ Sistema de salvamento (`saveProcessedRecipe`)

**Implementação Necessária:**

1. **Arquivo:** `src/pages/admin/pedidos/nova-receita.tsx`
2. **Alterações:**
   - Remover `disabled` do `TabsTrigger`
   - Substituir placeholder por formulário funcional
   - Campos: paciente, medicamentos, posologia, observações
   - Validação em tempo real
   - Integração com `receitaService.processRecipe()`

**Estimativa:** 2-3 horas de desenvolvimento

### 2.4 - Cálculo de Densidade e Sugestão de Recipiente (CRÍTICA)

**Estado Atual:**

- Campo `densidade` ainda não existe no cadastro de produtos.
- Builder de fórmula não realiza conversões massa→volume nem sugere recipiente.

**Requisitos Funcionais:**

- Tornar densidade (g/mL) obrigatória para insumos encapsuláveis ou líquidos.
- Converter automaticamente massa em volume usando densidade.
- Calcular volume por dose e volume total da fórmula.
- Sugerir cápsula (#000, #00, #0, #1, #2, #3, #4, #5) ou recipiente (frasco,
  pote) conforme tabelas parametrizadas.
- (Opcional) Validar se a concentração % p/v resultante está entre os limites
  mínimo/máximo configurados.

**Estimativa:** 6-8 horas de desenvolvimento + 2 horas de QA.

### 2.5 - Cadastro de Formas Farmacêuticas e Processos (CRÍTICA)

**Estado Atual:**

- Nenhuma tabela ou UI para formas farmacêuticas existe no sistema.
- Funções de venda/produção usam dados fixos ou não consideram forma.

**Requisitos Funcionais:**

- CRUD completo de formas farmacêuticas (nome, abreviatura, tipo de uso,
  políticas de desconto).
- Configuração de processos de produção por forma (ordem, nome, tipo, ponto de
  controle) com drag-and-drop.
- Parâmetros de rótulo (JSONB `rotulo_config`) com opções descritas no print do
  sistema legado.
- Aplicar desconto máximo e valor mínimo no PDV conforme forma.
- Integração com Builder de Fórmula para definir regras de cálculo.

**Estimativa:** 8-10 horas de desenvolvimento + 2 horas de QA.

### 3.1 - Histórico de Movimentação de Lotes e Rastreabilidade (CRÍTICA)

**Estado Atual:**

- Existe a tabela `lotes`, porém sem rastreabilidade detalhada nem saldo
  acumulado.
- Movimentos de estoque são registrados de forma parcial (apenas entrada via
  importação de NF-e) e não existe tela de histórico.
- Ausência de mecanismo para identificar rapidamente clientes impactados por um
  lote específico.

**Requisitos Funcionais:**

1. Registrar **todos** os movimentos que alterem a quantidade de um lote
   (COMPRA, PRODUÇÃO, VENDA/ATENDIMENTO, ESTORNO, TRANSFERÊNCIA, AJUSTE, PERDA,
   INVENTÁRIO).
2. Atualizar o **saldo atual** do lote em tempo real e impedir saldo negativo.
3. Disponibilizar tela "Histórico" no caminho `/admin/estoque/lotes/[id]`
   mostrando:
   - Data/hora
   - Tipo de movimento (cores: verde = entrada, cinza = saída, vermelho =
     estorno)
   - Documento de origem (NF-e, venda, ordem de produção, ajuste)
   - Usuário/filial
   - Quantidade (+/-) e saldo acumulado
   - Observação (livre)
4. Filtros por intervalo de datas, tipo de movimento e filial; paginação
   server-side.
5. Botão "Clientes Impactados" que lista todas as vendas que consumiram unidades
   do lote, exibindo dados de contato e quantidade enviada.
6. Exportação CSV/PDF tanto do histórico quanto da lista de clientes.
7. **Permissões:** módulo `ESTOQUE`, ação `VISUALIZAR_HISTORICO_LOTE`; somente
   gerentes podem estornar movimentos.
8. Auditoria completa (`created_at`, `created_by`, `updated_at`).

**Estimativa:** 12-14 horas de desenvolvimento + 2 horas de QA + 1 hora
documentação.

### 3.2 - Código Interno de Lote e Sistema de Rótulos (CRÍTICA)

**Justificativa:** o código de lote presente no XML do fornecedor é genérico e
dificulta rastreabilidade; além disso, rótulos físicos são obrigatórios para
potes e frascos conforme RDC 67/2007. Precisamos gerar um **código interno
único**, manter status do lote (QUARENTENA → LIBERADO) e permitir rótulos
configuráveis/impressão integrada.

**Requisitos Funcionais:**

1. Gerar **codigo_interno** exclusivo no momento da criação do lote (importação
   NF-e ou produção).\
   • Formato sugerido: `LA-YYYYMMDD-######` (sequência global).
2. Status inicial do lote = `QUARENTENA`; alteração manual para `LIBERADO` após
   CQ.
3. Sistema de **templates de rótulo** (HTML+CSS).
4. Impressão automática opcional logo após criação ou manual via UI.
5. Histórico de impressões (auditável).
6. Placeholder obrigatório no template para **codigo_interno**,
   **codigo_barras** (Code-128) e **status**.

**Estimativa:** 9-10 h desenvolvimento + 1,5 h QA + 0,5 h documentação.

### 4.1 - Sistema de Sinônimos (ALTA)

**Estado Atual:**

- Tela de produtos não possui aba ou tabela de sinônimos.
- Buscas por produto consideram apenas o nome oficial.

**Requisitos Funcionais:**

- Permitir vincular múltiplos nomes sinônimos a um produto (1-N).
- Sinônimo deve ser único globalmente — não pode referenciar dois produtos.
- Flag **ativo/inativo** para possibilitar desativação sem excluir histórico.
- Busca em qualquer módulo (estoque, fórmula, PDV) deve retornar o produto
  oficial quando o termo corresponder ao sinônimo.
- Auditoria completa: `created_at`, `updated_at`, `created_by`.
- Permissões: somente usuários com nível TOTAL no módulo Produtos podem
  criar/editar/remover sinônimos.

**Infraestrutura Necessária:**

1. **Migration Supabase** criando tabela `produto_sinonimos`:
   ```sql
   create table produto_sinonimos (
     id uuid primary key default gen_random_uuid(),
     produto_id uuid references produtos(id) on delete cascade,
     nome text not null,
     ativo boolean not null default true,
     created_at timestamptz default now(),
     updated_at timestamptz default now(),
     created_by uuid references usuarios(id),
     constraint produto_sinonimos_nome_unique unique (lower(nome))
   );
   ```
   - Trigger `set_updated_at`.
   - Políticas RLS: leitura para todos; escrita apenas para roles
     `editor_produtos`.
   - Índice GIN `gin_trgm_ops` em `lower(nome)` para buscas.
2. **Tipos TypeScript** gerados (`database.ts`) + interface `ProdutoSinonimo`.
3. **Edge Function (opcional)** `gerenciar-sinonimos` com CRUD + validações Zod.
4. **Hooks / Services**
   - `useSinonimos(produtoId)` para listar e mutar via React Query.
   - Ajustar `estoqueService.searchProdutos(term)` para incluir join com
     sinônimos.
5. **UI**
   - Aba "Sinônimos" no formulário de produto.
   - DataTable shadcn/ui com colunas Nome, Ativo, Ações.
   - Dialog "Novo Sinônimo" + "Editar Sinônimo" (nome + switch ativo).
   - Filtros: Todos / Ativos / Inativos.
6. **Testes**
   - Unitários: validações Zod, utilidade de busca.
   - Integração: Edge Function CRUD.
   - e2e: Buscar por sinônimo → adicionar no PDV → verificar que estoque
     registra produto oficial.

**Passos de Implementação:**

1. Criar migration Supabase e aplicar.
2. Regenerar tipos TypeScript.
3. Implementar hook/service + teste unitário.
4. Desenvolver UI da aba Sinônimos.
5. Ajustar buscas no sistema (estoque, PDV, fórmula).
6. (Opcional) Implementar Edge Function CRUD.

**Estimativa:** 9-10 horas de desenvolvimento + 1 hora de QA.

### 3.2 - Código Interno de Lote e Sistema de Rótulos (CRÍTICA)

**Justificativa:** o código de lote presente no XML do fornecedor é genérico e
dificulta rastreabilidade; além disso, rótulos físicos são obrigatórios para
potes e frascos conforme RDC 67/2007. Precisamos gerar um **código interno
único**, manter status do lote (QUARENTENA → LIBERADO) e permitir rótulos
configuráveis/impressão integrada.

**Requisitos Funcionais:**

1. Gerar **codigo_interno** exclusivo no momento da criação do lote (importação
   NF-e ou produção).\
   • Formato sugerido: `LA-YYYYMMDD-######` (sequência global).
2. Status inicial do lote = `QUARENTENA`; alteração manual para `LIBERADO` após
   CQ.
3. Sistema de **templates de rótulo** (HTML+CSS).
4. Impressão automática opcional logo após criação ou manual via UI.
5. Histórico de impressões (auditável).
6. Placeholder obrigatório no template para **codigo_interno**,
   **codigo_barras** (Code-128) e **status**.

**Infraestrutura Necessária:**

1. **DDL — Lotes & Sequência**
   ```sql
   -- Sequence global
   create sequence if not exists lote_codigo_seq;

   alter table lotes
     add column if not exists codigo_interno text unique,
     add column if not exists status varchar(20) not null default 'QUARENTENA';

   create or replace function gerar_codigo_lote_interno()
   returns trigger language plpgsql as $$
   declare
     seq int;
   begin
     select nextval('lote_codigo_seq') into seq;
     new.codigo_interno := concat('LA-', to_char(now(), 'YYYYMMDD'), '-', lpad(seq::text, 6, '0'));
     return new;
   end;$$;

   create trigger tg_codigo_interno
     before insert on lotes
     for each row execute function gerar_codigo_lote_interno();
   ```
2. **Tabela `rotulo_templates`**
   ```sql
   create table rotulo_templates (
     id uuid primary key default gen_random_uuid(),
     nome text not null,
     largura_mm int not null,
     altura_mm int not null,
     html_template text not null,
     css text,
     ativo boolean default true,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   ```
3. **Tabela `rotulo_impressoes`**
   ```sql
   create table rotulo_impressoes (
     id uuid primary key default gen_random_uuid(),
     lote_id uuid references lotes(id) on delete cascade,
     template_id uuid references rotulo_templates(id),
     usuario_id uuid references usuarios(id),
     quantidade int not null,
     impresso_em timestamptz default now()
   );
   ```
4. **View `lote_rotulo_dados`** (join lotes + produtos + fornecedores) para
   alimentar templates.

**Edge Functions:**

| Função              | Método | Descrição                                                                              |
| ------------------- | ------ | -------------------------------------------------------------------------------------- |
| `gerar-rotulo-lote` | POST   | Entrada `{ lote_id, template_id, quantidade }` → devolve PDF/ZPL + registra impressão. |
| `listar-templates`  | GET    | Retorna templates ativos para UI.                                                      |
| `crud-template`     | POST   | CRUD de `rotulo_templates` (restrito a perfis gerentes).                               |

Todas em Deno, validação Zod, CORS, logs estruturados, geração PDF via `pdf-lib`
ou `puppeteer`.

**Hooks / Services (React Query):**

- `useRotuloTemplates()` – lista/adiciona/edita templates.
- `useGerarRotulo(loteId, templateId, qtd)` – dispara impressão.
- `useHistoricoImpressoes(loteId)` – consulta `rotulo_impressoes`.

**UI / UX:**

1. **Admin › Configurações › Rótulos**\
   • DataGrid templates (nome, dimensões, ativo).\
   • Editor visual (HTML/CSS) com preview em tempo real usando lote de teste.
2. **Tela de Lote**\
   • Aba "Rótulos": select template, campo quantidade, botão **Gerar &
   Imprimir**.\
   • Badge mostra `codigo_interno` e `status`.\
   • Tabela de histórico de impressões.
3. **Impressão**\
   • Opção PDF (desktop) ou ZPL (térmica).\
   • Config flag "impressão automática após criação do lote".

**Integrações:**

| Momento                                   | Ação                                                      |
| ----------------------------------------- | --------------------------------------------------------- |
| Importação NF-e                           | Trigger gera `codigo_interno`; se flag on → gerar rótulo. |
| Conclusão de Ordem de Produção            | Cria lote, gera `codigo_interno`, opcionalmente imprime.  |
| Mudança de Status `QUARENTENA → LIBERADO` | Permite reimpressão sem a tag [QUARENTENA] no texto.      |

**Testes:**

1. Unitários – função PL/pgSQL de código, renderização Handlebars.
2. Integração – Edge gera PDF, registra `rotulo_impressoes`.
3. E2E – usuário importa NF-e → lote criado → rótulo gerado e impresso.

**Estimativa:** 9-10 h desenvolvimento + 1,5 h QA + 0,5 h documentação.

---

## Cronograma de Implementação

| Fase                             | Melhorias                              | Justificativa                                    | Status              |
| -------------------------------- | -------------------------------------- | ------------------------------------------------ | ------------------- |
| **~~Fase 0 – Modernização~~** ✅ | ~~1.1, 1.2~~                           | ~~Modernização de interfaces e UX~~              | ✅ **CONCLUÍDO**    |
| **Fase 1 – Crítica** 🔄          | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2 | Conformidade legal e fluxo de produção completo. | 🔄 **EM ANDAMENTO** |
| **Fase 2 – Alta Prioridade**     | 4.1                                    | Sistema de busca e sinônimos para produtos.      | ⏳ Pendente         |
| **Fase 3 – Média Prioridade**    | 5.1                                    | Chat interno e comunicação entre colaboradores.  | ⏳ Pendente         |

**📋 PRÓXIMOS PASSOS:** Com a modernização de interfaces concluída, agora
focaremos no **Fluxo de Produtos Manipulados** (Fase 1 - Crítica), que é
fundamental para a operação farmacêutica.

---

## Detalhes Técnicos de Implementação

### 2.2 - Digitação Manual de Receitas (CRÍTICA)

**Estado Atual:**

- Funcionalidade existe mas está **desabilitada** na interface
- Aba "Digitação Manual" com `disabled` no `TabsTrigger`
- Mostra apenas placeholder "Esta funcionalidade estará disponível em breve"

**Infraestrutura Pronta:**

- ✅ `receitaService.ts` completo
- ✅ Interfaces `IAExtractedData` e `Medication` definidas
- ✅ Fluxo de validação implementado (`validatePrescriptionData`)
- ✅ Sistema de salvamento (`saveProcessedRecipe`)

**Implementação Necessária:**

1. **Arquivo:** `src/pages/admin/pedidos/nova-receita.tsx`
2. **Alterações:**
   - Remover `disabled` do `TabsTrigger`
   - Substituir placeholder por formulário funcional
   - Campos: paciente, medicamentos, posologia, observações
   - Validação em tempo real
   - Integração com `receitaService.processRecipe()`

**Estimativa:** 2-3 horas de desenvolvimento

### 2.4 - Cálculo de Densidade e Sugestão de Recipiente (CRÍTICA)

**Estado Atual:**

- Campo `densidade` ainda não existe no cadastro de produtos.
- Builder de fórmula não realiza conversões massa→volume nem sugere recipiente.

**Requisitos Funcionais:**

- Tornar densidade (g/mL) obrigatória para insumos encapsuláveis ou líquidos.
- Converter automaticamente massa em volume usando densidade.
- Calcular volume por dose e volume total da fórmula.
- Sugerir cápsula (#000, #00, #0, #1, #2, #3, #4, #5) ou recipiente (frasco,
  pote) conforme tabelas parametrizadas.
- (Opcional) Validar se a concentração % p/v resultante está entre os limites
  mínimo/máximo configurados.

**Infraestrutura Necessária:**

1. Migration Supabase adicionando `densidade NUMERIC NOT NULL` à tabela
   `produtos`.
2. Tabelas auxiliares:
   - `capsulas` (numero, volume_ml)
   - `recipientes` (id, descricao, volume_ml)
3. Biblioteca `lib/formulas-utils.ts` com funções puras:
   - `calcVolume(massa_g, densidade)`
   - `suggestCapsuleSize(volume_ml)`
   - `suggestRecipient(volume_total_ml)`
4. Edge Function `sugerir-recipiente` consumindo as funções acima para validação
   server-side.
5. Atualizar `InsumoForm` para campo obrigatórios de densidade.
6. Atualizar builder de fórmula (`nova`, `editar`) para exibir volume calculado,
   sugestão de recipiente e alertas.

**Passos de Implementação:**

1. Criar a migration Supabase.
2. Atualizar interfaces TypeScript (`Produto`, hooks de estoque).
3. Implementar e testar utilidades de cálculo.
4. Desenvolver a Edge Function e testes de integração.
5. Ajustar UI de cadastro de produto.
6. Integrar cálculo em tempo real na tela de fórmula.
7. Adicionar alertas/bloqueios caso densidade esteja ausente.

**Estimativa:** 6-8 horas de desenvolvimento + 2 horas de QA.

### 2.5 - Cadastro de Formas Farmacêuticas e Processos (CRÍTICA)

**Estado Atual:**

- Nenhuma tabela ou UI para formas farmacêuticas existe no sistema.
- Funções de venda/produção usam dados fixos ou não consideram forma.

**Requisitos Funcionais:**

- CRUD completo de formas farmacêuticas (nome, abreviatura, tipo de uso,
  políticas de desconto).
- Configuração de processos de produção por forma (ordem, nome, tipo, ponto de
  controle) com drag-and-drop.
- Parâmetros de rótulo (JSONB `rotulo_config`) com opções descritas no print do
  sistema legado.
- Aplicar desconto máximo e valor mínimo no PDV conforme forma.
- Integração com Builder de Fórmula para definir regras de cálculo.

**Infraestrutura Necessária:**

1. Migration Supabase criando:
   - `formas_farmaceuticas` (colunas principais + `rotulo_config` JSONB NOT NULL
     DEFAULT '{}').
   - `forma_processos` (id, forma_id FK ON DELETE CASCADE, ordem SMALLINT,
     nome_processo TEXT, tipo_processo ENUM, ponto_controle BOOLEAN DEFAULT
     FALSE).
   - Triggers automáticos `updated_at`, auditoria, RLS completa.
2. Enum `tipo_processo` com valores iniciais: `PRODUCAO`, `QUALIDADE`,
   `LOGISTICA`.
3. Geração de tipos TypeScript via Supabase.
4. Lib `forma-utils.ts` fornecendo funções:
   - `getForma(id)` → busca + parse de JSONB.
   - `aplicarPoliticasVenda(forma, venda)`.
5. Edge Function `gerenciar-formas-farmaceuticas` (CRUD + processos) usando
   padrão Deno.
6. UI Admin `/admin/cadastros/formas-farmaceuticas`:
   - Lista com busca/filtros.
   - Formulário em abas (Geral, Rótulo, Processos).
   - Tabela de processos com reordenação.
7. Testes:
   - Unitários (utils, validações Zod).
   - Integração (Edge Function CRUD).
   - e2e (criar forma → aplicar no PDV, verificar desconto).

**Passos de Implementação:**

1. Criar migration Supabase.
2. Atualizar tipos gerados (`database.ts`).
3. Implementar lib utilitária + testes.
4. Desenvolver Edge Function + testes.
5. Construir interface admin.
6. Refatorar PDV e Builder de Fórmula para consumir a nova forma.

**Estimativa:** 8-10 horas de desenvolvimento + 2 horas de QA.

### 3.1 - Histórico de Movimentação de Lotes e Rastreabilidade (CRÍTICA)

**Estado Atual:**

- Existe a tabela `lotes`, porém sem rastreabilidade detalhada nem saldo
  acumulado.
- Movimentos de estoque são registrados de forma parcial (apenas entrada via
  importação de NF-e) e não existe tela de histórico.
- Ausência de mecanismo para identificar rapidamente clientes impactados por um
  lote específico.

**Requisitos Funcionais:**

1. Registrar **todos** os movimentos que alterem a quantidade de um lote
   (COMPRA, PRODUÇÃO, VENDA/ATENDIMENTO, ESTORNO, TRANSFERÊNCIA, AJUSTE, PERDA,
   INVENTÁRIO).
2. Atualizar o **saldo atual** do lote em tempo real e impedir saldo negativo.
3. Disponibilizar tela "Histórico" no caminho `/admin/estoque/lotes/[id]`
   mostrando:
   - Data/hora
   - Tipo de movimento (cores: verde = entrada, cinza = saída, vermelho =
     estorno)
   - Documento de origem (NF-e, venda, ordem de produção, ajuste)
   - Usuário/filial
   - Quantidade (+/-) e saldo acumulado
   - Observação (livre)
4. Filtros por intervalo de datas, tipo de movimento e filial; paginação
   server-side.
5. Botão "Clientes Impactados" que lista todas as vendas que consumiram unidades
   do lote, exibindo dados de contato e quantidade enviada.
6. Exportação CSV/PDF tanto do histórico quanto da lista de clientes.
7. **Permissões:** módulo `ESTOQUE`, ação `VISUALIZAR_HISTORICO_LOTE`; somente
   gerentes podem estornar movimentos.
8. Auditoria completa (`created_at`, `created_by`, `updated_at`).

**Infraestrutura Necessária:**

1. **Tabelas & Enums**
   ```sql
   create type tipo_movimento_lote as enum
     ('COMPRA','PRODUCAO','VENDA','ESTORNO','TRANSFERENCIA','AJUSTE','PERDA','INVENTARIO');

   create table estoque_movimentos (
     id uuid primary key default gen_random_uuid(),
     lote_id uuid references lotes(id) on delete cascade,
     tipo tipo_movimento_lote not null,
     quantidade numeric(18,3) not null check (quantidade <> 0),
     documento_origem text,                -- NF, OP, Venda, etc.
     filial_id uuid references filiais(id),
     usuario_id uuid references usuarios(id),
     observacao text,
     created_at timestamptz default now(),
     constraint estoque_movimentos_quantidade_sign check (
       (tipo in ('COMPRA','PRODUCAO','ESTORNO') and quantidade > 0) or
       (tipo in ('VENDA','TRANSFERENCIA','AJUSTE','PERDA','INVENTARIO') and quantidade < 0)
     )
   );
   ```
2. **Triggers**
   - `tg_atualiza_saldo_lote` → ao inserir movimento, soma `quantidade` em
     `lotes.saldo_atual`.
   - Validação de saldo negativo (raise exception).
   - `tg_set_updated_at` padrão.
3. **Views**
   - `historico_lote` (SELECT * FROM estoque_movimentos WHERE lote_id = $1 ORDER
     BY created_at).
   - `clientes_por_lote` une `estoque_movimentos` (tipo='VENDA') → `vendas` →
     `clientes`.
4. **RLS**
   - Leitura: usuários com permissão no módulo ESTOQUE.
   - Escrita: somente funções Edge autenticadas (safety-by-design).
5. **Índices**
   - B-Tree em `(lote_id, created_at)` para histórico.
   - B-Tree em `(documento_origem)` para buscas.

**Edge Functions:**

| Função                     | Método | Descrição                                                     |
| -------------------------- | ------ | ------------------------------------------------------------- |
| `registrar-movimento-lote` | POST   | Valida input, insere em `estoque_movimentos`, retorna saldo.  |
| `consultar-historico-lote` | GET    | Lista paginada/filtrada do histórico.                         |
| `clientes-por-lote`        | GET    | Retorna clientes impactados com dados de contato.             |
| `estornar-movimento-lote`  | POST   | Cria movimento inverso (tipo ESTORNO), exige permissão extra. |

Todas usando padrão Deno, validações Zod, CORS controlado e logs estruturados.

**Hooks / Services (React Query):**

- `useHistoricoLote(loteId, filtros)` – GET.
- `useClientesPorLote(loteId)` – GET.
- `useRegistrarMovimento()` – POST; usado internamente por módulos PDV,
  Produção, Ajustes.
- `useEstornarMovimento()` – POST, visível apenas a gerentes.

**UI / UX:**

1. **Admin › Estoque › Lotes › Detalhe**
   - Adicionar aba `Histórico` com DataGrid virtualizado.
   - Coluna saldo calculada em tempo real (cumulativo ou direto da view).
   - Tooltip com observação completa ao passar o mouse.
2. **Modal Clientes Impactados**
   - Tabela com nome, documento, telefone, e-mail, quantidade.
   - Botões "Exportar CSV" e "Copiar E-mails".
3. **Design Tokens**
   - Cores alinhadas ao tema Tailwind.
   - Ícone ↗ para estorno.
4. **Acessibilidade**
   - `aria-live` em toasts de erro.
   - Navegação por teclado em DataGrid.

**Integrações com Fluxos Existentes:**

| Evento                                | Ação                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| Importação NF-e (`importacao-nf.tsx`) | `COMPRA` + saldo positivo inicial.                         |
| Produção (Ordem Finalizada)           | `PRODUCAO` + saldo positivo no lote produzido.             |
| PDV (`vendas-operations`)             | Para cada item → seleciona lote (FIFO) → `VENDA` negativa. |
| Estorno de Venda                      | `ESTORNO` positiva vinculada à venda original.             |
| Ajuste Manual                         | `AJUSTE` negativo/positivo via UI de ajuste de estoque.    |

**Testes:**

1. **Unitários** – triggers (`saldo_atual`), validações Zod de Edge Functions.
2. **Integração** – cenário completo: compra → venda → estorno; verificar
   saldo 0.
3. **E2E (Playwright)** – usuário navega ao histórico, filtra, exporta CSV.

**Estimativa:** 12-14 horas de desenvolvimento + 2 horas de QA + 1 hora
documentação.

---

## Observações Importantes

- **Conformidade Legal:** itens relacionados a nota fiscal e rastreabilidade são
  obrigatórios por exigências sanitárias e fiscais.
- **Fluxo de Manipulados:** ordem de produção → manipulação → PDV deve funcionar
  de forma integrada.
- **Rastreabilidade:** o sistema de lotes e rótulos é crítico para segurança dos
  pacientes.
- **Experiência do Cliente:** pré-vendas e delivery atendem necessidades
  específicas do negócio farmacêutico.

---

_Última atualização: 2025-01-31_

_Versão: 3.1.0 - Numeração reorganizada e estrutura corrigida_
