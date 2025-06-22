-- =====================================================
-- MIGRAÇÃO: Criar tabela receitas_brutas
-- Data: 2025-05-31
-- Descrição: Tabela para armazenar receitas brutas (arquivos enviados)
-- =====================================================

-- 1. Criar extensão UUID, caso não exista
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar tabela receitas_brutas
CREATE TABLE IF NOT EXISTS public.receitas_brutas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  upload_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'error', 'deleted')),
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'error')),
  ocr_text TEXT,
  ocr_confidence NUMERIC,
  ai_extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.receitas_brutas IS 'Armazena informações dos arquivos de receitas enviados pelos usuários antes do processamento por IA';

-- 3. Índices úteis
CREATE INDEX IF NOT EXISTS receitas_brutas_uploaded_by_user_id_idx ON public.receitas_brutas(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS receitas_brutas_processing_status_idx ON public.receitas_brutas(processing_status);

-- 4. Habilitar RLS
ALTER TABLE public.receitas_brutas ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
-- Visualização apenas pelo próprio usuário ou por role "service_role"
CREATE POLICY "Usuário vê apenas suas receitas" ON public.receitas_brutas
  FOR SELECT USING (auth.uid() = uploaded_by_user_id);

-- Inserção apenas pelo usuário autenticado (próprio registro)
CREATE POLICY "Usuário insere suas receitas" ON public.receitas_brutas
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by_user_id);

-- Atualização permitida se for o dono ou role service_role
CREATE POLICY "Usuário atualiza suas receitas" ON public.receitas_brutas
  FOR UPDATE USING (auth.uid() = uploaded_by_user_id);

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_updated_at ON public.receitas_brutas;
CREATE TRIGGER set_timestamp_updated_at
  BEFORE UPDATE ON public.receitas_brutas
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_timestamp_updated_at();

-- 7. LOG DE SUCESSO
SELECT 'Tabela receitas_brutas criada com sucesso!' AS status; 