-- =====================================================
-- MIGRAÇÃO: Criar tabela lote
-- Data: 2024-05-28
-- Descrição: Cria tabela para controle de lotes
-- =====================================================

-- 1. Criar tabela lote
CREATE TABLE IF NOT EXISTS public.lote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES public.produto(id) ON DELETE CASCADE,
    numero_lote VARCHAR(50) NOT NULL,
    data_fabricacao DATE,
    data_validade DATE,
    quantidade_inicial DECIMAL(10,3) NOT NULL DEFAULT 0,
    quantidade_atual DECIMAL(10,3) NOT NULL DEFAULT 0,
    preco_custo_unitario DECIMAL(10,4),
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Impede números de lote duplicados para o mesmo produto
    UNIQUE(produto_id, numero_lote)
);

-- Adicionar comentários
COMMENT ON TABLE public.lote IS 'Tabela para controle de lotes de produtos e insumos';

-- Configurar RLS
ALTER TABLE public.lote ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar erros
DO $$ 
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem visualizar lotes" ON public.lote;
    EXCEPTION WHEN undefined_object THEN
        -- Ignora se a política não existir
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem inserir lotes" ON public.lote;
    EXCEPTION WHEN undefined_object THEN
        -- Ignora se a política não existir
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem atualizar lotes" ON public.lote;
    EXCEPTION WHEN undefined_object THEN
        -- Ignora se a política não existir
    END;
END $$;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar lotes" 
ON public.lote FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir lotes" 
ON public.lote FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar lotes" 
ON public.lote FOR UPDATE 
TO authenticated 
USING (true);

-- Criar índices para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_lote_produto_id
ON public.lote(produto_id);

CREATE INDEX IF NOT EXISTS idx_lote_numero
ON public.lote(numero_lote);

CREATE INDEX IF NOT EXISTS idx_lote_data_validade
ON public.lote(data_validade);

CREATE INDEX IF NOT EXISTS idx_lote_fornecedor
ON public.lote(fornecedor_id);

-- Criar trigger para atualização automática do updated_at
CREATE OR REPLACE FUNCTION update_lote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lote_timestamp ON lote;

CREATE TRIGGER update_lote_timestamp
BEFORE UPDATE ON lote
FOR EACH ROW
EXECUTE FUNCTION update_lote_updated_at();

-- Trigger para atualizar o estoque do produto quando um lote é inserido ou atualizado
CREATE OR REPLACE FUNCTION update_produto_estoque_from_lote()
RETURNS TRIGGER AS $$
DECLARE
    estoque_total DECIMAL(10,3);
BEGIN
    -- Calcular o estoque total do produto somando todos os lotes ativos
    SELECT COALESCE(SUM(quantidade_atual), 0)
    INTO estoque_total
    FROM public.lote
    WHERE produto_id = NEW.produto_id AND ativo = true;
    
    -- Atualizar o estoque atual do produto
    UPDATE public.produto
    SET estoque_atual = estoque_total,
        updated_at = NOW()
    WHERE id = NEW.produto_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para quando um lote é inserido ou atualizado
DROP TRIGGER IF EXISTS trigger_update_produto_estoque_from_lote_insert ON lote;

CREATE TRIGGER trigger_update_produto_estoque_from_lote_insert
AFTER INSERT OR UPDATE ON public.lote
FOR EACH ROW
EXECUTE FUNCTION update_produto_estoque_from_lote();

-- Trigger para quando um lote é excluído
DROP TRIGGER IF EXISTS trigger_update_produto_estoque_from_lote_delete ON lote;

CREATE TRIGGER trigger_update_produto_estoque_from_lote_delete
AFTER DELETE ON public.lote
FOR EACH ROW
EXECUTE FUNCTION update_produto_estoque_from_lote();

-- Inserir alguns lotes de exemplo
INSERT INTO public.lote (
    produto_id, 
    numero_lote, 
    data_fabricacao, 
    data_validade, 
    quantidade_inicial,
    quantidade_atual,
    preco_custo_unitario
) VALUES
    ((SELECT id FROM produto WHERE codigo_interno = 'MED001' LIMIT 1), 'LOT20250501', '2025-05-01', '2027-05-01', 100, 100, 0.25),
    ((SELECT id FROM produto WHERE codigo_interno = 'MED002' LIMIT 1), 'LOT20250502', '2025-05-01', '2027-05-01', 150, 150, 0.18),
    ((SELECT id FROM produto WHERE codigo_interno = 'MED003' LIMIT 1), 'LOT20250503', '2025-05-01', '2027-05-01', 200, 200, 0.30),
    ((SELECT id FROM produto WHERE codigo_interno = 'INS001' LIMIT 1), 'LOT20250504', '2025-05-01', '2026-05-01', 1000, 1000, 0.05),
    ((SELECT id FROM produto WHERE codigo_interno = 'INS002' LIMIT 1), 'LOT20250505', '2025-05-01', '2026-05-01', 500, 500, 0.12);

-- 2. LOG DE SUCESSO
SELECT 'Tabela lote criada com sucesso!' as status; 