# Documentação – Módulo de Atendimento (Central de Pedidos)

> Versão: 2025-05-31\
> Status do módulo: 65 % concluído (funcional)\
> Público-alvo: Farmacêuticos, atendentes, gerentes e time de suporte

---

## 1. Visão Geral

O módulo **Atendimento** reúne todos os fluxos relacionados à recepção,
cadastro, validação e acompanhamento de pedidos de medicamentos manipulados. Ele
centraliza informações de receitas, pacientes, prescritores, produção, entrega e
integrações de IA.

**Objetivos principais:**

1. Reduzir tempo de atendimento ao cliente.
2. Garantir precisão no cadastro de receitas por meio de IA + validação humana.
3. Oferecer rastreabilidade ponta-a-ponta do pedido, desde a entrada da receita
   até a entrega.

---

## 2. Estrutura de Páginas

| Rota                          | Componente                | Descrição Resumida                                             |
| ----------------------------- | ------------------------- | -------------------------------------------------------------- |
| `/admin/pedidos`              | `PedidosOverview`         | Dashboard com métricas, atalhos e status geral do sistema      |
| `/admin/pedidos/listar`       | `ListarPedidosPage`       | Lista todos os pedidos com filtros avançados e busca full-text |
| `/admin/pedidos/nova-receita` | `NovaReceitaPage`         | Upload + processamento inteligente de receitas                 |
| `/admin/pedidos/[id]`         | `PrescriptionDetailsPage` | Detalhes completos da receita/pedido + alteração de status     |
| `/admin/producao/overview`    | `ProducaoOverview`        | (Relacionado) Acompanham-se ordens de produção vinculadas      |
| `/admin/pedidos/entregas`     | **Em desenvolvimento**    | Gestão de logística e rastreamento de entregas                 |

---

## 3. Fluxo "Nova Receita" (🏷️ _Core do Atendimento_)

1. **Upload** – usuário seleciona JPG/PNG/PDF/DOCX.\
   • Arquivo sobe para bucket `receitas/` via `uploadRecipeFile`.\
   • Registro criado em `receitas_brutas` (`upload_status = uploaded`).
2. **OCR + IA** – função `processRecipe`:
   1. OCR (Tesseract para imagens ou pdf-js para PDF).
   2. Prompt enviado ao DeepSeek LLM → retorna `IAExtractedData`.
   3. Atualiza `receitas_brutas.processing_status = processed` + armazena texto
      extraído.
3. **Validação Humana** – interface mostra dados extraídos lado a lado com
   preview da receita.\
   • Usuário pode corrigir paciente, prescritor, lista de medicamentos etc.\
   • `validatePrescriptionData` garante regras mínimas (paciente, prescritor, ≥1
   medicamento).
4. **Salvar** – `saveProcessedRecipe` grava em `receitas_processadas` e gera
   `processed_recipe_id`. Em seguida:\
   • Cria um registro em `pedidos` (`status = draft`).\
   • Eventualmente inicia workflow de produção (ordem_producao) e move status.

> **Tempo médio:** 10-15 segundos (upload + IA) — exibido na UI para
> transparência.

---

## 4. Listagem de Pedidos

Funções principais:

- Filtro por _status_ (draft, in_production, delivered…)
- Busca por ID, paciente ou prescritor (like `%term%`).
- Badge de status com ícone e cor padronizados.
- Coluna "Total" convertida para BRL.
- Paginação controlada em React Query (lazy-loading).
- Ações:
  - **Ver** detalhes (`/admin/pedidos/[id]`).
  - **Editar** (para campos específicos – futura versão).

---

## 5. Detalhes da Receita/Pedido

Recursos:

- Exibe metadados da receita (`patient_name`, `prescriber_name`, medicamentos
  JSONB formatado).
- Mostra histórico de mudanças de status (tabela `historico_status_pedidos`).
- Dropdown para atualizar status do pedido; cada alteração registra log +
  usuário.
- Botão **Imprimir** gera documento A4 com informações resumidas (draft).

---

## 6. Métricas & Indicadores (Cards)

