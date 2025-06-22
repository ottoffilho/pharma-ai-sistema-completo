import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Configuração
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ChatbotRequest {
  sessionId: string;
  userMessage: string;
  leadData?: Record<string, unknown>;
  action?: string;
}

interface ConversationContext {
  relevantChunks: Array<{
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
  }>;
  recentMemory: Array<{
    user_message: string;
    bot_response: string;
    created_at: string;
  }>;
  leadContext: Record<string, unknown> | null;
}

// Função para buscar contexto relevante via RAG
async function searchRelevantContext(query: string, limit: number = 5): Promise<Record<string, unknown>[]> {
  try {
    console.log(`🔍 Buscando contexto para: "${query}"`);
    
    // Por enquanto, vamos fazer uma busca textual simples
    // Em produção, usar embeddings reais para busca semântica
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('content, metadata, chunk_index')
      .textSearch('content', query, {
        type: 'websearch',
        config: 'portuguese'
      })
      .limit(limit);

    if (error) {
      console.error('Erro na busca RAG:', error);
      return [];
    }

    console.log(`📄 Encontrados ${chunks?.length || 0} chunks relevantes`);
    return chunks || [];
  } catch (error) {
    console.error('Erro ao buscar contexto:', error);
    return [];
  }
}

// Função para buscar memória recente da conversa
async function getConversationMemory(sessionId: string, limit: number = 5): Promise<Record<string, unknown>[]> {
  try {
    const { data: memory, error } = await supabase
      .from('chatbot_memory')
      .select('user_message, bot_response, created_at, context_used')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar memória:', error);
      return [];
    }

    return memory || [];
  } catch (error) {
    console.error('Erro ao buscar memória:', error);
    return [];
  }
}

// Função para chamar DeepSeek API
async function callDeepSeekAPI(
  userMessage: string, 
  context: ConversationContext
): Promise<string> {
  try {
    // Construir contexto para o prompt
    const contextualInfo = context.relevantChunks
      .map(chunk => `- ${chunk.content.substring(0, 200)}...`)
      .join('\n');
    
    const recentHistory = context.recentMemory
      .reverse()
      .map(mem => `Usuário: ${mem.user_message}\nAssistente: ${mem.bot_response}`)
      .join('\n\n');

    const leadInfo = context.leadContext ? 
      `\nInformações do Lead:\n- Farmácia: ${context.leadContext.nomeFarmacia}\n- Contato: ${context.leadContext.nomeContato}\n- Email: ${context.leadContext.email}` : '';

    const systemPrompt = `Você é um assistente especialista em farmácias de manipulação e no sistema Pharma.AI.

CONTEXTO DO SISTEMA:
${contextualInfo}

INFORMAÇÕES DO CLIENTE:${leadInfo}

HISTÓRICO RECENTE:
${recentHistory}

INSTRUÇÕES:
- Responda de forma amigável e profissional
- Foque nos benefícios do Pharma.AI para farmácias de manipulação
- Use as informações do contexto para dar respostas precisas
- Mantenha respostas concisas (máx. 300 palavras)
- Se não souber algo específico, seja honesto
- Sempre relacione com necessidades de farmácias de manipulação
- Use emojis moderadamente para tornar a conversa mais amigável

Pergunta atual do usuário: "${userMessage}"`;

    console.log('🤖 Enviando para DeepSeek API...');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const result = await response.json();
    const botResponse = result.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta no momento.';

    console.log('✅ Resposta recebida do DeepSeek');
    return botResponse;

  } catch (error) {
    console.error('❌ Erro na DeepSeek API:', error);
    return 'Desculpe, estou com dificuldades técnicas no momento. Nossa equipe pode esclarecer suas dúvidas pessoalmente. Em breve entraremos em contato!';
  }
}

// Função para salvar na memória
async function saveConversationMemory(
  sessionId: string,
  userMessage: string,
  botResponse: string,
  contextUsed: Record<string, unknown>,
  leadData?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('chatbot_memory')
      .insert({
        session_id: sessionId,
        user_message: userMessage,
        bot_response: botResponse,
        context_used: contextUsed,
        lead_data: leadData || {},
        conversation_step: 'ai_conversation',
        relevance_score: 0.8 // Score padrão, pode ser calculado
      });

    if (error) {
      console.error('Erro ao salvar memória:', error);
    } else {
      console.log('💾 Memória salva com sucesso');
    }
  } catch (error) {
    console.error('Erro ao salvar memória:', error);
  }
}

// Função principal do handler
Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request
    const requestData: ChatbotRequest = await req.json();
    const { sessionId, userMessage, leadData, action } = requestData;

    console.log(`🚀 Processando mensagem: "${userMessage}" (sessão: ${sessionId})`);

    // Validações básicas
    if (!sessionId || !userMessage) {
      return new Response(
        JSON.stringify({ error: 'sessionId e userMessage são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar contexto relevante via RAG
    const relevantChunks = await searchRelevantContext(userMessage, 3);

    // 2. Buscar memória da conversa
    const recentMemory = await getConversationMemory(sessionId, 4);

    // 3. Construir contexto
    const context: ConversationContext = {
      relevantChunks: relevantChunks.map(chunk => ({
        content: chunk.content,
        similarity: 0.8, // Simulado por agora
        metadata: chunk.metadata
      })),
      recentMemory,
      leadContext: leadData
    };

    // 4. Chamar DeepSeek API
    const botResponse = await callDeepSeekAPI(userMessage, context);

    // 5. Salvar na memória
    await saveConversationMemory(
      sessionId,
      userMessage,
      botResponse,
      {
        chunks_used: relevantChunks.length,
        chunks_content: relevantChunks.map(c => c.chunk_index),
        memory_items_used: recentMemory.length
      },
      leadData
    );

    // 6. Retornar resposta
    const response = {
      botResponse,
      sessionId,
      contextUsed: {
        chunksFound: relevantChunks.length,
        memoryItems: recentMemory.length
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro no AI Agent:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}); 