import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Edge Function: admin-chat-agent
 * Objetivo: receber uma mensagem em linguagem natural do dashboard administrativo
 *            interpretar a intenção (versão inicial com regras simples) e consultar
 *            o banco de dados Supabase via Service Role, devolvendo uma resposta amigável.
 *
 * Futuro: trocar a lógica de regras por integração com LLM (DeepSeek / OpenAI)
 *         que produz consultas SQL ou roteia para funções pré-definidas.
 */

// ===== Configurações =====
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS padrão
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ===== Função auxiliar para formatação monetária =====
const formatBRL = (valor: number) => {
  return `R$ ${valor.toFixed(2)}`;
};

// ===== Função auxiliar simples de prompt e LLM =====
const buildSystemPrompt = (): string => {
  return 'Você é o assistente administrativo do Pharma.AI. Resuma dados de forma clara para humanos.';
};

const askLLM = async (prompt: string): Promise<string> => {
  // Placeholder: em versão MVP apenas devolve prompt original ou mensagem padrão
  console.log('askLLM called with:', prompt.slice(0, 120));
  return 'Resumo gerado automaticamente.';
};

// ===== Handler principal =====
Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionId, userMessage } = await req.json();

    if (!sessionId || !userMessage) {
      return new Response(
        JSON.stringify({ error: 'sessionId e userMessage obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const message = String(userMessage).toLowerCase();
    let botResponse = 'Desculpe, não entendi sua pergunta.';
    let records: unknown[] = [];

    // === Regras simples (versão MVP) ===

    // 1. Estoque geral
    if (message.includes('estoque') && (message.includes('como') || message.includes('situação'))) {
      const { data, error } = await supabase
        .from('produtos')
        .select('nome, estoque_atual, estoque_minimo, tipo')
        .not('estoque_atual', 'is', null);

      if (error) throw error;

      const total = data?.length || 0;
      const criticos = data?.filter(p => (p as any).estoque_atual < (p as any).estoque_minimo) ?? [];
      const ok = total - criticos.length;

      botResponse = `📦 Estoque geral:\n\n• Produtos cadastrados: ${total}\n• Em dia: ${ok}\n• Baixo/Crítico: ${criticos.length}`;
      records = data ?? [];
    }
    // 2. Produtos acabando
    else if (message.includes('acabando') || (message.includes('produtos') && message.includes('falta'))) {
      const { data, error } = await supabase
        .from('produtos')
        .select('nome, estoque_atual, estoque_minimo, tipo')
        .not('estoque_atual', 'is', null)
        .not('estoque_minimo', 'is', null);
      if (error) throw error;

      const lista = (data ?? []).filter(p => (p as any).estoque_atual <= (p as any).estoque_minimo * 1.2);
      botResponse = lista.length
        ? `⚠️ Produtos em nível baixo (até 20% acima do mínimo): ${lista.length}`
        : '✅ Nenhum produto em nível crítico no momento.';
      records = lista;
    }
    // 3. Faturamento
    else if (message.includes('faturamento') || message.includes('vendas')) {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('pedidos')
        .select('total_amount')
        .gte('created_at', inicioMes.toISOString())
        .in('status', ['finalizado', 'entregue']);
      if (error) throw error;

      const total = (data ?? []).reduce((s, p) => s + ((p as any).total_amount ?? 0), 0);
      botResponse = `💰 Faturamento no mês: ${formatBRL(total)}`;
      records = data ?? [];
    }
    // 4. Contagem de clientes
    else if (message.includes('cliente') && message.includes('quantos')) {
      const { count, error } = await supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      botResponse = `👥 Clientes cadastrados: ${count ?? 0}`;
      records = [];
    }
    // 5. Fallback usando DeepSeek (conhecimento geral de farmácia de manipulação)
    else {
      try {
        const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
        if (!deepseekApiKey) throw new Error('DEEPSEEK_API_KEY não configurada');

        const systemPrompt = `Você é o Assistente IA Pharma, especialista em farmácia de manipulação e analista de dados.\n\nRegras:\n1. Se precisar consultar o banco de dados:\n   • Coloque **somente** uma linha iniciando com \"SQL:\" contendo o comando.\n   • Use **apenas SELECT ou WITH** (nunca UPDATE/DELETE).\n   • Caso a pergunta comece com \"quantos/quantas\", gere uma consulta COUNT simples:\n     Exemplo: SELECT COUNT(*) AS total FROM tabela WHERE condicao;\n   • Inclua LIMIT 100 quando retornar várias linhas.\n2. Se não for necessário acessar dados, responda em português de forma clara.\n3. Não explique estas regras ao usuário.`;

        const dsResp = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            max_tokens: 600,
            temperature: 0.7,
            stream: false
          })
        });

        if (!dsResp.ok) throw new Error(`DeepSeek status ${dsResp.status}`);
        const dsJson = await dsResp.json();
        botResponse = dsJson.choices?.[0]?.message?.content || botResponse;
      } catch (llmError) {
        console.error('DeepSeek fallback error', llmError);
        botResponse = '📚 Desculpe, não encontrei informações. Tente reformular sua pergunta.';
      }
    }

    // (MVP) Pulo de etapa de resumo gerado por LLM. Futuro: usar askLLM para resposta natural.

    return new Response(
      JSON.stringify({ botResponse, records }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('admin-chat-agent error', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
}); 