-- =====================================================
-- MIGRAÇÃO: Inserir Perfis Básicos
-- Data: 2024-12-26
-- Descrição: Insere os perfis básicos necessários para o sistema
-- =====================================================

-- 1. INSERIR PERFIS BÁSICOS (se não existirem)
INSERT INTO perfis_usuario (tipo, nome, descricao, dashboard_padrao, ativo)
VALUES 
  ('PROPRIETARIO', 'Proprietário', 'Proprietário da farmácia com acesso total ao sistema', 'admin', true),
  ('FARMACEUTICO', 'Farmacêutico', 'Farmacêutico responsável técnico', 'admin', true),
  ('ATENDENTE', 'Atendente', 'Atendente de balcão', 'atendimento', true),
  ('MANIPULADOR', 'Manipulador', 'Técnico em manipulação', 'producao', true)
ON CONFLICT (nome) DO NOTHING;

-- 2. LOG DE SUCESSO
SELECT 'Perfis básicos inseridos com sucesso!' as status; 