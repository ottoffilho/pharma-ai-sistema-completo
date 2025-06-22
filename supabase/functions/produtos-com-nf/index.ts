// @ts-expect-error Deno imports não são reconhecidos pelo TypeScript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-expect-error Deno imports não são reconhecidos pelo TypeScript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declarações globais para Deno
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
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

    if (req.method === 'POST') {
      const body = await req.json()
      
      // Se for uma query SQL direta (para compatibilidade)
      if (body.query) {
        const { data, error } = await supabaseClient.rpc('execute_sql', {
          sql_query: body.query
        })
        
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // GET method - buscar produtos com dados da nota fiscal
    if (req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('produtos')
        .select(`
          id,
          nome,
          tipo,
          categoria,
          estoque_atual,
          estoque_minimo,
          estoque_maximo,
          custo_unitario,
          preco_custo,
          preco_venda,
          unidade_medida,
          controlado,
          ativo,
          is_deleted,
          fornecedores!fornecedor_id (
            nome
          ),
          itens_nota_fiscal!produto_id (
            valor_unitario_comercial,
            valor_frete,
            valor_total_produto,
            quantidade_comercial,
            notas_fiscais!nota_fiscal_id (
              numero_nf,
              data_emissao,
              valor_total_nota
            )
          )
        `)
        .eq('is_deleted', false)
        .order('nome')

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Processar dados para incluir valores reais da nota fiscal
      const produtosProcessados = data.map((produto: {
        id: string;
        nome: string;
        tipo: string;
        categoria: string;
        estoque_atual: string | number;
        estoque_minimo: string | number;
        estoque_maximo: string | number;
        custo_unitario: string | number;
        preco_custo: string | number;
        preco_venda: string | number;
        unidade_medida: string;
        controlado: boolean;
        ativo: boolean;
        is_deleted: boolean;
        fornecedores?: { nome: string };
        itens_nota_fiscal?: Array<{
          valor_unitario_comercial: string | number;
          valor_frete: string | number;
          valor_total_produto: string | number;
          quantidade_comercial: string | number;
          notas_fiscais?: {
            numero_nf: number;
            data_emissao: string;
            valor_total_nota: string | number;
          };
        }>;
      }) => {
        // Pegar o item mais recente da nota fiscal
        const itemNF = produto.itens_nota_fiscal?.[0]
        const notaFiscal = itemNF?.notas_fiscais
        
        // Frete é o valor total pago (não dividido por unidade)
        const freteTotal = itemNF ? parseFloat(String(itemNF.valor_frete || 0)) : null
        
        return {
          id: produto.id,
          nome: produto.nome,
          tipo: produto.tipo,
          categoria: produto.categoria,
          estoque_atual: parseFloat(String(produto.estoque_atual || 0)),
          estoque_minimo: parseFloat(String(produto.estoque_minimo || 0)),
          estoque_maximo: parseFloat(String(produto.estoque_maximo || 0)),
          custo_unitario: parseFloat(String(produto.custo_unitario || 0)),
          preco_custo: parseFloat(String(produto.preco_custo || produto.custo_unitario || 0)),
          preco_venda: parseFloat(String(produto.preco_venda || 0)),
          unidade_medida: produto.unidade_medida,
          controlado: produto.controlado,
          ativo: produto.ativo,
          is_deleted: produto.is_deleted,
          fornecedor_nome: produto.fornecedores?.nome || 'Não informado',
          
          // Valores reais da nota fiscal (não hardcoded)
          valor_compra_nf: itemNF ? parseFloat(String(itemNF.valor_unitario_comercial)) : null,
          frete_unitario: freteTotal, // Frete total pago
          valor_total_item_nf: itemNF ? parseFloat(String(itemNF.valor_total_produto)) : null,
          quantidade_nf: itemNF ? parseFloat(String(itemNF.quantidade_comercial)) : null,
          
          // Dados da nota fiscal
          numero_nf: notaFiscal?.numero_nf || null,
          data_emissao_nf: notaFiscal?.data_emissao || null,
          valor_total_nota: notaFiscal ? parseFloat(String(notaFiscal.valor_total_nota)) : null,
          
          // Custo efetivo é o valor total da nota fiscal (valor que a cliente pagou)
          custo_efetivo: notaFiscal ? parseFloat(String(notaFiscal.valor_total_nota)) : 
            (itemNF ? parseFloat(String(itemNF.valor_total_produto)) : parseFloat(String(produto.custo_unitario || 0)))
        }
      })

      return new Response(
        JSON.stringify(produtosProcessados),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na edge function produtos-com-nf:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 