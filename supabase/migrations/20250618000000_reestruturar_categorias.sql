-- =====================================================
-- MIGRAÇÃO: Reestruturar categorias para 4 tipos
-- Data: 2025-06-18
-- Descrição: Simplificar categorias de 10 para 4 tipos principais
-- Baseado em: prompt/resumos_contexto.md
-- =====================================================

-- 1) Limpar tabelas de categoria existentes (DB está zerado)
TRUNCATE public.categoria_produto RESTART IDENTITY CASCADE;
TRUNCATE public.categoria_markup RESTART IDENTITY CASCADE;

-- 2) Inserir as 4 novas categorias
INSERT INTO public.categoria_produto (nome, ativo)
VALUES  ('alopaticos', true),
        ('embalagens', true),
        ('homeopaticos', true),
        ('revenda', true);

INSERT INTO public.categoria_markup (categoria_nome, markup_padrao, ativo)
VALUES  ('alopaticos', 2.2, true),
        ('embalagens', 1.8, true),
        ('homeopaticos', 2.5, true),
        ('revenda', 1.6, true);

-- 3) Reaplicar RLS (caso use políticas anteriores)
ALTER TABLE public.categoria_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categoria_markup ENABLE ROW LEVEL SECURITY;

-- 4) Atualizar políticas se necessário
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar categorias" ON public.categoria_produto;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir categorias" ON public.categoria_produto;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar categorias" ON public.categoria_produto;
DROP POLICY IF EXISTS "Categoria markup - Leitura" ON public.categoria_markup;
DROP POLICY IF EXISTS "Categoria markup - Modificação Admin" ON public.categoria_markup;

-- Recriar políticas
CREATE POLICY "Usuários autenticados podem visualizar categorias" 
ON public.categoria_produto FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir categorias" 
ON public.categoria_produto FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar categorias" 
ON public.categoria_produto FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Categoria markup - Leitura" ON public.categoria_markup 
FOR SELECT USING (true);

CREATE POLICY "Categoria markup - Modificação Admin" ON public.categoria_markup 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM usuarios u 
    JOIN perfis_usuario p ON u.perfil_id = p.id
    WHERE u.supabase_auth_id = auth.uid() 
    AND p.tipo IN ('PROPRIETARIO', 'FARMACEUTICO')
    AND u.ativo = TRUE
  )
);

-- 5) LOG DE SUCESSO
SELECT 'Categorias reestruturadas para 4 tipos principais!' as status,
       'alopaticos, embalagens, homeopaticos, revenda' as categorias_criadas; 