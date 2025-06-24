import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('📨 Dados recebidos:', body);

    const {
      conversa_id,
      telefone,
      mensagem,
      tipo = 'texto',
      atendente_id,
      remetente_tipo = 'sistema',
      remetente_nome = 'Pharma.AI'
    } = body;

    // Validações básicas - conversa_id agora é opcional
    if (!telefone || !mensagem) {
      return new Response(
        JSON.stringify({
          error: 'Campos obrigatórios: telefone, mensagem'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let conversaFinal = conversa_id;

    // Se não tem conversa_id, criar uma nova conversa
    if (!conversa_id) {
      console.log('🆕 Criando nova conversa para telefone:', telefone);
      
      const { data: novaConversa, error: criarConversaError } = await supabase
        .from('conversas_atendimento')
        .insert({
          cliente_telefone: telefone,
          cliente_nome: `Cliente ${telefone}`,
          status: 'ativa',
          departamento: 'atendimento',
          prioridade: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (criarConversaError || !novaConversa) {
        return new Response(
          JSON.stringify({
            error: `Erro ao criar conversa: ${criarConversaError?.message || 'Erro desconhecido'}`
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      conversaFinal = novaConversa.id;
      console.log('✅ Nova conversa criada:', conversaFinal);
    } else {
      // Verificar se a conversa existe
      const { data: conversa, error: conversaError } = await supabase
        .from('conversas_atendimento')
        .select('id, cliente_telefone')
        .eq('id', conversa_id)
        .single();

      if (conversaError || !conversa) {
        return new Response(
          JSON.stringify({
            error: `Conversa não encontrada: ${conversaError?.message || 'ID inválido'}`
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Função para validar UUID
    const isValidUUID = (str: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    // Preparar dados da mensagem
    let dadosMensagem: any = {
      conversa_id: conversaFinal,
      conteudo: mensagem,
      tipo_mensagem: tipo,
      remetente_tipo: remetente_tipo,
      remetente_nome: remetente_nome,
      enviada_em: new Date().toISOString(),
      status_leitura: 'enviada',
      whatsapp_message_id: `n8n_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Só definir remetente_id se for um UUID válido
    if (atendente_id && isValidUUID(atendente_id)) {
      dadosMensagem.remetente_id = atendente_id;
      console.log('✅ UUID válido para atendente:', atendente_id);
    } else if (atendente_id) {
      console.log('⚠️ atendente_id não é UUID válido, ignorando:', atendente_id);
      // Para sistemas como "sistema_ia_pharma", não definir remetente_id
      // Deixar como null para evitar erro de UUID
    }

    // Para mensagens do sistema IA, garantir que o tipo está correto
    if (remetente_tipo === 'sistema' || remetente_nome.includes('IA') || remetente_nome.includes('Pharma')) {
      dadosMensagem.remetente_tipo = 'sistema';
      dadosMensagem.remetente_nome = 'Pharma.AI';
      // Não definir remetente_id para mensagens do sistema
      delete dadosMensagem.remetente_id;
    }

    console.log('💾 Salvando mensagem:', dadosMensagem);

    // Salvar mensagem no banco
    const { data: mensagemSalva, error: mensagemError } = await supabase
      .from('mensagens_atendimento')
      .insert(dadosMensagem)
      .select()
      .single();

    if (mensagemError) {
      console.error('❌ Erro ao salvar mensagem:', mensagemError);
      return new Response(
        JSON.stringify({
          error: `Error saving message: ${mensagemError.message}`,
          details: mensagemError,
          dados_enviados: dadosMensagem
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Atualizar última mensagem da conversa
    const { error: updateError } = await supabase
      .from('conversas_atendimento')
      .update({
        ultima_mensagem_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversaFinal);

    if (updateError) {
      console.warn('⚠️ Erro ao atualizar conversa:', updateError);
    }

    console.log('✅ Mensagem enviada com sucesso:', mensagemSalva.id);

    // Aqui você pode adicionar integração real com WhatsApp API
    // Por enquanto, simular envio bem-sucedido

    return new Response(
      JSON.stringify({
        success: true,
        mensagem_id: mensagemSalva.id,
        conversa_id: conversaFinal,
        telefone,
        conteudo: mensagem,
        remetente_tipo: dadosMensagem.remetente_tipo,
        remetente_nome: dadosMensagem.remetente_nome,
        timestamp: mensagemSalva.enviada_em,
        whatsapp_status: 'simulado' // Em produção, seria o status real da API do WhatsApp
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Erro na Edge Function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 