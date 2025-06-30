-- Migração: Sistema de Formas Farmacêuticas e Processos
-- Data: 2025-01-31
-- Objetivo: Implementar CRUD completo para formas farmacêuticas com processos e configurações de rótulo

-- Enum para tipos de processo
CREATE TYPE tipo_processo AS ENUM ('PRODUCAO', 'QUALIDADE', 'LOGISTICA');

-- Tabela principal de formas farmacêuticas
CREATE TABLE formas_farmaceuticas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    abreviatura VARCHAR(10),
    tipo_uso VARCHAR(50), -- oral, tópico, injetável, etc.
    descricao TEXT,
    desconto_maximo NUMERIC(5,2) DEFAULT 0, -- % máximo de desconto
    valor_minimo NUMERIC(10,2) DEFAULT 0, -- valor mínimo de venda
    rotulo_config JSONB NOT NULL DEFAULT '{}',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES usuarios(id)
);

-- Tabela de processos por forma farmacêutica
CREATE TABLE forma_processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forma_id UUID REFERENCES formas_farmaceuticas(id) ON DELETE CASCADE,
    ordem SMALLINT NOT NULL,
    nome_processo TEXT NOT NULL,
    tipo_processo tipo_processo NOT NULL,
    ponto_controle BOOLEAN DEFAULT false,
    tempo_estimado_min INTEGER, -- tempo em minutos
    instrucoes TEXT,
    equipamentos_necessarios TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Garantir ordem única por forma
    UNIQUE(forma_id, ordem)
);

-- Trigger para updated_at na tabela formas_farmaceuticas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_formas_farmaceuticas_updated_at
    BEFORE UPDATE ON formas_farmaceuticas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX formas_farmaceuticas_nome_idx ON formas_farmaceuticas(nome);
CREATE INDEX formas_farmaceuticas_ativo_idx ON formas_farmaceuticas(ativo);
CREATE INDEX forma_processos_forma_id_idx ON forma_processos(forma_id);
CREATE INDEX forma_processos_ordem_idx ON forma_processos(forma_id, ordem);

-- RLS Policies
ALTER TABLE formas_farmaceuticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE forma_processos ENABLE ROW LEVEL SECURITY;

-- Policy para formas_farmaceuticas - SELECT
CREATE POLICY "Formas farmacêuticas são visíveis para usuários autenticados"
ON formas_farmaceuticas FOR SELECT
TO authenticated
USING (true);

-- Policy para formas_farmaceuticas - INSERT
CREATE POLICY "Usuários podem criar formas farmacêuticas com permissão"
ON formas_farmaceuticas FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios u
        JOIN perfis p ON u.perfil_id = p.id
        JOIN permissoes perm ON p.id = perm.perfil_id
        WHERE u.id = auth.uid()
        AND perm.modulo = 'cadastros'
        AND perm.acao = 'criar'
    )
);

-- Policy para formas_farmaceuticas - UPDATE
CREATE POLICY "Usuários podem atualizar formas farmacêuticas com permissão"
ON formas_farmaceuticas FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM usuarios u
        JOIN perfis p ON u.perfil_id = p.id
        JOIN permissoes perm ON p.id = perm.perfil_id
        WHERE u.id = auth.uid()
        AND perm.modulo = 'cadastros'
        AND perm.acao = 'editar'
    )
);

-- Policy para formas_farmaceuticas - DELETE
CREATE POLICY "Usuários podem excluir formas farmacêuticas com permissão"
ON formas_farmaceuticas FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM usuarios u
        JOIN perfis p ON u.perfil_id = p.id
        JOIN permissoes perm ON p.id = perm.perfil_id
        WHERE u.id = auth.uid()
        AND perm.modulo = 'cadastros'
        AND perm.acao = 'excluir'
    )
);

-- Policy para forma_processos - SELECT
CREATE POLICY "Processos de formas são visíveis para usuários autenticados"
ON forma_processos FOR SELECT
TO authenticated
USING (true);

-- Policy para forma_processos - INSERT/UPDATE/DELETE
CREATE POLICY "Usuários podem gerenciar processos com permissão"
ON forma_processos FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM usuarios u
        JOIN perfis p ON u.perfil_id = p.id
        JOIN permissoes perm ON p.id = perm.perfil_id
        WHERE u.id = auth.uid()
        AND perm.modulo = 'cadastros'
        AND perm.acao IN ('criar', 'editar', 'excluir')
    )
);

