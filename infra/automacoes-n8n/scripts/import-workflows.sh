#!/bin/bash

# ==================================================
# SCRIPT DE IMPORTAÇÃO DOS WORKFLOWS N8N
# Pharma.AI - Sistema WhatsApp
# ==================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
N8N_URL=${N8N_URL:-"http://localhost:5678"}
WORKFLOWS_DIR="$(dirname "$0")/../workflows"
N8N_USER=${N8N_USER:-"admin"}
N8N_PASSWORD=${N8N_PASSWORD:-"pharma2025"}

echo -e "${BLUE}🚀 Importando Workflows N8N - Pharma.AI${NC}"
echo "=========================================="

# Verificar se n8n está rodando
echo -e "${YELLOW}📡 Verificando conexão com n8n...${NC}"
if ! curl -s "$N8N_URL/healthz" > /dev/null; then
    echo -e "${RED}❌ N8N não está acessível em $N8N_URL${NC}"
    echo "   Certifique-se que o n8n está rodando:"
    echo "   docker-compose up -d"
    exit 1
fi

echo -e "${GREEN}✅ N8N está acessível${NC}"

# Função para importar workflow
import_workflow() {
    local workflow_file="$1"
    local workflow_name=$(basename "$workflow_file" .json)
    
    echo -e "${YELLOW}📂 Importando: $workflow_name${NC}"
    
    # Ler o conteúdo do workflow
    if [ ! -f "$workflow_file" ]; then
        echo -e "${RED}❌ Arquivo não encontrado: $workflow_file${NC}"
        return 1
    fi
    
    # Fazer POST para importar o workflow
    response=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -u "$N8N_USER:$N8N_PASSWORD" \
        -d @"$workflow_file" \
        "$N8N_URL/api/v1/workflows/import" \
        -o /tmp/n8n_response.json)
    
    http_code="${response: -3}"
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ $workflow_name importado com sucesso${NC}"
        
        # Extrair ID do workflow para ativação
        workflow_id=$(cat /tmp/n8n_response.json | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        
        if [ ! -z "$workflow_id" ]; then
            # Ativar o workflow
            activate_response=$(curl -s -w "%{http_code}" \
                -X POST \
                -H "Content-Type: application/json" \
                -u "$N8N_USER:$N8N_PASSWORD" \
                -d '{"active": true}' \
                "$N8N_URL/api/v1/workflows/$workflow_id/activate" \
                -o /tmp/n8n_activate.json)
            
            activate_code="${activate_response: -3}"
            
            if [ "$activate_code" -eq 200 ]; then
                echo -e "${GREEN}✅ $workflow_name ativado${NC}"
            else
                echo -e "${YELLOW}⚠️  $workflow_name importado mas não ativado${NC}"
            fi
        fi
        
    else
        echo -e "${RED}❌ Erro ao importar $workflow_name (HTTP: $http_code)${NC}"
        if [ -f /tmp/n8n_response.json ]; then
            echo "Resposta: $(cat /tmp/n8n_response.json)"
        fi
        return 1
    fi
}

# Importar todos os workflows
echo -e "${BLUE}📦 Importando workflows...${NC}"

workflows=(
    "alerta-sla-atendimento.json"
    "pesquisa-csat-automatica.json"
    "backup-receitas-diario.json"
    "distribuicao-conversas.json"
    "relatorio-metricas.json"
)

success_count=0
total_count=${#workflows[@]}

for workflow in "${workflows[@]}"; do
    workflow_path="$WORKFLOWS_DIR/$workflow"
    
    if import_workflow "$workflow_path"; then
        ((success_count++))
    fi
    
    echo "" # Linha em branco para separar
done

# Resumo final
echo "=========================================="
echo -e "${BLUE}📊 Resumo da Importação:${NC}"
echo -e "   ✅ Sucessos: ${GREEN}$success_count${NC}/$total_count"

if [ $success_count -eq $total_count ]; then
    echo -e "${GREEN}🎉 Todos os workflows foram importados com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}🔗 Acesse o painel n8n:${NC}"
    echo "   $N8N_URL"
    echo ""
    echo -e "${BLUE}📋 Próximos passos:${NC}"
    echo "   1. Verificar se todos os workflows estão ativos"
    echo "   2. Configurar credenciais necessárias"
    echo "   3. Testar execução manual dos workflows"
    echo "   4. Monitorar logs de execução"
else
    echo -e "${YELLOW}⚠️  Alguns workflows falharam. Verifique os logs acima.${NC}"
    exit 1
fi

# Cleanup
rm -f /tmp/n8n_response.json /tmp/n8n_activate.json

echo -e "${GREEN}✨ Importação concluída!${NC}" 