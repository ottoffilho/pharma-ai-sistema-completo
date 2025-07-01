-- =====================================================
-- MIGRAÇÃO: Tabela para Rate Limiting - Pharma.AI
-- Data: 2025-07-01
-- Descrição: Cria estrutura para controle de taxa de requisições
-- =====================================================

-- 1. CRIAR TABELA RATE_LIMITS
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_key TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_rate_limits_client_key ON rate_limits(client_key);
CREATE INDEX idx_rate_limits_created_at ON rate_limits(created_at);
CREATE INDEX idx_rate_limits_endpoint ON rate_limits(endpoint);

-- 3. POLÍTICA DE RETENÇÃO (limpar automaticamente registros antigos)
-- Criar função para limpar registros antigos
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
    -- Manter apenas últimas 24 horas
    DELETE FROM rate_limits 
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 4. RLS PARA SEGURANÇA (apenas service role pode acessar)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Política que permite apenas ao service role acessar
CREATE POLICY "Service role only" ON rate_limits
    FOR ALL 
    USING (auth.role() = 'service_role');

-- 5. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE rate_limits IS 'Controle de taxa de requisições para Edge Functions';
COMMENT ON COLUMN rate_limits.client_key IS 'Chave identificadora do cliente (IP, user_id, etc.)';
COMMENT ON COLUMN rate_limits.endpoint IS 'Endpoint da requisição';
COMMENT ON COLUMN rate_limits.user_agent IS 'User agent da requisição';

-- 6. LOG DE SUCESSO
SELECT 'Tabela rate_limits criada com sucesso!' as status;