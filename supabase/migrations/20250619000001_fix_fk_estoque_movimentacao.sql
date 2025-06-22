-- =====================================================
-- MIGRAÇÃO: Corrigir FK da tabela estoque_movimentacao
-- Data: 2025-06-19
-- Descrição: Altera a foreign key produto_id para referenciar public.produtos(id)
-- =====================================================

BEGIN;

-- Remover constraint antiga (se existir)
ALTER TABLE IF EXISTS public.estoque_movimentacao
  DROP CONSTRAINT IF EXISTS estoque_movimentacao_produto_id_fkey;

-- Criar nova constraint apontando para produtos
ALTER TABLE public.estoque_movimentacao
  ADD CONSTRAINT estoque_movimentacao_produto_id_fkey
  FOREIGN KEY (produto_id)
  REFERENCES public.produtos(id)
  ON DELETE CASCADE;

COMMIT; 