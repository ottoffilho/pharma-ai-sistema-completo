import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  modo: 'preview' | 'executar'; // preview mostra o que será alterado, executar faz as alterações
  filtros?: {
    fornecedor_id?: string;
    codigo_interno?: string;
    apenas_problematicos?: boolean; // apenas produtos com info fiscal no nome
  };
}

interface ProdutoParaLimpar {
  id: string;
  codigo_interno: string;
  nome_original: string;
  nome_limpo: string;
  precisa_limpeza: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

/**
 * Remove informações fiscais do nome do produto
 */
function limparNomeProduto(nome: string): string {
  if (!nome) return nome;
  
  let nomeLimpo = nome;
  
  // Remove padrões fiscais específicos encontrados nos dados
  nomeLimpo = nomeLimpo.replace(/\s+IVA:\s*[\d.,]+%.*$/gi, '');
  nomeLimpo = nomeLimpo.replace(/\s+pIcmsSt:.*$/gi, '');
  nomeLimpo = nomeLimpo.replace(/\s+BcIcmsSt:.*$/gi, '');
  nomeLimpo = nomeLimpo.replace(/\s+vIcmsSt:.*$/gi, '');
  
  // Remove outros padrões fiscais comuns
  nomeLimpo = nomeLimpo.replace(/\s+ICMS.*$/gi, '');
  nomeLimpo = nomeLimpo.replace(/\s+ST:.*$/gi, '');
  nomeLimpo = nomeLimpo.replace(/\s+BC:.*$/gi, '');
  nomeLimpo = nomeLimpo.replace(/\s+CST.*$/gi, '');
  nomeLimpo = nomeLimpo.replace(/\s+NCM.*$/gi, '');
  nomeLimpo = nomeLimpo.replace(/\s+CFOP.*$/gi, '');
  
  // Remove informações entre parênteses no final que parecem fiscais
  nomeLimpo = nomeLimpo.replace(/\s*\([^)]*(?:ICMS|IVA|ST|CST|NCM|CFOP)[^)]*\)\s*$/gi, '');
  
  // Remove espaços extras e limpa
  nomeLimpo = nomeLimpo.trim();
  
  return nomeLimpo;
}

/**
 * Verifica se um nome precisa de limpeza
 */
function precisaLimpeza(nome: string): boolean {
  if (!nome) return false;
  
  const patterns = [
    /IVA:\s*[\d.,]+%/i,
    /pIcmsSt:/i,
    /BcIcmsSt:/i,
    /vIcmsSt:/i,
    /\bICMS\b/i,
    /\bST:\b/i,
    /\bBC:\b/i,
    /\bCST\b/i,
    /\bNCM\b/i,
    /\bCFOP\b/i
  ];
  
  return patterns.some(pattern => pattern.test(nome));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: RequestBody = await req.json()
    
    if (!body.modo || !['preview', 'executar'].includes(body.modo)) {
      return new Response(
        JSON.stringify({ error: 'Modo deve ser "preview" ou "executar"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar produtos
    let query = supabaseClient
      .from('produtos')
      .select('id, codigo_interno, nome')
      .eq('ativo', true)
      .eq('is_deleted', false)

    // Aplicar filtros
    if (body.filtros?.fornecedor_id) {
      query = query.eq('fornecedor_id', body.filtros.fornecedor_id)
    }

    if (body.filtros?.codigo_interno) {
      query = query.eq('codigo_interno', body.filtros.codigo_interno)
    }

    const { data: produtos, error: queryError } = await query

    if (queryError) {
      return new Response(
        JSON.stringify({ error: `Erro ao buscar produtos: ${queryError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!produtos || produtos.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Nenhum produto encontrado',
          produtos_analisados: 0,
          produtos_para_limpar: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Analisar produtos
    const produtosParaLimpar: ProdutoParaLimpar[] = produtos
      .map(produto => {
        const nomeLimpo = limparNomeProduto(produto.nome)
        const precisa = precisaLimpeza(produto.nome)
        
        return {
          id: produto.id,
          codigo_interno: produto.codigo_interno,
          nome_original: produto.nome,
          nome_limpo: nomeLimpo,
          precisa_limpeza: precisa
        }
      })
      .filter(produto => {
        // Se filtro apenas_problematicos, mostrar só os que precisam limpeza
        if (body.filtros?.apenas_problematicos) {
          return produto.precisa_limpeza
        }
        // Senão, mostrar todos os que teriam alteração no nome
        return produto.nome_original !== produto.nome_limpo
      })

    // Se for apenas preview, retornar análise
    if (body.modo === 'preview') {
      return new Response(
        JSON.stringify({
          modo: 'preview',
          produtos_analisados: produtos.length,
          produtos_para_limpar: produtosParaLimpar.length,
          produtos: produtosParaLimpar.slice(0, 20), // Limitar a 20 para preview
          total_produtos: produtosParaLimpar.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Modo executar - aplicar limpeza
    if (produtosParaLimpar.length === 0) {
      return new Response(
        JSON.stringify({
          modo: 'executar',
          message: 'Nenhum produto precisa de limpeza',
          produtos_limpos: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let produtosLimpos = 0
    const erros: string[] = []

    // Executar limpeza em lotes de 10
    for (let i = 0; i < produtosParaLimpar.length; i += 10) {
      const lote = produtosParaLimpar.slice(i, i + 10)
      
      for (const produto of lote) {
        try {
          const { error: updateError } = await supabaseClient
            .from('produtos')
            .update({ 
              nome: produto.nome_limpo,
              updated_at: new Date().toISOString()
            })
            .eq('id', produto.id)

          if (updateError) {
            erros.push(`Erro ao limpar produto ${produto.codigo_interno}: ${updateError.message}`)
          } else {
            produtosLimpos++
          }
        } catch (error) {
          erros.push(`Erro ao processar produto ${produto.codigo_interno}: ${error.message}`)
        }
      }
    }

    return new Response(
      JSON.stringify({
        modo: 'executar',
        message: `Limpeza concluída. ${produtosLimpos} produtos foram limpos.`,
        produtos_analisados: produtos.length,
        produtos_limpos: produtosLimpos,
        erros: erros.length > 0 ? erros : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na função limpar-nomes-produtos:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 