-- Dados iniciais de formas farmacêuticas
INSERT INTO formas_farmaceuticas (nome, abreviatura, tipo_uso, rotulo_config, descricao) VALUES
('Cápsula', 'CAPS', 'oral', '{"mostrar_concentracao": true, "mostrar_posologia": true, "mostrar_numero_capsulas": true}', 'Forma farmacêutica sólida para administração oral'),
('Pomada', 'POM', 'tópico', '{"mostrar_concentracao": true, "mostrar_area_aplicacao": true, "mostrar_peso": true}', 'Preparação semi-sólida para aplicação tópica'),
('Creme', 'CR', 'tópico', '{"mostrar_concentracao": true, "mostrar_area_aplicacao": true, "mostrar_peso": true}', 'Emulsão semi-sólida para aplicação na pele'),
('Solução', 'SOL', 'oral', '{"mostrar_concentracao": true, "mostrar_volume": true, "mostrar_posologia": true}', 'Preparação líquida homogênea para administração oral'),
('Xarope', 'XAR', 'oral', '{"mostrar_concentracao": true, "mostrar_volume": true, "mostrar_sabor": true, "mostrar_posologia": true}', 'Solução açucarada para administração oral'),
('Gel', 'GEL', 'tópico', '{"mostrar_concentracao": true, "mostrar_area_aplicacao": true, "mostrar_peso": true}', 'Preparação semi-sólida transparente para aplicação tópica'),
('Loção', 'LOC', 'tópico', '{"mostrar_concentracao": true, "mostrar_area_aplicacao": true, "mostrar_volume": true}', 'Preparação líquida para aplicação na pele'),
('Supositório', 'SUP', 'retal', '{"mostrar_concentracao": true, "mostrar_quantidade": true, "mostrar_peso": true}', 'Forma farmacêutica sólida para administração retal');

-- Processos padrão para Cápsulas
INSERT INTO forma_processos (forma_id, ordem, nome_processo, tipo_processo, ponto_controle, tempo_estimado_min, instrucoes) 
SELECT id, 1, 'Pesagem dos Insumos', 'PRODUCAO', true, 15, 'Pesar todos os insumos conforme fórmula'
FROM formas_farmaceuticas WHERE nome = 'Cápsula';

INSERT INTO forma_processos (forma_id, ordem, nome_processo, tipo_processo, ponto_controle, tempo_estimado_min, instrucoes)
SELECT id, 2, 'Mistura e Homogeneização', 'PRODUCAO', false, 20, 'Misturar os insumos até obter mistura homogênea'
FROM formas_farmaceuticas WHERE nome = 'Cápsula';

INSERT INTO forma_processos (forma_id, ordem, nome_processo, tipo_processo, ponto_controle, tempo_estimado_min, instrucoes)
SELECT id, 3, 'Encapsulação', 'PRODUCAO', true, 30, 'Encapsular manualmente ou com equipamento específico'
FROM formas_farmaceuticas WHERE nome = 'Cápsula';

INSERT INTO forma_processos (forma_id, ordem, nome_processo, tipo_processo, ponto_controle, tempo_estimado_min, instrucoes)
SELECT id, 4, 'Controle de Qualidade', 'QUALIDADE', true, 10, 'Verificar peso médio, aspecto visual e uniformidade'
FROM formas_farmaceuticas WHERE nome = 'Cápsula';

INSERT INTO forma_processos (forma_id, ordem, nome_processo, tipo_processo, ponto_controle, tempo_estimado_min, instrucoes)
SELECT id, 5, 'Embalagem e Rotulagem', 'LOGISTICA', false, 15, 'Embalar em recipiente adequado e aplicar rótulo'
FROM formas_farmaceuticas WHERE nome = 'Cápsula';

-- Processos padrão para Pomadas
INSERT INTO forma_processos (forma_id, ordem, nome_processo, tipo_processo, ponto_controle, tempo_estimado_min, instrucoes)
SELECT id, 1, 'Pesagem dos Insumos', 'PRODUCAO', true, 10, 'Pesar princípio ativo e excipientes'
FROM formas_farmaceuticas WHERE nome = 'Pomada';

INSERT INTO forma_processos (forma_id, ordem, nome_processo, tipo_processo, ponto_controle, tempo_estimado_min, instrucoes)
SELECT id, 2, 'Incorporação e Homogeneização', 'PRODUCAO', true, 25, 'Incorporar gradualmente o princípio ativo na base'
FROM formas_farmaceuticas WHERE nome = 'Pomada';

INSERT INTO forma_processos (forma_id, ordem, nome_processo, tipo_processo, ponto_controle, tempo_estimado_min, instrucoes)
SELECT id, 3, 'Controle de Qualidade', 'QUALIDADE', true, 15, 'Verificar homogeneidade, pH e aspecto'
FROM formas_farmaceuticas WHERE nome = 'Pomada';

INSERT INTO forma_processos (forma_id, ordem, nome_processo, tipo_processo, ponto_controle, tempo_estimado_min, instrucoes)
SELECT id, 4, 'Envase e Rotulagem', 'LOGISTICA', false, 10, 'Envasar em recipiente adequado e rotular'
FROM formas_farmaceuticas WHERE nome = 'Pomada';

-- Comentários para documentação
COMMENT ON TABLE formas_farmaceuticas IS 'Cadastro de formas farmacêuticas com configurações de rótulo e políticas comerciais';
COMMENT ON TABLE forma_processos IS 'Processos de produção específicos para cada forma farmacêutica';
COMMENT ON COLUMN formas_farmaceuticas.rotulo_config IS 'Configurações JSON para campos do rótulo (ex: {"mostrar_concentracao": true, "mostrar_posologia": true})';
COMMENT ON COLUMN forma_processos.ponto_controle IS 'Indica se este processo é um ponto crítico de controle de qualidade';
COMMENT ON COLUMN forma_processos.equipamentos_necessarios IS 'Array de equipamentos necessários para este processo';