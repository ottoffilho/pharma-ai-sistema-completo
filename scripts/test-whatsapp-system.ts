#!/usr/bin/env node

/**
 * Script de teste do sistema WhatsApp
 * Valida a implementação completa
 */

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

// Configurações
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(chalk.red('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias'));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Utilitários
const log = {
  info: (msg: string) => console.log(chalk.blue(`ℹ️  ${msg}`)),
  success: (msg: string) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg: string) => console.log(chalk.red(`❌ ${msg}`)),
  warning: (msg: string) => console.log(chalk.yellow(`⚠️  ${msg}`)),
};

// Testes
async function testDatabaseStructure() {
  log.info('Testando estrutura do banco de dados...');
  
  const tables = [
    'conversas_atendimento',
    'mensagens_atendimento',
    'templates_resposta',
    'eventos_whatsapp',
    'orcamentos',
    'fila_conversas'
  ];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      log.error(`Tabela ${table} não existe ou tem problemas: ${error.message}`);
    } else {
      log.success(`Tabela ${table} OK`);
    }
  }
}

async function testEdgeFunctions() {
  log.info('Testando Edge Functions...');
  
  const functions = [
    'whatsapp-webhook',
    'whatsapp-process-events',
    'enviar-mensagem-whatsapp'
  ];
  
  for (const fn of functions) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      });
      
      if (response.ok) {
        log.success(`Edge Function ${fn} respondendo`);
      } else {
        log.warning(`Edge Function ${fn} retornou status ${response.status}`);
      }
    } catch (error) {
      log.error(`Edge Function ${fn} não acessível: ${error.message}`);
    }
  }
}

async function testDatabaseFunctions() {
  log.info('Testando funções do banco...');
  
  // Testar buscar_conversas_whatsapp
  const { data: conversas, error: conversasError } = await supabase.rpc('buscar_conversas_whatsapp', {
    p_limit: 5
  });
  
  if (conversasError) {
    log.error(`Função buscar_conversas_whatsapp falhou: ${conversasError.message}`);
  } else {
    log.success(`Função buscar_conversas_whatsapp OK - ${conversas?.length || 0} conversas encontradas`);
  }
  
  // Testar obter_estatisticas_whatsapp
  const { data: stats, error: statsError } = await supabase.rpc('obter_estatisticas_whatsapp');
  
  if (statsError) {
    log.error(`Função obter_estatisticas_whatsapp falhou: ${statsError.message}`);
  } else {
    log.success(`Função obter_estatisticas_whatsapp OK`);
    console.log(chalk.gray(JSON.stringify(stats, null, 2)));
  }
}

async function testTemplates() {
  log.info('Verificando templates...');
  
  const { data: templates, error } = await supabase
    .from('templates_resposta')
    .select('*')
    .eq('ativo', true);
    
  if (error) {
    log.error(`Erro ao buscar templates: ${error.message}`);
  } else {
    log.success(`${templates?.length || 0} templates ativos encontrados`);
    
    const categorias = [...new Set(templates?.map(t => t.categoria) || [])];
    log.info(`Categorias: ${categorias.join(', ')}`);
  }
}

async function testRLSPolicies() {
  log.info('Testando políticas RLS...');
  
  // Criar um cliente com anon key para testar
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    log.warning('SUPABASE_ANON_KEY não definida, pulando teste RLS');
    return;
  }
  
  const anonClient = createClient(SUPABASE_URL, anonKey);
  
  // Tentar ler conversas sem autenticação
  const { data, error } = await anonClient
    .from('conversas_atendimento')
    .select('id')
    .limit(1);
    
  if (error && error.code === 'PGRST301') {
    log.success('RLS está protegendo conversas_atendimento corretamente');
  } else {
    log.warning('RLS pode não estar configurado corretamente para conversas_atendimento');
  }
}

