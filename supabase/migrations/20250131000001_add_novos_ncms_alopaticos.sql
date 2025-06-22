-- =====================================================
-- MIGRAÇÃO: Adicionar Novos NCMs de Produtos Alopáticos
-- Data: 2025-01-31
-- Descrição: Adiciona NCMs identificados na análise dos XMLs de alopáticos
-- =====================================================

-- Verificar se a função de classificação existe
DO $$
BEGIN
    -- Atualizar a função de classificação de produtos para incluir novos NCMs
    CREATE OR REPLACE FUNCTION classificar_tipo_produto_por_ncm(ncm_codigo TEXT, nome_produto TEXT DEFAULT '')
    RETURNS TEXT AS $func$
    BEGIN
        -- Limpar NCM (remover caracteres não numéricos)
        ncm_codigo := REGEXP_REPLACE(COALESCE(ncm_codigo, ''), '[^0-9]', '', 'g');
        nome_produto := UPPER(COALESCE(nome_produto, ''));
        
        -- === EMBALAGENS FARMACÊUTICAS ===
        IF ncm_codigo IN (
            '39232990', '39233000', '39234000', '39269090', '39199090',
            '70109010', '70109090', '70139000', '70200000',
            '48194000', '48195000', '48211000', '48219000', '48236900',
            '83099000', '39235000', '90183100', '90183200', '90189010',
            '48194000', '63053200', '39232100', '39191000', '48239000',
            '39269000', '96020010' -- NOVO: Cápsulas vazias
        ) THEN
            RETURN 'EMBALAGEM';
        END IF;
        
        -- Verificação por prefixos de NCM de embalagens
        IF ncm_codigo ~ '^(3923|3926|4819|4821|4823|7010|7013|7020|7612|8309|9018|9602)' THEN
            RETURN 'EMBALAGEM';
        END IF;
        
        -- === PRODUTOS ALOPÁTICOS (MATÉRIA-PRIMA) ===
        
        -- Hormônios e derivados (NCM 2937xxxx)
        IF ncm_codigo IN (
            '29372349', -- NOVO: Estradiol Base Micro
            '29372990', -- Hormônios diversos
            '29379090'  -- NOVO: Liotironina Base (T3)
        ) THEN
            RETURN 'MATERIA_PRIMA';
        END IF;
        
        -- Vitaminas (NCM 2936xxxx)
        IF ncm_codigo IN (
            '29362610', -- NOVO: VIT. B-12 CIANOCOBALAMINA
            '29362690', -- NOVO: VIT. B-12 METILCOBALAMINA
            '29362710', -- VIT. C (já existente)
            '29362812', -- NOVO: Vit.E Oleo(Dl-Alfatocof)Acet.
            '29362931', -- NOVO: VIT. H BIOTINA
            '29362940', '29362921',
            '29393010'  -- NOVO: Cafeina Anidra
        ) THEN
            RETURN 'MATERIA_PRIMA';
        END IF;
        
        -- Aminoácidos e derivados (NCM 29xxxx específicos)
        IF ncm_codigo IN (
            '29224990', -- NOVO: Tetracaina HCl, Acido D-Aspartico
            '29309019', -- NOVO: N-ACETIL-L-CISTEINA
            '29335991', -- NOVO: Minoxidil Sulfato
            '29389090', -- NOVO: Crisina 99% Min
            '29391900', -- NOVO: Naltrexone Hcl
            '29400019', -- NOVO: D-RIBOSE
            '29181690', '29156019', '29239090', '29252990', '29223990'
        ) THEN
            RETURN 'MATERIA_PRIMA';
        END IF;
        
        -- Extratos vegetais medicinais (NCM 1302xxxx)
        IF ncm_codigo IN (
            '13021930', '13021960', '13021950', '13021999'
        ) THEN
            RETURN 'MATERIA_PRIMA';
        END IF;
        
        -- Enzimas e proteínas (NCM 35xxxx)
        IF ncm_codigo IN (
            '35079049', 
            '35040090', -- NOVO: Colageno Hidrolisado Peptan Po
            '29146200'  -- NOVO: Coenzima Q-10 (Ubidecarenona)
        ) THEN
            RETURN 'MATERIA_PRIMA';
        END IF;
        
        -- === INSUMOS FARMACÊUTICOS ===
        
        -- Óleos e gorduras (NCM 15xxxx)
        IF ncm_codigo IN (
            '15159090'  -- NOVO: Oleo De Semente Uva
        ) THEN
            RETURN 'INSUMO';
        END IF;
        
        -- Suplementos e preparações (NCM 21xxxx)
        IF ncm_codigo IN (
            '21069090', -- NOVO: TCM PO
            '21021090', '21069030', '21022000'
        ) THEN
            RETURN 'INSUMO';
        END IF;
        
        -- Compostos químicos inorgânicos (NCM 28xxxx)
        IF ncm_codigo IN (
            '28321090', -- NOVO: Metabissulfito De Sodio
            '28369911', '25262000'
        ) THEN
            RETURN 'INSUMO';
        END IF;
        
        -- Fibras e materiais naturais (NCM 03xxxx)
        IF ncm_codigo IN (
            '03061990'  -- NOVO: Fibras De Crustaceos
        ) THEN
            RETURN 'INSUMO';
        END IF;
        
        -- Triglicerídeos e preparações lipídicas (NCM 38xxxx)
        IF ncm_codigo IN (
            '38249923', -- NOVO: Triglicerideos de Cadeia Media TCM Liquido
            '39100019'
        ) THEN
            RETURN 'INSUMO';
        END IF;
        
        -- === COSMÉTICOS ===
        IF ncm_codigo IN (
            '33029019'  -- NOVO: Fagron Essencia Lavanda
        ) OR ncm_codigo ~ '^(3301|3302|3303|3304|3305|3306|3307)' THEN
            RETURN 'COSMÉTICO';
        END IF;
        
        -- === MEDICAMENTOS ===
        IF ncm_codigo ~ '^(3003|3004|3002)' THEN
            RETURN 'MEDICAMENTO';
        END IF;
        
        -- === CLASSIFICAÇÃO POR PALAVRAS-CHAVE ===
        
        -- Produtos alopáticos por nome
        IF nome_produto ~ '(ÁCIDO|ACIDO|SULFATO|CLORIDRATO|FOSFATO|CITRATO|TARTARATO|MALEATO|VITAMINA|HORMÔNIO|TESTOSTERONA|ESTRADIOL|LIOTIRONINA|NALTREXONE|MINOXIDIL|CAFEINA|BIOTINA|COENZIMA|CRISINA|TETRACAINA)' THEN
            RETURN 'MATERIA_PRIMA';
        END IF;
        
        -- Embalagens por nome
        IF nome_produto ~ '(FRASCO|POTE|BISNAGA|TAMPA|CAPSULA|CÁPSULA|EMBALAGEM|AMPOLA|SERINGA|AGULHA)' THEN
            RETURN 'EMBALAGEM';
        END IF;
        
        -- Cosméticos por nome
        IF nome_produto ~ '(ESSENCIA|ÓLEO ESSENCIAL|PERFUME|COLÔNIA|COSMÉTICO|LAVANDA)' THEN
            RETURN 'COSMÉTICO';
        END IF;
        
        -- === FALLBACK BASEADO EM PREFIXOS ===
        
        -- Grupo 29 - Compostos químicos orgânicos (geralmente alopáticos)
        IF ncm_codigo ~ '^29' THEN
            RETURN 'MATERIA_PRIMA';
        END IF;
        
        -- Grupo 13 - Extratos vegetais
        IF ncm_codigo ~ '^13' THEN
            RETURN 'MATERIA_PRIMA';
        END IF;
        
        -- Grupo 35 - Proteínas e enzimas
        IF ncm_codigo ~ '^35' THEN
            RETURN 'MATERIA_PRIMA';
        END IF;
        
        -- Grupo 30 - Medicamentos
        IF ncm_codigo ~ '^30' THEN
            RETURN 'MEDICAMENTO';
        END IF;
        
        -- Grupo 33 - Cosméticos
        IF ncm_codigo ~ '^33' THEN
            RETURN 'COSMÉTICO';
        END IF;
        
        -- Grupos de insumos químicos
        IF ncm_codigo ~ '^(28|38|21|15|03)' THEN
            RETURN 'INSUMO';
        END IF;
        
        -- Grupos de embalagens
        IF ncm_codigo ~ '^(39|48|70|76|83|90)' THEN
            RETURN 'EMBALAGEM';
        END IF;
        
        -- Fallback padrão
        RETURN 'OUTRO';
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    -- Adicionar comentário na função
    COMMENT ON FUNCTION classificar_tipo_produto_por_ncm(TEXT, TEXT) IS 
    'Classifica automaticamente o tipo de produto baseado no NCM e nome. Atualizada com novos NCMs de alopáticos identificados em 2025-01-31.';
    
    RAISE NOTICE 'Função classificar_tipo_produto_por_ncm atualizada com novos NCMs de alopáticos';
