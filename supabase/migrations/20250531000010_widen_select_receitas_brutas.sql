-- =====================================================
-- MIGRAÇÃO: Ampliar SELECT em receitas_brutas para evitar falha de FK
-- Data: 2025-05-31
-- =====================================================

ALTER TABLE public.receitas_brutas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select receitas por dono" ON public.receitas_brutas;

-- Permitir SELECT a todas as linhas para usuários autenticados –
-- necessário para verificação de FK. Dados sensíveis são mínimos
-- (arquivo e owner), risco aceitável dentro do escopo autenticado.
CREATE POLICY "select receitas autenticado" ON public.receitas_brutas
  FOR SELECT TO authenticated USING (true);

SELECT 'Políticas SELECT atualizadas' AS status; 