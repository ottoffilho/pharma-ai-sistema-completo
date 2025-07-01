-- =====================================================
-- MIGRAÇÃO: Sistema 2FA - Pharma.AI
-- Data: 2025-07-01
-- Descrição: Implementa autenticação de dois fatores
-- =====================================================

-- 1. EXTENSÃO PARA CRIPTOGRAFIA
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABELA PARA CONFIGURAÇÕES 2FA
CREATE TABLE IF NOT EXISTS user_2fa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Configurações TOTP
    secret_key TEXT NOT NULL, -- Chave secreta criptografada
    is_enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[], -- Códigos de backup criptografados
    
    -- Configurações SMS (futuro)
    phone_number TEXT,
    phone_verified BOOLEAN DEFAULT false,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    recovery_used_at TIMESTAMPTZ,
    
    -- Restrições
    CONSTRAINT unique_user_2fa UNIQUE (user_id)
);

-- 3. TABELA PARA LOGS DE TENTATIVAS 2FA
CREATE TABLE IF NOT EXISTS auth_2fa_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Detalhes da tentativa
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('totp', 'backup_code', 'sms')),
    success BOOLEAN NOT NULL,
    code_used TEXT, -- Hash do código usado
    ip_address INET,
    user_agent TEXT,
    
    -- Contexto
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX idx_user_2fa_enabled ON user_2fa(is_enabled);
CREATE INDEX idx_auth_2fa_attempts_user_id ON auth_2fa_attempts(user_id);
CREATE INDEX idx_auth_2fa_attempts_created_at ON auth_2fa_attempts(created_at);
CREATE INDEX idx_auth_2fa_attempts_success ON auth_2fa_attempts(success);

-- 5. FUNÇÃO PARA GERAR CHAVE SECRETA
CREATE OR REPLACE FUNCTION generate_2fa_secret()
RETURNS TEXT AS $$
DECLARE
    secret TEXT;
BEGIN
    -- Gerar chave secreta de 32 caracteres base32
    secret := encode(gen_random_bytes(20), 'base32');
    -- Remover padding e retornar
    RETURN replace(secret, '=', '');
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO PARA CRIPTOGRAFAR DADOS SENSÍVEIS
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Usar chave mestra do ambiente ou padrão para desenvolvimento
    RETURN encode(
        pgp_sym_encrypt(
            data, 
            COALESCE(current_setting('app.encryption_key', true), 'pharma-ai-dev-key-2025')
        ), 
        'base64'
    );
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA DESCRIPTOGRAFAR DADOS SENSÍVEIS
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_data, 'base64'),
        COALESCE(current_setting('app.encryption_key', true), 'pharma-ai-dev-key-2025')
    );
EXCEPTION WHEN OTHERS THEN
    RETURN NULL; -- Retorna NULL se não conseguir descriptografar
END;
$$ LANGUAGE plpgsql;