END $$;

-- =====================================================
-- CRIAR FUNÇÃO DE ANÁLISE DE POTENCIAL ALOPÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION analisar_potencial_alopatico(ncm_codigo TEXT, nome_produto TEXT DEFAULT '')
RETURNS JSONB AS $$
DECLARE
    ncm_limpo TEXT;
    nome_upper TEXT;
    confianca INTEGER := 0;
    motivos TEXT[] := ARRAY[]::TEXT[];
    is_provavel_alopatico BOOLEAN := FALSE;
    sugestao_categoria TEXT := 'outros';
BEGIN
    -- Limpar entrada
    ncm_limpo := REGEXP_REPLACE(COALESCE(ncm_codigo, ''), '[^0-9]', '', 'g');
    nome_upper := UPPER(COALESCE(nome_produto, ''));
    
    -- NCMs confirmadamente alopáticos (alta confiança)
    IF ncm_limpo = ANY(ARRAY[
        '29372990', '29372100', '29372200', '29372300', '29372910', '29372930', '29372349', '29379090',
        '29224110', '29224120', '29224190', '29224990', '29241999', '29252990', '29223990', '29239090', 
        '29181690', '29156019', '29181500', '29309019', '29335991', '29389090', '29391900', '29400019',
        '29362710', '29362610', '29362921', '29362812', '29362931', '29362940', '29362690', '29393010',
        '29146200', '35079049', '35040090', '13021930', '13021960', '13021950', '13021999'
    ]) THEN
        confianca := confianca + 95;
        motivos := motivos || ('NCM ' || ncm_limpo || ' confirmado como alopático');
        is_provavel_alopatico := TRUE;
    END IF;
    
    -- Análise por prefixos (alta probabilidade)
    IF ncm_limpo ~ '^2937' THEN
        confianca := confianca + 90;
        motivos := motivos || 'NCM prefixo 2937 (Hormônios) - alta probabilidade alopático';
        is_provavel_alopatico := TRUE;
    ELSIF ncm_limpo ~ '^2936' THEN
        confianca := confianca + 85;
        motivos := motivos || 'NCM prefixo 2936 (Vitaminas) - alta probabilidade alopático';
        is_provavel_alopatico := TRUE;
    ELSIF ncm_limpo ~ '^2922' THEN
        confianca := confianca + 80;
        motivos := motivos || 'NCM prefixo 2922 (Aminoácidos) - alta probabilidade alopático';
        is_provavel_alopatico := TRUE;
    ELSIF ncm_limpo ~ '^2924' THEN
        confianca := confianca + 75;
        motivos := motivos || 'NCM prefixo 2924 (Compostos com função amina) - alta probabilidade alopático';
        is_provavel_alopatico := TRUE;
    ELSIF ncm_limpo ~ '^2925' THEN
        confianca := confianca + 70;
        motivos := motivos || 'NCM prefixo 2925 (Compostos com função imina) - alta probabilidade alopático';
        is_provavel_alopatico := TRUE;
    END IF;
    
    -- Análise por palavras-chave (alta confiança)
    IF nome_upper ~ '(CLORIDRATO|SULFATO|FOSFATO|CITRATO|TARTARATO|MALEATO|MONOHIDRATADA|DIHIDRATADA|ANIDRO|TESTOSTERONA|DUTASTERIDA|VITAMINA|COLECALCIFEROL|CIANOCOBALAMINA|TOCOFEROL|L-CARNITINA|L-LISINA|L-TRIPTOFANO|L-TEANINA|L-CITRULINA|CREATINA|ALANTOINA|CERAMIDAS|GLUCONOLACTONA|ESTRADIOL|LIOTIRONINA|NALTREXONE|MINOXIDIL|CAFEINA|BIOTINA|COENZIMA|CRISINA|TETRACAINA)' THEN
        confianca := confianca + 80;
        motivos := motivos || 'Nome contém palavras-chave de alta confiança para alopático';
        is_provavel_alopatico := TRUE;
    END IF;
    
    -- Análise média probabilidade
    IF confianca < 70 THEN
        IF ncm_limpo ~ '^2918' THEN
            confianca := confianca + 60;
            motivos := motivos || 'NCM prefixo 2918 (Ácidos carboxílicos) - média probabilidade alopático';
        ELSIF ncm_limpo ~ '^2933' THEN
            confianca := confianca + 65;
            motivos := motivos || 'NCM prefixo 2933 (Compostos heterocíclicos) - média probabilidade alopático';
        ELSIF ncm_limpo ~ '^2939' THEN
            confianca := confianca + 70;
            motivos := motivos || 'NCM prefixo 2939 (Alcaloides vegetais) - média probabilidade alopático';
        ELSIF ncm_limpo ~ '^3507' THEN
            confianca := confianca + 75;
            motivos := motivos || 'NCM prefixo 3507 (Enzimas) - média probabilidade alopático';
        END IF;
        
        IF confianca >= 60 THEN
            is_provavel_alopatico := TRUE;
        END IF;
    END IF;
    
    -- Determinar sugestão de categoria
    IF is_provavel_alopatico AND confianca >= 70 THEN
        sugestao_categoria := 'alopaticos';
    ELSIF confianca >= 40 THEN
        IF ncm_limpo ~ '^1302' THEN
            sugestao_categoria := 'alopaticos'; -- extratos vegetais medicinais
        ELSIF ncm_limpo ~ '^(25|28)' THEN
            sugestao_categoria := 'insumos'; -- minerais e sais
        ELSIF ncm_limpo ~ '^(39|48|70|96)' THEN
            sugestao_categoria := 'embalagens'; -- materiais de embalagem
        ELSE
            sugestao_categoria := 'insumos'; -- outros insumos farmacêuticos
        END IF;
    END IF;
    
    -- Retornar análise estruturada
    RETURN jsonb_build_object(
        'is_provavel_alopatico', is_provavel_alopatico,
        'confianca', confianca,
        'motivos', motivos,
        'sugestao_categoria', sugestao_categoria,
        'ncm_analisado', ncm_limpo,
        'nome_analisado', nome_upper
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Adicionar comentário na função
COMMENT ON FUNCTION analisar_potencial_alopatico(TEXT, TEXT) IS 
'Analisa se um produto tem potencial de ser alopático baseado no NCM e nome. Retorna análise detalhada com nível de confiança.';

-- =====================================================
-- CRIAR TRIGGER PARA CLASSIFICAÇÃO AUTOMÁTICA
-- =====================================================

-- Função do trigger para classificação automática
CREATE OR REPLACE FUNCTION trigger_classificar_produto_automaticamente()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o tipo não foi definido ou é 'OUTRO', tentar classificar automaticamente
    IF NEW.tipo IS NULL OR NEW.tipo = 'OUTRO' THEN
        NEW.tipo := classificar_tipo_produto_por_ncm(NEW.ncm, NEW.nome);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_auto_classificar_produto') THEN
        CREATE TRIGGER trigger_auto_classificar_produto
            BEFORE INSERT OR UPDATE ON produtos
            FOR EACH ROW
            EXECUTE FUNCTION trigger_classificar_produto_automaticamente();
        
        RAISE NOTICE 'Trigger para classificação automática criado com sucesso';
    ELSE
        RAISE NOTICE 'Trigger para classificação automática já existe';
    END IF;
END $$;

-- =====================================================
-- ADICIONAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para NCM na tabela produtos
CREATE INDEX IF NOT EXISTS idx_produtos_ncm ON produtos(ncm) WHERE ncm IS NOT NULL;

-- Índice para tipo de produto
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo) WHERE tipo IS NOT NULL;

