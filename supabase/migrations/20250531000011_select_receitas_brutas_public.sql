-- =====================================================
-- MIGRAÇÃO: Tornar SELECT em receitas_brutas público (todas roles)
-- Data: 2025-05-31
-- =====================================================

ALTER TABLE public.receitas_brutas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select receitas autenticado" ON public.receitas_brutas;

CREATE POLICY "select receitas qualquer" ON public.receitas_brutas
  FOR SELECT USING (true);

SELECT 'Política SELECT para todas as roles aplicada' AS status; 