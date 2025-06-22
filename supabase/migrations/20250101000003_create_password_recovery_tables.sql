-- =====================================================
-- MIGRAÇÃO: Sistema de Recuperação de Senha
-- Data: 2024-12-26
-- Descrição: Criação das tabelas para gerenciar tokens de recuperação de senha
-- =====================================================

-- Tabela para armazenar tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS tokens_recuperacao_senha (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    usado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_tokens_recuperacao_token ON tokens_recuperacao_senha(token);
CREATE INDEX IF NOT EXISTS idx_tokens_recuperacao_email ON tokens_recuperacao_senha(email);
CREATE INDEX IF NOT EXISTS idx_tokens_recuperacao_usuario_id ON tokens_recuperacao_senha(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tokens_recuperacao_expires_at ON tokens_recuperacao_senha(expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_recuperacao_usado ON tokens_recuperacao_senha(usado);

-- Tabela para logs de emails enviados
CREATE TABLE IF NOT EXISTS logs_email (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- 'recuperacao_senha', 'boas_vindas', etc.
    destinatario VARCHAR(255) NOT NULL,
    assunto TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'enviado', -- 'enviado', 'erro', 'entregue'
    erro_detalhes TEXT,
    dados_extras JSONB,
    enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs de email
CREATE INDEX IF NOT EXISTS idx_logs_email_tipo ON logs_email(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_email_destinatario ON logs_email(destinatario);
CREATE INDEX IF NOT EXISTS idx_logs_email_status ON logs_email(status);
CREATE INDEX IF NOT EXISTS idx_logs_email_enviado_em ON logs_email(enviado_em);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tokens_recuperacao_senha_updated_at 
    BEFORE UPDATE ON tokens_recuperacao_senha 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para tokens_recuperacao_senha
ALTER TABLE tokens_recuperacao_senha ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios tokens
CREATE POLICY "Usuários podem ver seus próprios tokens de recuperação" ON tokens_recuperacao_senha
    FOR SELECT USING (
        usuario_id IN (
            SELECT id FROM usuarios WHERE supabase_auth_id = auth.uid()
        )
    );

-- Política para permitir inserção de tokens (necessário para o sistema)
CREATE POLICY "Sistema pode inserir tokens de recuperação" ON tokens_recuperacao_senha
    FOR INSERT WITH CHECK (true);

-- Política para permitir atualização de tokens (marcar como usado)
CREATE POLICY "Sistema pode atualizar tokens de recuperação" ON tokens_recuperacao_senha
    FOR UPDATE USING (true);

-- RLS para logs_email
ALTER TABLE logs_email ENABLE ROW LEVEL SECURITY;

-- Política para logs de email (apenas sistema pode inserir)
CREATE POLICY "Sistema pode inserir logs de email" ON logs_email
    FOR INSERT WITH CHECK (true);

-- Política para visualização de logs (apenas admins)
CREATE POLICY "Admins podem ver logs de email" ON logs_email
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN perfis_usuario p ON u.perfil_id = p.id
            WHERE u.supabase_auth_id = auth.uid()
            AND p.nome = 'Proprietário'
        )
    );

-- Função para limpeza automática de tokens expirados (executar via cron job)
CREATE OR REPLACE FUNCTION limpar_tokens_expirados()
RETURNS INTEGER AS $$
DECLARE
    tokens_removidos INTEGER;
BEGIN
    DELETE FROM tokens_recuperacao_senha 
    WHERE expires_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS tokens_removidos = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO logs_email (tipo, destinatario, assunto, dados_extras)
    VALUES (
        'limpeza_sistema',
        'sistema@pharma-ai.com',
        'Limpeza automática de tokens expirados',
        jsonb_build_object('tokens_removidos', tokens_removidos, 'executado_em', NOW())
    );
    
    RETURN tokens_removidos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários nas tabelas
COMMENT ON TABLE tokens_recuperacao_senha IS 'Armazena tokens temporários para recuperação de senha';
COMMENT ON COLUMN tokens_recuperacao_senha.token IS 'Token único e seguro para recuperação';
COMMENT ON COLUMN tokens_recuperacao_senha.expires_at IS 'Data/hora de expiração do token (1 hora após criação)';
COMMENT ON COLUMN tokens_recuperacao_senha.usado IS 'Indica se o token já foi utilizado';

COMMENT ON TABLE logs_email IS 'Log de todos os emails enviados pelo sistema';
COMMENT ON COLUMN logs_email.tipo IS 'Tipo do email: recuperacao_senha, boas_vindas, etc.';
COMMENT ON COLUMN logs_email.dados_extras IS 'Dados adicionais em formato JSON';

-- Inserir permissões para o módulo de recuperação de senha (apenas se não existir)
DO $$
BEGIN
    INSERT INTO permissoes (perfil_id, modulo, acao, permitido)
    SELECT 
        p.id,
        'USUARIOS_PERMISSOES',
        'LER',
        true
    FROM perfis_usuario p
    WHERE p.nome IN ('Proprietário', 'Farmacêutico', 'Atendente', 'Manipulador')
    AND NOT EXISTS (
        SELECT 1 FROM permissoes perm 
        WHERE perm.perfil_id = p.id 
        AND perm.modulo = 'USUARIOS_PERMISSOES' 
        AND perm.acao = 'LER'
    );
END $$; 