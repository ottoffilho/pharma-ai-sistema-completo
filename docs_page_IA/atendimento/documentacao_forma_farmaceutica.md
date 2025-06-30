# Documentação – Módulo de Formas Farmacêuticas

> Versão: 2025-01-31\
> Status do módulo: 95% concluído (production-ready)\
> Público-alvo: Farmacêuticos, operadores de produção, gerentes e time de
> suporte

---

## 1. Visão Geral

O módulo **Formas Farmacêuticas** gerencia todos os tipos de apresentações de
medicamentos manipulados que a farmácia produz (cápsulas, pomadas, soluções,
xaropes, etc.). É o núcleo que define como cada medicamento será produzido,
embalado e rotulado.

**Objetivos principais:**

1. Padronizar processos de produção para cada forma farmacêutica.
2. Configurar rótulos personalizados por tipo de apresentação.
3. Definir sequências de produção com pontos de controle de qualidade.
4. Integrar com módulos de Produção, Estoque e PDV para fluxo completo.

---

## 2. Estrutura de Páginas

| Rota                                                | Componente                    | Descrição Resumida                        |
| --------------------------------------------------- | ----------------------------- | ----------------------------------------- |
| `/admin/cadastros/formas-farmaceuticas`             | `FormasFarmaceuticasPage`     | Lista todas as formas com filtros e busca |
| `/admin/cadastros/formas-farmaceuticas/nova`        | `NovaFormaFarmaceuticaPage`   | Criação de nova forma farmacêutica        |
| `/admin/cadastros/formas-farmaceuticas/[id]`        | `DetalhesFormaFarmaceutica`   | Visualização completa da forma            |
| `/admin/cadastros/formas-farmaceuticas/[id]/editar` | `EditarFormaFarmaceuticaPage` | Edição de forma existente                 |

---

## 3. Fluxo "Nova Forma Farmacêutica" (🏷️ _Core do Módulo_)

### 3.1 Informações Gerais

1. **Nome** – identificação principal (ex: "Cápsula", "Pomada", "Solução Oral")
2. **Abreviatura** – código curto para relatórios (ex: "CAPS", "POM", "SOL")
3. **Tipo de Uso** – via de administração:
   - Oral
   - Tópico
   - Injetável
   - Nasal
   - Oftálmico
   - Vaginal
   - Retal
4. **Descrição** – detalhes técnicos e características especiais
5. **Controles Comerciais:**
   - **Desconto Máximo (%)** – limite para vendas
   - **Valor Mínimo (R$)** – preço base para esta forma
6. **Status Ativo** – define se está disponível para uso

### 3.2 Processos de Produção

Cada forma farmacêutica possui uma sequência específica de processos:

| Campo                        | Descrição                         | Exemplo                    |
| ---------------------------- | --------------------------------- | -------------------------- |
| **Nome do Processo**         | Identificação da etapa            | "Pesagem de Insumos"       |
| **Tipo**                     | PRODUCAO / QUALIDADE / LOGISTICA  | PRODUCAO                   |
| **Ordem**                    | Sequência numérica (define fluxo) | 1, 2, 3...                 |
| **Tempo Estimado (min)**     | Duração prevista                  | 30                         |
| **Ponto de Controle**        | Se requer validação obrigatória   | Sim/Não                    |
| **Instruções**               | Procedimento detalhado            | "Pesar com precisão ±0,1g" |
| **Equipamentos Necessários** | Lista de equipamentos (array)     | ["Balança", "Espátula"]    |

**Exemplo de Sequência para Cápsulas:**

1. Pesagem de Insumos (PRODUCAO) ⚠️ _Ponto de Controle_
2. Mistura Homogênea (PRODUCAO)
3. Encapsulação (PRODUCAO)
4. Teste de Peso Médio (QUALIDADE) ⚠️ _Ponto de Controle_
5. Rotulagem (LOGISTICA)
6. Embalagem Final (LOGISTICA)

### 3.3 Configuração de Rótulos

Sistema de switches para definir quais informações aparecem no rótulo:

| Opção                    | Quando Usar                           | Exemplo de Exibição       |
| ------------------------ | ------------------------------------- | ------------------------- |
| **Concentração**         | Formas com princípio ativo mensurável | "Paracetamol 500mg"       |
| **Posologia**            | Instruções de uso são relevantes      | "Tomar 1 cápsula de 8/8h" |
| **Volume**               | Líquidos (soluções, xaropes)          | "Frasco 100mL"            |
| **Área de Aplicação**    | Uso tópico                            | "Aplicar na pele afetada" |
| **Sabor**                | Medicamentos palatáveis               | "Sabor Morango"           |
| **Via de Administração** | Injetáveis e formas especiais         | "Via Intramuscular"       |

> **Resultado:** Rótulos personalizados e padronizados conforme o tipo de forma
> farmacêutica.

---

## 4. Listagem e Busca

### 4.1 Filtros Disponíveis

- **Status:** Ativo/Inativo
- **Tipo de Uso:** Oral, Tópico, Injetável, etc.
- **Busca:** Nome ou abreviatura (busca parcial)

