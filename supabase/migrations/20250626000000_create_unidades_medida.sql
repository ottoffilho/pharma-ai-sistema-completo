-- Criação da tabela de unidades de medida
BEGIN;

CREATE TABLE IF NOT EXISTS public.unidades_medida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at (presume que a função trigger_set_timestamp já exista no banco)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_unidades_medida'
  ) THEN
    CREATE TRIGGER set_timestamp_unidades_medida
    BEFORE UPDATE ON public.unidades_medida
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END;
$$;

-- Habilitar RLS e política básica de leitura
ALTER TABLE public.unidades_medida ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS unidades_medida_leitura_todos
  ON public.unidades_medida
  FOR SELECT
  USING (true);

-- Seed inicial das unidades (baseado no sistema legado)
INSERT INTO public.unidades_medida (codigo, descricao) VALUES
  ('%', 'PORCENTAGEM'),
  ('bh', 'BILHÕES EM UNID. FORMADORA DE COLÔNIA'),
  ('cc', 'CENTÍMETRO CÚBICO'),
  ('CH', 'CENTESIMAL'),
  ('cm3', 'CENTÍMETRO CÚBICO'),
  ('dh', 'DECIMAL'),
  ('FC', 'FLUXO CONTÍNUO'),
  ('g', 'GRAMA'),
  ('gt', 'GOTAS'),
  ('K', 'KORSAKOVIANO'),
  ('kg', 'KILOGRAMA'),
  ('l', 'LITRO'),
  ('LM', '50 MILESIMAL'),
  ('mcg', 'MICROGRAMA'),
  ('meq', 'MILIEQUIVALENTE'),
  ('mg', 'MILIGRAMA'),
  ('ml', 'MILILITRO'),
  ('mlh', 'MILHÕES EM UNID. FORMADORA DE COLÔNIA'),
  ('PC', 'PLACEBO'),
  ('qsp(ex)', 'EXCIPIENTE QSP'),
  ('qsp(g)', 'GRAMA QSP'),
  ('qsp(gt)', 'GOTAS QSP'),
  ('qsp(mg)', 'MILIGRAMA QSP'),
  ('qsp(ml)', 'MILILITRO QSP'),
  ('SD', 'DINAMIZAÇÃO ESPECIAL'),
  ('TM', 'TINTURA MÃE'),
  ('u', 'UNIDADE'),
  ('ufc', 'UNID. FORMADORA DE COLÔNIA'),
  ('ui', 'UNID. INTERNACIONAL'),
  ('utr', 'UNID. TAXA REF.');

COMMIT; 