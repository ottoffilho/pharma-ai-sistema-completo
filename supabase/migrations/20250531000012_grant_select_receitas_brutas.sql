-- =====================================================
-- MIGRAÇÃO: Conceder SELECT em receitas_brutas ao role authenticated
-- Data: 2025-05-31
-- =====================================================

GRANT SELECT ON public.receitas_brutas TO authenticated;

SELECT 'Grant SELECT receitas_brutas → authenticated' AS status; 