### 4.2 Informações Exibidas

- Nome e abreviatura
- Tipo de uso
- Status (badge verde/vermelho)
- Número de processos configurados
- Ações: Ver, Editar, Desativar

### 4.3 Paginação

- 50 itens por página (padrão)
- Controle via React Query para performance
- Loading states durante carregamento

---

## 5. Integração com Outros Módulos

### 5.1 Módulo de Produção

- **Ordens de Produção** herdam automaticamente os processos da forma
  farmacêutica
- **Etapas de CQ** são criadas baseadas nos pontos de controle configurados
- **Tempos estimados** alimentam planejamento de produção

### 5.2 Módulo de Estoque

- **Produtos manipulados** são categorizados por forma farmacêutica
- **Markup automático** pode variar conforme a forma (valor mínimo)
- **Rótulos** são gerados seguindo configuração da forma

### 5.3 PDV v2

- **Tipo de venda MANIPULADO** filtra produtos por forma farmacêutica
- **Preço mínimo** é respeitado durante vendas
- **Desconto máximo** é aplicado automaticamente

---

## 6. Modelo de Dados

```sql
formas_farmaceuticas
└─ id PK (UUID)
└─ nome VARCHAR(100) NOT NULL UNIQUE
└─ abreviatura VARCHAR(10)
└─ tipo_uso VARCHAR(50) -- oral, topico, injetavel, etc.
└─ descricao TEXT
└─ desconto_maximo DECIMAL(5,2) DEFAULT 0 -- %
└─ valor_minimo DECIMAL(10,2) DEFAULT 0 -- R$
└─ rotulo_config JSONB -- configurações de rótulo
└─ ativo BOOLEAN DEFAULT true
└─ created_at, updated_at, created_by

forma_processos
└─ id PK (UUID)
└─ forma_id FK → formas_farmaceuticas
└─ ordem INTEGER NOT NULL -- sequência
└─ nome_processo VARCHAR(100) NOT NULL
└─ tipo_processo ENUM('PRODUCAO','QUALIDADE','LOGISTICA')
└─ ponto_controle BOOLEAN DEFAULT false
└─ tempo_estimado_min INTEGER
└─ instrucoes TEXT
└─ equipamentos_necessarios TEXT[] -- array de strings
└─ created_at
```

**Configuração de Rótulo (JSONB):**

```json
{
    "mostrar_concentracao": true,
    "mostrar_posologia": true,
    "mostrar_volume": false,
    "mostrar_area_aplicacao": false,
    "mostrar_sabor": false,
    "mostrar_via": false
}
```

---

## 7. Boas Práticas para Usuários

### 7.1 Criação de Formas

1. **Nome descritivo** – use termos farmacêuticos padrão (ex: "Solução Oral" ao
   invés de "Líquido")
2. **Abreviatura consistente** – máximo 10 caracteres, use padrão interno
3. **Processos bem definidos** – cada etapa deve ter instrução clara
4. **Pontos de controle estratégicos** – marque apenas etapas críticas para
   qualidade

### 7.2 Configuração de Processos

1. **Ordem lógica** – siga fluxo real de produção
2. **Tempos realistas** – baseie em cronometragem real, inclua tempo de setup
3. **Instruções detalhadas** – operador deve conseguir executar apenas lendo
4. **Equipamentos necessários** – liste tudo para preparação prévia

### 7.3 Configuração de Rótulos

1. **Informações relevantes** – habilite apenas o necessário para o tipo
2. **Consistência** – formas similares devem ter configuração similar
3. **Regulamentação** – considere exigências da ANVISA para cada tipo

### 7.4 Manutenção

1. **Revisar periodicamente** – tempos e processos podem mudar
2. **Desativar ao invés de excluir** – mantém histórico de produções antigas
3. **Versionar mudanças críticas** – documente alterações importantes

---

## 8. Roadmap de Evolução

| Sprint  | Funcionalidade                            | Status |
| ------- | ----------------------------------------- | ------ |
| S-02/25 | Versionamento de formas farmacêuticas     | 🔜     |
| S-03/25 | Templates de processo por categoria       | 🔜     |
| S-03/25 | Calculadora de tempos baseada em volume   | 🔜     |
| S-04/25 | Integração com sistema de rótulos externo | 🔜     |
| S-05/25 | Análise de performance por forma          | 🔜     |

---

## 9. Fluxo Passo a Passo - Criação Completa

### 9.1 Acessar o Sistema

1. Menu lateral → **Cadastros** → **Formas Farmacêuticas**
2. Clique **+ Nova Forma Farmacêutica**

### 9.2 Aba "Informações Gerais"

1. **Nome:** Digite nome completo (ex: "Cápsula Gelatinosa Dura")
2. **Abreviatura:** Código curto (ex: "CGD")
3. **Tipo de Uso:** Selecione no dropdown
4. **Descrição:** Detalhes técnicos e características
5. **Desconto Máximo:** Percentual limite (0-100%)
6. **Valor Mínimo:** Preço base em reais
7. **Ativo:** Marque para disponibilizar

### 9.3 Aba "Processos de Produção"

