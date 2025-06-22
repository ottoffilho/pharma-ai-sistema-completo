-- Migração 002: Criação da tabela de pedidos
-- Data: 2024-12-26
-- Descrição: Cria a tabela de pedidos para o sistema de farmácia

-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_cpf VARCHAR(14),
    cliente_telefone VARCHAR(20),
    cliente_email VARCHAR(255),
    medico_nome VARCHAR(255),
    medico_crm VARCHAR(50),
    status VARCHAR(50) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'producao', 'pronto', 'entregue', 'cancelado')),
    valor_total DECIMAL(10,2) DEFAULT 0.00,
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_entrega_prevista TIMESTAMP WITH TIME ZONE,
    data_entrega_real TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON public.pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_nome ON public.pedidos(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_criacao ON public.pedidos(data_criacao);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_by ON public.pedidos(created_by);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pedidos_updated_at 
    BEFORE UPDATE ON public.pedidos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de pedido automaticamente
CREATE OR REPLACE FUNCTION generate_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    new_numero VARCHAR(50);
BEGIN
    -- Buscar o próximo número sequencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pedido FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.pedidos
    WHERE numero_pedido ~ '^PED[0-9]+$';
    
    -- Gerar o novo número no formato PED000001
    new_numero := 'PED' || LPAD(next_number::TEXT, 6, '0');
    
    -- Verificar se já existe (por segurança)
    WHILE EXISTS (SELECT 1 FROM public.pedidos WHERE numero_pedido = new_numero) LOOP
        next_number := next_number + 1;
        new_numero := 'PED' || LPAD(next_number::TEXT, 6, '0');
    END LOOP;
    
    NEW.numero_pedido := new_numero;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para gerar número de pedido automaticamente se não fornecido
CREATE TRIGGER generate_pedido_numero 
    BEFORE INSERT ON public.pedidos 
    FOR EACH ROW 
    WHEN (NEW.numero_pedido IS NULL OR NEW.numero_pedido = '')
    EXECUTE FUNCTION generate_numero_pedido();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuários podem ver todos os pedidos (para farmácia)
CREATE POLICY "Usuários podem visualizar pedidos" ON public.pedidos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política RLS: Usuários autenticados podem inserir pedidos
CREATE POLICY "Usuários podem criar pedidos" ON public.pedidos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política RLS: Usuários podem atualizar pedidos
CREATE POLICY "Usuários podem atualizar pedidos" ON public.pedidos
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política RLS: Apenas administradores podem deletar pedidos
CREATE POLICY "Apenas admins podem deletar pedidos" ON public.pedidos
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.perfil = 'proprietario'
        )
    );

-- Inserir alguns dados de exemplo para teste
INSERT INTO public.pedidos (
    cliente_nome, 
    cliente_cpf, 
    cliente_telefone, 
    medico_nome, 
    medico_crm, 
    status, 
    valor_total, 
    observacoes
) VALUES 
(
    'Maria Silva Santos', 
    '123.456.789-00', 
    '(11) 99999-9999', 
    'Dr. João Carvalho', 
    'CRM 12345-SP', 
    'aguardando', 
    125.50, 
    'Receita para tratamento homeopático'
),
(
    'José Oliveira', 
    '987.654.321-00', 
    '(11) 88888-8888', 
    'Dra. Ana Costa', 
    'CRM 67890-SP', 
    'producao', 
    89.90, 
    'Medicamento manipulado urgente'
),
(
    'Ana Paula Lima', 
    '456.789.123-00', 
    '(11) 77777-7777', 
    'Dr. Carlos Mendes', 
    'CRM 54321-SP', 
    'pronto', 
    156.75, 
    'Fórmula complexa - verificar dosagem'
);

-- Comentários para documentação
COMMENT ON TABLE public.pedidos IS 'Tabela para armazenar pedidos de medicamentos manipulados';
COMMENT ON COLUMN public.pedidos.numero_pedido IS 'Número único do pedido gerado automaticamente';
COMMENT ON COLUMN public.pedidos.status IS 'Status atual do pedido: aguardando, producao, pronto, entregue, cancelado';
COMMENT ON COLUMN public.pedidos.valor_total IS 'Valor total do pedido em reais';
COMMENT ON COLUMN public.pedidos.data_entrega_prevista IS 'Data prevista para entrega do pedido';
COMMENT ON COLUMN public.pedidos.data_entrega_real IS 'Data real de entrega do pedido'; 