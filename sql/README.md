# Migrações SQL - Pharma.AI

Este diretório contém as migrações SQL necessárias para configurar o banco de dados do sistema Pharma.AI.

## 📋 **Pré-requisitos**

- Projeto Supabase configurado
- Acesso ao SQL Editor do Supabase Dashboard
- Variáveis de ambiente configuradas no projeto

## 🚀 **Como Executar as Migrações**

### 1. Acesse o Supabase Dashboard
1. Faça login em [supabase.com](https://supabase.com)
2. Selecione seu projeto Pharma.AI
3. Navegue para **SQL Editor** no menu lateral

### 2. Execute a Migração do Sistema de Permissões
1. Abra o arquivo `migrations/001_sistema_permissoes.sql`
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** para executar

### 3. Verificar a Execução
Após executar a migração, você deve ver:
- ✅ Mensagem: "Sistema de permissões criado com sucesso!"
- 5 novas tabelas criadas:
  - `perfis_usuario`
  - `usuarios`
  - `permissoes`
  - `sessoes_usuario`
  - `logs_auditoria`

## 📊 **Estrutura Criada**

### Tabelas Principais
- **perfis_usuario**: Define os tipos de usuário (Proprietário, Farmacêutico, etc.)
- **usuarios**: Usuários do sistema com referência ao Supabase Auth
- **permissoes**: Permissões granulares por perfil e módulo
- **sessoes_usuario**: Controle de sessões ativas
- **logs_auditoria**: Log de todas as ações do sistema

### Dados Iniciais
A migração cria automaticamente:
- 4 perfis padrão (Proprietário, Farmacêutico, Atendente, Manipulador)
- Permissões configuradas para cada perfil
- 4 usuários de demonstração

### Usuários de Demonstração
| Email | Perfil | Dashboard |
|-------|--------|-----------|
| proprietario@farmacia.com | Proprietário | Administrativo |
| farmaceutico@farmacia.com | Farmacêutico | Operacional |
| atendente@farmacia.com | Atendente | Atendimento |
| manipulador@farmacia.com | Manipulador | Produção |

## 🔐 **Configuração de Autenticação**

Após executar a migração, você precisa:

1. **Criar usuários no Supabase Auth**:
   - Vá para **Authentication > Users** no Supabase Dashboard
   - Crie usuários com os emails de demonstração
   - Use a senha: `123456` (ou configure suas próprias senhas)

2. **Vincular usuários**:
   - O sistema irá automaticamente vincular os usuários do Auth com a tabela `usuarios`
   - Isso acontece no primeiro login de cada usuário

## 🛡️ **Segurança (RLS)**

A migração configura automaticamente:
- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas básicas para usuários autenticados
- Políticas restritivas para modificações (apenas proprietários)

## 🔧 **Funções Utilitárias**

A migração cria funções SQL úteis:
- `verificar_permissao()`: Verifica se um usuário tem permissão específica
- `obter_usuario_por_auth_id()`: Obtém dados do usuário pelo ID do Supabase Auth
- `update_updated_at_column()`: Atualiza automaticamente timestamps

## 📝 **Próximos Passos**

1. Execute a migração
2. Crie os usuários no Supabase Auth
3. Teste o login com os usuários de demonstração
4. Configure permissões adicionais conforme necessário

## ⚠️ **Importante**

- Execute as migrações em ordem numérica
- Sempre faça backup antes de executar em produção
- Teste em ambiente de desenvolvimento primeiro

## 🆘 **Solução de Problemas**

### Erro: "relation already exists"
- Normal se executar a migração novamente
- O script usa `IF NOT EXISTS` para evitar conflitos

### Erro: "permission denied"
- Verifique se você tem permissões de administrador no projeto Supabase
- Certifique-se de estar logado com a conta correta

### Usuários não conseguem fazer login
- Verifique se os usuários foram criados no Supabase Auth
- Confirme se os emails coincidem exatamente
- Verifique as políticas RLS se necessário

---

**Versão**: 1.0.0  
**Data**: 2024-12-19  
**Autor**: Sistema Pharma.AI 