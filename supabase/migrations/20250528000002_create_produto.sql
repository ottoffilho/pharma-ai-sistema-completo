-- =====================================================
-- MIGRAÇÃO: Criar tabela produto
-- Data: 2024-05-28
-- Descrição: Cria tabela para produtos e insumos
-- =====================================================

-- 1. Criar tabela produto
CREATE TABLE IF NOT EXISTS public.produto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_interno VARCHAR(50) UNIQUE NOT NULL,
    codigo_ean VARCHAR(14),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    
    -- Classificações/Relacionamentos
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
    unidade_comercial VARCHAR(10) NOT NULL,
    unidade_tributaria VARCHAR(10),
    
    -- Preços e Custos
    preco_custo DECIMAL(10,4),
    preco_venda DECIMAL(10,4),
    margem_lucro DECIMAL(5,2),
    
    -- Impostos (percentuais padrão)
    aliquota_icms DECIMAL(5,2) DEFAULT 0,
    aliquota_ipi DECIMAL(5,2) DEFAULT 0,
    aliquota_pis DECIMAL(5,2) DEFAULT 0,
    aliquota_cofins DECIMAL(5,2) DEFAULT 0,
    
    -- Controle de Estoque
    estoque_minimo DECIMAL(10,3) DEFAULT 0,
    estoque_maximo DECIMAL(10,3) DEFAULT 0,
    estoque_atual DECIMAL(10,3) DEFAULT 0,
    
    -- Flags de Controle
    controlado BOOLEAN DEFAULT false,
    requer_receita BOOLEAN DEFAULT false,
    produto_manipulado BOOLEAN DEFAULT false,
    produto_revenda BOOLEAN DEFAULT true,
    ativo BOOLEAN DEFAULT true,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar comentários
COMMENT ON TABLE public.produto IS 'Tabela para cadastro de produtos, insumos e matérias-primas';

-- Configurar RLS
ALTER TABLE public.produto ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar erros
DO $$ 
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem visualizar produtos" ON public.produto;
    EXCEPTION WHEN undefined_object THEN
        -- Ignora se a política não existir
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtos" ON public.produto;
    EXCEPTION WHEN undefined_object THEN
        -- Ignora se a política não existir
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON public.produto;
    EXCEPTION WHEN undefined_object THEN
        -- Ignora se a política não existir
    END;
END $$;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar produtos" 
ON public.produto FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir produtos" 
ON public.produto FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar produtos" 
ON public.produto FOR UPDATE 
TO authenticated 
USING (true);

-- Criar índices para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_produto_codigo_interno
ON public.produto(codigo_interno);

CREATE INDEX IF NOT EXISTS idx_produto_codigo_ean
ON public.produto(codigo_ean);

CREATE INDEX IF NOT EXISTS idx_produto_nome
ON public.produto USING gin(to_tsvector('portuguese', nome));

CREATE INDEX IF NOT EXISTS idx_produto_fornecedor
ON public.produto(fornecedor_id);

CREATE INDEX IF NOT EXISTS idx_produto_categoria
ON public.produto(categoria_produto_id);

CREATE INDEX IF NOT EXISTS idx_produto_forma_farmaceutica
ON public.produto(forma_farmaceutica_id);

-- Criar trigger para atualização automática do updated_at
CREATE OR REPLACE FUNCTION update_produto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_produto_timestamp ON produto;

CREATE TRIGGER update_produto_timestamp
BEFORE UPDATE ON produto
FOR EACH ROW
EXECUTE FUNCTION update_produto_updated_at();

-- 2. LOG DE SUCESSO
SELECT 'Tabela produto criada com sucesso!' as status; 