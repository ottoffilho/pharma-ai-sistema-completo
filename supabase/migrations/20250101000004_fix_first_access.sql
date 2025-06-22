-- =====================================================
-- MIGRAÇÃO: Correção para Primeiro Acesso
-- Data: 2024-12-26
-- Descrição: Permite primeiro acesso desabilitando RLS temporariamente
-- =====================================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA PRIMEIRO ACESSO
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 2. CRIAR FUNÇÃO SIMPLES PARA VERIFICAR PRIMEIRO ACESSO
CREATE OR REPLACE FUNCTION check_first_access()
RETURNS JSON AS $$
DECLARE
    user_count INTEGER;
    result JSON;
BEGIN
    -- Contar usuários existentes
    SELECT COUNT(*) INTO user_count FROM usuarios;
    
    -- Criar resposta JSON
    result := json_build_object(
        'isFirstAccess', user_count = 0,
        'userCount', user_count,
        'timestamp', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PERMITIR ACESSO PÚBLICO À FUNÇÃO
GRANT EXECUTE ON FUNCTION check_first_access() TO anon;
GRANT EXECUTE ON FUNCTION check_first_access() TO authenticated;

-- 4. PERMITIR ACESSO PÚBLICO À TABELA USUARIOS (TEMPORÁRIO)
GRANT SELECT, INSERT, UPDATE ON usuarios TO anon;
GRANT SELECT, INSERT, UPDATE ON usuarios TO authenticated;

-- 5. PERMITIR ACESSO À TABELA PERFIS_USUARIO
GRANT SELECT ON perfis_usuario TO anon;
GRANT SELECT ON perfis_usuario TO authenticated;

-- 6. COMENTÁRIOS
COMMENT ON FUNCTION check_first_access() IS 'Verifica se é o primeiro acesso ao sistema (sem RLS)';

-- 7. LOG DE SUCESSO
SELECT 'Primeiro acesso habilitado com sucesso!' as status; 