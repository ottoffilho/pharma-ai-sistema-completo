-- 20250617000021_trigger_create_ordem_producao.sql
-- Cria função e trigger para gerar ordem de produção automaticamente
-- quando um novo registro é inserido em public.pedidos.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela ordens_producao deve existir. Caso não, informe via README.

CREATE OR REPLACE FUNCTION public.create_ordem_from_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_numero TEXT;
BEGIN
  -- Gera numero_ordem sequencial  OP000001
  SELECT 'OP' || LPAD(COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM '[0-9]+') AS INTEGER)),0)+1::text,6,'0')
  INTO new_numero
  FROM public.ordens_producao;

  INSERT INTO public.ordens_producao (
    pedido_id,
    receita_processada_id,
    numero_ordem,
    status,
    prioridade,
    data_criacao,
    is_deleted
  ) VALUES (
    NEW.id,
    NEW.processed_recipe_id,
    new_numero,
    'pendente',
    'normal',
    NOW(),
    FALSE
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_ordem_after_pedido ON public.pedidos;
CREATE TRIGGER trg_create_ordem_after_pedido
AFTER INSERT ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.create_ordem_from_pedido();

-- Backfill para pedidos existentes sem ordem
INSERT INTO public.ordens_producao (
  pedido_id,
  receita_processada_id,
  numero_ordem,
  status,
  prioridade,
  data_criacao,
  is_deleted
)
SELECT p.id,
       p.processed_recipe_id,
       'OP' || LPAD(row_number() OVER (ORDER BY p.created_at)::text,6,'0'),
       'pendente',
       'normal',
       p.created_at,
       FALSE
FROM public.pedidos p
LEFT JOIN public.ordens_producao op ON op.pedido_id = p.id
WHERE op.pedido_id IS NULL; 