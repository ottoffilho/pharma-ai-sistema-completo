// Edge Function: criar-usuario
// Função que cria um usuário no Auth e na tabela usuarios

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { validateCreateUserRequest } from '../_shared/validators.ts'

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    })
  }

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Obter e validar dados da requisição
    const payload = await req.json()
    try {
      validateCreateUserRequest(payload)
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: 'Payload inválido', detalhes: validationError instanceof Error ? validationError.message : validationError }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const { email, password, userData } = payload

    // Criar cliente Supabase com chave de serviço
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

    // Criar usuário no Auth (sem confirmação de email, conforme configuração do Supabase)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar automaticamente já que "Confirm email" está desabilitado
      user_metadata: {
        nome: userData.nome,
        telefone: userData.telefone || '',
        email_verified: true,
        phone_verified: false
      }
    })

    // Garantir que os tokens necessários sejam criados
    if (authData?.user) {
      await supabaseAdmin
        .from('auth.users')
        .update({
          confirmation_sent_at: new Date().toISOString(),
          confirmation_token: crypto.randomUUID().replace(/-/g, ''),
          recovery_token: crypto.randomUUID().replace(/-/g, ''),
          email_change_token_new: crypto.randomUUID().replace(/-/g, '')
        })
        .eq('id', authData.user.id)
    }

    if (authError) {
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário: ' + authError.message }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Criar registro na tabela usuarios
    const { data: userData2, error: userError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        supabase_auth_id: authData.user.id,
        email,
        nome: userData.nome,
        telefone: userData.telefone,
        perfil_id: userData.perfil_id,
        ativo: userData.ativo
      })
      .select()
      .single()

    if (userError) {
      // Reverter criação no Auth se falhou na tabela
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(JSON.stringify({ error: 'Erro ao salvar dados do usuário: ' + userError.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Retornar sucesso
    return new Response(JSON.stringify({ 
      sucesso: true, 
      usuario: userData2 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro interno: ' + error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}) 