-- 20250617000020_create_trigger_pedido_receita.sql
-- Cria trigger e função para gerar automaticamente um registro em public.pedidos
-- a partir da inserção em public.receitas_processadas.

-- Garantir extensão pgcrypto para gen_random_uuid (caso ainda não exista)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função responsável por inserir pedido correspondente
CREATE OR REPLACE FUNCTION public.create_pedido_for_processed_receita()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insere o pedido, evitando duplicidades com UNIQUE em processed_recipe_id
  INSERT INTO public.pedidos (
    processed_recipe_id,
    created_by_user_id,
    status,
    total_amount,
    payment_status,
    channel
  )
  VALUES (
    NEW.id,
    NEW.processed_by_user_id,
    'draft',       -- status inicial
    0,             -- valor inicial (será atualizado posteriormente)
    'pending',     -- pagamento pendente
    'IA'           -- canal padrão (processamento IA)
  )
  ON CONFLICT (processed_recipe_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Garante chave única para evitar múltiplos pedidos para a mesma receita
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_processed_recipe_id_key'
  ) THEN
    ALTER TABLE public.pedidos
      ADD CONSTRAINT pedidos_processed_recipe_id_key UNIQUE (processed_recipe_id);
  END IF;
END;
$$;

-- Cria (ou recria) trigger
DROP TRIGGER IF EXISTS trg_create_pedido_after_receita_processed ON public.receitas_processadas;

CREATE TRIGGER trg_create_pedido_after_receita_processed
AFTER INSERT ON public.receitas_processadas
FOR EACH ROW
EXECUTE FUNCTION public.create_pedido_for_processed_receita();

-- Backfill: cria pedidos para receitas já existentes que ainda não possuem
-- um registro correspondente em public.pedidos.
INSERT INTO public.pedidos (processed_recipe_id, created_by_user_id, status, total_amount, payment_status, channel)
SELECT rp.id, rp.processed_by_user_id, 'draft', 0, 'pending', 'IA'
FROM public.receitas_processadas rp
LEFT JOIN public.pedidos p ON p.processed_recipe_id = rp.id
WHERE p.processed_recipe_id IS NULL; 