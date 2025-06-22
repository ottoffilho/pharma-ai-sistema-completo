-- =====================================================
-- MIGRAÇÃO: Atualizar FK raw_recipe_id → receitas_brutas
-- Data: 2025-05-31
-- Descrição: A coluna raw_recipe_id em receitas_processadas ainda referencia
--            a tabela legada receitas_raw. Esta migração remove a constraint
--            antiga e cria uma nova apontando para receitas_brutas, que é a
--            tabela atual de uploads de receitas.
-- =====================================================

-- 1. Remover constraint antiga (se existir)
ALTER TABLE public.receitas_processadas
  DROP CONSTRAINT IF EXISTS receitas_processadas_raw_recipe_id_fkey;

-- 2. Garantir tipo UUID (caso collation tenha mudado)
ALTER TABLE public.receitas_processadas
  ALTER COLUMN raw_recipe_id TYPE UUID USING raw_recipe_id::uuid;

-- 3. Criar nova constraint apontando para receitas_brutas
ALTER TABLE public.receitas_processadas
  ADD CONSTRAINT receitas_processadas_raw_recipe_id_fkey
  FOREIGN KEY (raw_recipe_id)
  REFERENCES public.receitas_brutas(id)
  ON DELETE CASCADE;

-- 4. Conceder REFERENCES à role authenticated (caso necessário)
GRANT REFERENCES ON TABLE public.receitas_brutas TO authenticated;

SELECT 'FK de receitas_processadas atualizada para receitas_brutas' AS status; 