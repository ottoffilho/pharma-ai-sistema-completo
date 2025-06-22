-- =====================================================
-- MIGRAÇÃO: Funções para Sistema de Caixa
-- Data: 2025-01-28
-- Descrição: Funções para verificar e criar tabela abertura_caixa automaticamente
-- =====================================================

-- Função para verificar se uma tabela existe
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = check_table_exists.table_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar a tabela abertura_caixa
CREATE OR REPLACE FUNCTION create_abertura_caixa_table()
RETURNS VOID AS $$
BEGIN
    -- Criar tabela se não existir
    IF NOT check_table_exists('abertura_caixa') THEN
        CREATE TABLE public.abertura_caixa (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            usuario_id UUID NOT NULL REFERENCES auth.users(id),
            usuario_fechamento UUID REFERENCES auth.users(id),
            data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            data_fechamento TIMESTAMP WITH TIME ZONE,
            valor_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
            valor_final NUMERIC(12,2),
            total_vendas NUMERIC(12,2) DEFAULT 0,
            total_sangrias NUMERIC(12,2) DEFAULT 0,
            total_suprimentos NUMERIC(12,2) DEFAULT 0,
            diferenca NUMERIC(12,2),
            status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado', 'suspenso')),
            observacoes TEXT,
            observacoes_fechamento TEXT,
            valor_esperado NUMERIC(12,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Habilitar RLS
        ALTER TABLE public.abertura_caixa ENABLE ROW LEVEL SECURITY;

        -- Criar políticas
        CREATE POLICY "Users can view abertura_caixa" 
        ON public.abertura_caixa FOR SELECT 
        TO authenticated 
        USING (true);

        CREATE POLICY "Users can insert abertura_caixa" 
        ON public.abertura_caixa FOR INSERT 
        TO authenticated 
        WITH CHECK (true);

        CREATE POLICY "Users can update abertura_caixa" 
        ON public.abertura_caixa FOR UPDATE 
        TO authenticated 
        USING (true);

        -- Criar índices
        CREATE INDEX idx_abertura_caixa_usuario ON public.abertura_caixa(usuario_id);
        CREATE INDEX idx_abertura_caixa_status ON public.abertura_caixa(status);
        CREATE INDEX idx_abertura_caixa_data ON public.abertura_caixa(data_abertura);
        
        RAISE NOTICE 'Tabela abertura_caixa criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela abertura_caixa já existe';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar a tabela imediatamente
SELECT create_abertura_caixa_table();

-- Criar função para obter caixa ativo (alternativa à edge function)
CREATE OR REPLACE FUNCTION get_caixa_ativo()
RETURNS TABLE (
    id UUID,
    usuario_id UUID,
    data_abertura TIMESTAMP WITH TIME ZONE,
    valor_inicial NUMERIC(12,2),
    total_vendas NUMERIC(12,2),
    status TEXT,
    observacoes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.id,
        ac.usuario_id,
        ac.data_abertura,
        ac.valor_inicial,
        ac.total_vendas,
        ac.status,
        ac.observacoes
    FROM public.abertura_caixa ac
    WHERE ac.status = 'aberto'
    ORDER BY ac.data_abertura DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 