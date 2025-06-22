-- =====================================================
-- MIGRAÇÃO: Corrigir RLS para insumos e embalagens
-- Data: 2025-01-28
-- Descrição: Configura Row Level Security para tabelas insumos e embalagens
-- =====================================================

-- 1. CONFIGURAR RLS PARA TABELA INSUMOS
-- =====================================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE IF EXISTS public.insumos ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar insumos" ON public.insumos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir insumos" ON public.insumos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar insumos" ON public.insumos;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir insumos" ON public.insumos;

-- Criar políticas RLS para insumos
CREATE POLICY "Usuários autenticados podem visualizar insumos" 
ON public.insumos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir insumos" 
ON public.insumos FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar insumos" 
ON public.insumos FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem excluir insumos" 
ON public.insumos FOR DELETE 
TO authenticated 
USING (true);

-- 2. CONFIGURAR RLS PARA TABELA EMBALAGENS
-- =====================================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE IF EXISTS public.embalagens ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar embalagens" ON public.embalagens;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir embalagens" ON public.embalagens;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar embalagens" ON public.embalagens;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir embalagens" ON public.embalagens;

-- Criar políticas RLS para embalagens
CREATE POLICY "Usuários autenticados podem visualizar embalagens" 
ON public.embalagens FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir embalagens" 
ON public.embalagens FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar embalagens" 
ON public.embalagens FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem excluir embalagens" 
ON public.embalagens FOR DELETE 
TO authenticated 
USING (true);

-- 3. CORRIGIR PROBLEMA DA FUNÇÃO DUPLICADA
-- =====================================================

-- Remover função duplicada se existir
DROP FUNCTION IF EXISTS public.classificar_produto_automaticamente(text, text);
DROP FUNCTION IF EXISTS public.classificar_produto_automaticamente(varchar, varchar);

-- Criar função única e correta
CREATE OR REPLACE FUNCTION public.classificar_produto_automaticamente(
    nome_produto text,
    categoria_base text DEFAULT 'medicamentos'
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    resultado jsonb;
    nome_upper text;
    forma_farmaceutica text;
    categoria text;
    controlado boolean;
BEGIN
    nome_upper := upper(nome_produto);
    
    -- Classificação por forma farmacêutica
    IF nome_upper LIKE '% TM %' OR nome_upper LIKE '%TINTURA%' THEN
        forma_farmaceutica := 'TM';
    ELSIF nome_upper LIKE '% CH %' OR nome_upper LIKE '%CENTESIMAL%' THEN
        forma_farmaceutica := 'CH';
    ELSIF nome_upper LIKE '% FC %' OR nome_upper LIKE '%FLUXO%' THEN
        forma_farmaceutica := 'FC';
    ELSIF nome_upper LIKE '%BACH%' OR nome_upper LIKE '%FLORAL%' THEN
        forma_farmaceutica := 'FLORAL';
    ELSE
        forma_farmaceutica := null;
    END IF;
    
    -- Classificação por categoria
    IF nome_upper LIKE '%BACH%' OR nome_upper LIKE '%FLORAL%' THEN
        categoria := 'FLORAIS_BACH';
    ELSIF nome_upper LIKE '%TM%' OR nome_upper LIKE '%TINTURA%' THEN
        categoria := 'TINTURAS_MAES';
    ELSIF nome_upper LIKE '%CH%' OR nome_upper LIKE '%FC%' THEN
        categoria := 'HOMEOPATICOS';
    ELSIF nome_upper LIKE '%FRASCO%' OR nome_upper LIKE '%POTE%' OR nome_upper LIKE '%EMBALAGEM%' THEN
        categoria := 'EMBALAGENS';
    ELSE
        categoria := categoria_base;
    END IF;
    
    -- Verificar se é controlado (lista básica)
    controlado := nome_upper LIKE '%MORFINA%' OR 
                  nome_upper LIKE '%CODEINA%' OR 
                  nome_upper LIKE '%TRAMADOL%';
    
    -- Montar resultado
    resultado := jsonb_build_object(
        'forma_farmaceutica', forma_farmaceutica,
        'categoria', categoria,
        'controlado', controlado,
        'requer_receita', controlado
    );
    
    RETURN resultado;
END;
$$;

-- 4. CONFIGURAR RLS PARA TABELAS RELACIONADAS
-- =====================================================

-- Configurar RLS para notas_fiscais se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas_fiscais') THEN
        ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Usuários autenticados podem acessar notas fiscais" ON public.notas_fiscais;
        CREATE POLICY "Usuários autenticados podem acessar notas fiscais" 
        ON public.notas_fiscais FOR ALL 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- Configurar RLS para fornecedores se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fornecedores') THEN
        ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Usuários autenticados podem acessar fornecedores" ON public.fornecedores;
        CREATE POLICY "Usuários autenticados podem acessar fornecedores" 
        ON public.fornecedores FOR ALL 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- 5. LOG DE SUCESSO
SELECT 'RLS configurado com sucesso para insumos, embalagens e tabelas relacionadas!' as status; 