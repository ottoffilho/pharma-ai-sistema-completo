-- Migração para adicionar campos de armazenamento do XML na tabela notas_fiscais
-- Data: 2025-01-31
-- Descrição: Adiciona campos para armazenar informações do arquivo XML importado

-- Adicionar campos para informações do arquivo XML
ALTER TABLE public.notas_fiscais 
ADD COLUMN IF NOT EXISTS xml_arquivo_path TEXT,
ADD COLUMN IF NOT EXISTS xml_arquivo_nome TEXT,
ADD COLUMN IF NOT EXISTS xml_arquivo_tamanho BIGINT;

-- Comentários para documentação
COMMENT ON COLUMN public.notas_fiscais.xml_arquivo_path IS 'Caminho do arquivo XML no storage';
COMMENT ON COLUMN public.notas_fiscais.xml_arquivo_nome IS 'Nome original do arquivo XML importado';
COMMENT ON COLUMN public.notas_fiscais.xml_arquivo_tamanho IS 'Tamanho do arquivo XML em bytes';

-- Atualizar timestamp de modificação da tabela
UPDATE public.notas_fiscais SET updated_at = NOW() WHERE xml_arquivo_path IS NULL; 