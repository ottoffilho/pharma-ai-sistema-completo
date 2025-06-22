import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateCriarVenda, validateFinalizarVenda } from '../_shared/validators-vendas.ts'

// Interfaces
interface CriarVendaRequest {
  cliente_id?: string;
  cliente_nome?: string;
  cliente_documento?: string;
  cliente_telefone?: string;
  itens: Array<{
    produto_id: string;
    produto_codigo?: string;
    produto_nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
    lote_id?: string;
  }>;
  subtotal: number;
  desconto_valor?: number;
  desconto_percentual?: number;
  total: number;
  observacoes?: string;
}

interface FinalizarVendaRequest {
  venda_id: string;
  pagamentos: Array<{
    forma_pagamento: string;
    valor: number;
    bandeira_cartao?: string;
    numero_autorizacao?: string;
    codigo_transacao?: string;
    observacoes?: string;
  }>;
  troco?: number;
}

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
      case 'criar-venda':
        return await criarVenda(req, supabase, user.id)
      
      case 'finalizar-venda':
        return await finalizarVenda(req, supabase, user.id)
      
      case 'obter-venda':
        return await obterVenda(url, supabase)
      
      case 'listar-vendas':
        return await listarVendas(url, supabase)
      
      case 'cancelar-venda':
        return await cancelarVenda(url, supabase, user.id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Erro na function vendas-operations:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function criarVenda(req: Request, supabase: any, userId: string) {
  const payload = await req.json()
  try {
    validateCriarVenda(payload)
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Payload inválido', detalhes: err instanceof Error ? err.message : err }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const data = payload as CriarVendaRequest

  // Gerar número sequencial da venda
  const { data: ultimaVenda } = await supabase
    .from('vendas')
    .select('numero_venda')
    .order('numero_venda', { ascending: false })
    .limit(1)

  let proximoNumero = '000001'
  if (ultimaVenda && ultimaVenda.length > 0) {
    const ultimoNumero = parseInt(ultimaVenda[0].numero_venda)
    proximoNumero = (ultimoNumero + 1).toString().padStart(6, '0')
  }

  // Verificar se há caixa aberto
  const { data: caixaAberto } = await supabase
    .from('abertura_caixa')
    .select('id')
    .eq('status', 'aberto')
    .order('data_abertura', { ascending: false })
    .limit(1)

  if (!caixaAberto || caixaAberto.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Não há caixa aberto. Abra o caixa antes de realizar vendas.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Iniciar transação
  const { data: vendaData, error: vendaError } = await supabase
    .from('vendas')
    .insert({
      numero_venda: proximoNumero,
      data_venda: new Date().toISOString(),
      usuario_id: userId,
      cliente_id: data.cliente_id,
      cliente_nome: data.cliente_nome,
      cliente_documento: data.cliente_documento,
      cliente_telefone: data.cliente_telefone,
      subtotal: data.subtotal,
      desconto_valor: data.desconto_valor || 0,
      desconto_percentual: data.desconto_percentual || 0,
      total: data.total,
      status: 'rascunho',
      status_pagamento: 'pendente',
      observacoes: data.observacoes,
      caixa_id: caixaAberto[0].id
    })
    .select()
    .single()

  if (vendaError) {
    console.error('Erro ao criar venda:', vendaError)
    return new Response(
      JSON.stringify({ error: 'Erro ao criar venda' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Inserir itens da venda
  const itensVenda = data.itens.map(item => ({
    venda_id: vendaData.id,
    produto_id: item.produto_id,
    produto_codigo: item.produto_codigo,
    produto_nome: item.produto_nome,
    quantidade: item.quantidade,
    preco_unitario: item.preco_unitario,
    preco_total: item.preco_total,
    lote_id: item.lote_id
  }))

  const { error: itensError } = await supabase
    .from('itens_venda')
    .insert(itensVenda)

  if (itensError) {
    console.error('Erro ao inserir itens da venda:', itensError)
    // Deletar a venda criada em caso de erro
    await supabase.from('vendas').delete().eq('id', vendaData.id)
    
    return new Response(
      JSON.stringify({ error: 'Erro ao inserir itens da venda' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ venda: vendaData }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function finalizarVenda(req: Request, supabase: any, userId: string) {
  const payload = await req.json()
  try {
    validateFinalizarVenda(payload)
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Payload inválido', detalhes: err instanceof Error ? err.message : err }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const data = payload as FinalizarVendaRequest

  // Verificar se a venda existe e está em rascunho
  const { data: venda, error: vendaError } = await supabase
    .from('vendas')
    .select('*')
    .eq('id', data.venda_id)
    .single()

  if (vendaError || !venda) {
    return new Response(
      JSON.stringify({ error: 'Venda não encontrada' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (venda.status !== 'rascunho') {
    return new Response(
      JSON.stringify({ error: 'Venda já foi finalizada ou cancelada' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Verificar se o total dos pagamentos bate com o total da venda
  const totalPagamentos = data.pagamentos.reduce((sum, pag) => sum + pag.valor, 0)
  const totalComTroco = totalPagamentos - (data.troco || 0)

  if (Math.abs(totalComTroco - venda.total) > 0.01) {
    return new Response(
      JSON.stringify({ error: 'Total dos pagamentos não confere com o total da venda' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Atualizar status da venda
  const { error: updateVendaError } = await supabase
    .from('vendas')
    .update({
      status: 'finalizada',
      status_pagamento: 'pago',
      troco: data.troco || 0,
      data_finalizacao: new Date().toISOString()
    })
    .eq('id', data.venda_id)

  if (updateVendaError) {
    console.error('Erro ao finalizar venda:', updateVendaError)
    return new Response(
      JSON.stringify({ error: 'Erro ao finalizar venda' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Inserir pagamentos
  const pagamentosVenda = data.pagamentos.map(pag => ({
    venda_id: data.venda_id,
    forma_pagamento: pag.forma_pagamento,
    valor: pag.valor,
    bandeira_cartao: pag.bandeira_cartao,
    numero_autorizacao: pag.numero_autorizacao,
    codigo_transacao: pag.codigo_transacao,
    observacoes: pag.observacoes,
    data_pagamento: new Date().toISOString()
  }))

  const { error: pagamentosError } = await supabase
    .from('pagamentos_venda')
    .insert(pagamentosVenda)

  if (pagamentosError) {
    console.error('Erro ao inserir pagamentos:', pagamentosError)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar pagamentos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Atualizar estoque dos produtos vendidos
  const { data: itensVenda } = await supabase
    .from('itens_venda')
    .select('produto_id, quantidade, lote_id')
    .eq('venda_id', data.venda_id)

  for (const item of itensVenda || []) {
    // Decrementar quantidade no estoque geral
    await supabase.rpc('decrementar_estoque_produto', {
      produto_id: item.produto_id,
      quantidade: item.quantidade
    })

    // Se tem lote específico, decrementar do lote
    if (item.lote_id) {
      await supabase.rpc('decrementar_estoque_lote', {
        lote_id: item.lote_id,
        quantidade: item.quantidade
      })
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Venda finalizada com sucesso',
      numero_venda: venda.numero_venda,
      venda_id: data.venda_id,
      total: venda.total,
      troco: data.troco || 0
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function obterVenda(url: URL, supabase: any) {
  const vendaId = url.searchParams.get('venda_id')

  if (!vendaId) {
    return new Response(
      JSON.stringify({ error: 'ID da venda é obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { data: venda, error: vendaError } = await supabase
    .from('vendas')
    .select(`
      *,
      itens:itens_venda(*),
      pagamentos:pagamentos_venda(*)
    `)
    .eq('id', vendaId)
    .single()

  if (vendaError) {
    return new Response(
      JSON.stringify({ error: 'Venda não encontrada' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ venda }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function listarVendas(url: URL, supabase: any) {
  const limite = parseInt(url.searchParams.get('limite') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const status = url.searchParams.get('status')
  const dataInicio = url.searchParams.get('data_inicio')
  const dataFim = url.searchParams.get('data_fim')

  let query = supabase
    .from('vendas')
    .select('*')
    .order('data_venda', { ascending: false })
    .range(offset, offset + limite - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (dataInicio) {
    query = query.gte('data_venda', dataInicio)
  }

  if (dataFim) {
    query = query.lte('data_venda', dataFim)
  }

  const { data: vendas, error } = await query

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Erro ao listar vendas' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ vendas }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function cancelarVenda(url: URL, supabase: any, userId: string) {
  const vendaId = url.searchParams.get('venda_id')
  const motivo = url.searchParams.get('motivo')

  if (!vendaId) {
    return new Response(
      JSON.stringify({ error: 'ID da venda é obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Verificar se a venda pode ser cancelada
  const { data: venda, error: vendaError } = await supabase
    .from('vendas')
    .select('status')
    .eq('id', vendaId)
    .single()

  if (vendaError || !venda) {
    return new Response(
      JSON.stringify({ error: 'Venda não encontrada' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (venda.status === 'cancelada') {
    return new Response(
      JSON.stringify({ error: 'Venda já está cancelada' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Cancelar a venda
  const { error: updateError } = await supabase
    .from('vendas')
    .update({
      status: 'cancelada',
      status_pagamento: 'cancelado',
      data_cancelamento: new Date().toISOString(),
      motivo_cancelamento: motivo,
      usuario_cancelamento: userId
    })
    .eq('id', vendaId)

  if (updateError) {
    return new Response(
      JSON.stringify({ error: 'Erro ao cancelar venda' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Se a venda estava finalizada, reverter estoque
  if (venda.status === 'finalizada') {
    const { data: itensVenda } = await supabase
      .from('itens_venda')
      .select('produto_id, quantidade, lote_id')
      .eq('venda_id', vendaId)

    for (const item of itensVenda || []) {
      // Incrementar quantidade no estoque geral
      await supabase.rpc('incrementar_estoque_produto', {
        produto_id: item.produto_id,
        quantidade: item.quantidade
      })

      // Se tem lote específico, incrementar do lote
      if (item.lote_id) {
        await supabase.rpc('incrementar_estoque_lote', {
          lote_id: item.lote_id,
          quantidade: item.quantidade
        })
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Venda cancelada com sucesso' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
} 