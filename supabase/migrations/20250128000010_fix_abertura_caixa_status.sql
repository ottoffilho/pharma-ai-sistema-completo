-- =====================================================
-- MIGRAÇÃO: Correção da tabela abertura_caixa
-- Data: 2025-01-28
-- Descrição: Garantir que a coluna status existe na tabela abertura_caixa
-- =====================================================

-- 1. CRIAR TIPOS ENUM SE NÃO EXISTIREM
-- =====================================================

DO $$ 
BEGIN
    -- Tipo para status do caixa
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_caixa') THEN
        CREATE TYPE status_caixa AS ENUM ('aberto', 'fechado', 'suspenso');
    END IF;

    -- Tipo para tipos de movimento de caixa
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_movimento_caixa') THEN
        CREATE TYPE tipo_movimento_caixa AS ENUM ('sangria', 'suprimento', 'venda', 'estorno');
    END IF;
END $$;

-- 2. VERIFICAR E CRIAR TABELA ABERTURA_CAIXA SE NÃO EXISTIR
-- =====================================================

CREATE TABLE IF NOT EXISTS public.abertura_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valor_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
    status status_caixa DEFAULT 'aberto',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADICIONAR COLUNAS FALTANTES SE NÃO EXISTIREM
-- =====================================================

DO $$ 
BEGIN
    -- Verificar e adicionar coluna status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN status status_caixa DEFAULT 'aberto';
        RAISE NOTICE 'Coluna status adicionada à tabela abertura_caixa';
    ELSE
        RAISE NOTICE 'Coluna status já existe na tabela abertura_caixa';
    END IF;

    -- Verificar outras colunas importantes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'usuario_fechamento'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN usuario_fechamento UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'data_fechamento'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN data_fechamento TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'valor_final'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN valor_final NUMERIC(12,2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'total_vendas'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN total_vendas NUMERIC(12,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'total_sangrias'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN total_sangrias NUMERIC(12,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'total_suprimentos'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN total_suprimentos NUMERIC(12,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'diferenca'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN diferenca NUMERIC(12,2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN observacoes TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'observacoes_fechamento'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN observacoes_fechamento TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'abertura_caixa' 
        AND column_name = 'valor_esperado'
    ) THEN
        ALTER TABLE public.abertura_caixa ADD COLUMN valor_esperado NUMERIC(12,2);
    END IF;
END $$;

-- 4. HABILITAR RLS
-- =====================================================

ALTER TABLE public.abertura_caixa ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS RLS SE NÃO EXISTIREM
-- =====================================================

DO $$ 
BEGIN
    -- Drop políticas existentes que podem ter nomes diferentes
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem visualizar aberturas de caixa" ON public.abertura_caixa;
        DROP POLICY IF EXISTS "Usuários autenticados podem inserir aberturas de caixa" ON public.abertura_caixa;
        DROP POLICY IF EXISTS "Usuários autenticados podem atualizar aberturas de caixa" ON public.abertura_caixa;
        DROP POLICY IF EXISTS "Usuários autenticados podem excluir aberturas de caixa" ON public.abertura_caixa;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignora erros se não existirem
    END;

    -- Criar políticas
    CREATE POLICY "Usuários autenticados podem visualizar aberturas de caixa" 
    ON public.abertura_caixa FOR SELECT 
    TO authenticated 
    USING (true);

    CREATE POLICY "Usuários autenticados podem inserir aberturas de caixa" 
    ON public.abertura_caixa FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

    CREATE POLICY "Usuários autenticados podem atualizar aberturas de caixa" 
    ON public.abertura_caixa FOR UPDATE 
    TO authenticated 
    USING (true);

    CREATE POLICY "Usuários autenticados podem excluir aberturas de caixa" 
    ON public.abertura_caixa FOR DELETE 
    TO authenticated 
    USING (true);
END $$;

-- 6. CRIAR ÍNDICES SE NÃO EXISTIREM
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_abertura_caixa_usuario ON public.abertura_caixa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_abertura_caixa_status ON public.abertura_caixa(status);
CREATE INDEX IF NOT EXISTS idx_abertura_caixa_data_abertura ON public.abertura_caixa(data_abertura);
CREATE INDEX IF NOT EXISTS idx_abertura_caixa_data_fechamento ON public.abertura_caixa(data_fechamento);

-- 7. CRIAR TABELA MOVIMENTOS_CAIXA SE NÃO EXISTIR
-- =====================================================

CREATE TABLE IF NOT EXISTS public.movimentos_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abertura_caixa_id UUID NOT NULL REFERENCES public.abertura_caixa(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    venda_id UUID REFERENCES public.vendas(id),
    tipo tipo_movimento_caixa NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.movimentos_caixa ENABLE ROW LEVEL SECURITY;

-- Políticas para movimentos_caixa
DO $$ 
BEGIN
    -- Drop políticas existentes
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem visualizar movimentos de caixa" ON public.movimentos_caixa;
        DROP POLICY IF EXISTS "Usuários autenticados podem inserir movimentos de caixa" ON public.movimentos_caixa;
        DROP POLICY IF EXISTS "Usuários autenticados podem atualizar movimentos de caixa" ON public.movimentos_caixa;
        DROP POLICY IF EXISTS "Usuários autenticados podem excluir movimentos de caixa" ON public.movimentos_caixa;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Criar políticas
    CREATE POLICY "Usuários autenticados podem visualizar movimentos de caixa" 
    ON public.movimentos_caixa FOR SELECT 
    TO authenticated 
    USING (true);

    CREATE POLICY "Usuários autenticados podem inserir movimentos de caixa" 
    ON public.movimentos_caixa FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

    CREATE POLICY "Usuários autenticados podem atualizar movimentos de caixa" 
    ON public.movimentos_caixa FOR UPDATE 
    TO authenticated 
    USING (true);

    CREATE POLICY "Usuários autenticados podem excluir movimentos de caixa" 
    ON public.movimentos_caixa FOR DELETE 
    TO authenticated 
    USING (true);
END $$;

-- Índices para movimentos_caixa
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_abertura ON public.movimentos_caixa(abertura_caixa_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_usuario ON public.movimentos_caixa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_tipo ON public.movimentos_caixa(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_venda ON public.movimentos_caixa(venda_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_data ON public.movimentos_caixa(created_at);

-- 8. PERMISSÕES
-- =====================================================

GRANT ALL ON public.abertura_caixa TO authenticated;
GRANT ALL ON public.abertura_caixa TO service_role;
GRANT ALL ON public.movimentos_caixa TO authenticated;
GRANT ALL ON public.movimentos_caixa TO service_role;

-- 9. TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at na abertura_caixa
DROP TRIGGER IF EXISTS trigger_updated_at_abertura_caixa ON public.abertura_caixa;
CREATE TRIGGER trigger_updated_at_abertura_caixa
    BEFORE UPDATE ON public.abertura_caixa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular totais do caixa
CREATE OR REPLACE FUNCTION calcular_totais_caixa()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for inserção ou atualização em movimentos_caixa
    IF TG_TABLE_NAME = 'movimentos_caixa' THEN
        -- Recalcular totais na abertura_caixa correspondente
        UPDATE public.abertura_caixa 
        SET 
            total_vendas = COALESCE((
                SELECT SUM(valor) 
                FROM public.movimentos_caixa 
                WHERE abertura_caixa_id = NEW.abertura_caixa_id 
                AND tipo = 'venda'
            ), 0),
            total_sangrias = COALESCE((
                SELECT SUM(valor) 
                FROM public.movimentos_caixa 
                WHERE abertura_caixa_id = NEW.abertura_caixa_id 
                AND tipo = 'sangria'
            ), 0),
            total_suprimentos = COALESCE((
                SELECT SUM(valor) 
                FROM public.movimentos_caixa 
                WHERE abertura_caixa_id = NEW.abertura_caixa_id 
                AND tipo = 'suprimento'
            ), 0),
            updated_at = NOW()
        WHERE id = NEW.abertura_caixa_id;
        
        -- Calcular valor esperado e diferença
        UPDATE public.abertura_caixa 
        SET 
            valor_esperado = valor_inicial + total_vendas + total_suprimentos - total_sangrias,
            diferenca = CASE 
                WHEN valor_final IS NOT NULL 
                THEN valor_final - (valor_inicial + total_vendas + total_suprimentos - total_sangrias)
                ELSE NULL 
            END
        WHERE id = NEW.abertura_caixa_id;
    END IF;
    
    -- Se for atualização na abertura_caixa (fechamento)
    IF TG_TABLE_NAME = 'abertura_caixa' AND NEW.valor_final IS NOT NULL AND OLD.valor_final IS NULL THEN
        NEW.diferenca = NEW.valor_final - NEW.valor_esperado;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular totais quando movimento é inserido/atualizado
DROP TRIGGER IF EXISTS trigger_calcular_totais_caixa_movimento ON public.movimentos_caixa;
CREATE TRIGGER trigger_calcular_totais_caixa_movimento
    AFTER INSERT OR UPDATE ON public.movimentos_caixa
    FOR EACH ROW EXECUTE FUNCTION calcular_totais_caixa();

-- Trigger para calcular diferença no fechamento
DROP TRIGGER IF EXISTS trigger_calcular_totais_caixa_fechamento ON public.abertura_caixa;
CREATE TRIGGER trigger_calcular_totais_caixa_fechamento
    BEFORE UPDATE ON public.abertura_caixa
    FOR EACH ROW EXECUTE FUNCTION calcular_totais_caixa();

RAISE NOTICE 'Migração concluída: Sistema de caixa corrigido'; 