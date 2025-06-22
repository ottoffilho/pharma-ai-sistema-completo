-- Migração: Correção do campo preco_custo na tabela embalagens
-- Data: 2025-06-15
-- Versão: 1.0.0

-- =====================================================
-- ADICIONAR O CAMPO PRECO_CUSTO À TABELA EMBALAGENS
-- =====================================================

-- Adicionar o campo preco_custo se não existir
ALTER TABLE embalagens ADD COLUMN IF NOT EXISTS preco_custo NUMERIC(10,2);

-- Copiar os dados existentes de custo_unitario para preco_custo
UPDATE embalagens SET preco_custo = custo_unitario WHERE preco_custo IS NULL;

-- =====================================================
-- CRIAR TRIGGER PARA SINCRONIZAÇÃO DOS CAMPOS
-- =====================================================

-- Função para manter os campos preco_custo e custo_unitario sincronizados
CREATE OR REPLACE FUNCTION sincronizar_campos_custo_embalagens()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Em caso de INSERT, se apenas um dos campos estiver preenchido, copie para o outro
    IF NEW.preco_custo IS NULL AND NEW.custo_unitario IS NOT NULL THEN
      NEW.preco_custo = NEW.custo_unitario;
    ELSIF NEW.custo_unitario IS NULL AND NEW.preco_custo IS NOT NULL THEN
      NEW.custo_unitario = NEW.preco_custo;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Em caso de UPDATE, se um dos campos foi atualizado, atualize o outro
    IF NEW.preco_custo != OLD.preco_custo AND NEW.custo_unitario = OLD.custo_unitario THEN
      NEW.custo_unitario = NEW.preco_custo;
    ELSIF NEW.custo_unitario != OLD.custo_unitario AND NEW.preco_custo = OLD.preco_custo THEN
      NEW.preco_custo = NEW.custo_unitario;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronizar os campos
DROP TRIGGER IF EXISTS trigger_sincronizar_custo_embalagens ON embalagens;
CREATE TRIGGER trigger_sincronizar_custo_embalagens
  BEFORE INSERT OR UPDATE ON embalagens
  FOR EACH ROW EXECUTE FUNCTION sincronizar_campos_custo_embalagens();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN embalagens.preco_custo IS 'Preço de custo da embalagem, usado no cálculo do preço de venda via markup';
COMMENT ON FUNCTION sincronizar_campos_custo_embalagens() IS 'Mantém os campos preco_custo e custo_unitario sincronizados para compatibilidade'; 