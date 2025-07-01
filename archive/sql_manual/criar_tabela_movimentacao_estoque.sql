-- Criar tabela de movimentação de estoque
CREATE TABLE IF NOT EXISTS estoque_movimentacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID REFERENCES insumos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade DECIMAL(10,3) NOT NULL,
  quantidade_anterior DECIMAL(10,3),
  quantidade_nova DECIMAL(10,3),
  motivo TEXT,
  documento_referencia VARCHAR(100),
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacao_produto_id ON estoque_movimentacao(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacao_tipo ON estoque_movimentacao(tipo);
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacao_created_at ON estoque_movimentacao(created_at);

-- Habilitar RLS
ALTER TABLE estoque_movimentacao ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Usuários podem ler movimentações" ON estoque_movimentacao
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Usuários podem criar movimentações" ON estoque_movimentacao
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_estoque_movimentacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_estoque_movimentacao_updated_at
  BEFORE UPDATE ON estoque_movimentacao
  FOR EACH ROW
  EXECUTE FUNCTION update_estoque_movimentacao_updated_at(); 