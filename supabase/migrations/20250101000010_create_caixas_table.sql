-- =====================================================
-- Migração: Criar tabela caixas para controle de caixa PDV
-- Data: 2025-01-01
-- =====================================================

-- Criar tabela caixas
CREATE TABLE IF NOT EXISTS caixas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    valor_abertura DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_fechamento DECIMAL(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
    observacoes_abertura TEXT,
    observacoes_fechamento TEXT,
    data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    data_fechamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_caixas_usuario_id ON caixas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_caixas_status ON caixas(status);
CREATE INDEX IF NOT EXISTS idx_caixas_data_abertura ON caixas(data_abertura);

-- RLS (Row Level Security)
ALTER TABLE caixas ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver seus próprios caixas
CREATE POLICY "Usuários podem ver próprios caixas" ON caixas
    FOR ALL USING (auth.uid() = usuario_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_caixas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_caixas_updated_at
    BEFORE UPDATE ON caixas
    FOR EACH ROW
    EXECUTE FUNCTION update_caixas_updated_at();

-- Comentários
COMMENT ON TABLE caixas IS 'Controle de abertura e fechamento de caixa para PDV';
COMMENT ON COLUMN caixas.valor_abertura IS 'Valor em dinheiro na abertura do caixa';
COMMENT ON COLUMN caixas.valor_fechamento IS 'Valor em dinheiro no fechamento do caixa';
COMMENT ON COLUMN caixas.status IS 'Status do caixa: aberto ou fechado'; 