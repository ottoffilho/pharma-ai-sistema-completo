import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Interfaces
interface AbrirCaixaRequest {
  valor_inicial: number;
  observacoes?: string;
}

interface FecharCaixaRequest {
  caixa_id: string;
  valor_final: number;
  observacoes?: string;
}

type VendaSimples = {
  total: number;
};

serve(async (req) => {
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  }

  // Tratar requisições OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obter informações de autenticação
    const authHeader = req.headers.get('Authorization')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Verificar autenticação do usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'abrir-caixa':
        return await abrirCaixa(req, supabase, user.id)
      
      case 'fechar-caixa':
        return await fecharCaixa(req, supabase, user.id)
      
      case 'obter-caixa-ativo':
        return await obterCaixaAtivo(supabase)
      
      case 'historico-caixa':
        return await historicoOperacoesCaixa(url, supabase)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Erro na function caixa-operations:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function abrirCaixa(req: Request, supabase: SupabaseClient, userId: string) {
  const data: AbrirCaixaRequest = await req.json()

  // 1. Buscar perfil do usuário para obter farmacia_id
  const { data: perfilUsuario, error: perfilError } = await supabase
    .from('usuarios')
    .select('farmacia_id')
    .eq('id', userId)
    .single()

  if (perfilError || !perfilUsuario || !perfilUsuario.farmacia_id) {
    console.error('Erro ao buscar perfil ou farmacia_id:', perfilError)
    return new Response(
      JSON.stringify({ error: 'Não foi possível identificar a farmácia do usuário.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  const { farmacia_id } = perfilUsuario

  // 2. Verificar se há caixa já aberto para esta farmácia
  const { data: caixaAberto } = await supabase
    .from('abertura_caixa')
    .select('id, status')
    .eq('status', 'aberto')
    .eq('farmacia_id', farmacia_id) // <-- Adicionado filtro por farmácia
    .order('data_abertura', { ascending: false })
    .limit(1)

  if (caixaAberto && caixaAberto.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Já existe um caixa aberto para esta farmácia. Feche-o antes de abrir um novo.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 3. Validar valor inicial
  if (data.valor_inicial === undefined || data.valor_inicial === null || data.valor_inicial < 0) {
    return new Response(
      JSON.stringify({ error: 'Valor inicial deve ser maior ou igual a zero' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 4. Abrir novo caixa com farmacia_id
  const { data: novoCaixa, error: caixaError } = await supabase
    .from('abertura_caixa')
    .insert({
      usuario_id: userId,
      farmacia_id: farmacia_id, // <-- Adicionado farmacia_id
      data_abertura: new Date().toISOString(),
      valor_inicial: data.valor_inicial,
      status: 'aberto',
      observacoes: data.observacoes
    })
    .select()
    .single()

  if (caixaError) {
    console.error('Erro ao abrir caixa:', caixaError)
    // Adiciona mais detalhes do erro para o frontend
    const errorMessage = caixaError.details || 'Erro ao criar o registro do caixa no banco de dados.';
    return new Response(
      JSON.stringify({ error: errorMessage, details: caixaError }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Caixa aberto com sucesso',
      caixa: novoCaixa
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function fecharCaixa(req: Request, supabase: SupabaseClient, userId: string) {
  const data: FecharCaixaRequest = await req.json()

  // Verificar se o caixa existe e está aberto
  const { data: caixa, error: caixaError } = await supabase
    .from('abertura_caixa')
    .select('*')
    .eq('id', data.caixa_id)
    .eq('status', 'aberto')
    .single()

  if (caixaError || !caixa) {
    return new Response(
      JSON.stringify({ error: 'Caixa não encontrado ou já fechado' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Calcular vendas do período
  const { data: vendas } = await supabase
    .from('vendas')
    .select('total')
    .eq('caixa_id', data.caixa_id)
    .eq('status', 'finalizada')

  const totalVendas = (vendas as VendaSimples[] | null)?.reduce((sum, venda) => sum + venda.total, 0) || 0
  const valorEsperado = caixa.valor_inicial + totalVendas
  const diferenca = data.valor_final - valorEsperado

  // Fechar o caixa
  const { error: updateError } = await supabase
    .from('abertura_caixa')
    .update({
      status: 'fechado',
      data_fechamento: new Date().toISOString(),
      valor_final: data.valor_final,
      valor_vendas: totalVendas,
      diferenca: diferenca,
      usuario_fechamento: userId,
      observacoes_fechamento: data.observacoes
    })
    .eq('id', data.caixa_id)

  if (updateError) {
    console.error('Erro ao fechar caixa:', updateError)
    return new Response(
      JSON.stringify({ error: 'Erro ao fechar caixa' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Caixa fechado com sucesso',
      resumo: {
        valor_inicial: caixa.valor_inicial,
        valor_vendas: totalVendas,
        valor_esperado: valorEsperado,
        valor_final: data.valor_final,
        diferenca: diferenca
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function obterCaixaAtivo(supabase: SupabaseClient) {
  const { data: caixaAtivo, error } = await supabase
    .from('abertura_caixa')
    .select(`
      *,
      usuario:usuario_id(nome),
      vendas(count)
    `)
    .eq('status', 'aberto')
    .order('data_abertura', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar caixa ativo' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ caixa: caixaAtivo || null }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function historicoOperacoesCaixa(url: URL, supabase: SupabaseClient) {
  const limite = parseInt(url.searchParams.get('limite') || '20')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const dataInicio = url.searchParams.get('data_inicio')
  const dataFim = url.searchParams.get('data_fim')

  let query = supabase
    .from('abertura_caixa')
    .select(`
      *,
      usuario:usuario_id(nome),
      usuario_fechamento_info:usuario_fechamento(nome)
    `)
    .order('data_abertura', { ascending: false })
    .range(offset, offset + limite - 1)

  if (dataInicio) {
    query = query.gte('data_abertura', dataInicio)
  }

  if (dataFim) {
    query = query.lte('data_abertura', dataFim)
  }

  const { data: historico, error } = await query

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar histórico do caixa' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ historico }),
    { headers: { 'Content-Type': 'application/json' } }
  )
} 