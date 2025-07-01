import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Tipos para Payloads de Ações
interface ConfiguracoesPDV {
  tema: 'light' | 'dark' | 'auto';
  tamanho_fonte: 'pequeno' | 'normal' | 'grande';
  som_habilitado: boolean;
  confirmar_antes_finalizar: boolean;
  imprimir_automatico: boolean;
  abrir_gaveta_automatico: boolean;
  atalhos_teclado: Record<string, string>;
  mostrar_produtos_favoritos: boolean;
  mostrar_ultimas_vendas: boolean;
  mostrar_metricas: boolean;
  layout_preferido: 'padrao' | 'compacto' | 'expandido';
}

interface Pagamento {
  forma_pagamento: string;
  valor: number;
  numero_autorizacao?: string;
  bandeira_cartao?: string;
  codigo_transacao?: string;
}

interface ProdutoVenda {
  id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
}

interface RequestData {
  action: string;
  [key: string]: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth user from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Cabeçalho de autorização não encontrado');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'buscar_configuracoes':
        return await buscarConfiguracoes(supabase, user.id);
      
      case 'atualizar_configuracoes':
        return await atualizarConfiguracoes(supabase, user.id, payload.configuracoes);
      
      case 'favoritar_produto':
        return await favoritarProduto(supabase, user.id, payload.produto_id);
      
      case 'sugerir_produtos':
        return await sugerirProdutos(supabase, payload.cliente_id, payload.produtos_atuais);
      
      case 'buscar_cliente_preferencias':
        return await buscarClientePreferencias(supabase, payload.cliente_id);
      
      case 'calcular_desconto_inteligente':
        return await calcularDescontoInteligente(supabase, payload.cliente_id, payload.produtos, payload.total);
      
      case 'processar_pagamentos':
        return await processarPagamentos(supabase, payload.venda_id, payload.pagamentos);
      
      default:
        throw new Error(`Ação não reconhecida: ${action}`);
    }
  } catch (error) {
    console.error('Erro na Edge Function pdv-v2-operations:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function buscarConfiguracoes(supabase: SupabaseClient, usuarioId: string) {
  try {
    const { data, error } = await supabase
      .from('configuracoes_pdv')
      .select('configuracao')
      .eq('usuario_id', usuarioId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Configurações padrão se não existir
    const configuracaoPadrao: ConfiguracoesPDV = {
      tema: 'light',
      tamanho_fonte: 'normal',
      som_habilitado: true,
      confirmar_antes_finalizar: true,
      imprimir_automatico: false,
      abrir_gaveta_automatico: true,
      atalhos_teclado: {},
      mostrar_produtos_favoritos: true,
      mostrar_ultimas_vendas: true,
      mostrar_metricas: true,
      layout_preferido: 'padrao'
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        configuracoes: data?.configuracao || configuracaoPadrao 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Erro ao buscar configurações: ${error.message}`);
  }
}

async function atualizarConfiguracoes(supabase: SupabaseClient, usuarioId: string, configuracoes: ConfiguracoesPDV) {
  try {
    const { error } = await supabase
      .from('configuracoes_pdv')
      .upsert({
        usuario_id: usuarioId,
        configuracao: configuracoes,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Erro ao atualizar configurações: ${error.message}`);
  }
}

async function favoritarProduto(supabase: SupabaseClient, usuarioId: string, produtoId: string) {
  try {
    // Verificar se já existe
    const { data: existente } = await supabase
      .from('produtos_favoritos')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('produto_id', produtoId)
      .single();

    if (!existente) {
      // Adicionar aos favoritos
      const { error } = await supabase
        .from('produtos_favoritos')
        .insert({
          usuario_id: usuarioId,
          produto_id: produtoId,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Erro ao favoritar produto: ${error.message}`);
  }
}

async function sugerirProdutos(supabase: SupabaseClient, clienteId?: string, produtosAtuais?: ProdutoVenda[]) {
  try {
    // Lógica simples de sugestão baseada em produtos populares
    const { data: produtosPopulares, error } = await supabase
      .from('produtos')
      .select(`
        id, nome, preco_venda, categoria_produto_id,
        categoria_produto:categoria_produto_id(nome)
      `)
      .eq('ativo', true)
      .gt('estoque_atual', 0)
      .order('vendas_totais', { ascending: false })
      .limit(10);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        sugestoes: produtosPopulares || [] 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Erro ao sugerir produtos: ${error.message}`);
  }
}

async function buscarClientePreferencias(supabase: SupabaseClient, clienteId: string) {
  try {
    const { data, error } = await supabase
      .from('clientes_preferencias')
      .select('*')
      .eq('cliente_id', clienteId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        preferencias: data || {} 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Erro ao buscar preferências do cliente: ${error.message}`);
  }
}

async function calcularDescontoInteligente(supabase: SupabaseClient, clienteId: string, produtos: ProdutoVenda[], total: number) {
  try {
    // Lógica simples de desconto baseada no histórico do cliente
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('total_compras, pontos_fidelidade')
      .eq('id', clienteId)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          desconto_percentual: 0,
          motivo: 'Cliente não encontrado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let descontoPercentual = 0;
    let motivo = '';

    // Desconto por fidelidade
    if (cliente.total_compras > 5000) {
      descontoPercentual = 5;
      motivo = 'Desconto especial - cliente fidelidade ouro';
    } else if (cliente.total_compras > 2000) {
      descontoPercentual = 3;
      motivo = 'Desconto especial - cliente fidelidade prata';
    } else if (cliente.total_compras > 500) {
      descontoPercentual = 2;
      motivo = 'Desconto especial - cliente fidelidade bronze';
    }

    // Desconto por volume da compra atual
    if (total > 200 && descontoPercentual < 3) {
      descontoPercentual = Math.max(descontoPercentual, 2);
      motivo = 'Desconto por volume de compra';
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        desconto_percentual: descontoPercentual,
        motivo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Erro ao calcular desconto inteligente: ${error.message}`);
  }
}

async function processarPagamentos(supabase: SupabaseClient, vendaId: string, pagamentos: Pagamento[]) {
  try {
    // Inserir pagamentos
    const pagamentosData = pagamentos.map(pag => ({
      venda_id: vendaId,
      forma_pagamento: pag.forma_pagamento,
      valor: pag.valor,
      numero_autorizacao: pag.numero_autorizacao,
      bandeira_cartao: pag.bandeira_cartao,
      codigo_transacao: pag.codigo_transacao,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('pagamentos_venda')
      .insert(pagamentosData);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Erro ao processar pagamentos: ${error.message}`);
  }
} 