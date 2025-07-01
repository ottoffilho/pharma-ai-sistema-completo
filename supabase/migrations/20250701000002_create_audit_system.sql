-- =====================================================
-- MIGRAÇÃO: Sistema de Auditoria Completo - Pharma.AI
-- Data: 2025-07-01
-- Descrição: Implementa sistema robusto de auditoria para todas as operações
-- =====================================================

-- 1. CRIAR TABELA DE AUDITORIA PRINCIPAL
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação da operação
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID,
    
    -- Dados da operação
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Contexto do usuário
    user_id UUID REFERENCES usuarios(id),
    user_email TEXT,
    user_ip INET,
    user_agent TEXT,
    
    -- Contexto da requisição
    endpoint TEXT,
    http_method TEXT,
    request_id UUID,
    session_id TEXT,
    
    -- Contexto de negócio
    farmacia_id UUID,
    proprietario_id UUID,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    severity TEXT DEFAULT 'INFO' CHECK (severity IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')),
    tags TEXT[],
    additional_data JSONB
);

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_farmacia_id ON audit_logs(farmacia_id);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);

-- Índice composto para consultas comuns
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at);

-- 3. FUNÇÃO GENÉRICA DE AUDITORIA
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id UUID;
    audit_user_email TEXT;
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[] := '{}';
    field_name TEXT;