-- Índice composto para consultas de classificação
CREATE INDEX IF NOT EXISTS idx_produtos_ncm_tipo ON produtos(ncm, tipo) WHERE ncm IS NOT NULL;

-- =====================================================
-- INSERIR DADOS DE TESTE/VALIDAÇÃO
-- =====================================================

-- Inserir registros de NCMs conhecidos para validação (se não existirem)
INSERT INTO ncm_classificacao (ncm, tipo_produto, descricao, confianca, criado_em)
VALUES 
    ('29372349', 'MATERIA_PRIMA', 'Estradiol Base Micro - Hormônio feminino', 95, NOW()),
    ('29379090', 'MATERIA_PRIMA', 'Liotironina Base (T3) - Hormônio da tireoide', 95, NOW()),
    ('29362610', 'MATERIA_PRIMA', 'VIT. B-12 CIANOCOBALAMINA - Vitamina essencial', 90, NOW()),
    ('29362690', 'MATERIA_PRIMA', 'VIT. B-12 METILCOBALAMINA - Vitamina B12 ativa', 90, NOW()),
    ('29362931', 'MATERIA_PRIMA', 'VIT. H BIOTINA - Vitamina do complexo B', 90, NOW()),
    ('29393010', 'MATERIA_PRIMA', 'Cafeina Anidra - Estimulante natural', 85, NOW()),
    ('29224990', 'MATERIA_PRIMA', 'Tetracaina HCl / Acido D-Aspartico - Aminoácidos e anestésicos', 85, NOW()),
    ('29309019', 'MATERIA_PRIMA', 'N-ACETIL-L-CISTEINA - Aminoácido derivado', 85, NOW()),
    ('29335991', 'MATERIA_PRIMA', 'Minoxidil Sulfato - Tratamento capilar', 90, NOW()),
    ('29389090', 'MATERIA_PRIMA', 'Crisina 99% Min - Flavonoide natural', 80, NOW()),
    ('29391900', 'MATERIA_PRIMA', 'Naltrexone Hcl - Antagonista opioide', 95, NOW()),
    ('29400019', 'MATERIA_PRIMA', 'D-RIBOSE - Açúcar natural', 80, NOW()),
    ('29146200', 'MATERIA_PRIMA', 'Coenzima Q-10 (Ubidecarenona) - Antioxidante', 90, NOW()),
    ('29362812', 'MATERIA_PRIMA', 'Vit.E Oleo(Dl-Alfatocof)Acet. - Vitamina E', 90, NOW()),
    ('35040090', 'MATERIA_PRIMA', 'Colageno Hidrolisado Peptan Po - Proteína', 85, NOW()),
    ('15159090', 'INSUMO', 'Oleo De Semente Uva - Óleo vegetal', 70, NOW()),
    ('21069090', 'INSUMO', 'TCM PO - Triglicerídeos de cadeia média', 75, NOW()),
    ('28321090', 'INSUMO', 'Metabissulfito De Sodio - Conservante', 80, NOW()),
    ('03061990', 'INSUMO', 'Fibras De Crustaceos - Quitosana', 75, NOW()),
    ('38249923', 'INSUMO', 'Triglicerideos de Cadeia Media TCM Liquido', 75, NOW()),
    ('33029019', 'COSMÉTICO', 'Fagron Essencia Lavanda - Essência aromática', 85, NOW()),
    ('96020010', 'EMBALAGEM', 'Caps.0 Clo Vdcl Trans ACG - Cápsulas vazias', 95, NOW())
ON CONFLICT (ncm) DO UPDATE SET
    tipo_produto = EXCLUDED.tipo_produto,
    descricao = EXCLUDED.descricao,
    confianca = EXCLUDED.confianca,
    atualizado_em = NOW();

-- =====================================================
-- LOG DE MIGRAÇÃO
-- =====================================================

INSERT INTO migrations_log (migration_name, executed_at, description) 
VALUES (
    '20250131000001_add_novos_ncms_alopaticos', 
    NOW(), 
    'Adicionados novos NCMs de produtos alopáticos identificados na análise de XMLs de notas fiscais'
)
ON CONFLICT (migration_name) DO NOTHING; 