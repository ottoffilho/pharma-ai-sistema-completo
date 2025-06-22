-- =====================================================
-- MIGRAÇÃO: Correção da função get_logged_user_data (coluna auth_id ambígua)
-- Data: 2025-06-01
-- Descrição: Renomeia variável interna para evitar conflito e qualifica coluna.
-- =====================================================

-- Recriar função com correção
CREATE OR REPLACE FUNCTION get_logged_user_data()
RETURNS JSON AS $$
DECLARE
    v_auth_uid UUID;              -- Renomeado para evitar ambiguidade com colunas
    v_user RECORD;
    v_profile RECORD;
    v_owner RECORD;
    v_pharmacy RECORD;
    v_result JSON;
BEGIN
    -- Obter ID do usuário autenticado
    v_auth_uid := auth.uid();

    IF v_auth_uid IS NULL THEN
        RETURN json_build_object(
            'error', 'Usuário não autenticado',
            'usuario', NULL,
            'perfil', NULL
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
    INTO v_user
    FROM usuarios AS u
    WHERE u.supabase_auth_id = v_auth_uid
      AND u.ativo = TRUE;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'error', 'Usuário não encontrado ou inativo',
            'usuario', NULL,
            'perfil', NULL
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
    INTO v_profile
    FROM perfis_usuario AS p
    WHERE p.id = v_user.perfil_id;

    -- Buscar dados do proprietário (se existir)
    IF v_user.proprietario_id IS NOT NULL THEN
        SELECT 
            pr.id,
            pr.nome,
            pr.email,
            pr.cpf,
            pr.telefone,
            pr.status_assinatura,
            pr.ativo
        INTO v_owner
        FROM proprietarios AS pr
        WHERE pr.id = v_user.proprietario_id;
    END IF;

    -- Buscar dados da farmácia (se existir)
    IF v_user.farmacia_id IS NOT NULL THEN
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
        INTO v_pharmacy
        FROM farmacias AS f
        WHERE f.id = v_user.farmacia_id;
    END IF;

    -- Montar resposta JSON
    v_result := json_build_object(
        'error', NULL,
        'usuario', json_build_object(
            'id', v_user.id,
            'nome', v_user.nome,
            'email', v_user.email,
            'telefone', v_user.telefone,
            'perfil_id', v_user.perfil_id,
            'proprietario_id', v_user.proprietario_id,
            'farmacia_id', v_user.farmacia_id,
            'ativo', v_user.ativo,
            'ultimo_acesso', v_user.ultimo_acesso,
            'criado_em', v_user.criado_em,
            'atualizado_em', v_user.atualizado_em,
            'supabase_auth_id', v_user.supabase_auth_id
        ),
        'perfil', CASE 
            WHEN v_profile IS NOT NULL THEN
                json_build_object(
                    'id', v_profile.id,
                    'nome', v_profile.nome,
                    'tipo', v_profile.tipo,
                    'dashboard_padrao', v_profile.dashboard_padrao,
                    'descricao', v_profile.descricao,
                    'ativo', v_profile.ativo
                )
            ELSE NULL
        END,
        'proprietario', CASE 
            WHEN v_owner IS NOT NULL THEN
                json_build_object(
                    'id', v_owner.id,
                    'nome', v_owner.nome,
                    'email', v_owner.email,
                    'cpf', v_owner.cpf,
                    'telefone', v_owner.telefone,
                    'status_assinatura', v_owner.status_assinatura,
                    'ativo', v_owner.ativo
                )
            ELSE NULL
        END,
        'farmacia', CASE 
            WHEN v_pharmacy IS NOT NULL THEN
                json_build_object(
                    'id', v_pharmacy.id,
                    'nome_fantasia', v_pharmacy.nome_fantasia,
                    'razao_social', v_pharmacy.razao_social,
                    'cnpj', v_pharmacy.cnpj,
                    'telefone', v_pharmacy.telefone,
                    'email', v_pharmacy.email,
                    'endereco_cidade', v_pharmacy.endereco_cidade,
                    'endereco_uf', v_pharmacy.endereco_uf,
                    'matriz', v_pharmacy.matriz,
                    'ativa', v_pharmacy.ativa
                )
            ELSE NULL
        END
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão de execução
GRANT EXECUTE ON FUNCTION get_logged_user_data() TO authenticated; 