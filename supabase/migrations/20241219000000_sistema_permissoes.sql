-- =====================================================
-- MIGRAÇÃO: Sistema de Permissões - Pharma.AI
-- Versão: 1.0.0
-- Data: 2024-12-19
-- Descrição: Criação das tabelas para sistema de usuários e permissões
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA: perfis_usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS perfis_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PROPRIETARIO', 'FARMACEUTICO', 'ATENDENTE', 'MANIPULADOR')),
    dashboard_padrao VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supabase_auth_id UUID UNIQUE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    perfil_id UUID NOT NULL REFERENCES perfis_usuario(id),
    ativo BOOLEAN DEFAULT true,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABELA: permissoes
-- =====================================================
CREATE TABLE IF NOT EXISTS permissoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES perfis_usuario(id),
    modulo VARCHAR(50) NOT NULL,
    acao VARCHAR(20) NOT NULL CHECK (acao IN ('LER', 'CRIAR', 'EDITAR', 'DELETAR', 'ADMINISTRAR')),
    permitido BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA: sessoes_usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS sessoes_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    token_sessao VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL
);

-- =====================================================
-- 5. TABELA: logs_auditoria
-- =====================================================
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    detalhes JSONB,
    ip_address INET,
    user_agent TEXT,
    sucesso BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_id ON usuarios(perfil_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_supabase_auth_id ON usuarios(supabase_auth_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- Índices para permissoes
CREATE INDEX IF NOT EXISTS idx_permissoes_perfil_id ON permissoes(perfil_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_modulo ON permissoes(modulo);
CREATE INDEX IF NOT EXISTS idx_permissoes_acao ON permissoes(acao);

-- Índices para sessoes_usuario
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes_usuario(token_sessao);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativo ON sessoes_usuario(ativo);

-- Índices para logs_auditoria
CREATE INDEX IF NOT EXISTS idx_logs_usuario_id ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_logs_modulo ON logs_auditoria(modulo);
CREATE INDEX IF NOT EXISTS idx_logs_criado_em ON logs_auditoria(criado_em);

-- =====================================================
-- 7. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualização automática
CREATE TRIGGER update_perfis_usuario_updated_at 
    BEFORE UPDATE ON perfis_usuario 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. DADOS INICIAIS - PERFIS PADRÃO
-- =====================================================

INSERT INTO perfis_usuario (nome, descricao, tipo, dashboard_padrao) VALUES
('Proprietário', 'Acesso total ao sistema, dashboard administrativo completo', 'PROPRIETARIO', 'administrativo'),
('Farmacêutico', 'Acesso a produção, qualidade e operações farmacêuticas', 'FARMACEUTICO', 'operacional'),
('Atendente', 'Acesso a atendimento, PDV e consultas básicas', 'ATENDENTE', 'atendimento'),
('Manipulador', 'Acesso a produção e controle de qualidade', 'MANIPULADOR', 'producao')
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- 9. PERMISSÕES PADRÃO POR PERFIL
-- =====================================================

-- Função para inserir permissões
CREATE OR REPLACE FUNCTION inserir_permissoes_perfil(
    p_perfil_nome VARCHAR,
    p_modulos TEXT[],
    p_acoes TEXT[]
) RETURNS VOID AS $$
DECLARE
    v_perfil_id UUID;
    v_modulo TEXT;
    v_acao TEXT;
BEGIN
    -- Buscar ID do perfil
    SELECT id INTO v_perfil_id FROM perfis_usuario WHERE nome = p_perfil_nome;
    
    IF v_perfil_id IS NULL THEN
        RAISE EXCEPTION 'Perfil % não encontrado', p_perfil_nome;
    END IF;
    
    -- Inserir permissões para cada módulo e ação
    FOREACH v_modulo IN ARRAY p_modulos
    LOOP
        FOREACH v_acao IN ARRAY p_acoes
        LOOP
            INSERT INTO permissoes (perfil_id, modulo, acao, permitido)
            VALUES (v_perfil_id, v_modulo, v_acao, true)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- PROPRIETÁRIO - Acesso total
SELECT inserir_permissoes_perfil(
    'Proprietário',
    ARRAY['USUARIOS_PERMISSOES', 'CADASTROS_ESSENCIAIS', 'ATENDIMENTO', 'ESTOQUE', 'FINANCEIRO', 'PDV', 'RELATORIOS', 'PRODUCAO', 'IA'],
    ARRAY['LER', 'CRIAR', 'EDITAR', 'DELETAR', 'ADMINISTRAR']
);

-- FARMACÊUTICO - Foco em produção e qualidade
SELECT inserir_permissoes_perfil(
    'Farmacêutico',
    ARRAY['CADASTROS_ESSENCIAIS', 'ESTOQUE', 'PRODUCAO', 'RELATORIOS'],
    ARRAY['LER', 'CRIAR', 'EDITAR']
);

SELECT inserir_permissoes_perfil(
    'Farmacêutico',
    ARRAY['ATENDIMENTO', 'PDV'],
    ARRAY['LER']
);

-- ATENDENTE - Foco em atendimento e vendas
SELECT inserir_permissoes_perfil(
    'Atendente',
    ARRAY['ATENDIMENTO', 'PDV'],
    ARRAY['LER', 'CRIAR', 'EDITAR']
);

SELECT inserir_permissoes_perfil(
    'Atendente',
    ARRAY['CADASTROS_ESSENCIAIS', 'ESTOQUE', 'RELATORIOS'],
    ARRAY['LER']
);

-- MANIPULADOR - Foco em produção
SELECT inserir_permissoes_perfil(
    'Manipulador',
    ARRAY['PRODUCAO', 'ESTOQUE'],
    ARRAY['LER', 'CRIAR', 'EDITAR']
);

SELECT inserir_permissoes_perfil(
    'Manipulador',
    ARRAY['CADASTROS_ESSENCIAIS'],
    ARRAY['LER']
);

-- =====================================================
-- 10. USUÁRIOS DE DEMONSTRAÇÃO
-- =====================================================

-- Inserir usuários de demonstração (sem supabase_auth_id por enquanto)
INSERT INTO usuarios (nome, email, perfil_id) VALUES
('Administrador Sistema', 'proprietario@farmacia.com', (SELECT id FROM perfis_usuario WHERE nome = 'Proprietário')),
('Dr. João Silva', 'farmaceutico@farmacia.com', (SELECT id FROM perfis_usuario WHERE nome = 'Farmacêutico')),
('Maria Santos', 'atendente@farmacia.com', (SELECT id FROM perfis_usuario WHERE nome = 'Atendente')),
('Carlos Oliveira', 'manipulador@farmacia.com', (SELECT id FROM perfis_usuario WHERE nome = 'Manipulador'))
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE perfis_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (usuários autenticados)
CREATE POLICY "Usuários autenticados podem ver perfis" ON perfis_usuario
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver usuários" ON usuarios
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver permissões" ON permissoes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas mais restritivas para modificações (apenas proprietários)
CREATE POLICY "Apenas proprietários podem modificar usuários" ON usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            JOIN perfis_usuario p ON u.perfil_id = p.id 
            WHERE u.supabase_auth_id = auth.uid() 
            AND p.tipo = 'PROPRIETARIO'
        )
    );

-- =====================================================
-- 12. FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função para verificar permissão
CREATE OR REPLACE FUNCTION verificar_permissao(
    p_usuario_id UUID,
    p_modulo VARCHAR,
    p_acao VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_permitido BOOLEAN := false;
BEGIN
    SELECT p.permitido INTO v_permitido
    FROM usuarios u
    JOIN permissoes p ON u.perfil_id = p.perfil_id
    WHERE u.id = p_usuario_id
    AND p.modulo = p_modulo
    AND p.acao = p_acao;
    
    RETURN COALESCE(v_permitido, false);
END;
$$ LANGUAGE plpgsql;

-- Função para obter usuário por auth_id
CREATE OR REPLACE FUNCTION obter_usuario_por_auth_id(p_auth_id UUID)
RETURNS TABLE (
    id UUID,
    nome VARCHAR,
    email VARCHAR,
    telefone VARCHAR,
    perfil_nome VARCHAR,
    perfil_tipo VARCHAR,
    dashboard_padrao VARCHAR,
    ativo BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.nome,
        u.email,
        u.telefone,
        p.nome as perfil_nome,
        p.tipo as perfil_tipo,
        p.dashboard_padrao,
        u.ativo
    FROM usuarios u
    JOIN perfis_usuario p ON u.perfil_id = p.id
    WHERE u.supabase_auth_id = p_auth_id
    AND u.ativo = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 13. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE perfis_usuario IS 'Perfis de usuário do sistema (Proprietário, Farmacêutico, etc.)';
COMMENT ON TABLE usuarios IS 'Usuários do sistema com referência ao Supabase Auth';
COMMENT ON TABLE permissoes IS 'Permissões granulares por perfil e módulo';
COMMENT ON TABLE sessoes_usuario IS 'Controle de sessões ativas dos usuários';
COMMENT ON TABLE logs_auditoria IS 'Log de auditoria de todas as ações do sistema';

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Limpar função temporária
DROP FUNCTION IF EXISTS inserir_permissoes_perfil(VARCHAR, TEXT[], TEXT[]);

-- Confirmar criação
SELECT 'Sistema de permissões criado com sucesso!' as status; 