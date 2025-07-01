-- Criação da tabela ordens_producao
CREATE TABLE IF NOT EXISTS ordens_producao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_conclusao TIMESTAMP WITH TIME ZONE,
  pedido_id UUID REFERENCES pedidos(id),
  farmaceutico_responsavel_id UUID REFERENCES usuarios(id),
  observacoes TEXT,
  prioridade TEXT DEFAULT 'normal',
  etapa_atual TEXT DEFAULT 'aguardando',
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Comentários na tabela
COMMENT ON TABLE ordens_producao IS 'Ordens de produção para manipulação de medicamentos';
COMMENT ON COLUMN ordens_producao.id IS 'Identificador único da ordem de produção';
COMMENT ON COLUMN ordens_producao.codigo IS 'Código de referência da ordem de produção';
COMMENT ON COLUMN ordens_producao.status IS 'Status da ordem (pendente, em_producao, concluida, cancelada)';
COMMENT ON COLUMN ordens_producao.data_criacao IS 'Data de criação da ordem';
COMMENT ON COLUMN ordens_producao.data_atualizacao IS 'Data da última atualização da ordem';
COMMENT ON COLUMN ordens_producao.data_conclusao IS 'Data de conclusão da ordem';
COMMENT ON COLUMN ordens_producao.pedido_id IS 'Referência ao pedido relacionado';
COMMENT ON COLUMN ordens_producao.farmaceutico_responsavel_id IS 'Referência ao farmacêutico responsável';
COMMENT ON COLUMN ordens_producao.observacoes IS 'Observações e notas sobre a ordem';
COMMENT ON COLUMN ordens_producao.prioridade IS 'Nível de prioridade (baixa, normal, alta, urgente)';
COMMENT ON COLUMN ordens_producao.etapa_atual IS 'Etapa atual do processo de produção';
COMMENT ON COLUMN ordens_producao.is_deleted IS 'Flag para exclusão lógica';

-- Índices
CREATE INDEX IF NOT EXISTS idx_ordens_producao_pedido_id ON ordens_producao(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ordens_producao_farmaceutico_id ON ordens_producao(farmaceutico_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_ordens_producao_status ON ordens_producao(status);
CREATE INDEX IF NOT EXISTS idx_ordens_producao_data_criacao ON ordens_producao(data_criacao);

-- Trigger para atualização automática de data_atualizacao
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON ordens_producao
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS (Row Level Security)
ALTER TABLE ordens_producao ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários autenticados podem ver ordens" 
  ON ordens_producao 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Farmacêuticos e administradores podem inserir ordens" 
  ON ordens_producao 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      JOIN perfis p ON u.perfil_id = p.id
      WHERE u.id = auth.uid() AND 
      (p.tipo = 'farmaceutico' OR p.tipo = 'administrador' OR p.tipo = 'proprietario')
    )
  );

CREATE POLICY "Farmacêuticos e administradores podem atualizar ordens" 
  ON ordens_producao 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      JOIN perfis p ON u.perfil_id = p.id
      WHERE u.id = auth.uid() AND 
      (p.tipo = 'farmaceutico' OR p.tipo = 'administrador' OR p.tipo = 'proprietario')
    )
  );

CREATE POLICY "Farmacêuticos e administradores podem deletar ordens" 
  ON ordens_producao 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      JOIN perfis p ON u.perfil_id = p.id
      WHERE u.id = auth.uid() AND 
      (p.tipo = 'farmaceutico' OR p.tipo = 'administrador' OR p.tipo = 'proprietario')
    )
  ); 