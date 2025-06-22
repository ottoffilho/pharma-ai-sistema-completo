-- =====================================================
-- MIGRAÇÃO: Popular coluna categoria com 4 categorias simplificadas
-- Data: 2025-06-18
-- Descrição: Atualiza registros pré-existentes na tabela produtos para
-- preencher a coluna categoria conforme novas regras (alopaticos,
-- embalagens, homeopaticos, revenda) usando o valor existente em 'tipo'.
-- =====================================================

-- 1. Adicionar coluna categoria se ainda não existir (garantia)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name   = 'produtos' 
      AND column_name  = 'categoria'
  ) THEN
    ALTER TABLE public.produtos ADD COLUMN categoria VARCHAR(50);
  END IF;
END$$;

-- 2. Preencher categoria baseado no campo tipo legado
UPDATE public.produtos
SET categoria = CASE
  WHEN tipo = 'EMBALAGEM' THEN 'embalagens'
  WHEN tipo IN ('MATERIA_PRIMA','INSUMO','MEDICAMENTO','COSMÉTICO') THEN 'alopaticos'
  WHEN tipo = 'HOMEOPATICO' THEN 'homeopaticos'
  ELSE 'revenda'
END
WHERE categoria IS NULL OR categoria = '';

-- 3. Garantir valor default para novos inserts (fallback revenda)
ALTER TABLE public.produtos
  ALTER COLUMN categoria SET DEFAULT 'revenda';

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_simplificada ON public.produtos(categoria);

-- 5. Comentário
COMMENT ON COLUMN public.produtos.categoria IS 'Categoria simplificada para markup: embalagens, alopaticos, homeopaticos, revenda'; 