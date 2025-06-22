-- =====================================================
-- MIGRAÇÃO: Função para Verificar Primeiro Acesso
-- Data: 2024-12-26
-- Descrição: Cria função SQL para verificar primeiro acesso via RPC
-- =====================================================

-- Função para verificar se é o primeiro acesso (sem usuários cadastrados)
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

-- Permitir que usuários anônimos chamem esta função
GRANT EXECUTE ON FUNCTION check_first_access() TO anon;
GRANT EXECUTE ON FUNCTION check_first_access() TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION check_first_access() IS 'Verifica se é o primeiro acesso ao sistema retornando JSON com isFirstAccess e userCount';

-- Teste da função
DO $$
DECLARE
    test_result JSON;
BEGIN
    SELECT check_first_access() INTO test_result;
    RAISE NOTICE 'Função check_first_access() criada com sucesso!';
    RAISE NOTICE 'Resultado do teste: %', test_result;
END $$; 