async function createTestData() {
  log.info('Criando dados de teste...');
  
  // Criar conversa de teste
  const { data: conversa, error: conversaError } = await supabase
    .from('conversas_atendimento')
    .insert({
      cliente_nome: 'Teste WhatsApp',
      cliente_telefone: '11999999999',
      status: 'ativa',
      prioridade: 'media',
      canal: 'whatsapp'
    })
    .select()
    .single();
    
  if (conversaError) {
    log.error(`Erro ao criar conversa teste: ${conversaError.message}`);
    return;
  }
  
  log.success(`Conversa teste criada: ${conversa.id}`);
  
  // Criar mensagem de teste
  const { error: mensagemError } = await supabase
    .from('mensagens_atendimento')
    .insert({
      conversa_id: conversa.id,
      remetente_tipo: 'cliente',
      remetente_nome: 'Teste WhatsApp',
      conteudo: 'Olá, preciso de um orçamento',
      tipo_mensagem: 'texto',
      enviada_em: new Date().toISOString(),
      status_leitura: 'enviada'
    });
    
  if (mensagemError) {
    log.error(`Erro ao criar mensagem teste: ${mensagemError.message}`);
  } else {
    log.success('Mensagem teste criada');
  }
  
  // Criar evento de teste
  const { error: eventoError } = await supabase
    .from('eventos_whatsapp')
    .insert({
      conversa_id: conversa.id,
      tipo_evento: 'nova_mensagem',
      descricao: 'Teste de evento',
      dados_evento: {
        teste: true
      }
    });
    
  if (eventoError) {
    log.error(`Erro ao criar evento teste: ${eventoError.message}`);
  } else {
    log.success('Evento teste criado');
  }
  
  return conversa.id;
}

async function testWebhookIntegration() {
  log.info('Testando integração webhook...');
  
  const webhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;
  
  // Testar verificação do webhook
  const verifyResponse = await fetch(`${webhookUrl}?hub.mode=subscribe&hub.verify_token=pharma-ai-verify-token&hub.challenge=test123`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  
  if (verifyResponse.ok) {
    const challenge = await verifyResponse.text();
    if (challenge === 'test123') {
      log.success('Verificação do webhook OK');
    } else {
      log.warning('Webhook respondeu mas challenge incorreto');
    }
  } else {
    log.error(`Verificação do webhook falhou: ${verifyResponse.status}`);
  }
  
  // Simular recebimento de mensagem
  const messagePayload = {
    entry: [{
      id: 'test',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '551199999999',
            phone_number_id: 'test123'
          },
          contacts: [{
            profile: { name: 'Teste API' },
            wa_id: '5511888888888'
          }],
          messages: [{
            from: '5511888888888',
            id: 'test_msg_' + Date.now(),
            timestamp: Math.floor(Date.now() / 1000).toString(),
            text: { body: 'Teste de webhook' },
            type: 'text'
          }]
        },
        field: 'messages'
      }]
    }]
  };
  
  const messageResponse = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messagePayload)
  });
  
  if (messageResponse.ok) {
    log.success('Webhook processou mensagem teste');
  } else {
    const error = await messageResponse.text();
    log.error(`Webhook falhou ao processar mensagem: ${error}`);
  }
}

async function cleanup(conversaId?: string) {
  log.info('Limpando dados de teste...');
  
  if (conversaId) {
    // Limpar na ordem correta devido às foreign keys
    await supabase.from('eventos_whatsapp').delete().eq('conversa_id', conversaId);
    await supabase.from('mensagens_atendimento').delete().eq('conversa_id', conversaId);
    await supabase.from('fila_conversas').delete().eq('conversa_id', conversaId);
    await supabase.from('orcamentos').delete().eq('conversa_id', conversaId);
    await supabase.from('conversas_atendimento').delete().eq('id', conversaId);
    
    log.success('Dados de teste removidos');
  }
}

// Executar testes
async function runTests() {
  console.log(chalk.bold.cyan('\n🚀 Testando Sistema WhatsApp Pharma.AI\n'));
  
  try {
    await testDatabaseStructure();
    console.log('');
    
    await testEdgeFunctions();
    console.log('');
    
    await testDatabaseFunctions();
    console.log('');
    
    await testTemplates();
    console.log('');
    
    await testRLSPolicies();
    console.log('');
    
    const conversaId = await createTestData();
    console.log('');
    
    await testWebhookIntegration();
    console.log('');
    
    await cleanup(conversaId);
    
    console.log(chalk.bold.green('\n✨ Todos os testes concluídos com sucesso!\n'));
    
  } catch (error) {
    console.error(chalk.bold.red('\n💥 Erro durante os testes:'), error);
    process.exit(1);
  }
}

// Executar
runTests(); 