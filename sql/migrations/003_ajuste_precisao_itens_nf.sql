-- Ajusta a precisão das colunas na tabela itens_nota_fiscal para alinhar com o padrão da NF-e.
-- O padrão da NF-e permite até 4 casas decimais para quantidade e 10 para valor unitário.

-- Altera as colunas de quantidade para suportar 4 casas decimais.
ALTER TABLE public.itens_nota_fiscal
ALTER COLUMN quantidade_comercial TYPE numeric(15, 4);

ALTER TABLE public.itens_nota_fiscal
ALTER COLUMN quantidade_tributaria TYPE numeric(15, 4);

-- Altera as colunas de valor unitário para suportar 10 casas decimais.
ALTER TABLE public.itens_nota_fiscal
ALTER COLUMN valor_unitario_comercial TYPE numeric(21, 10);

ALTER TABLE public.itens_nota_fiscal
ALTER COLUMN valor_unitario_tributario TYPE numeric(21, 10);

-- Adiciona um comentário na tabela para registrar a mudança.
COMMENT ON TABLE public.itens_nota_fiscal IS 'Estrutura de colunas de quantidade e valor ajustada para o padrão NF-e em 2025-06-30.';
