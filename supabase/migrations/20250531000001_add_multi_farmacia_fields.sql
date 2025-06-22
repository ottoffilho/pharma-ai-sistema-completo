-- =====================================================
-- MIGRAÇÃO: Adicionar Campos Multi-Farmácia
-- Data: 2025-05-31
-- Descrição: Adiciona campos para suporte ao sistema multi-farmácia
-- =====================================================

-- 1. CRIAR TABELA PROPRIETÁRIOS
CREATE TABLE IF NOT EXISTS public.proprietarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    plano_id UUID,
    status_assinatura VARCHAR(20) DEFAULT 'ativo' CHECK (status_assinatura IN ('ativo', 'suspenso', 'cancelado')),
    data_vencimento TIMESTAMP WITH TIME ZONE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA FARMÁCIAS
CREATE TABLE IF NOT EXISTS public.farmacias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietario_id UUID NOT NULL REFERENCES public.proprietarios(id) ON DELETE CASCADE,
    nome_fantasia VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(50),
    inscricao_municipal VARCHAR(50),
    telefone VARCHAR(20),
    email VARCHAR(255),
    site VARCHAR(255),
    
    -- Endereço
    endereco_cep VARCHAR(9) NOT NULL,
    endereco_logradouro VARCHAR(255) NOT NULL,
    endereco_numero VARCHAR(20) NOT NULL,
    endereco_complemento VARCHAR(100),
    endereco_bairro VARCHAR(100) NOT NULL,
    endereco_cidade VARCHAR(100) NOT NULL,
    endereco_uf VARCHAR(2) NOT NULL,
    
    -- Responsável Técnico
    responsavel_tecnico_nome VARCHAR(255) NOT NULL,
    responsavel_tecnico_crf VARCHAR(20) NOT NULL,
    responsavel_tecnico_telefone VARCHAR(20),
    responsavel_tecnico_email VARCHAR(255),
    
    -- Configurações
    matriz BOOLEAN DEFAULT false,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADICIONAR CAMPOS MULTI-FARMÁCIA À TABELA USUARIOS
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS proprietario_id UUID REFERENCES public.proprietarios(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS farmacia_id UUID REFERENCES public.farmacias(id) ON DELETE CASCADE;

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_proprietarios_email ON public.proprietarios(email);
CREATE INDEX IF NOT EXISTS idx_proprietarios_cpf ON public.proprietarios(cpf);
CREATE INDEX IF NOT EXISTS idx_farmacias_proprietario_id ON public.farmacias(proprietario_id);
CREATE INDEX IF NOT EXISTS idx_farmacias_cnpj ON public.farmacias(cnpj);
CREATE INDEX IF NOT EXISTS idx_usuarios_proprietario_id ON public.usuarios(proprietario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_farmacia_id ON public.usuarios(farmacia_id);

-- 5. CONFIGURAR RLS
ALTER TABLE public.proprietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmacias ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA PROPRIETÁRIOS
CREATE POLICY "Proprietários podem ver seus próprios dados" 
ON public.proprietarios FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u 
        WHERE u.supabase_auth_id = auth.uid() 
        AND u.proprietario_id = proprietarios.id
    )
);

CREATE POLICY "Proprietários podem atualizar seus próprios dados" 
ON public.proprietarios FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u 
        JOIN public.perfis_usuario p ON u.perfil_id = p.id
        WHERE u.supabase_auth_id = auth.uid() 
        AND u.proprietario_id = proprietarios.id
        AND p.tipo = 'PROPRIETARIO'
    )
);

-- 7. POLÍTICAS RLS PARA FARMÁCIAS  
CREATE POLICY "Usuários podem ver farmácias do seu proprietário" 
ON public.farmacias FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u 
        WHERE u.supabase_auth_id = auth.uid() 
        AND u.proprietario_id = farmacias.proprietario_id
    )
);

CREATE POLICY "Proprietários podem gerenciar suas farmácias" 
ON public.farmacias FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u 
        JOIN public.perfis_usuario p ON u.perfil_id = p.id
        WHERE u.supabase_auth_id = auth.uid() 
        AND u.proprietario_id = farmacias.proprietario_id
        AND p.tipo = 'PROPRIETARIO'
    )
);

-- 8. TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proprietarios_updated_at 
    BEFORE UPDATE ON public.proprietarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmacias_updated_at 
    BEFORE UPDATE ON public.farmacias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. INSERIR DADOS PADRÃO PARA DESENVOLVIMENTO
-- Proprietário padrão
INSERT INTO public.proprietarios (id, nome, email, cpf, telefone, ativo) VALUES
(
    'a89379dd-f971-49a2-8a83-81bf6969d17b', 
    'ODTWIN FRITSCHE FH', 
    'ottof6@gmail.com',
    '12345678901',
    '(11) 99999-9999',
    true
) ON CONFLICT (email) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    ativo = EXCLUDED.ativo;

-- Farmácia padrão
INSERT INTO public.farmacias (
    id, 
    proprietario_id, 
    nome_fantasia, 
    razao_social, 
    cnpj,
    endereco_cep,
    endereco_logradouro,
    endereco_numero,
    endereco_bairro,
    endereco_cidade,
    endereco_uf,
    responsavel_tecnico_nome,
    responsavel_tecnico_crf,
    matriz,
    ativa
) VALUES (
    gen_random_uuid(),
    'a89379dd-f971-49a2-8a83-81bf6969d17b',
    'Pharma.AI - Farmácia Matriz',
    'Pharma.AI Farmácias LTDA',
    '12.345.678/0001-90',
    '01234-567',
    'Rua das Farmácias',
    '123',
    'Centro',
    'São Paulo',
    'SP',
    'Dr. João Silva',
    'CRF-SP/12345',
    true,
    true
) ON CONFLICT DO NOTHING;

-- 10. ATUALIZAR USUÁRIOS EXISTENTES
-- Atualizar usuário proprietário existente
UPDATE public.usuarios 
SET 
    proprietario_id = 'a89379dd-f971-49a2-8a83-81bf6969d17b',
    farmacia_id = (SELECT id FROM public.farmacias WHERE proprietario_id = 'a89379dd-f971-49a2-8a83-81bf6969d17b' LIMIT 1)
WHERE email = 'ottof6@gmail.com' 
AND proprietario_id IS NULL;

-- 11. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.proprietarios IS 'Proprietários de farmácias no sistema multi-farmácia';
COMMENT ON TABLE public.farmacias IS 'Farmácias pertencentes aos proprietários';
COMMENT ON COLUMN public.usuarios.proprietario_id IS 'Referência ao proprietário das farmácias';
COMMENT ON COLUMN public.usuarios.farmacia_id IS 'Referência à farmácia atual do usuário';

-- 12. LOG DE SUCESSO
SELECT 'Migração multi-farmácia aplicada com sucesso!' as status; 