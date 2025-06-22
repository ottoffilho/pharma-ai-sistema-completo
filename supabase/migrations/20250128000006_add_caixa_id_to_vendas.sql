-- =====================================================
-- MIGRAÇÃO: Adicionar caixa_id à tabela vendas
-- Data: 2025-01-28
-- Descrição: Garante que vendas sejam associadas a um caixa
-- =====================================================

-- Verificar e adicionar coluna caixa_id se não existir
DO $$
BEGIN
    -- Adicionar coluna caixa_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendas' 
        AND column_name = 'caixa_id'
    ) THEN
        ALTER TABLE public.vendas ADD COLUMN caixa_id UUID;
        
        -- Adicionar foreign key para abertura_caixa
        ALTER TABLE public.vendas 
        ADD CONSTRAINT fk_vendas_caixa 
        FOREIGN KEY (caixa_id) REFERENCES public.abertura_caixa(id);
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_vendas_caixa_id ON public.vendas(caixa_id);
        
        RAISE NOTICE 'Coluna caixa_id adicionada à tabela vendas';
    ELSE
        RAISE NOTICE 'Coluna caixa_id já existe na tabela vendas';
    END IF;
END $$;

-- Função para associar vendas ao caixa ativo automaticamente
CREATE OR REPLACE FUNCTION associar_venda_caixa_ativo()
RETURNS TRIGGER AS $$
DECLARE
    caixa_ativo_id UUID;
BEGIN
    -- Apenas para inserções de vendas finalizadas
    IF TG_OP = 'INSERT' AND NEW.status = 'finalizada' AND NEW.caixa_id IS NULL THEN
        -- Buscar caixa ativo
        SELECT id INTO caixa_ativo_id
        FROM public.abertura_caixa
        WHERE status = 'aberto'
        ORDER BY data_abertura DESC
        LIMIT 1;
        
        -- Se encontrou caixa ativo, associar
        IF caixa_ativo_id IS NOT NULL THEN
            NEW.caixa_id = caixa_ativo_id;
            
            -- Registrar movimento no caixa
            INSERT INTO public.movimentos_caixa (
                abertura_caixa_id,
                usuario_id,
                venda_id,
                tipo,
                valor,
                descricao
            ) VALUES (
                caixa_ativo_id,
                NEW.usuario_id,
                NEW.id,
                'venda',
                NEW.total,
                'Venda #' || NEW.numero_venda
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para associar vendas automaticamente
DROP TRIGGER IF EXISTS trigger_associar_venda_caixa ON public.vendas;
CREATE TRIGGER trigger_associar_venda_caixa
    BEFORE INSERT OR UPDATE ON public.vendas
    FOR EACH ROW EXECUTE FUNCTION associar_venda_caixa_ativo();

-- Função para recalcular totais do caixa após venda
CREATE OR REPLACE FUNCTION recalcular_totais_caixa_venda()
RETURNS TRIGGER AS $$
BEGIN
    -- Se uma venda foi inserida/atualizada e tem caixa_id
    IF NEW.caixa_id IS NOT NULL THEN
        -- Recalcular total de vendas do caixa
        UPDATE public.abertura_caixa 
        SET 
            total_vendas = COALESCE((
                SELECT SUM(total) 
                FROM public.vendas 
                WHERE caixa_id = NEW.caixa_id 
                AND status = 'finalizada'
            ), 0),
            updated_at = NOW()
        WHERE id = NEW.caixa_id;
        
        -- Recalcular valor esperado
        UPDATE public.abertura_caixa 
        SET valor_esperado = valor_inicial + total_vendas + total_suprimentos - total_sangrias
        WHERE id = NEW.caixa_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para recalcular totais
DROP TRIGGER IF EXISTS trigger_recalcular_totais_caixa_venda ON public.vendas;
CREATE TRIGGER trigger_recalcular_totais_caixa_venda
    AFTER INSERT OR UPDATE ON public.vendas
    FOR EACH ROW EXECUTE FUNCTION recalcular_totais_caixa_venda();

-- Grant permissions
GRANT EXECUTE ON FUNCTION associar_venda_caixa_ativo() TO authenticated;
GRANT EXECUTE ON FUNCTION recalcular_totais_caixa_venda() TO authenticated;
GRANT EXECUTE ON FUNCTION associar_venda_caixa_ativo() TO service_role;
GRANT EXECUTE ON FUNCTION recalcular_totais_caixa_venda() TO service_role; 