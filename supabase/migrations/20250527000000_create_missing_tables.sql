-- =====================================================
-- MIGRAÇÃO: Criar tabelas faltantes
-- Data: 2024-05-27
-- Descrição: Cria tabelas necessárias que foram excluídas
-- =====================================================

-- 1. Criar tabela usuarios_internos
CREATE TABLE IF NOT EXISTS public.usuarios_internos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_completo TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cargo_perfil TEXT NOT NULL,
  data_admissao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  telefone TEXT,
  endereco TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar comentários
COMMENT ON TABLE public.usuarios_internos IS 'Tabela com informações de usuários internos da farmácia';

-- Configurar RLS
ALTER TABLE public.usuarios_internos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar" 
ON public.usuarios_internos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Apenas administradores podem inserir" 
ON public.usuarios_internos FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IN (SELECT auth.users.id FROM auth.users WHERE auth.users.role = 'admin'));

CREATE POLICY "Apenas administradores podem atualizar" 
ON public.usuarios_internos FOR UPDATE 
TO authenticated 
USING (auth.uid() IN (SELECT auth.users.id FROM auth.users WHERE auth.users.role = 'admin'));

-- 2. Criar tabela receitas_processadas
CREATE TABLE IF NOT EXISTS public.receitas_processadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_name TEXT NOT NULL,
  medications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configurar RLS
ALTER TABLE public.receitas_processadas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar receitas" 
ON public.receitas_processadas FOR SELECT 
TO authenticated 
USING (true);

-- 3. Criar tabela ordens_producao
CREATE TABLE IF NOT EXISTS public.ordens_producao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_ordem TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_preparacao', 'em_manipulacao', 'controle_qualidade', 'finalizada', 'cancelada')),
  prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  receita_id UUID REFERENCES public.receitas_processadas(id),
  usuario_responsavel_id UUID REFERENCES public.usuarios_internos(id),
  farmaceutico_responsavel_id UUID REFERENCES public.usuarios_internos(id),
  observacoes_gerais TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_finalizacao TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configurar RLS
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar ordens" 
ON public.ordens_producao FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir ordens" 
ON public.ordens_producao FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar ordens" 
ON public.ordens_producao FOR UPDATE 
TO authenticated 
USING (true);

-- 4. LOG DE SUCESSO
SELECT 'Tabelas faltantes criadas com sucesso!' as status; 