-- =====================================================
-- MIGRAÇÃO: Funções RPC para Dashboard do Proprietário
-- Data: 2025-01-28
-- Descrição: Cria funções SQL especializadas para dashboard consolidado
-- =====================================================

-- 1. FUNÇÃO PARA OBTER VENDAS POR FARMÁCIA DOS ÚLTIMOS 30 DIAS
-- =====================================================

CREATE OR REPLACE FUNCTION get_vendas_por_farmacia_30_dias(
    p_proprietario_id UUID
)
RETURNS TABLE (
    farmacia_id UUID,
    farmacia_nome TEXT,
    total_vendas NUMERIC,
    quantidade_vendas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as farmacia_id,
        f.nome_fantasia as farmacia_nome,
        COALESCE(SUM(v.total), 0) as total_vendas,
        COUNT(v.id)::INTEGER as quantidade_vendas
    FROM farmacias f
    LEFT JOIN vendas v ON v.farmacia_id = f.id 
        AND v.status = 'finalizada'
        AND v.created_at >= (NOW() - INTERVAL '30 days')
    WHERE f.proprietario_id = p_proprietario_id
        AND f.ativa = true
    GROUP BY f.id, f.nome_fantasia
    ORDER BY total_vendas DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNÇÃO PARA OBTER VENDAS POR FARMÁCIA COM FILTRO DE PERÍODO
-- =====================================================

CREATE OR REPLACE FUNCTION get_vendas_por_farmacia_periodo(
    p_proprietario_id UUID,
    p_data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_data_fim TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    farmacia_id UUID,
    farmacia_nome TEXT,
    total_vendas NUMERIC,
    quantidade_vendas INTEGER,
    ticket_medio NUMERIC
) AS $$
DECLARE
    data_inicio_calc TIMESTAMP WITH TIME ZONE;
    data_fim_calc TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Definir período padrão se não fornecido (últimos 30 dias)
    data_inicio_calc := COALESCE(p_data_inicio, NOW() - INTERVAL '30 days');
    data_fim_calc := COALESCE(p_data_fim, NOW());
    
    RETURN QUERY
    SELECT 
        f.id as farmacia_id,
        f.nome_fantasia as farmacia_nome,
        COALESCE(SUM(v.total), 0) as total_vendas,
        COUNT(v.id)::INTEGER as quantidade_vendas,
        CASE 
            WHEN COUNT(v.id) > 0 THEN COALESCE(SUM(v.total), 0) / COUNT(v.id)
            ELSE 0
        END as ticket_medio
    FROM farmacias f
    LEFT JOIN vendas v ON v.farmacia_id = f.id 
        AND v.status = 'finalizada'
        AND v.created_at >= data_inicio_calc
        AND v.created_at <= data_fim_calc
    WHERE f.proprietario_id = p_proprietario_id
        AND f.ativa = true
    GROUP BY f.id, f.nome_fantasia
    ORDER BY total_vendas DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO PARA OBTER ESTOQUE CONSOLIDADO DO PROPRIETÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION get_estoque_consolidado_proprietario(
    p_proprietario_id UUID
)
RETURNS TABLE (
    produto_id UUID,
    produto_nome TEXT,
    estoque_total NUMERIC,
    farmacias_com_estoque INTEGER,
    tipo_produto TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as produto_id,
        p.nome as produto_nome,
        COALESCE(SUM(e.quantidade_atual), 0) as estoque_total,
        COUNT(DISTINCT e.farmacia_id)::INTEGER as farmacias_com_estoque,
        COALESCE(p.tipo, 'MEDICAMENTO') as tipo_produto
    FROM produtos p
    LEFT JOIN estoque e ON e.produto_id = p.id 
        AND e.quantidade_atual > 0
    LEFT JOIN farmacias f ON f.id = e.farmacia_id 
        AND f.proprietario_id = p_proprietario_id
        AND f.ativa = true
    WHERE p.ativo = true
        AND (e.farmacia_id IS NULL OR f.id IS NOT NULL)
    GROUP BY p.id, p.nome, p.tipo
    HAVING COALESCE(SUM(e.quantidade_atual), 0) > 0
    ORDER BY estoque_total DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO PARA COMPARAÇÃO COM PERÍODO ANTERIOR
-- =====================================================

CREATE OR REPLACE FUNCTION get_comparacao_vendas_periodo_anterior(
    p_proprietario_id UUID,
    p_data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_data_fim TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_vendas_atual NUMERIC,
    total_vendas_anterior NUMERIC,
    variacao_percentual NUMERIC,
    quantidade_vendas_atual INTEGER,
    quantidade_vendas_anterior INTEGER,
    ticket_medio_atual NUMERIC,
    ticket_medio_anterior NUMERIC
) AS $$
DECLARE
    data_inicio_calc TIMESTAMP WITH TIME ZONE;
    data_fim_calc TIMESTAMP WITH TIME ZONE;
    duracao_periodo INTERVAL;
    data_inicio_anterior TIMESTAMP WITH TIME ZONE;
    data_fim_anterior TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Definir período padrão se não fornecido (últimos 30 dias)
    data_inicio_calc := COALESCE(p_data_inicio, NOW() - INTERVAL '30 days');
    data_fim_calc := COALESCE(p_data_fim, NOW());
    
    -- Calcular duração do período
    duracao_periodo := data_fim_calc - data_inicio_calc;
    
    -- Calcular período anterior
    data_fim_anterior := data_inicio_calc;
    data_inicio_anterior := data_fim_anterior - duracao_periodo;
    
    RETURN QUERY
    WITH vendas_atual AS (
        SELECT 
            COALESCE(SUM(v.total), 0) as total_vendas,
            COUNT(v.id)::INTEGER as quantidade_vendas
        FROM vendas v
        JOIN farmacias f ON f.id = v.farmacia_id
        WHERE f.proprietario_id = p_proprietario_id
            AND f.ativa = true
            AND v.status = 'finalizada'
            AND v.created_at >= data_inicio_calc
            AND v.created_at <= data_fim_calc
    ),
    vendas_anterior AS (
        SELECT 
            COALESCE(SUM(v.total), 0) as total_vendas,
            COUNT(v.id)::INTEGER as quantidade_vendas
        FROM vendas v
        JOIN farmacias f ON f.id = v.farmacia_id
        WHERE f.proprietario_id = p_proprietario_id
            AND f.ativa = true
            AND v.status = 'finalizada'
            AND v.created_at >= data_inicio_anterior
            AND v.created_at <= data_fim_anterior
    )
    SELECT 
        va.total_vendas as total_vendas_atual,
        van.total_vendas as total_vendas_anterior,
        CASE 
            WHEN van.total_vendas > 0 THEN 
                ROUND(((va.total_vendas - van.total_vendas) / van.total_vendas) * 100, 2)
            ELSE 0
        END as variacao_percentual,
        va.quantidade_vendas as quantidade_vendas_atual,
        van.quantidade_vendas as quantidade_vendas_anterior,
        CASE 
            WHEN va.quantidade_vendas > 0 THEN va.total_vendas / va.quantidade_vendas
            ELSE 0
        END as ticket_medio_atual,
        CASE 
            WHEN van.quantidade_vendas > 0 THEN van.total_vendas / van.quantidade_vendas
            ELSE 0
        END as ticket_medio_anterior
    FROM vendas_atual va, vendas_anterior van;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO PARA OBTER USUÁRIOS ATIVOS DO PROPRIETÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION get_usuarios_ativos_proprietario(
    p_proprietario_id UUID
)
RETURNS TABLE (
    total_usuarios INTEGER,
    usuarios_por_perfil JSONB,
    usuarios_por_farmacia JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH usuarios_perfil AS (
        SELECT 
            p.nome as perfil_nome,
            COUNT(u.id) as quantidade
        FROM usuarios u
        JOIN perfis_usuario p ON p.id = u.perfil_id
        WHERE u.proprietario_id = p_proprietario_id
            AND u.ativo = true
        GROUP BY p.id, p.nome
    ),
    usuarios_farmacia AS (
        SELECT 
            f.nome_fantasia as farmacia_nome,
            COUNT(u.id) as quantidade
        FROM usuarios u
        JOIN farmacias f ON f.id = u.farmacia_id
        WHERE u.proprietario_id = p_proprietario_id
            AND u.ativo = true
        GROUP BY f.id, f.nome_fantasia
    )
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM usuarios WHERE proprietario_id = p_proprietario_id AND ativo = true) as total_usuarios,
        (SELECT jsonb_object_agg(perfil_nome, quantidade) FROM usuarios_perfil) as usuarios_por_perfil,
        (SELECT jsonb_object_agg(farmacia_nome, quantidade) FROM usuarios_farmacia) as usuarios_por_farmacia;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CONCEDER PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION get_vendas_por_farmacia_30_dias(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendas_por_farmacia_periodo(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_estoque_consolidado_proprietario(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comparacao_vendas_periodo_anterior(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_usuarios_ativos_proprietario(UUID) TO authenticated;

-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION get_vendas_por_farmacia_30_dias(UUID) IS 'Obtém vendas por farmácia dos últimos 30 dias para o proprietário';
COMMENT ON FUNCTION get_vendas_por_farmacia_periodo(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Obtém vendas por farmácia com filtro de período customizável';
COMMENT ON FUNCTION get_estoque_consolidado_proprietario(UUID) IS 'Obtém estoque consolidado de todas as farmácias do proprietário';
COMMENT ON FUNCTION get_comparacao_vendas_periodo_anterior(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Compara vendas atuais com período anterior para análise de crescimento';
COMMENT ON FUNCTION get_usuarios_ativos_proprietario(UUID) IS 'Obtém estatísticas de usuários ativos do proprietário por perfil e farmácia';

-- 8. LOG DE SUCESSO
-- =====================================================

SELECT 'Funções RPC para Dashboard do Proprietário criadas com sucesso!' as status; 