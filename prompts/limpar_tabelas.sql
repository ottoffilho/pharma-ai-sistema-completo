-- Script para limpar as tabelas de importação de Nota Fiscal
-- Use este script no Editor SQL do Supabase para limpar os dados antes de uma nova importação.
-- O comando TRUNCATE é mais eficiente que o DELETE e reinicia os contadores de ID.
-- RESTART IDENTITY reinicia as sequências de ID (ex: id 1, 2, 3...).
-- CASCADE remove automaticamente os registros em tabelas dependentes.

TRUNCATE TABLE 
    public.produtos, 
    public.notas_fiscais, 
    public.itens_nota_fiscal, 
    public.lote
RESTART IDENTITY CASCADE;
