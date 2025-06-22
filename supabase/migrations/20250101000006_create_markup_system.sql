-- Migração: Sistema de Markup e Precificação
-- Data: 2025-01-01
-- Versão: 1.0.0

-- =====================================================
-- 1. ADICIONAR CAMPOS DE MARKUP À TABELA PRODUTOS
-- =====================================================

-- A tabela produtos já possui os campos de markup criados na migração de unificação
-- Garantir que os campos existem
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS markup NUMERIC(6,2) DEFAULT 6.00;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS markup_personalizado BOOLEAN DEFAULT FALSE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS data_ultima_atualizacao_preco TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- 2. CRIAR TABELAS DO SISTEMA DE MARKUP
-- =====================================================

-- Configuração global de markup
CREATE TABLE IF NOT EXISTS configuracao_markup (
  id SERIAL PRIMARY KEY,
  markup_global_padrao NUMERIC(6,2) DEFAULT 6.00,
  markup_minimo NUMERIC(6,2) DEFAULT 1.50,
  markup_maximo NUMERIC(6,2) DEFAULT 20.00,
  permitir_markup_zero BOOLEAN DEFAULT FALSE,
  aplicar_automatico_importacao BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Markup por categoria
CREATE TABLE IF NOT EXISTS categoria_markup (
  id SERIAL PRIMARY KEY,
  categoria_nome VARCHAR(100) NOT NULL UNIQUE,
  markup_padrao NUMERIC(6,2) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de alterações de preço
CREATE TABLE IF NOT EXISTS historico_precos (
  id SERIAL PRIMARY KEY,
  entidade_tipo VARCHAR(50) NOT NULL, -- 'produto'
  entidade_id UUID NOT NULL,
  preco_custo_anterior NUMERIC(10,2),
  preco_custo_novo NUMERIC(10,2),
  markup_anterior NUMERIC(6,2),
  markup_novo NUMERIC(6,2),
  preco_venda_anterior NUMERIC(10,2),
  preco_venda_novo NUMERIC(10,2),
  motivo VARCHAR(255),
  usuario_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CRIAR FUNÇÕES DE CÁLCULO
-- =====================================================

-- Função para calcular preço de venda automaticamente
CREATE OR REPLACE FUNCTION calcular_preco_venda()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular preço de venda quando markup ou preço de custo mudar
  IF NEW.custo_unitario IS NOT NULL AND NEW.markup IS NOT NULL THEN
    NEW.preco_venda = ROUND(NEW.custo_unitario * NEW.markup, 2);
    NEW.data_ultima_atualizacao_preco = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar histórico de alterações de preço
CREATE OR REPLACE FUNCTION registrar_historico_preco()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.custo_unitario != NEW.custo_unitario OR 
    OLD.markup != NEW.markup OR 
    OLD.preco_venda != NEW.preco_venda
  ) THEN
    INSERT INTO historico_precos (
      entidade_tipo,
      entidade_id,
      preco_custo_anterior,
      preco_custo_novo,
      markup_anterior,
      markup_novo,
      preco_venda_anterior,
      preco_venda_novo,
      usuario_id
    ) VALUES (
      'produto',
      NEW.id,
      OLD.custo_unitario,
      NEW.custo_unitario,
      OLD.markup,
      NEW.markup,
      OLD.preco_venda,
      NEW.preco_venda,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CRIAR TRIGGERS
-- =====================================================

-- Triggers para calcular preço de venda automaticamente
DROP TRIGGER IF EXISTS trigger_calcular_preco_venda_produtos ON produtos;
CREATE TRIGGER trigger_calcular_preco_venda_produtos
  BEFORE INSERT OR UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION calcular_preco_venda();

-- Triggers para registrar histórico de alterações
DROP TRIGGER IF EXISTS trigger_historico_preco_produtos ON produtos;
CREATE TRIGGER trigger_historico_preco_produtos
  AFTER UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION registrar_historico_preco();

-- =====================================================
-- 5. INSERIR DADOS INICIAIS
-- =====================================================

-- Configuração global padrão
INSERT INTO configuracao_markup (
  markup_global_padrao,
  markup_minimo,
  markup_maximo,
  permitir_markup_zero,
  aplicar_automatico_importacao
) VALUES (
  6.00,
  1.50,
  20.00,
  FALSE,
  TRUE
) ON CONFLICT DO NOTHING;

-- Categorias de markup padrão
INSERT INTO categoria_markup (categoria_nome, markup_padrao) VALUES
  ('medicamentos', 6.00),
  ('homeopaticos', 6.50),
  ('florais', 7.00),
  ('cosmeticos', 8.00),
  ('suplementos', 10.00),
  ('manipulados', 12.00),
  ('embalagens', 5.00),
  ('insumos', 5.50),
  ('materias_primas_raras', 15.00)
ON CONFLICT (categoria_nome) DO NOTHING;

-- =====================================================
-- 6. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE configuracao_markup ENABLE ROW LEVEL SECURITY;
ALTER TABLE categoria_markup ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_precos ENABLE ROW LEVEL SECURITY;

-- Políticas para configuracao_markup
CREATE POLICY "Configuração markup - Leitura" ON configuracao_markup 
  FOR SELECT USING (true);

CREATE POLICY "Configuração markup - Atualização Admin" ON configuracao_markup 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      JOIN perfis_usuario p ON u.perfil_id = p.id
      WHERE u.supabase_auth_id = auth.uid() 
      AND p.tipo IN ('PROPRIETARIO', 'FARMACEUTICO')
      AND u.ativo = TRUE
    )
  );

-- Políticas para categoria_markup
CREATE POLICY "Categoria markup - Leitura" ON categoria_markup 
  FOR SELECT USING (true);

CREATE POLICY "Categoria markup - Modificação Admin" ON categoria_markup 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      JOIN perfis_usuario p ON u.perfil_id = p.id
      WHERE u.supabase_auth_id = auth.uid() 
      AND p.tipo IN ('PROPRIETARIO', 'FARMACEUTICO')
      AND u.ativo = TRUE
    )
  );

-- Políticas para historico_precos
CREATE POLICY "Histórico preços - Leitura" ON historico_precos 
  FOR SELECT USING (true);

CREATE POLICY "Histórico preços - Inserção" ON historico_precos 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 7. ATUALIZAR TRIGGER DE UPDATED_AT
-- =====================================================

-- Trigger para updated_at em configuracao_markup
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_updated_at_configuracao_markup ON configuracao_markup;
CREATE TRIGGER trigger_updated_at_configuracao_markup
  BEFORE UPDATE ON configuracao_markup
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_updated_at_categoria_markup ON categoria_markup;
CREATE TRIGGER trigger_updated_at_categoria_markup
  BEFORE UPDATE ON categoria_markup
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE configuracao_markup IS 'Configurações globais do sistema de markup';
COMMENT ON TABLE categoria_markup IS 'Markups padrão por categoria de produto';
COMMENT ON TABLE historico_precos IS 'Histórico de alterações de preços e markups';

COMMENT ON FUNCTION calcular_preco_venda() IS 'Calcula automaticamente o preço de venda baseado no custo e markup';
COMMENT ON FUNCTION registrar_historico_preco() IS 'Registra alterações de preço no histórico'; 