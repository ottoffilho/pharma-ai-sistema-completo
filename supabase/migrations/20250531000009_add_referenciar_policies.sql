-- =====================================================
-- MIGRAÇÃO: Permitir referências FK a receitas_brutas
-- Data: 2025-05-31
-- Descrição: Adiciona política RLS FOR REFERENCES para permitir que o usuário
--            proprietário utilize a linha como FK em outras tabelas.
-- =====================================================

-- 1. Garantir que RLS esteja habilitado (caso rodado fora de ordem)
ALTER TABLE public.receitas_brutas ENABLE ROW LEVEL SECURITY;

-- 2. Remover política antiga se existir
DROP POLICY IF EXISTS "referenciar suas receitas" ON public.receitas_brutas;

-- 3. Criar política FOR REFERENCES
CREATE POLICY "referenciar suas receitas" ON public.receitas_brutas
  FOR REFERENCES USING (auth.uid() = uploaded_by_user_id);

-- 4. Log
SELECT 'Política FOR REFERENCES em receitas_brutas criada!' AS status; 