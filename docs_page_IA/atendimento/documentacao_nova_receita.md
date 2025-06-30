# Guia – Como Processar uma Nova Receita

> Versão: 2025-06-27\
> Módulo: Atendimento\
> Público-alvo: atendentes e farmacêuticos

---

## 1. Fluxo em 3 Etapas

1. **Upload do arquivo** (imagem/PDF/DOCX)
2. **Análise IA + Validação Humana**
3. **Salvar & Gerar Pedido**

O sistema utiliza OCR + LLM para extrair dados; você só precisa revisar.

---

## 2. Passo a Passo

### 2.1 Acessar a Tela

Rota: `/admin/pedidos/nova-receita` → botão **Nova Receita**.

### 2.2 Digitação Manual (uso no balcão)

Casos de uso principais:

- Cliente traz receita física mas não deseja deixar o documento.
- Receita ilegível para a câmera ou com informações que o atendente já sabe.
- Atendimento via telefone ou WhatsApp – recepção dita a fórmula.

Passos:

1. Na parte superior do cartão "Upload de Receita" clique na aba **Digitação
   Manual**.
2. Preencha **Dados do Paciente** (nome é obrigatório; CPF, data de nascimento,
   telefone e endereço são opcionais).
3. Preencha **Dados do Prescritor** (nome e CRM/CRF – se não informado coloque
   _"N/I"_).
4. Clique em **Adicionar Medicamento** para cada item da fórmula e informe:
   - **Nome** do medicamento (obrigatório).
   - **Concentração/Dinamização** (ex.: `30CH` ou `100 mg`).
   - **Forma farmacêutica** (selecione na lista).
   - **Quantidade** + **Unidade**.
   - **Posologia / Instruções de uso**. Dica: use a tecla **Tab** para navegar
     entre campos rapidamente.
5. (Opcional) Preencha **Observações Gerais** (ex.: validade, orientações
   adicionais) e **Data da Prescrição**.
6. Quando terminar clique em **Processar Receita Manual**. O sistema:
   - Constrói um `rawRecipeId` fictício (prefixo `manual-…`).
   - Exibe a área de **Validação de Dados** igual ao fluxo de upload.
7. Revise os dados; se tudo certo clique **Criar Pedido**. O pedido será criado
   com status _draft_ e ficará aguardando aprovação/orçamento.

> 💡 **Atalho:** pressione `Ctrl + Enter` (ou `⌘ + Enter` no macOS) dentro de
> qualquer campo para salvar mais rápido.

### 2.3 Upload Automático (IA)

1. Clique **Selecionar Arquivo** ou arraste para a área tracejada.
2. Formatos aceitos: JPG, PNG, PDF, DOCX (máx. 10 MB).
3. Após upload, o status muda para **Processando…** (IA + OCR).

### 2.4 Validação

Depois de ~10 s a tela mostra:

| Lado Esquerdo      | Lado Direito                   |
| ------------------ | ------------------------------ |
| Preview da receita | Formulário com dados extraídos |

Campos obrigatórios ficam destacados em vermelho se vazios.

Revise ou corrija:

- Paciente (nome, data nasc.)
- Prescritor (nome, CRM)
- Lista de medicamentos (nome, forma, dose, quantidade)

> **Fluxos de upload e manual convergem aqui.**

### 2.5 Salvar

1. Clique **Criar Pedido**.
2. O sistema grava em `receitas_processadas` e cria um **pedido** em status
   _draft_.
3. Você será redirecionado para a página de detalhes do pedido.

---

## 3. Integração com Produção

Quando o pedido é **aprovado**, ele gera automaticamente uma **Ordem de Produção
(OP)**.\
Consulte `documentacao_ordem_producao.md` para acompanhar o restante do fluxo.

---

## 4. Dicas Rápidas

- Receita ilegível? Peça nova foto ao cliente.
- IA errou medicamento? Edite antes de salvar – isso treinará modelos futuros.
- Use filtros na lista de pedidos para encontrar rapidamente o que está _draft_.

---

> Documento gerado automaticamente após atualização do fluxo de OP.