1. Clique **Adicionar Processo**
2. Preencha:
   - **Nome do Processo:** Descrição clara
   - **Tipo:** PRODUCAO/QUALIDADE/LOGISTICA
   - **Tempo Estimado:** Minutos necessários
   - **Ponto de Controle:** Marque se requer validação
   - **Instruções:** Procedimento detalhado
   - **Equipamentos:** Liste equipamentos necessários
3. Repita para cada etapa do processo
4. Use drag-and-drop para reordenar se necessário

### 9.4 Aba "Configuração de Rótulo"

1. **Concentração:** Ative para formas com dosagem mensurável
2. **Posologia:** Ative para incluir instruções de uso
3. **Volume:** Ative para líquidos (soluções, xaropes)
4. **Área de Aplicação:** Ative para tópicos
5. **Sabor:** Ative para formas palatáveis
6. **Via de Administração:** Ative para injetáveis

### 9.5 Salvar

1. Clique **Criar Forma Farmacêutica**
2. Sistema valida dados obrigatórios
3. Redirecionamento para página de detalhes
4. Forma fica disponível em outros módulos

---

## 10. Troubleshooting Comum

### 10.1 Erro ao Salvar

**Problema:** "Erro 500 - Internal Server Error" **Causa:** Campo obrigatório
vazio ou duplicação de nome **Solução:**

- Verifique se nome está preenchido e único
- Confirme que pelo menos um processo foi adicionado
- Recarregue a página se persistir

### 10.2 Processo Não Aparece na Ordem de Produção

**Problema:** Processos configurados não aparecem na OP **Causa:** Forma
farmacêutica inativa ou processo sem ordem definida **Solução:**

- Confirme que forma está **Ativa**
- Verifique ordem dos processos (sem números duplicados)
- Re-deploy da edge function se necessário

### 10.3 Rótulo Não Mostra Informações

**Problema:** Campos não aparecem no rótulo gerado **Causa:** Configuração de
rótulo desabilitada **Solução:**

- Edite a forma farmacêutica
- Aba "Configuração de Rótulo"
- Ative os switches necessários

---

## 11. API Reference (Para Desenvolvedores)

### 11.1 Endpoints Principais

```bash
# Listar formas farmacêuticas
GET /gerenciar-formas-farmaceuticas
Query params: ?ativo=true&busca=capsula&page=1&limit=50

# Obter forma específica
GET /gerenciar-formas-farmaceuticas/forma/{id}

# Criar nova forma
POST /gerenciar-formas-farmaceuticas/criar
Body: { nome, abreviatura, tipo_uso, descricao, ... }

# Atualizar forma
PUT /gerenciar-formas-farmaceuticas/atualizar/{id}

# Desativar forma (soft delete)
DELETE /gerenciar-formas-farmaceuticas/excluir/{id}

# Gerenciar processos
POST /gerenciar-formas-farmaceuticas/processos/criar
PUT /gerenciar-formas-farmaceuticas/processos/atualizar/{id}
DELETE /gerenciar-formas-farmaceuticas/processos/excluir/{id}
```

### 11.2 Exemplo de Response

```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "nome": "Cápsula Gelatinosa",
        "abreviatura": "CAPS",
        "tipo_uso": "oral",
        "descricao": "Cápsula para medicamentos sólidos",
        "desconto_maximo": 15.00,
        "valor_minimo": 25.00,
        "rotulo_config": {
            "mostrar_concentracao": true,
            "mostrar_posologia": true,
            "mostrar_volume": false
        },
        "ativo": true,
        "forma_processos": [
            {
                "id": "uuid",
                "ordem": 1,
                "nome_processo": "Pesagem",
                "tipo_processo": "PRODUCAO",
                "ponto_controle": true,
                "tempo_estimado_min": 15,
                "instrucoes": "Pesar ingredientes...",
                "equipamentos_necessarios": ["Balança analítica"]
            }
        ]
    }
}
```

---

## 12. FAQ Rápido

**P:** Posso excluir uma forma farmacêutica?\
**R:** Não recomendado. Use "Desativar" para manter histórico de produções.
Exclusão só via admin com cuidado especial.

**P:** Como alterar ordem dos processos?\
**R:** Na edição, use drag-and-drop ou edite o número da ordem diretamente.

**P:** Quantos processos posso adicionar?\
**R:** Sem limite técnico, mas recomenda-se máximo 15 para fluxo prático.

**P:** A forma aparece automaticamente no PDV?\
**R:** Sim, formas ativas aparecem na seleção durante vendas de manipulados.

---

## 13. Integração com Treinamento de IA

Este documento serve como base para:

1. **Treinamento de atendentes** – processo completo de cadastro
2. **Padronização** – todos seguem mesmo fluxo
3. **Base de conhecimento da IA** – chatbot pode orientar usuários
4. **Auditoria** – verificar se processos estão sendo seguidos
5. **Onboarding** – novos funcionários têm referência completa

---

> **Documento gerado automaticamente** – atualização via IA sempre que o código
> do módulo é modificado. Última revisão: 2025-01-31 após correção CORS e
> validação de formulários.
