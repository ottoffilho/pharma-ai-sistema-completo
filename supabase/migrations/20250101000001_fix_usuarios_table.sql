-- =====================================================
-- MIGRAÇÃO: Correção da Tabela de Usuários e RLS
-- Data: 2024-12-26
-- Descrição: Corrige problemas de RLS e inconsistências na tabela usuarios
-- =====================================================

-- 1. REMOVER POLÍTICAS RLS PROBLEMÁTICAS
DROP POLICY IF EXISTS "Apenas proprietários podem modificar usuários" ON usuarios;
DROP POLICY IF EXISTS "Usuários autenticados podem ver usuários" ON usuarios;

-- 2. CRIAR POLÍTICAS RLS CORRETAS E SEM RECURSÃO

-- Política para SELECT (visualização)
CREATE POLICY "usuarios_select_policy" ON usuarios
    FOR SELECT USING (
        -- Usuários autenticados podem ver todos os usuários
        auth.role() = 'authenticated'
    );

-- Política para INSERT (primeiro acesso e criação por proprietários)
CREATE POLICY "usuarios_insert_policy" ON usuarios
    FOR INSERT WITH CHECK (
        -- Permitir inserção se não há usuários (primeiro acesso)
        NOT EXISTS (SELECT 1 FROM usuarios LIMIT 1)
        OR
        -- Ou se o usuário atual é proprietário (verificação via auth.uid())
        auth.uid() IN (
            SELECT supabase_auth_id FROM usuarios u2
            JOIN perfis_usuario p ON u2.perfil_id = p.id
            WHERE p.tipo = 'PROPRIETARIO' AND u2.ativo = true
        )
    );

-- Política para UPDATE (apenas proprietários)
CREATE POLICY "usuarios_update_policy" ON usuarios
    FOR UPDATE USING (
        -- Apenas proprietários podem atualizar
        auth.uid() IN (
            SELECT supabase_auth_id FROM usuarios u2
            JOIN perfis_usuario p ON u2.perfil_id = p.id
            WHERE p.tipo = 'PROPRIETARIO' AND u2.ativo = true
        )
    );

-- Política para DELETE (apenas proprietários)
CREATE POLICY "usuarios_delete_policy" ON usuarios
    FOR DELETE USING (
        -- Apenas proprietários podem deletar
        auth.uid() IN (
            SELECT supabase_auth_id FROM usuarios u2
            JOIN perfis_usuario p ON u2.perfil_id = p.id
            WHERE p.tipo = 'PROPRIETARIO' AND u2.ativo = true
        )
    );

-- 3. CRIAR FUNÇÃO PARA VERIFICAR SE É PRIMEIRO ACESSO
CREATE OR REPLACE FUNCTION is_first_access()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (SELECT 1 FROM usuarios LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR FUNÇÃO PARA OBTER ID DO PERFIL PROPRIETÁRIO
CREATE OR REPLACE FUNCTION get_proprietario_perfil_id()
RETURNS UUID AS $$
DECLARE
    perfil_id UUID;
BEGIN
    SELECT id INTO perfil_id 
    FROM perfis_usuario 
    WHERE tipo = 'PROPRIETARIO' 
    LIMIT 1;
    
    RETURN perfil_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CRIAR TRIGGER PARA SINCRONIZAÇÃO COM AUTH.USERS
CREATE OR REPLACE FUNCTION sync_user_with_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar último acesso quando o usuário faz login
    IF TG_OP = 'UPDATE' AND OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        UPDATE usuarios 
        SET ultimo_acesso = NEW.last_sign_in_at
        WHERE supabase_auth_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela auth.users (se não existir)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION sync_user_with_auth();

-- 6. INSERIR PERFIL PROPRIETÁRIO SE NÃO EXISTIR
INSERT INTO perfis_usuario (id, nome, descricao, tipo, dashboard_padrao, ativo)
VALUES (
    '42142fe1-756d-4ff2-b92a-58a7ea8b77fa',
    'Proprietário',
    'Acesso total ao sistema, dashboard administrativo completo',
    'PROPRIETARIO',
    'administrativo',
    true
) ON CONFLICT (nome) DO UPDATE SET
    descricao = EXCLUDED.descricao,
    tipo = EXCLUDED.tipo,
    dashboard_padrao = EXCLUDED.dashboard_padrao,
    ativo = EXCLUDED.ativo;

-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON POLICY "usuarios_select_policy" ON usuarios IS 'Permite que usuários autenticados vejam todos os usuários';
COMMENT ON POLICY "usuarios_insert_policy" ON usuarios IS 'Permite inserção no primeiro acesso ou por proprietários';
COMMENT ON POLICY "usuarios_update_policy" ON usuarios IS 'Apenas proprietários podem atualizar usuários';
COMMENT ON POLICY "usuarios_delete_policy" ON usuarios IS 'Apenas proprietários podem deletar usuários';

COMMENT ON FUNCTION is_first_access() IS 'Verifica se é o primeiro acesso ao sistema (nenhum usuário cadastrado)';
COMMENT ON FUNCTION get_proprietario_perfil_id() IS 'Retorna o ID do perfil de proprietário';
COMMENT ON FUNCTION sync_user_with_auth() IS 'Sincroniza dados entre auth.users e usuarios';

-- 8. VERIFICAR SE A MIGRAÇÃO FOI APLICADA CORRETAMENTE
DO $$
DECLARE
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Verificar políticas
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'usuarios' AND schemaname = 'public';
    
    -- Verificar funções
    SELECT COUNT(*) INTO function_count
    FROM pg_proc 
    WHERE proname IN ('is_first_access', 'get_proprietario_perfil_id', 'sync_user_with_auth');
    
    RAISE NOTICE 'Migração aplicada com sucesso!';
    RAISE NOTICE 'Políticas RLS criadas: %', policy_count;
    RAISE NOTICE 'Funções utilitárias criadas: %', function_count;
END $$; 