-- =====================================================
-- MIGRAÇÃO: Sistema de Caixa Completo
-- Data: 2025-01-28
-- Descrição: Cria tabelas e estruturas para controle de caixa
-- =====================================================

-- 1. CRIAR TIPOS ENUM
-- =====================================================

-- Tipo para status do caixa
CREATE TYPE status_caixa AS ENUM ('aberto', 'fechado', 'suspenso');

-- Tipo para tipos de movimento de caixa
CREATE TYPE tipo_movimento_caixa AS ENUM ('sangria', 'suprimento', 'venda', 'estorno');

-- 2. CRIAR TABELA ABERTURA_CAIXA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.abertura_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Usuário responsável
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    usuario_fechamento UUID REFERENCES auth.users(id),
    
    -- Controle de datas
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fechamento TIMESTAMP WITH TIME ZONE,
    
    -- Valores financeiros
    valor_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
    valor_final NUMERIC(12,2),
    
    -- Calculados automaticamente por triggers
    total_vendas NUMERIC(12,2) DEFAULT 0,
    total_sangrias NUMERIC(12,2) DEFAULT 0,
    total_suprimentos NUMERIC(12,2) DEFAULT 0,
    diferenca NUMERIC(12,2),
    
    -- Status e observações
    status status_caixa DEFAULT 'aberto',
    observacoes TEXT,
    observacoes_fechamento TEXT,
    
    -- Valor esperado (calculado)
    valor_esperado NUMERIC(12,2),
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA MOVIMENTOS_CAIXA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.movimentos_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referências
    abertura_caixa_id UUID NOT NULL REFERENCES public.abertura_caixa(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    venda_id UUID REFERENCES public.vendas(id),
    
    -- Dados do movimento
    tipo tipo_movimento_caixa NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    descricao TEXT,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CONFIGURAR RLS
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.abertura_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentos_caixa ENABLE ROW LEVEL SECURITY;

-- Políticas para abertura_caixa
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

-- Políticas para movimentos_caixa
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

-- 5. CRIAR ÍNDICES
-- =====================================================

-- Índices para abertura_caixa
CREATE INDEX IF NOT EXISTS idx_abertura_caixa_usuario ON public.abertura_caixa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_abertura_caixa_status ON public.abertura_caixa(status);
CREATE INDEX IF NOT EXISTS idx_abertura_caixa_data_abertura ON public.abertura_caixa(data_abertura);
CREATE INDEX IF NOT EXISTS idx_abertura_caixa_data_fechamento ON public.abertura_caixa(data_fechamento);

-- Índices para movimentos_caixa
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_abertura ON public.movimentos_caixa(abertura_caixa_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_usuario ON public.movimentos_caixa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_tipo ON public.movimentos_caixa(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_venda ON public.movimentos_caixa(venda_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_data ON public.movimentos_caixa(created_at);

-- 6. CRIAR FUNÇÕES DE TRIGGERS
-- =====================================================

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

-- Função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. CRIAR TRIGGERS
-- =====================================================

-- Trigger para calcular totais quando movimento é inserido/atualizado
CREATE TRIGGER trigger_calcular_totais_caixa_movimento
    AFTER INSERT OR UPDATE ON public.movimentos_caixa
    FOR EACH ROW EXECUTE FUNCTION calcular_totais_caixa();

-- Trigger para updated_at na abertura_caixa
CREATE TRIGGER trigger_updated_at_abertura_caixa
    BEFORE UPDATE ON public.abertura_caixa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular diferença no fechamento
CREATE TRIGGER trigger_calcular_diferenca_fechamento
    BEFORE UPDATE ON public.abertura_caixa
    FOR EACH ROW EXECUTE FUNCTION calcular_totais_caixa();

-- 8. ADICIONAR COLUNA CAIXA_ID NA TABELA VENDAS (SE NÃO EXISTIR)
-- =====================================================

-- Verificar e adicionar coluna caixa_id na tabela vendas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendas' 
        AND column_name = 'caixa_id'
    ) THEN
        ALTER TABLE public.vendas ADD COLUMN caixa_id UUID REFERENCES public.abertura_caixa(id);
        CREATE INDEX IF NOT EXISTS idx_vendas_caixa ON public.vendas(caixa_id);
    END IF;
END $$;

-- 9. FUNÇÃO PARA VERIFICAR CAIXA ABERTO
-- =====================================================

CREATE OR REPLACE FUNCTION verificar_caixa_aberto()
RETURNS UUID AS $$
DECLARE
    caixa_id UUID;
BEGIN
    SELECT id INTO caixa_id
    FROM public.abertura_caixa
    WHERE status = 'aberto'
    ORDER BY data_abertura DESC
    LIMIT 1;
    
    RETURN caixa_id;
END;
$$ LANGUAGE plpgsql;

-- 10. GRANT PERMISSIONS
-- =====================================================

-- Conceder permissões para usuários autenticados
GRANT ALL ON public.abertura_caixa TO authenticated;
GRANT ALL ON public.movimentos_caixa TO authenticated;
GRANT EXECUTE ON FUNCTION verificar_caixa_aberto() TO authenticated;
GRANT EXECUTE ON FUNCTION calcular_totais_caixa() TO authenticated;

-- Conceder permissões para service_role
GRANT ALL ON public.abertura_caixa TO service_role;
GRANT ALL ON public.movimentos_caixa TO service_role;
GRANT ALL ON FUNCTION verificar_caixa_aberto() TO service_role;
GRANT ALL ON FUNCTION calcular_totais_caixa() TO service_role; 