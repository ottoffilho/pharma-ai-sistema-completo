-- =====================================================
-- MIGRAÇÃO: Funções RPC para Autenticação Multi-Farmácia
-- Data: 2025-05-31
-- Descrição: Cria funções RPC para autenticação e carregamento de dados multi-farmácia
-- =====================================================

-- 1. FUNÇÃO PARA OBTER DADOS DO USUÁRIO LOGADO
CREATE OR REPLACE FUNCTION get_logged_user_data()
RETURNS JSON AS $$
DECLARE
    user_auth_id UUID;
    user_data RECORD;
    perfil_data RECORD;
    proprietario_data RECORD;
    farmacia_data RECORD;
    result JSON;
BEGIN
    -- Obter ID do usuário autenticado
    user_auth_id := auth.uid();
    
    IF user_auth_id IS NULL THEN
        RETURN json_build_object(
            'error', 'Usuário não autenticado',
            'usuario', null,
            'perfil', null
        );
    END IF;
    
    -- Buscar dados do usuário
    SELECT 
        u.id,
        u.nome,
        u.email,
        u.telefone,
        u.perfil_id,
        u.proprietario_id,
        u.farmacia_id,
        u.ativo,
        u.ultimo_acesso,
        u.criado_em,
        u.atualizado_em,
        u.supabase_auth_id
    INTO user_data
    FROM usuarios u
    WHERE u.supabase_auth_id = user_auth_id
    AND u.ativo = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'error', 'Usuário não encontrado ou inativo',
            'usuario', null,
            'perfil', null
        );
    END IF;
    
    -- Buscar dados do perfil
    SELECT 
        p.id,
        p.nome,
        p.tipo,
        p.dashboard_padrao,
        p.descricao,
        p.ativo
    INTO perfil_data
    FROM perfis_usuario p
    WHERE p.id = user_data.perfil_id;
    
    -- Buscar dados do proprietário (se existir)
    IF user_data.proprietario_id IS NOT NULL THEN
        SELECT 
            pr.id,
            pr.nome,
            pr.email,
            pr.cpf,
            pr.telefone,
            pr.status_assinatura,
            pr.ativo
        INTO proprietario_data
        FROM proprietarios pr
        WHERE pr.id = user_data.proprietario_id;
    END IF;
    
    -- Buscar dados da farmácia (se existir)
    IF user_data.farmacia_id IS NOT NULL THEN
        SELECT 
            f.id,
            f.nome_fantasia,
            f.razao_social,
            f.cnpj,
            f.telefone,
            f.email,
            f.endereco_cidade,
            f.endereco_uf,
            f.matriz,
            f.ativa
        INTO farmacia_data
        FROM farmacias f
        WHERE f.id = user_data.farmacia_id;
    END IF;
    
    -- Montar resposta JSON
    result := json_build_object(
        'error', null,
        'usuario', json_build_object(
            'id', user_data.id,
            'nome', user_data.nome,
            'email', user_data.email,
            'telefone', user_data.telefone,
            'perfil_id', user_data.perfil_id,
            'proprietario_id', user_data.proprietario_id,
            'farmacia_id', user_data.farmacia_id,
            'ativo', user_data.ativo,
            'ultimo_acesso', user_data.ultimo_acesso,
            'criado_em', user_data.criado_em,
            'atualizado_em', user_data.atualizado_em,
            'supabase_auth_id', user_data.supabase_auth_id
        ),
        'perfil', CASE 
            WHEN perfil_data IS NOT NULL THEN
                json_build_object(
                    'id', perfil_data.id,
                    'nome', perfil_data.nome,
                    'tipo', perfil_data.tipo,
                    'dashboard_padrao', perfil_data.dashboard_padrao,
                    'descricao', perfil_data.descricao,
                    'ativo', perfil_data.ativo
                )
            ELSE null
        END,
        'proprietario', CASE 
            WHEN proprietario_data IS NOT NULL THEN
                json_build_object(
                    'id', proprietario_data.id,
                    'nome', proprietario_data.nome,
                    'email', proprietario_data.email,
                    'cpf', proprietario_data.cpf,
                    'telefone', proprietario_data.telefone,
                    'status_assinatura', proprietario_data.status_assinatura,
                    'ativo', proprietario_data.ativo
                )
            ELSE null
        END,
        'farmacia', CASE 
            WHEN farmacia_data IS NOT NULL THEN
                json_build_object(
                    'id', farmacia_data.id,
                    'nome_fantasia', farmacia_data.nome_fantasia,
                    'razao_social', farmacia_data.razao_social,
                    'cnpj', farmacia_data.cnpj,
                    'telefone', farmacia_data.telefone,
                    'email', farmacia_data.email,
                    'endereco_cidade', farmacia_data.endereco_cidade,
                    'endereco_uf', farmacia_data.endereco_uf,
                    'matriz', farmacia_data.matriz,
                    'ativa', farmacia_data.ativa
                )
            ELSE null
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNÇÃO PARA OBTER PERMISSÕES DO USUÁRIO
CREATE OR REPLACE FUNCTION get_user_permissions()
RETURNS TABLE (
    id UUID,
    perfil_id UUID,
    modulo VARCHAR,
    acao VARCHAR,
    permitido BOOLEAN,
    criado_em TIMESTAMP
) AS $$
DECLARE
    user_auth_id UUID;
    user_perfil_id UUID;
BEGIN
    -- Obter ID do usuário autenticado
    user_auth_id := auth.uid();
    
    IF user_auth_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Buscar perfil_id do usuário
    SELECT u.perfil_id INTO user_perfil_id
    FROM usuarios u
    WHERE u.supabase_auth_id = user_auth_id
    AND u.ativo = true;
    
    IF user_perfil_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Retornar permissões do perfil
    RETURN QUERY
    SELECT 
        p.id,
        p.perfil_id,
        p.modulo,
        p.acao,
        p.permitido,
        p.criado_em
    FROM permissoes p
    WHERE p.perfil_id = user_perfil_id
    AND p.permitido = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO PARA ATUALIZAR ÚLTIMO ACESSO
CREATE OR REPLACE FUNCTION update_last_access()
RETURNS BOOLEAN AS $$
DECLARE
    user_auth_id UUID;
    updated_rows INTEGER;
BEGIN
    -- Obter ID do usuário autenticado
    user_auth_id := auth.uid();
    
    IF user_auth_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Atualizar último acesso
    UPDATE usuarios 
    SET ultimo_acesso = NOW()
    WHERE supabase_auth_id = user_auth_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO PARA CRIAR USUÁRIO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION create_user_auto(
    user_email TEXT,
    user_name TEXT,
    auth_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    perfil_proprietario_id UUID;
    proprietario_default_id UUID;
    farmacia_default_id UUID;
    new_user_id UUID;
    result JSON;
BEGIN
    -- Buscar ID do perfil proprietário
    SELECT id INTO perfil_proprietario_id
    FROM perfis_usuario 
    WHERE tipo = 'PROPRIETARIO' 
    LIMIT 1;
    
    IF perfil_proprietario_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Perfil PROPRIETARIO não encontrado'
        );
    END IF;
    
    -- Para o primeiro usuário, criar como proprietário sem vincular a farmácia específica
    -- Os campos proprietario_id e farmacia_id serão preenchidos depois
    
    -- Inserir usuário
    INSERT INTO usuarios (
        email,
        nome,
        perfil_id,
        supabase_auth_id,
        ativo
    ) VALUES (
        user_email,
        user_name,
        perfil_proprietario_id,
        auth_user_id,
        true
    ) RETURNING id INTO new_user_id;
    
    RETURN json_build_object(
        'success', true,
        'user_id', new_user_id,
        'message', 'Usuário criado com sucesso'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO PARA OBTER LISTA DE FARMÁCIAS DO PROPRIETÁRIO
CREATE OR REPLACE FUNCTION get_user_farmacias()
RETURNS TABLE (
    id UUID,
    proprietario_id UUID,
    nome_fantasia VARCHAR,
    razao_social VARCHAR,
    cnpj VARCHAR,
    telefone VARCHAR,
    email VARCHAR,
    endereco_cidade VARCHAR,
    endereco_uf VARCHAR,
    matriz BOOLEAN,
    ativa BOOLEAN
) AS $$
DECLARE
    user_auth_id UUID;
    user_proprietario_id UUID;
BEGIN
    -- Obter ID do usuário autenticado
    user_auth_id := auth.uid();
    
    IF user_auth_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Buscar proprietario_id do usuário
    SELECT u.proprietario_id INTO user_proprietario_id
    FROM usuarios u
    WHERE u.supabase_auth_id = user_auth_id
    AND u.ativo = true;
    
    IF user_proprietario_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Retornar farmácias do proprietário
    RETURN QUERY
    SELECT 
        f.id,
        f.proprietario_id,
        f.nome_fantasia,
        f.razao_social,
        f.cnpj,
        f.telefone,
        f.email,
        f.endereco_cidade,
        f.endereco_uf,
        f.matriz,
        f.ativa
    FROM farmacias f
    WHERE f.proprietario_id = user_proprietario_id
    AND f.ativa = true
    ORDER BY f.matriz DESC, f.nome_fantasia;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION get_logged_user_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION update_last_access() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_auto(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_farmacias() TO authenticated;

-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON FUNCTION get_logged_user_data() IS 'Obtém dados completos do usuário logado incluindo proprietário e farmácia';
COMMENT ON FUNCTION get_user_permissions() IS 'Obtém todas as permissões do usuário logado';
COMMENT ON FUNCTION update_last_access() IS 'Atualiza o último acesso do usuário logado';
COMMENT ON FUNCTION create_user_auto(TEXT, TEXT, UUID) IS 'Cria automaticamente um usuário no primeiro acesso';
COMMENT ON FUNCTION get_user_farmacias() IS 'Obtém lista de farmácias do proprietário do usuário logado';

-- 8. LOG DE SUCESSO
SELECT 'Funções RPC de autenticação criadas com sucesso!' as status; 