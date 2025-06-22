-- =====================================================
-- MIGRAÇÃO: Ajustar tabela receitas_processadas
-- Data: 2025-05-31
-- Descrição: Adiciona colunas e constraints usadas pelo frontend/Edge
-- =====================================================

-- 1. Garantir extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Adicionar colunas faltantes, se não existirem
ALTER TABLE public.receitas_processadas
  ADD COLUMN IF NOT EXISTS raw_recipe_id UUID UNIQUE REFERENCES public.receitas_brutas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS processed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending','validated','rejected')),
  ADD COLUMN IF NOT EXISTS validation_notes TEXT,
  ADD COLUMN IF NOT EXISTS raw_ia_output JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 3. Criar índice útil
CREATE INDEX IF NOT EXISTS receitas_processadas_raw_recipe_id_idx ON public.receitas_processadas(raw_recipe_id);

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at_receitas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_updated_at_receitas ON public.receitas_processadas;
CREATE TRIGGER set_timestamp_updated_at_receitas
  BEFORE UPDATE ON public.receitas_processadas
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_timestamp_updated_at_receitas();

-- 5. Habilitar RLS se ainda não
ALTER TABLE public.receitas_processadas ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS (se já existirem serão ignoradas)
DROP POLICY IF EXISTS "Usuário vê suas receitas processadas" ON public.receitas_processadas;
DROP POLICY IF EXISTS "Usuário insere receitas processadas" ON public.receitas_processadas;
DROP POLICY IF EXISTS "Usuário atualiza receitas processadas" ON public.receitas_processadas;

CREATE POLICY "Usuário vê suas receitas processadas" ON public.receitas_processadas
  FOR SELECT USING (auth.uid() = processed_by_user_id);

CREATE POLICY "Usuário insere receitas processadas" ON public.receitas_processadas
  FOR INSERT WITH CHECK (auth.uid() = processed_by_user_id);

CREATE POLICY "Usuário atualiza receitas processadas" ON public.receitas_processadas
  FOR UPDATE USING (auth.uid() = processed_by_user_id);

-- 7. Log
SELECT 'Tabela receitas_processadas ajustada com sucesso!' AS status; 