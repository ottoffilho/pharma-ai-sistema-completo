-- =====================================================
-- MIGRAÇÃO: Criar tabela forma_farmaceutica
-- Data: 2024-05-28
-- Descrição: Cria tabela para formas farmacêuticas
-- =====================================================

-- 1. Criar tabela forma_farmaceutica
CREATE TABLE IF NOT EXISTS public.forma_farmaceutica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    sigla VARCHAR(10),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar comentários
COMMENT ON TABLE public.forma_farmaceutica IS 'Tabela para formas farmacêuticas de medicamentos';

-- Configurar RLS
ALTER TABLE public.forma_farmaceutica ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar erros
DO $$ 
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem visualizar formas" ON public.forma_farmaceutica;
    EXCEPTION WHEN undefined_object THEN
        -- Ignora se a política não existir
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem inserir formas" ON public.forma_farmaceutica;
    EXCEPTION WHEN undefined_object THEN
        -- Ignora se a política não existir
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Usuários autenticados podem atualizar formas" ON public.forma_farmaceutica;
    EXCEPTION WHEN undefined_object THEN
        -- Ignora se a política não existir
    END;
END $$;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar formas" 
ON public.forma_farmaceutica FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir formas" 
ON public.forma_farmaceutica FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar formas" 
ON public.forma_farmaceutica FOR UPDATE 
TO authenticated 
USING (true);

-- Criar índice para buscas por nome
CREATE INDEX IF NOT EXISTS idx_forma_farmaceutica_nome 
ON public.forma_farmaceutica(nome);

CREATE INDEX IF NOT EXISTS idx_forma_farmaceutica_sigla
ON public.forma_farmaceutica(sigla);

-- Criar trigger para atualização automática do updated_at
CREATE OR REPLACE FUNCTION update_forma_farmaceutica_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_forma_farmaceutica_timestamp ON forma_farmaceutica;

CREATE TRIGGER update_forma_farmaceutica_timestamp
BEFORE UPDATE ON forma_farmaceutica
FOR EACH ROW
EXECUTE FUNCTION update_forma_farmaceutica_updated_at();

-- 2. LOG DE SUCESSO
SELECT 'Tabela forma_farmaceutica criada com sucesso!' as status; 