-- =====================================================
-- MIGRAÇÃO: Unificar tabelas de produtos
-- Data: 2025-01-28
-- Descrição: Unifica insumos, embalagens e produto em uma tabela produtos
-- =====================================================

-- 1. CRIAR NOVA TABELA PRODUTOS UNIFICADA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    codigo_interno VARCHAR(50) UNIQUE,
    codigo_ean VARCHAR(14),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    
    -- Tipo e Categoria
    tipo VARCHAR(50) NOT NULL DEFAULT 'MEDICAMENTO', -- MEDICAMENTO, INSUMO, EMBALAGEM
    categoria VARCHAR(100), -- Subcategoria específica
    categoria_produto_id UUID REFERENCES public.categoria_produto(id),
    forma_farmaceutica_id UUID REFERENCES public.forma_farmaceutica(id),
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    
    -- Dados Fiscais
    ncm VARCHAR(8),
    cfop VARCHAR(4),
    origem INTEGER DEFAULT 0,
    cst_icms VARCHAR(3),
    cst_ipi VARCHAR(2),
    cst_pis VARCHAR(2),
    cst_cofins VARCHAR(2),
    
    -- Unidades
    unidade_medida VARCHAR(10) NOT NULL DEFAULT 'UN',
    unidade_comercial VARCHAR(10),
    unidade_tributaria VARCHAR(10),
    volume_capacidade VARCHAR(50), -- Para embalagens
    
    -- Preços e Custos
    custo_unitario NUMERIC(10,4) NOT NULL DEFAULT 0,
    preco_custo NUMERIC(10,4),
    preco_venda NUMERIC(10,4),
    margem_lucro NUMERIC(5,2),
    frete_unitario NUMERIC(10,4) DEFAULT 0,
    custo_efetivo NUMERIC(10,4),
    
    -- Sistema de Markup
    markup NUMERIC(6,2) DEFAULT 6.00,
    markup_personalizado BOOLEAN DEFAULT FALSE,
    data_ultima_atualizacao_preco TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Impostos (percentuais padrão)
    aliquota_icms NUMERIC(5,2) DEFAULT 0,
    aliquota_ipi NUMERIC(5,2) DEFAULT 0,
    aliquota_pis NUMERIC(5,2) DEFAULT 0,
    aliquota_cofins NUMERIC(5,2) DEFAULT 0,
    
    -- Controle de Estoque
    estoque_atual NUMERIC(10,3) DEFAULT 0,
    estoque_minimo NUMERIC(10,3) DEFAULT 0,
    estoque_maximo NUMERIC(10,3) DEFAULT 0,
    
    -- Flags de Controle
    controlado BOOLEAN DEFAULT false,
    requer_receita BOOLEAN DEFAULT false,
    produto_manipulado BOOLEAN DEFAULT false,
    produto_revenda BOOLEAN DEFAULT true,
    ativo BOOLEAN DEFAULT true,
    
    -- Observações
    observacoes_custo TEXT,
    
    -- Controle
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MIGRAR DADOS EXISTENTES
-- =====================================================

