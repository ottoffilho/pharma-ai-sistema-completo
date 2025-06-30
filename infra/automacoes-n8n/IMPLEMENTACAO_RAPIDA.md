# 🚀 Implementação Rápida - N8N Workflows Pharma.AI

Guia passo a passo para implementar os workflows n8n em 30 minutos.

## ⚡ Setup Express (5 minutos)

### 1. Configurar Ambiente

```bash
# Clone ou atualize o repositório
cd pharma-dev/infra/automacoes-n8n

# Criar arquivo de ambiente (Windows)
copy env.example .env

# Editar .env com suas credenciais reais
notepad .env
```

### 2. Subir N8N

```bash
# Iniciar n8n via Docker
docker-compose up -d

# Verificar se está rodando
docker-compose ps
```

### 3. Acessar Interface

- URL: http://localhost:5678
- User: `admin`
- Password: `pharma2025`

## 🔧 Configuração Rápida (10 minutos)

### 1. Credenciais Obrigatórias

No painel n8n, vá em **Settings > Credentials** e configure:

#### A. Supabase HTTP

```
Name: Supabase Pharma.AI
URL: https://hjwebmpvaaeogbfqxwub.supabase.co
Headers:
  - Authorization: Bearer SEU_SERVICE_ROLE_KEY
  - apikey: SEU_SERVICE_ROLE_KEY
  - Content-Type: application/json
```

#### B. WhatsApp HTTP

```
Name: WhatsApp Meta API
URL: https://graph.facebook.com/v18.0
Headers:
  - Authorization: Bearer SEU_WHATSAPP_TOKEN
  - Content-Type: application/json
```

#### C. Slack Webhook

```
Name: Slack Pharma.AI
Webhook URL: https://hooks.slack.com/services/SEU_WEBHOOK_SLACK
```

#### D. SMTP Email

```
Name: Email Pharma.AI
Host: smtp.gmail.com
Port: 587
User: seu_email@pharmaai.com
Password: sua_senha_app
From: seu_email@pharmaai.com
```

### 2. Variáveis de Ambiente

No n8n, vá em **Settings > Environment Variables**:

```
SUPABASE_URL=https://hjwebmpvaaeogbfqxwub.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
WHATSAPP_ACCESS_TOKEN=seu_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id
SLACK_WEBHOOK_URL=sua_url_slack
```

## 📂 Importar Workflows (10 minutos)

### Método 1: Import Manual

1. Acessar **Workflows** no menu
2. Clicar **"Import from File"**
3. Selecionar cada arquivo JSON da pasta `workflows/`
4. Ativar cada workflow importado

### Método 2: Script Automático

```bash
# No terminal/PowerShell
cd infra/automacoes-n8n/scripts
./import-workflows.sh

# Ou no Windows
bash import-workflows.sh
```

## ✅ Verificação e Teste (5 minutos)

### 1. Workflows Ativos

Verificar se todos estão **ACTIVE**:

- ✅ Alerta SLA Atendimento
- ✅ Pesquisa CSAT Automática
- ✅ Backup Receitas Diário
- ✅ Distribuição Conversas
- ✅ Relatório Métricas

### 2. Teste Manual

Para cada workflow:

1. Clicar no workflow
2. Clicar **"Execute Workflow"**
3. Verificar se executa sem erros
4. Checar logs de execução

### 3. Teste de Conectividade

```bash
# Testar Supabase
curl -H "Authorization: Bearer SEU_TOKEN" \
     https://hjwebmpvaaeogbfqxwub.supabase.co/rest/v1/conversas_atendimento?limit=1

# Testar Slack (adaptar URL)
curl -X POST -H "Content-Type: application/json" \
     -d '{"text":"Teste N8N Pharma.AI"}' \
     SEU_SLACK_WEBHOOK_URL
```

## 🔄 Monitoramento Contínuo

### Dashboard N8N

- **Executions**: Ver histórico de execuções
- **Logs**: Verificar erros e sucessos
- **Metrics**: Acompanhar performance

### Alertas Importantes

1. **SLA**: Monitora a cada 5 minutos
2. **CSAT**: Acionado quando conversa é resolvida
3. **Backup**: Executa diariamente às 02:00
4. **Distribuição**: Acionado por webhook
5. **Relatórios**: Semanalmente às segundas 09:00

## 🆘 Troubleshooting Rápido

### Problema: Workflow não executa

**Solução:**

1. Verificar se está ACTIVE
2. Checar credenciais
3. Testar conexões
4. Ver logs de erro

### Problema: Erro de autenticação

**Solução:**

1. Verificar tokens nas variáveis de ambiente
2. Regenerar Service Role Key se necessário
3. Confirmar permissões no Supabase

### Problema: Slack não recebe mensagens

**Solução:**

1. Testar webhook URL manualmente
2. Verificar formato da mensagem
3. Confirmar canal existe

### Problema: E-mails não chegam

**Solução:**

1. Verificar configurações SMTP
2. Usar senha de app (Gmail)
3. Testar conexão SMTP

## 📞 Suporte

- **Logs N8N**: http://localhost:5678/executions
- **Documentação**: `/prompts/n8n.txt`
- **Testes**: `/scripts/test-whatsapp-system.ts`

---

## ✨ Checklist Final

- [ ] N8N rodando em Docker
- [ ] 5 workflows importados e ativos
- [ ] Credenciais configuradas
- [ ] Variáveis de ambiente definidas
- [ ] Testes manuais OK
- [ ] Monitoramento configurado
- [ ] Slack recebendo alertas
- [ ] E-mails funcionando

**🎉 Parabéns! Sistema N8N configurado e operacional!**

---

_Tempo estimado total: **30 minutos**_\
_Última atualização: Janeiro 2025_