| Card                     | Fonte de Dados                                    | Valor para o Usuário                                      |
| ------------------------ | ------------------------------------------------- | --------------------------------------------------------- |
| **Total de Pedidos**     | `SELECT count(*) FROM pedidos`                    | Volume atual de pedidos; ajuda planejar produção          |
| **Receitas Processadas** | `SELECT count(*) FROM receitas_processadas`       | Quantas receitas já passaram por IA; mede uso do sistema  |
| **Sistema IA**           | (Hoje hard-coded → será função `health_ia()`)     | Confiança de que OCR/IA estão operacionais                |
| **Status Sistema**       | (Hoje hard-coded → será função `health_system()`) | Disponibilidade geral (Supabase, Edge Functions, Storage) |

Em versões futuras, os dois últimos cards receberão dados dinâmicos (tempo de
resposta, uptimes, etc.).

---

## 7. Modelo de Dados (resumido)

```
receitas_brutas
└─ id PK
└─ uploaded_by_user_id FK → auth.users
└─ file_path, file_name, file_type, file_size
└─ upload_status enum('uploaded','error')
└─ processing_status enum('pending','processing','processed','error')
└─ ocr_text, ocr_confidence

receitas_processadas
└─ id PK
└─ raw_recipe_id FK → receitas_brutas
└─ processed_by_user_id FK → auth.users
└─ medications JSONB
└─ patient_name, patient_dob
└─ prescriber_name, prescriber_identifier
└─ validation_status enum('pending','validated','rejected')

pedidos
└─ id PK
└─ processed_recipe_id FK → receitas_processadas
└─ status enum('draft','in_production',…)
└─ total_amount, estimated_delivery_date, channel, notes

historico_status_pedidos
└─ id PK
└─ pedido_id FK → pedidos
└─ status_anterior, status_novo
└─ usuario_id FK → auth.users
└─ created_at
```

> Todas as tabelas têm **RLS habilitado**; somente usuários autenticados com
> permissões adequadas podem ler/gravar.

---

## 8. Boas Práticas para Usuários

1. **Qualidade da imagem** – fotos nítidas e sem sombras reduzem erros de OCR.
2. **Conferir dados extraídos** – IA acerta ~90 %; revise
   medicamentos/dinamização antes de salvar.
3. **Utilizar filtros** – na lista de pedidos, aplique filtros de status para
   encontrar rapidamente pedidos pendentes.
4. **Manter status atualizado** – isso alimenta relatórios e comunicação com
   clientes.
5. **Verificar indicadores** – se "Sistema IA" aparecer como _indisponível_,
   aguarde ou siga processo manual.

---

## 9. Roadmap de Evolução

| Sprint  | Funcionalidade                                 | Status |
| ------- | ---------------------------------------------- | ------ |
| S-05/25 | IA dinâmica nos cards                          | 🔜     |
| S-06/25 | Página de Entregas + rastreamento              | 🔜     |
| S-06/25 | Exportação PDF do pedido                       | 🔜     |
| S-07/25 | Integração WhatsApp para confirmação de pedido | 🔜     |

---

## 10. FAQ Rápido

**P:** O upload falhou, o que faço?\
**R:** Verifique se o arquivo tem até 10 MB e está em formato suportado (JPG,
PNG, PDF, DOCX). Recarregue a página se necessário.

**P:** IA retornou medicamento errado.\
**R:** Edite manualmente antes de salvar; isso treina o modelo em versões
futuras.

**P:** Posso apagar uma receita processada?\
**R:** Apenas usuários com perfil **Administrador** podem excluir; use a função
"Excluir" nos detalhes do pedido.

---

## 11. Integração com Produção

Após o pedido ser **aprovado** e mudar de _draft_ para _in_production_, o
sistema gera automaticamente uma **Ordem de Produção (OP)** vinculada.

• Para entender todo o processo da OP, consulte o manual:
`documentacao_ordem_producao.md` na mesma pasta. • A OP segue o fluxo descrito
lá até ficar **finalizada**, quando o PDV pode efetuar a venda tipo
_MANIPULADO_.

---

> **Documento gerado automaticamente** – atualização via IA sempre que o código
> do módulo é modificado.
