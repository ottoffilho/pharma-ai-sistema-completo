import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar autorização
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ erro: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { auth_id } = await req.json()
    const userIdToCheck = auth_id || user.id

    console.log('🔍 Verificando sincronização para user:', userIdToCheck)

    // 1. Verificar se usuário existe por supabase_auth_id
    const { data: usuarioExistePorAuth, error: usuarioErrorAuth } = await supabaseClient
      .from('usuarios')
      .select('id, nome, email')
      .eq('supabase_auth_id', userIdToCheck)
      .maybeSingle()

    if (usuarioErrorAuth) {
      console.error('Erro ao verificar usuário por auth_id:', usuarioErrorAuth)
      return new Response(
        JSON.stringify({ erro: 'Erro ao verificar usuário', detalhes: usuarioErrorAuth.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (usuarioExistePorAuth) {
      console.log('✅ Usuário já sincronizado:', usuarioExistePorAuth.nome)
      return new Response(
        JSON.stringify({ 
          sucesso: true, 
          usuario_sincronizado: true,
          usuario: usuarioExistePorAuth,
          mensagem: 'Usuário já sincronizado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verificar se existe usuário com mesmo ID (fallback)
    const { data: usuarioExistePorId, error: usuarioErrorId } = await supabaseClient
      .from('usuarios')
      .select('id, nome, email, supabase_auth_id')
      .eq('id', userIdToCheck)
      .maybeSingle()

    if (!usuarioErrorId && usuarioExistePorId) {
      // Usuário existe mas sem supabase_auth_id correto - sincronizar
      if (!usuarioExistePorId.supabase_auth_id || usuarioExistePorId.supabase_auth_id !== userIdToCheck) {
        console.log('🔧 Sincronizando supabase_auth_id para usuário existente:', usuarioExistePorId.nome)
        
        const { error: updateError } = await supabaseClient
          .from('usuarios')
          .update({ supabase_auth_id: userIdToCheck })
          .eq('id', userIdToCheck)

        if (updateError) {
          console.error('Erro ao atualizar supabase_auth_id:', updateError)
          return new Response(
            JSON.stringify({ erro: 'Erro ao sincronizar usuário', detalhes: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            sucesso: true, 
            usuario_sincronizado: true,
            usuario: { ...usuarioExistePorId, supabase_auth_id: userIdToCheck },
            mensagem: 'Usuário sincronizado com sucesso'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 3. Usuário não existe - tentar criar
    console.log('🆕 Criando novo usuário na tabela usuarios')

    // Buscar perfil proprietário
    const { data: perfilProprietario, error: perfilError } = await supabaseClient
      .from('perfis_usuario')
      .select('id')
      .eq('tipo', 'PROPRIETARIO')
      .limit(1)
      .maybeSingle()

    if (perfilError || !perfilProprietario) {
      console.error('Erro ao buscar perfil proprietário:', perfilError)
      return new Response(
        JSON.stringify({ erro: 'Perfil proprietário não encontrado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar novamente se não foi criado por outro processo (race condition)
    const { data: verificarNovamente } = await supabaseClient
      .from('usuarios')
      .select('id')
      .eq('supabase_auth_id', userIdToCheck)
      .maybeSingle()

    if (verificarNovamente) {
      console.log('✅ Usuário já foi criado por outro processo:', verificarNovamente.id)
      return new Response(
        JSON.stringify({ 
          sucesso: true, 
          usuario_sincronizado: true,
          usuario: verificarNovamente,
          mensagem: 'Usuário já foi criado por outro processo'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar dados do usuário no auth
    const { data: authUser, error: authUserError } = await supabaseClient.auth.admin.getUserById(userIdToCheck)
    
    if (authUserError || !authUser.user) {
      console.error('Erro ao buscar dados do usuário no auth:', authUserError)
      return new Response(
        JSON.stringify({ erro: 'Usuário não encontrado no sistema de autenticação' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar usuário na tabela usuarios
    const { data: usuarioCriado, error: criarError } = await supabaseClient
      .from('usuarios')
      .insert({
        id: userIdToCheck,
        supabase_auth_id: userIdToCheck,
        nome: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Usuário',
        email: authUser.user.email,
        perfil_id: perfilProprietario.id,
        ativo: true
      })
      .select()
      .single()

    if (criarError) {
      console.error('Erro ao criar usuário:', criarError)
      
      // Se o erro for de duplicate key, tentar buscar o usuário que foi criado
      if (criarError.code === '23505') {
        const { data: usuarioJaExiste } = await supabaseClient
          .from('usuarios')
          .select('id, nome, email')
          .eq('supabase_auth_id', userIdToCheck)
          .maybeSingle()
        
        if (usuarioJaExiste) {
          console.log('✅ Usuário já existia, retornando existente:', usuarioJaExiste.nome)
          return new Response(
            JSON.stringify({ 
              sucesso: true, 
              usuario_sincronizado: true,
              usuario: usuarioJaExiste,
              mensagem: 'Usuário já existia no sistema'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
      
      return new Response(
        JSON.stringify({ erro: 'Erro ao criar usuário', detalhes: criarError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Usuário criado com sucesso:', usuarioCriado.nome)
    
    return new Response(
      JSON.stringify({ 
        sucesso: true, 
        usuario_sincronizado: true,
        usuario: usuarioCriado,
        mensagem: 'Usuário criado e sincronizado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro interno:', error)
    return new Response(
      JSON.stringify({ erro: 'Erro interno do servidor', detalhes: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 