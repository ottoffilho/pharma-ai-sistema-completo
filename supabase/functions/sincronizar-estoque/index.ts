import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Iniciando sincronização de estoque...')

    // 1. Buscar todos os produtos ativos
    const { data: produtos, error: produtosError } = await supabaseClient
      .from('produtos')
      .select('id, nome, estoque_atual')
      .eq('is_deleted', false)

    if (produtosError) {
      throw new Error(`Erro ao buscar produtos: ${produtosError.message}`)
    }

    console.log(`📦 Encontrados ${produtos?.length || 0} produtos para sincronizar`)

    const resultados = []

    // 2. Para cada produto, calcular estoque real dos lotes
    for (const produto of produtos || []) {
      try {
        // Somar quantidade_atual de todos os lotes ativos do produto
        const { data: lotes, error: lotesError } = await supabaseClient
          .from('lote')
          .select('quantidade_atual')
          .eq('produto_id', produto.id)
          .eq('ativo', true)

        if (lotesError) {
          console.error(`❌ Erro ao buscar lotes do produto ${produto.nome}:`, lotesError)
          continue
        }

        // Calcular estoque real (soma dos lotes)
        const estoqueRealLotes = lotes?.reduce((total, lote) => {
          return total + (parseFloat(lote.quantidade_atual) || 0)
        }, 0) || 0

        const estoqueAtualProduto = produto.estoque_atual || 0

        console.log(`📊 ${produto.nome}:`)
        console.log(`   - Estoque na tabela produtos: ${estoqueAtualProduto}`)
        console.log(`   - Estoque real dos lotes: ${estoqueRealLotes}`)

        // 3. Se houver diferença, atualizar o estoque do produto
        if (Math.abs(estoqueAtualProduto - estoqueRealLotes) > 0.001) {
          const { error: updateError } = await supabaseClient
            .from('produtos')
            .update({ estoque_atual: estoqueRealLotes })
            .eq('id', produto.id)

          if (updateError) {
            console.error(`❌ Erro ao atualizar produto ${produto.nome}:`, updateError)
            resultados.push({
              produto_id: produto.id,
              produto_nome: produto.nome,
              status: 'erro',
              erro: updateError.message,
              estoque_anterior: estoqueAtualProduto,
              estoque_lotes: estoqueRealLotes
            })
          } else {
            console.log(`✅ ${produto.nome}: ${estoqueAtualProduto} → ${estoqueRealLotes}`)
            resultados.push({
              produto_id: produto.id,
              produto_nome: produto.nome,
              status: 'atualizado',
              estoque_anterior: estoqueAtualProduto,
              estoque_novo: estoqueRealLotes,
              diferenca: estoqueRealLotes - estoqueAtualProduto
            })
          }
        } else {
          console.log(`✅ ${produto.nome}: Já sincronizado`)
          resultados.push({
            produto_id: produto.id,
            produto_nome: produto.nome,
            status: 'sincronizado',
            estoque_atual: estoqueAtualProduto
          })
        }

      } catch (error) {
        console.error(`❌ Erro ao processar produto ${produto.nome}:`, error)
        resultados.push({
          produto_id: produto.id,
          produto_nome: produto.nome,
          status: 'erro',
          erro: error.message
        })
      }
    }

    // 4. Resumo dos resultados
    const resumo = {
      total_produtos: produtos?.length || 0,
      atualizados: resultados.filter(r => r.status === 'atualizado').length,
      sincronizados: resultados.filter(r => r.status === 'sincronizado').length,
      erros: resultados.filter(r => r.status === 'erro').length
    }

    console.log('📈 Resumo da sincronização:', resumo)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização de estoque concluída',
        resumo,
        detalhes: resultados
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erro na sincronização de estoque:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 