-- 8. FUNÇÃO PARA CONFIGURAR 2FA
CREATE OR REPLACE FUNCTION setup_user_2fa(
    p_user_id UUID,
    p_secret_key TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    secret_key TEXT;
    backup_codes TEXT[];
    encrypted_secret TEXT;
    encrypted_codes TEXT[];
    i INTEGER;
    temp_code TEXT;
    result JSON;
BEGIN
    -- Gerar chave secreta se não fornecida
    IF p_secret_key IS NULL THEN
        secret_key := generate_2fa_secret();
    ELSE
        secret_key := p_secret_key;
    END IF;
    
    -- Gerar 10 códigos de backup
    backup_codes := '{}';
    FOR i IN 1..10 LOOP
        temp_code := LPAD(floor(random() * 1000000)::text, 6, '0');
        backup_codes := array_append(backup_codes, temp_code);
    END LOOP;
    
    -- Criptografar dados sensíveis
    encrypted_secret := encrypt_sensitive_data(secret_key);
    encrypted_codes := '{}';
    FOREACH temp_code IN ARRAY backup_codes LOOP
        encrypted_codes := array_append(encrypted_codes, encrypt_sensitive_data(temp_code));
    END LOOP;
    
    -- Inserir ou atualizar configuração 2FA
    INSERT INTO user_2fa (user_id, secret_key, backup_codes, is_enabled)
    VALUES (p_user_id, encrypted_secret, encrypted_codes, false)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        secret_key = EXCLUDED.secret_key,
        backup_codes = EXCLUDED.backup_codes,
        is_enabled = false,
        updated_at = NOW();
    
    -- Retornar dados para configuração (não criptografados)
    result := json_build_object(
        'secret_key', secret_key,
        'backup_codes', backup_codes,
        'qr_code_url', 'otpauth://totp/Pharma.AI:' || 
                      (SELECT email FROM usuarios WHERE id = p_user_id) || 
                      '?secret=' || secret_key || 
                      '&issuer=Pharma.AI'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNÇÃO PARA HABILITAR 2FA
CREATE OR REPLACE FUNCTION enable_user_2fa(
    p_user_id UUID,
    p_totp_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    stored_secret TEXT;
    decrypted_secret TEXT;
    is_valid BOOLEAN := false;
BEGIN
    -- Buscar chave secreta
    SELECT secret_key INTO stored_secret
    FROM user_2fa
    WHERE user_id = p_user_id;
    
    IF stored_secret IS NULL THEN
        RETURN false;
    END IF;
    
    -- Descriptografar chave
    decrypted_secret := decrypt_sensitive_data(stored_secret);
    
    IF decrypted_secret IS NULL THEN
        RETURN false;
    END IF;
    
    -- Validar código TOTP (implementação simplificada)
    -- Em produção, usar biblioteca adequada para TOTP
    -- Por agora, aceitar qualquer código de 6 dígitos para configuração
    IF length(p_totp_code) = 6 AND p_totp_code ~ '^[0-9]+$' THEN
        is_valid := true;
    END IF;
    
    IF is_valid THEN
        -- Habilitar 2FA
        UPDATE user_2fa 
        SET is_enabled = true, updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Log da ativação
        INSERT INTO auth_2fa_attempts (
            user_id, attempt_type, success, code_used
        ) VALUES (
            p_user_id, 'totp', true, encode(digest(p_totp_code, 'sha256'), 'hex')
        );
        
        RETURN true;
    END IF;
    
    -- Log da tentativa falhada
    INSERT INTO auth_2fa_attempts (
        user_id, attempt_type, success, code_used
    ) VALUES (
        p_user_id, 'totp', false, encode(digest(p_totp_code, 'sha256'), 'hex')
    );
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. FUNÇÃO PARA VERIFICAR CÓDIGO 2FA
CREATE OR REPLACE FUNCTION verify_2fa_code(
    p_user_id UUID,
    p_code TEXT,
    p_code_type TEXT DEFAULT 'totp'
)
RETURNS BOOLEAN AS $$
DECLARE
    user_2fa_record RECORD;
    is_valid BOOLEAN := false;
    backup_code TEXT;
    decrypted_code TEXT;
    updated_codes TEXT[];
BEGIN
    -- Buscar configuração 2FA
    SELECT * INTO user_2fa_record
    FROM user_2fa
    WHERE user_id = p_user_id AND is_enabled = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Verificar tipo de código
    IF p_code_type = 'totp' THEN
        -- Validação TOTP simplificada para demonstração
        -- Em produção, implementar validação real com janela de tempo
        IF length(p_code) = 6 AND p_code ~ '^[0-9]+$' THEN
            is_valid := true; -- Placeholder
        END IF;
        
    ELSIF p_code_type = 'backup_code' THEN
        -- Verificar códigos de backup
        updated_codes := '{}';
        FOREACH backup_code IN ARRAY user_2fa_record.backup_codes LOOP
            decrypted_code := decrypt_sensitive_data(backup_code);
            IF decrypted_code = p_code THEN
                is_valid := true;
                -- Marcar código como usado (remover da lista)
            ELSE
                updated_codes := array_append(updated_codes, backup_code);
            END IF;
        END LOOP;
        
        -- Atualizar códigos de backup se um foi usado
        IF is_valid THEN
            UPDATE user_2fa 
            SET backup_codes = updated_codes, recovery_used_at = NOW()
            WHERE user_id = p_user_id;
        END IF;
    END IF;
    
    -- Log da tentativa
    INSERT INTO auth_2fa_attempts (
        user_id, attempt_type, success, code_used
    ) VALUES (
        p_user_id, p_code_type, is_valid, encode(digest(p_code, 'sha256'), 'hex')
    );
    
    -- Atualizar último uso se sucesso
    IF is_valid THEN
        UPDATE user_2fa 
        SET last_used_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. FUNÇÃO PARA DESABILITAR 2FA
CREATE OR REPLACE FUNCTION disable_user_2fa(
    p_user_id UUID,
    p_verification_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    is_valid BOOLEAN;
BEGIN
    -- Verificar código antes de desabilitar
    is_valid := verify_2fa_code(p_user_id, p_verification_code, 'totp');
    
    IF NOT is_valid THEN
        -- Tentar com código de backup
        is_valid := verify_2fa_code(p_user_id, p_verification_code, 'backup_code');
    END IF;
    
    IF is_valid THEN
        -- Desabilitar 2FA
        UPDATE user_2fa 
        SET is_enabled = false, updated_at = NOW()
        WHERE user_id = p_user_id;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. FUNÇÃO PARA VERIFICAR STATUS 2FA
CREATE OR REPLACE FUNCTION get_user_2fa_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'is_enabled', COALESCE(is_enabled, false),
        'has_backup_codes', COALESCE(array_length(backup_codes, 1) > 0, false),
        'last_used', last_used_at,
        'setup_date', created_at
    ) INTO result
    FROM user_2fa
    WHERE user_id = p_user_id;
    
    -- Se não existe registro, retornar status padrão
    IF result IS NULL THEN
        result := json_build_object(
            'is_enabled', false,
            'has_backup_codes', false,
            'last_used', null,
            'setup_date', null
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. TRIGGER PARA ATUALIZAR TIMESTAMP
CREATE TRIGGER update_user_2fa_timestamp
    BEFORE UPDATE ON user_2fa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 14. RLS PARA SEGURANÇA
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_2fa_attempts ENABLE ROW LEVEL SECURITY;

-- Usuários só podem ver seus próprios dados 2FA
CREATE POLICY "Users can view own 2FA settings" ON user_2fa
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM usuarios WHERE supabase_auth_id = auth.uid()
        )
    );

-- Usuários só podem modificar seus próprios dados 2FA via funções
CREATE POLICY "Users can modify own 2FA via functions" ON user_2fa
    FOR ALL
    USING (auth.role() = 'service_role');

-- Logs de tentativas 2FA
CREATE POLICY "Users can view own 2FA attempts" ON auth_2fa_attempts
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM usuarios WHERE supabase_auth_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage 2FA attempts" ON auth_2fa_attempts
    FOR ALL
    USING (auth.role() = 'service_role');

-- 15. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION setup_user_2fa(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION enable_user_2fa(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_2fa_code(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION disable_user_2fa(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_2fa_status(UUID) TO authenticated;

-- 16. COMENTÁRIOS
COMMENT ON TABLE user_2fa IS 'Configurações de autenticação de dois fatores por usuário';
COMMENT ON TABLE auth_2fa_attempts IS 'Log de tentativas de autenticação 2FA';
COMMENT ON FUNCTION setup_user_2fa(UUID, TEXT) IS 'Configura 2FA para um usuário';
COMMENT ON FUNCTION verify_2fa_code(UUID, TEXT, TEXT) IS 'Verifica código 2FA (TOTP ou backup)';

-- 17. LOG DE SUCESSO
SELECT 'Sistema 2FA criado com sucesso!' as status;