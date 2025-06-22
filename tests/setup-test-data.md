# Setup de Dados de Teste - Pharma.AI

## 🎯 Objetivo
Configurar usuários de teste para executar os testes E2E com sucesso.

## 📋 Problema Identificado
Os testes E2E estão falhando porque não existem usuários de teste válidos no Supabase Auth.

## 🔧 Solução Manual

### 1. Acessar o Dashboard do Supabase
1. Ir para: https://supabase.com/dashboard/project/hjwebmpvaaeogbfqxwub
2. Navegar para: Authentication > Users

### 2. Criar Usuários de Teste Manualmente

#### Usuário 1: Proprietário
- **Email:** `proprietario.teste@pharmaai.com`
- **Senha:** `Teste123!`
- **Confirmar email:** ✅ Sim

#### Usuário 2: Farmacêutico
- **Email:** `farmaceutico.teste@pharmaai.com`
- **Senha:** `Teste123!`
- **Confirmar email:** ✅ Sim

#### Usuário 3: Atendente
- **Email:** `atendente.teste@pharmaai.com`
- **Senha:** `Teste123!`
- **Confirmar email:** ✅ Sim

#### Usuário 4: Manipulador
- **Email:** `manipulador.teste@pharmaai.com`
- **Senha:** `Teste123!`
- **Confirmar email:** ✅ Sim

### 3. Sincronizar com Tabela `usuarios`

Após criar os usuários no Auth, executar este SQL no Editor SQL do Supabase:

```sql
-- Atualizar tabela usuarios com os IDs do Auth
-- (Substituir os UUIDs pelos IDs reais gerados)

UPDATE usuarios 
SET supabase_auth_id = (
  SELECT id FROM auth.users WHERE email = 'proprietario.teste@pharmaai.com'
)
WHERE email = 'proprietario.teste@pharmaai.com';

UPDATE usuarios 
SET supabase_auth_id = (
  SELECT id FROM auth.users WHERE email = 'farmaceutico.teste@pharmaai.com'
)
WHERE email = 'farmaceutico.teste@pharmaai.com';

UPDATE usuarios 
SET supabase_auth_id = (
  SELECT id FROM auth.users WHERE email = 'atendente.teste@pharmaai.com'
)
WHERE email = 'atendente.teste@pharmaai.com';

UPDATE usuarios 
SET supabase_auth_id = (
  SELECT id FROM auth.users WHERE email = 'manipulador.teste@pharmaai.com'
)
WHERE email = 'manipulador.teste@pharmaai.com';
```

### 4. Verificar Sincronização

```sql
-- Verificar se os usuários estão sincronizados
SELECT 
  u.nome,
  u.email,
  u.supabase_auth_id,
  p.tipo as perfil,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ Sincronizado'
    ELSE '❌ Não sincronizado'
  END as status
FROM usuarios u
LEFT JOIN perfis_usuario p ON u.perfil_id = p.id
LEFT JOIN auth.users au ON u.supabase_auth_id = au.id
WHERE u.email LIKE '%.teste@pharmaai.com'
ORDER BY u.nome;
```

## 🧪 Executar Testes

Após configurar os usuários:

```bash
# Executar apenas testes de autenticação
npm run test:e2e -- auth-flow.spec.ts

# Executar todos os testes E2E
npm run test:e2e
```

## 📊 Status Esperado

Após a configuração, os testes devem mostrar:
- ✅ Login com credenciais válidas
- ✅ Redirecionamento para dashboard
- ✅ Verificação de permissões por perfil
- ✅ Logout funcional

## 🔍 Troubleshooting

### Erro: "Timed out waiting for URL /admin"
- Verificar se o usuário existe no Auth
- Verificar se o `supabase_auth_id` está correto na tabela `usuarios`
- Verificar se o perfil está ativo

### Erro: "Invalid credentials"
- Verificar se a senha está correta
- Verificar se o email está confirmado no Auth

### Erro: "User not found"
- Verificar se o usuário foi criado no Auth
- Verificar se o email está correto 