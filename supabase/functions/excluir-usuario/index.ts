import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Logs para depuração de variáveis de ambiente (GARANTIR QUE SEJAM OS PRIMEIROS)
  console.log(`[DEBUG ENV] SUPABASE_URL is set: ${!!Deno.env.get('SUPABASE_URL')}`);
  console.log(`[DEBUG ENV] SUPABASE_ANON_KEY is set: ${!!Deno.env.get('SUPABASE_ANON_KEY')}`);
  console.log(`[DEBUG ENV] SUPABASE_SERVICE_ROLE_KEY is set: ${!!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.error('[CRITICAL ENV] Uma ou mais variáveis de ambiente do Supabase (URL, ANON_KEY, SERVICE_ROLE_KEY) estão faltando!');
    // Não retornar imediatamente para permitir que outros logs apareçam, se possível
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Obter dados da requisição
    const { supabaseAuthId, usuarioId } = await req.json()
    console.log(`[DEBUG DATA] Recebido para exclusão: supabaseAuthId: ${supabaseAuthId}, usuarioId (da tabela usuarios): ${usuarioId}`);

    if (!supabaseAuthId || !usuarioId) {
      return new Response(
        JSON.stringify({ error: 'supabaseAuthId e usuarioId são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar autorização
    const authHeader = req.headers.get('Authorization')
    console.log(`[DEBUG AUTH] Authorization Header: ${authHeader ? authHeader.substring(0, 15) + '...' : 'Nenhum'}`); // Loga apenas o início do token

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Criar cliente Supabase com Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Criar cliente normal para verificar permissões do usuário atual
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se o usuário atual tem permissão para excluir usuários
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar dados do usuário atual para verificar permissões
    const { data: usuarioAtual, error: userError } = await supabase
      .from('usuarios')
      .select(`
        id,
        perfil_id
      `)
      .eq('supabase_auth_id', user.id)
      .single()

    if (userError || !usuarioAtual) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar permissões do usuário atual
    const { data: permissoesUsuario, error: permError } = await supabase
      .from('permissoes')
      .select('modulo, acao, permitido')
      .eq('perfil_id', usuarioAtual.perfil_id)
      .eq('permitido', true)

    if (permError) {
      console.error('Erro ao buscar permissões:', permError)
    }

    // Verificar se o usuário tem permissão para excluir usuários
    // Proprietário sempre tem permissão, ou verificar permissões específicas
    const temPermissao = usuarioAtual.perfil_id === '42142fe1-756d-4ff2-b92a-58a7ea8b77fa' || // ID do perfil Proprietário
      permissoesUsuario?.some((p: {
        modulo: string;
        acao: string;
        permitido: boolean;
      }) => 
        p.modulo === 'USUARIOS_PERMISSOES' && 
        (p.acao === 'DELETAR' || p.acao === 'ADMINISTRAR')
      )

    if (!temPermissao) {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para excluir usuários' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se o usuário não está tentando excluir a si mesmo
    if (usuarioAtual.id === usuarioId) {
      return new Response(
        JSON.stringify({ error: 'Não é possível excluir seu próprio usuário' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar dados do usuário a ser excluído
    const { data: usuarioParaExcluir, error: targetUserError } = await supabase
      .from('usuarios')
      .select('id, nome, email, perfil_id')
      .eq('id', usuarioId)
      .single()

    if (targetUserError || !usuarioParaExcluir) {
      return new Response(
        JSON.stringify({ error: 'Usuário a ser excluído não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Não permitir exclusão do último proprietário
    if (usuarioParaExcluir.perfil_id === '42142fe1-756d-4ff2-b92a-58a7ea8b77fa') { // ID do perfil Proprietário
      const { data: proprietarios, error: propError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('perfil_id', '42142fe1-756d-4ff2-b92a-58a7ea8b77fa') // ID do perfil Proprietário
        .eq('ativo', true)

      if (propError || !proprietarios || proprietarios.length <= 1) {
        return new Response(
          JSON.stringify({ error: 'Não é possível excluir o último proprietário do sistema' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    console.log(`Iniciando exclusão do usuário: ${usuarioParaExcluir.nome} (${usuarioParaExcluir.email})`)

    // Etapa Preparatória: Remover da tabela public.usuarios primeiro
    // Isso é para tentar mitigar possíveis problemas de FK antes de chamar auth.admin.deleteUser
    console.log(`[INFO] Etapa 1: Tentando excluir usuarioId: ${usuarioId} da tabela public.usuarios.`);
    const { error: publicUserDeleteError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', usuarioId); // Usar o ID da tabela usuarios aqui

    if (publicUserDeleteError) {
      console.error('[WARN] Erro ao excluir da tabela public.usuarios (Etapa 1):', publicUserDeleteError);
      // Não vamos retornar um erro fatal aqui ainda, pois o objetivo principal é excluir do Auth.
      // Mas logamos o aviso.
    } else {
      console.log('[INFO] Usuário excluído da tabela public.usuarios com sucesso (Etapa 1).');
    }

    // 1. Excluir do Supabase Auth usando Service Role
    console.log(`[INFO] Etapa 2: Tentando excluir supabaseAuthId: ${supabaseAuthId} do Supabase Auth.`);
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseAuthId)
    
    if (authDeleteError) {
      console.error('Erro ao excluir do Supabase Auth:', authDeleteError)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao excluir usuário do sistema de autenticação',
          details: authDeleteError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Usuário excluído do Supabase Auth com sucesso')

    // 3. Registrar log de auditoria
    try {
      await supabase
        .from('logs_auditoria')
        .insert({
          usuario_id: usuarioAtual.id,
          acao: 'EXCLUIR_USUARIO',
          modulo: 'USUARIOS_PERMISSOES',
          recurso: 'usuario',
          dados_anteriores: {
            id: usuarioParaExcluir.id,
            nome: usuarioParaExcluir.nome,
            email: usuarioParaExcluir.email,
            perfil_id: usuarioParaExcluir.perfil_id
          },
          dados_novos: {},
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        })
    } catch (logError) {
      console.error('Erro ao registrar log de auditoria:', logError)
      // Não falha a operação por causa do log
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário excluído com sucesso',
        usuario: {
          id: usuarioParaExcluir.id,
          nome: usuarioParaExcluir.nome,
          email: usuarioParaExcluir.email
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na Edge Function excluir-usuario:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 