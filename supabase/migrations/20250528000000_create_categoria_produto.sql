-- =====================================================
-- MIGRAÇÃO: Criar tabela categoria_produto
-- Data: 2024-05-28
-- Descrição: Cria tabela para categorias de produtos
-- =====================================================

-- 1. Criar tabela categoria_produto
CREATE TABLE IF NOT EXISTS public.categoria_produto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    codigo VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar comentários
COMMENT ON TABLE public.categoria_produto IS 'Tabela para categorização de produtos farmacêuticos';

-- Configurar RLS
ALTER TABLE public.categoria_produto ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar categorias" 
ON public.categoria_produto FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir categorias" 
ON public.categoria_produto FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar categorias" 
ON public.categoria_produto FOR UPDATE 
TO authenticated 
USING (true);

-- Criar índice para buscas por nome
CREATE INDEX IF NOT EXISTS idx_categoria_produto_nome 
ON public.categoria_produto(nome);

-- Criar trigger para atualização automática do updated_at
CREATE OR REPLACE FUNCTION update_categoria_produto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categoria_produto_timestamp
BEFORE UPDATE ON categoria_produto
FOR EACH ROW
EXECUTE FUNCTION update_categoria_produto_updated_at();

-- 2. LOG DE SUCESSO
SELECT 'Tabela categoria_produto criada com sucesso!' as status; 