BEGIN
    -- Obter informações do usuário atual
    SELECT id, email INTO audit_user_id, audit_user_email
    FROM usuarios 
    WHERE supabase_auth_id = auth.uid();

    -- Preparar dados antigos e novos
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSE -- UPDATE
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        -- Identificar campos alterados
        FOR field_name IN 
            SELECT key FROM jsonb_each(old_data) 
            WHERE jsonb_extract_path(old_data, key) IS DISTINCT FROM jsonb_extract_path(new_data, key)
        LOOP
            changed_fields := array_append(changed_fields, field_name);
        END LOOP;
    END IF;

    -- Inserir log de auditoria
    INSERT INTO audit_logs (
        table_name,
        operation,
        record_id,
        old_values,
        new_values,
        changed_fields,
        user_id,
        user_email,
        farmacia_id,
        proprietario_id,
        severity,
        additional_data
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        old_data,
        new_data,
        changed_fields,
        audit_user_id,
        audit_user_email,
        COALESCE(NEW.farmacia_id, OLD.farmacia_id),
        COALESCE(NEW.proprietario_id, OLD.proprietario_id),
        CASE 
            WHEN TG_TABLE_NAME IN ('vendas', 'pagamentos_venda', 'usuarios') THEN 'WARN'
            WHEN TG_OP = 'DELETE' THEN 'WARN'
            ELSE 'INFO'
        END,
        jsonb_build_object(
            'trigger_name', TG_NAME,
            'when', TG_WHEN,
            'level', TG_LEVEL
        )
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO PARA AUDITORIA MANUAL
CREATE OR REPLACE FUNCTION log_audit_event(
    p_table_name TEXT,
    p_operation TEXT,
    p_record_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT NULL,
    p_severity TEXT DEFAULT 'INFO',
    p_tags TEXT[] DEFAULT '{}',
    p_additional_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    audit_user_id UUID;
    audit_user_email TEXT;
BEGIN
    -- Obter informações do usuário atual
    SELECT id, email INTO audit_user_id, audit_user_email
    FROM usuarios 
    WHERE supabase_auth_id = auth.uid();

    -- Inserir log
    INSERT INTO audit_logs (
        table_name,
        operation,
        record_id,
        new_values,
        user_id,
        user_email,
        severity,
        tags,
        additional_data
    ) VALUES (
        p_table_name,
        p_operation,
        p_record_id,
        p_data,
        audit_user_id,
        audit_user_email,
        p_severity,
        p_tags,
        p_additional_data
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. APLICAR TRIGGERS EM TABELAS CRÍTICAS
-- Vendas
DROP TRIGGER IF EXISTS audit_vendas ON vendas;
CREATE TRIGGER audit_vendas
    AFTER INSERT OR UPDATE OR DELETE ON vendas
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Usuários
DROP TRIGGER IF EXISTS audit_usuarios ON usuarios;
CREATE TRIGGER audit_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Produtos
DROP TRIGGER IF EXISTS audit_produtos ON produtos;
CREATE TRIGGER audit_produtos
    AFTER INSERT OR UPDATE OR DELETE ON produtos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Pagamentos
DROP TRIGGER IF EXISTS audit_pagamentos_venda ON pagamentos_venda;
CREATE TRIGGER audit_pagamentos_venda
    AFTER INSERT OR UPDATE OR DELETE ON pagamentos_venda
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Clientes (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientes') THEN
        DROP TRIGGER IF EXISTS audit_clientes ON clientes;
        CREATE TRIGGER audit_clientes
            AFTER INSERT OR UPDATE OR DELETE ON clientes
            FOR EACH ROW EXECUTE FUNCTION audit_trigger();
    END IF;
END $$;

-- 6. FUNÇÃO PARA LIMPEZA AUTOMÁTICA
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS void AS $$
BEGIN
    -- Manter logs críticos por 2 anos
    DELETE FROM audit_logs 
    WHERE severity NOT IN ('WARN', 'ERROR', 'CRITICAL') 
    AND created_at < NOW() - INTERVAL '6 months';
    
    -- Manter logs importantes por 2 anos
    DELETE FROM audit_logs 
    WHERE severity IN ('WARN', 'ERROR', 'CRITICAL')
    AND created_at < NOW() - INTERVAL '2 years';
    
    -- Log da operação de limpeza
    INSERT INTO audit_logs (
        table_name,
        operation,
        severity,
        additional_data
    ) VALUES (
        'audit_logs',
        'CLEANUP',
        'INFO',
        jsonb_build_object(
            'cleanup_date', NOW(),
            'remaining_count', (SELECT COUNT(*) FROM audit_logs)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA RELATÓRIO DE AUDITORIA
CREATE OR REPLACE FUNCTION get_audit_report(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW(),
    p_table_name TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    operation_count BIGINT,
    table_name TEXT,
    operation TEXT,
    user_email TEXT,
    last_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as operation_count,
        a.table_name,
        a.operation,
        a.user_email,
        MAX(a.created_at) as last_activity
    FROM audit_logs a
    WHERE a.created_at BETWEEN p_start_date AND p_end_date
    AND (p_table_name IS NULL OR a.table_name = p_table_name)
    AND (p_user_id IS NULL OR a.user_id = p_user_id)
    GROUP BY a.table_name, a.operation, a.user_email
    ORDER BY operation_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS PARA SEGURANÇA
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para proprietários verem seus dados
CREATE POLICY "Proprietários podem ver auditorias de sua farmácia" ON audit_logs
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN perfis_usuario p ON u.perfil_id = p.id
            WHERE u.supabase_auth_id = auth.uid()
            AND p.tipo = 'PROPRIETARIO'
            AND (farmacia_id IS NULL OR farmacia_id = u.farmacia_id)
        )
    );

-- Política para service role (aplicação)
CREATE POLICY "Service role full access" ON audit_logs
    FOR ALL 
    USING (auth.role() = 'service_role');

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE audit_logs IS 'Registro completo de auditoria para todas as operações do sistema';
COMMENT ON FUNCTION audit_trigger() IS 'Trigger genérico para auditoria automática de tabelas';
COMMENT ON FUNCTION log_audit_event(TEXT, TEXT, UUID, JSONB, TEXT, TEXT[], JSONB) IS 'Função para log manual de eventos de auditoria';
COMMENT ON FUNCTION cleanup_audit_logs() IS 'Limpeza automática de logs antigos baseada na criticidade';

-- 10. LOG DE SUCESSO
SELECT 'Sistema de auditoria completo criado com sucesso!' as status;