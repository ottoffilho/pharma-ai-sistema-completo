import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Iniciando verificação de vendas no banco')
    
    // Obter configurações do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Criar cliente Supabase com service role (sem autenticação de usuário)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // 1. Verificar venda específica (ID: 3ef758de-8b15-48b0-bff8-1bc3b9a7b02e)
    console.log('Consultando venda específica...')
    const { data: vendaEspecifica, error: vendaError } = await supabase
      .from('vendas')
      .select('*')
      .eq('id', '3ef758de-8b15-48b0-bff8-1bc3b9a7b02e')
      .single()

    // 2. Listar vendas recentes com status finalizada
    console.log('Consultando vendas finalizadas recentes...')
    const { data: vendasFinalizadas, error: vendasError } = await supabase
      .from('vendas')
      .select('*')
      .eq('status', 'finalizada')
      .order('data_venda', { ascending: false })
      .limit(10)

    // 3. Verificar pagamentos para a venda específica
    console.log('Consultando pagamentos...')
    const { data: pagamentos, error: pagamentosError } = await supabase
      .from('pagamentos_venda')
      .select('*')
      .eq('venda_id', '3ef758de-8b15-48b0-bff8-1bc3b9a7b02e')

    // 4. Verificar itens da venda específica
    console.log('Consultando itens da venda...')
    const { data: itensVenda, error: itensError } = await supabase
      .from('itens_venda')
      .select('*')
      .eq('venda_id', '3ef758de-8b15-48b0-bff8-1bc3b9a7b02e')

    // 5. Contar total de vendas por status
    console.log('Consultando estatísticas gerais...')
    const { data: estatisticas, error: estatisticasError } = await supabase
      .from('vendas')
      .select('status')

    let contagemStatus = {}
    if (estatisticas) {
      contagemStatus = estatisticas.reduce((acc, venda) => {
        acc[venda.status] = (acc[venda.status] || 0) + 1
        return acc
      }, {})
    }

    // Preparar resposta detalhada
    const resultado = {
      timestamp: new Date().toISOString(),
      consultas: {
        venda_especifica: {
          encontrada: !vendaError && vendaEspecifica ? true : false,
          dados: vendaEspecifica,
          erro: vendaError?.message
        },
        vendas_finalizadas: {
          total: vendasFinalizadas?.length || 0,
          dados: vendasFinalizadas,
          erro: vendasError?.message
        },
        pagamentos_venda: {
          total: pagamentos?.length || 0,
          dados: pagamentos,
          erro: pagamentosError?.message
        },
        itens_venda: {
          total: itensVenda?.length || 0,
          dados: itensVenda,
          erro: itensError?.message
        },
        estatisticas_gerais: {
          contagem_por_status: contagemStatus,
          erro: estatisticasError?.message
        }
      },
      analise: {
        venda_existe: !vendaError && vendaEspecifica ? true : false,
        venda_finalizada: vendaEspecifica?.status === 'finalizada',
        tem_pagamentos: pagamentos && pagamentos.length > 0,
        tem_itens: itensVenda && itensVenda.length > 0,
        consistencia: {
          dados_completos: false,
          observacoes: []
        }
      }
    }

    // Análise de consistência
    if (resultado.analise.venda_existe) {
      resultado.analise.consistencia.dados_completos = 
        resultado.analise.venda_finalizada && 
        resultado.analise.tem_pagamentos && 
        resultado.analise.tem_itens

      if (!resultado.analise.venda_finalizada) {
        resultado.analise.consistencia.observacoes.push('Venda não está com status finalizada')
      }
      if (!resultado.analise.tem_pagamentos) {
        resultado.analise.consistencia.observacoes.push('Venda não possui pagamentos associados')
      }
      if (!resultado.analise.tem_itens) {
        resultado.analise.consistencia.observacoes.push('Venda não possui itens associados')
      }
    } else {
      resultado.analise.consistencia.observacoes.push('Venda com ID especificado não foi encontrada no banco')
    }

    return new Response(
      JSON.stringify(resultado, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    
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
    )
  }
})