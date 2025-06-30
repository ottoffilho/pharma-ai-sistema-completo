-- =====================================================
-- MIGRAÇÃO: Sistema de Vendas Completo
-- Data: 2025-06-25
-- Descrição: Cria tabelas para sistema de vendas/PDV
-- =====================================================

-- 1. CRIAR TIPOS ENUM
-- =====================================================

-- Tipo para status da venda
CREATE TYPE IF NOT EXISTS status_venda AS ENUM ('rascunho', 'aberta', 'finalizada', 'cancelada');

-- Tipo para forma de pagamento
CREATE TYPE IF NOT EXISTS forma_pagamento AS ENUM ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'convenio');

-- Tipo para status de pagamento
CREATE TYPE IF NOT EXISTS status_pagamento AS ENUM ('pendente', 'parcial', 'pago', 'cancelado');

-- 2. CRIAR TABELA VENDAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    numero_venda TEXT UNIQUE NOT NULL,
    
    -- Cliente
    cliente_id UUID REFERENCES public.clientes(id),
    cliente_nome TEXT,
    cliente_documento TEXT,
    cliente_telefone TEXT,
    
    -- Valores
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    desconto_valor NUMERIC(12,2) DEFAULT 0,
    desconto_percentual NUMERIC(5,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    troco NUMERIC(12,2),
    
    -- Status
    status status_venda DEFAULT 'rascunho',
    status_pagamento status_pagamento DEFAULT 'pendente',
    
    -- Operação
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observacoes TEXT,
    
    -- Receita associada (se aplicável)
    receita_id UUID REFERENCES public.receitas_processadas(id),
    
    -- Caixa associado
    caixa_id UUID REFERENCES public.abertura_caixa(id),
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA ITENS_VENDA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.itens_venda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id),
    lote_id UUID REFERENCES public.lotes(id),
    
    -- Produto (cache para performance)
    produto_nome TEXT NOT NULL,
    produto_codigo TEXT,
    
    -- Quantidades e preços
    quantidade NUMERIC(10,3) NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL,
    preco_total NUMERIC(12,2) NOT NULL,
    
    -- Desconto específico do item
    desconto_valor NUMERIC(12,2) DEFAULT 0,
    desconto_percentual NUMERIC(5,2) DEFAULT 0,
    
    -- Observações específicas do item
    observacoes TEXT,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA PAGAMENTOS_VENDA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pagamentos_venda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamento
    venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
    
    -- Pagamento
    forma_pagamento forma_pagamento NOT NULL,
    valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    
    -- Específicos para cartão
    numero_autorizacao TEXT,
    bandeira_cartao TEXT,
    
    -- Específicos para PIX/transferência
    codigo_transacao TEXT,
    
    -- Observações
    observacoes TEXT,
    
    -- Controle
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CONFIGURAR RLS
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_venda ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para vendas
CREATE POLICY "Usuários autenticados podem visualizar vendas" 
ON public.vendas FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem criar vendas" 
ON public.vendas FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar vendas" 
ON public.vendas FOR UPDATE 
TO authenticated 
USING (true);

-- Políticas para itens_venda
CREATE POLICY "Usuários autenticados podem visualizar itens de venda" 
ON public.itens_venda FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem criar itens de venda" 
ON public.itens_venda FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar itens de venda" 
ON public.itens_venda FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem excluir itens de venda" 
ON public.itens_venda FOR DELETE 
TO authenticated 
USING (true);

-- Políticas para pagamentos_venda
CREATE POLICY "Usuários autenticados podem visualizar pagamentos" 
ON public.pagamentos_venda FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem criar pagamentos" 
ON public.pagamentos_venda FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 6. CRIAR ÍNDICES
-- =====================================================

-- Índices para vendas
CREATE INDEX IF NOT EXISTS idx_vendas_numero ON public.vendas(numero_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON public.vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_usuario ON public.vendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON public.vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON public.vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_caixa ON public.vendas(caixa_id);

-- Índices para itens_venda
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda ON public.itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto ON public.itens_venda(produto_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_lote ON public.itens_venda(lote_id);

-- Índices para pagamentos_venda
CREATE INDEX IF NOT EXISTS idx_pagamentos_venda_venda ON public.pagamentos_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_forma ON public.pagamentos_venda(forma_pagamento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON public.pagamentos_venda(data_pagamento);

-- 7. CRIAR TRIGGERS
-- =====================================================

-- Trigger para updated_at
CREATE TRIGGER trigger_vendas_updated_at
    BEFORE UPDATE ON public.vendas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_itens_venda_updated_at
    BEFORE UPDATE ON public.itens_venda
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar totais da venda quando itens são modificados
CREATE OR REPLACE FUNCTION calcular_totais_venda()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular totais da venda
    UPDATE public.vendas 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(preco_total - desconto_valor), 0)
            FROM public.itens_venda 
            WHERE venda_id = COALESCE(NEW.venda_id, OLD.venda_id)
        ),
        total = (
            SELECT COALESCE(SUM(preco_total - desconto_valor), 0)
            FROM public.itens_venda 
            WHERE venda_id = COALESCE(NEW.venda_id, OLD.venda_id)
        ) - COALESCE(desconto_valor, 0),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.venda_id, OLD.venda_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nos eventos de itens
CREATE TRIGGER trigger_calcular_totais_venda_insert
    AFTER INSERT ON public.itens_venda
    FOR EACH ROW EXECUTE FUNCTION calcular_totais_venda();

CREATE TRIGGER trigger_calcular_totais_venda_update
    AFTER UPDATE ON public.itens_venda
    FOR EACH ROW EXECUTE FUNCTION calcular_totais_venda();

CREATE TRIGGER trigger_calcular_totais_venda_delete
    AFTER DELETE ON public.itens_venda
    FOR EACH ROW EXECUTE FUNCTION calcular_totais_venda();

-- 8. GRANT PERMISSIONS
-- =====================================================

-- Conceder permissões para usuários autenticados
GRANT ALL ON public.vendas TO authenticated;
GRANT ALL ON public.itens_venda TO authenticated;
GRANT ALL ON public.pagamentos_venda TO authenticated;

-- Conceder permissões para service_role
GRANT ALL ON public.vendas TO service_role;
GRANT ALL ON public.itens_venda TO service_role;
GRANT ALL ON public.pagamentos_venda TO service_role;

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.vendas IS 'Vendas realizadas no PDV';
COMMENT ON TABLE public.itens_venda IS 'Itens de cada venda';
COMMENT ON TABLE public.pagamentos_venda IS 'Formas de pagamento de cada venda';

-- LOG DE SUCESSO
SELECT 'Sistema de vendas criado com sucesso!' as status;