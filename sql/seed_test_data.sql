-- Script de seed para ambiente de testes / staging
-- Executar: supabase db remote set && supabase db reset --file sql/seed_test_data.sql

-- Produtos
insert into produtos (id, nome, codigo_interno, ean, preco_venda, estoque_atual) values
  ('prod-bulbo-1', 'Bulbo Silicone Branco', '902623', '7891127777257', 2320, 10)
  on conflict (id) do nothing;

-- Perfis
insert into perfis_usuario (id, tipo) values
  ('perfil-proprietario', 'PROPRIETARIO') on conflict (id) do nothing;

-- Usuários de teste
insert into usuarios (id, supabase_auth_id, nome, email, perfil_id, ativo)
values
  ('user-prop-1', 'user-prop-1', 'Proprietario Teste', 'proprietario.teste@pharmaai.com', 'perfil-proprietario', true)
  on conflict (id) do nothing; 