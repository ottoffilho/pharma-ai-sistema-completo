# Automações N8N - Pharma.AI WhatsApp

Este diretório contém os workflows n8n para automatizar o sistema de atendimento
via WhatsApp.

## 📁 Estrutura de Arquivos

```
infra/automacoes-n8n/
├── README.md                           # Este arquivo
├── workflows/                          # Workflows JSON
│   ├── alerta-sla-atendimento.json    # Monitoramento SLA
│   ├── pesquisa-csat-automatica.json # CSAT automático
│   ├── backup-receitas-diario.json   # Backup diário
│   ├── distribuicao-conversas.json   # Distribuição automática
│   └── relatorio-metricas.json       # Relatórios semanais
├── docker-compose.yml                 # Deploy n8n
├── .env.example                       # Variáveis de ambiente
└── scripts/                           # Scripts auxiliares
    ├── export-workflows.sh            # Exportar workflows
    ├── import-workflows.sh            # Importar workflows
    └── test-connections.sh            # Testar conexões
```

## 🚀 Setup Rápido

1. **Configurar ambiente:**
   ```bash
   cp .env.example .env
   # Editar .env com suas credenciais
   ```

2. **Subir n8n:**
   ```bash
   docker-compose up -d
   ```

3. **Importar workflows:**
   ```bash
   ./scripts/import-workflows.sh
   ```

4. **Ativar workflows:**
   - Acessar http://localhost:5678
   - Ativar todos os workflows importados

## 📊 Workflows Incluídos

| Workflow               | Trigger      | Objetivo               | Status    |
| ---------------------- | ------------ | ---------------------- | --------- |
| Alerta SLA             | Cron 5min    | Monitorar SLA expirado | ✅ Pronto |
| CSAT Automático        | Webhook      | Pesquisa satisfação    | ✅ Pronto |
| Backup Receitas        | Cron diário  | Backup S3 Glacier      | ✅ Pronto |
| Distribuição Conversas | Webhook      | Auto-assign atendentes | ✅ Pronto |
| Relatório Métricas     | Cron semanal | KPIs e relatórios      | ✅ Pronto |

## 🔧 Configuração

### Variáveis Obrigatórias:

- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave service role
- `WHATSAPP_ACCESS_TOKEN`: Token Meta Business API
- `WHATSAPP_PHONE_NUMBER_ID`: ID do número WhatsApp
- `SLACK_WEBHOOK_URL`: URL webhook Slack
- `SMTP_*`: Configurações de e-mail

### Credenciais n8n:

1. **Supabase**: HTTP Request com Bearer token
2. **WhatsApp**: HTTP Request com Bearer token
3. **Slack**: Webhook
4. **E-mail**: SMTP

## 🔄 Manutenção

- **Backup:** Executar `export-workflows.sh` semanalmente
- **Atualizações:** Versionar alterações neste repositório
- **Monitoramento:** Verificar logs no dashboard n8n
- **Testes:** Usar `test-connections.sh` mensalmente

## 📞 Suporte

- Documentação completa: `/prompts/n8n.txt`
- Logs n8n: http://localhost:5678/workflows
- Issues: Criar issue no repositório principal

---

**Última atualização:** Janeiro 2025