-- Migrar dados da tabela insumos
INSERT INTO public.produtos (
    id, nome, tipo, categoria, unidade_medida, custo_unitario, fornecedor_id, descricao,
    estoque_atual, estoque_minimo, estoque_maximo, created_at, updated_at, is_deleted,
    codigo_interno, codigo_ean, ncm, cfop, unidade_comercial, unidade_tributaria,
    origem, cst_icms, cst_ipi, cst_pis, cst_cofins, aliquota_icms, aliquota_ipi,
    aliquota_pis, aliquota_cofins, preco_custo, preco_venda, margem_lucro,
    controlado, requer_receita, produto_manipulado, produto_revenda, ativo,
    categoria_produto_id, forma_farmaceutica_id, markup, markup_personalizado,
    data_ultima_atualizacao_preco, frete_unitario, custo_efetivo, observacoes_custo,
    volume_capacidade
)
SELECT 
    id, nome, 
    CASE 
        WHEN tipo = 'MEDICAMENTO' THEN 'MEDICAMENTO'
        ELSE 'INSUMO'
    END as tipo,
    tipo as categoria, -- Tipo original vira categoria
    unidade_medida, custo_unitario, fornecedor_id, descricao,
    estoque_atual, estoque_minimo, estoque_maximo, created_at, updated_at, is_deleted,
    codigo_interno, codigo_ean, ncm, cfop, unidade_comercial, unidade_tributaria,
    origem, cst_icms, cst_ipi, cst_pis, cst_cofins, aliquota_icms, aliquota_ipi,
    aliquota_pis, aliquota_cofins, preco_custo, preco_venda, margem_lucro,
    controlado, requer_receita, produto_manipulado, produto_revenda, ativo,
    categoria_produto_id, forma_farmaceutica_id, markup, markup_personalizado,
    data_ultima_atualizacao_preco, frete_unitario, custo_efetivo, observacoes_custo,
    volume_capacidade
FROM public.insumos
WHERE NOT is_deleted;

-- Migrar dados da tabela embalagens
INSERT INTO public.produtos (
    id, nome, tipo, categoria, custo_unitario, fornecedor_id, descricao,
    estoque_atual, estoque_minimo, estoque_maximo, created_at, updated_at, is_deleted,
    markup, preco_venda, markup_personalizado, data_ultima_atualizacao_preco,
    preco_custo, frete_unitario, custo_efetivo, observacoes_custo, volume_capacidade,
    unidade_medida
)
SELECT 
    id, nome, 'EMBALAGEM' as tipo, tipo as categoria, custo_unitario, fornecedor_id, descricao,
    estoque_atual::numeric, estoque_minimo::numeric, estoque_maximo::numeric, 
    created_at, updated_at, is_deleted,
    markup, preco_venda, markup_personalizado, data_ultima_atualizacao_preco,
    preco_custo, frete_unitario, custo_efetivo, observacoes_custo, volume_capacidade,
    'UN' as unidade_medida
FROM public.embalagens
WHERE NOT is_deleted;

-- 3. CONFIGURAR RLS E POLÍTICAS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar produtos" 
ON public.produtos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir produtos" 
ON public.produtos FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar produtos" 
ON public.produtos FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem excluir produtos" 
ON public.produtos FOR DELETE 
TO authenticated 
USING (true);

-- 4. CRIAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_produtos_codigo_interno ON public.produtos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_ean ON public.produtos(codigo_ean);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON public.produtos USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON public.produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON public.produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_baixo ON public.produtos(estoque_atual, estoque_minimo);

-- 5. CRIAR TRIGGERS PARA PRODUTOS
-- =====================================================

-- Trigger para calcular preço de venda automaticamente
CREATE TRIGGER trigger_calcular_preco_venda_produtos
  BEFORE INSERT OR UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION calcular_preco_venda();

-- Trigger para registrar histórico de alterações
CREATE TRIGGER trigger_historico_preco_produtos
  AFTER UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION registrar_historico_preco();

-- Trigger para updated_at
CREATE TRIGGER trigger_updated_at_produtos
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. ATUALIZAR REFERÊNCIAS DE LOTES
-- =====================================================

-- A tabela lote usa produto_id, então já está compatível
-- Mas vamos garantir que as referências estejam corretas

-- Atualizar foreign key constraint se necessário
-- (comentado por segurança - execute apenas se necessário)
-- ALTER TABLE lote DROP CONSTRAINT IF EXISTS lote_produto_id_fkey;
-- ALTER TABLE lote ADD CONSTRAINT lote_produto_id_fkey 
--   FOREIGN KEY (produto_id) REFERENCES produtos(id);

-- 7. LOG DE SUCESSO
SELECT 'Tabela produtos unificada criada com sucesso!' as status;

-- Verificar migração
SELECT 
  tipo,
  COUNT(*) as total
FROM public.produtos 
GROUP BY tipo
ORDER BY tipo; 