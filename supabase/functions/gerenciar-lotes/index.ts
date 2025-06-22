import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Tipagem para lote
interface Lote {
  id?: string;
  produto_id: string;
  numero_lote: string;
  data_fabricacao?: string;
  data_validade?: string;
  quantidade_inicial: number;
  quantidade_atual: number;
  preco_custo_unitario?: number;
  fornecedor_id?: string;
  observacoes?: string;
  ativo?: boolean;
}

interface FiltrosLote {
  produto_id?: string;
  fornecedor_id?: string;
  numero_lote?: string;
  vencidos?: boolean;
  vencimento_proximo?: boolean;
  ativo?: boolean;
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
    
    // Obter o path da URL da requisição
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const endpoint = pathSegments[pathSegments.length - 1];
    
    // Se o endpoint é um ID UUID, extrair para usar nas operações
    let id: string | null = null;
    if (endpoint && endpoint !== 'gerenciar-lotes' && endpoint.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      id = endpoint;
    }
    
    // Processar os parâmetros de busca/filtros
    const params = url.searchParams;
    const filtros: FiltrosLote = {};
    
    if (params.has('produto_id')) filtros.produto_id = params.get('produto_id') ?? undefined;
    if (params.has('fornecedor_id')) filtros.fornecedor_id = params.get('fornecedor_id') ?? undefined;
    if (params.has('numero_lote')) filtros.numero_lote = params.get('numero_lote') ?? undefined;
    if (params.has('vencidos')) filtros.vencidos = params.get('vencidos') === 'true';
    if (params.has('vencimento_proximo')) filtros.vencimento_proximo = params.get('vencimento_proximo') === 'true';
    if (params.has('ativo')) filtros.ativo = params.get('ativo') === 'true';
    
    // Paginação
    const page = parseInt(params.get('page') ?? '1');
    const limit = parseInt(params.get('limit') ?? '20');
    const offset = (page - 1) * limit;
    
    // Ordenação
    const orderBy = params.get('order_by') ?? 'data_validade';
    const orderDir = (params.get('order_dir') ?? 'asc') === 'desc' ? 'desc' : 'asc';
    
    // GET method handler
    if (req.method === 'GET') {
      // Se um ID específico foi fornecido na URL
      if (id) {
        const { data, error } = await supabaseClient
          .from('lote')
          .select(`
            *,
            produto:produto_id (*),
            fornecedor:fornecedor_id (*)
          `)
          .eq('id', id)
          .single();
          
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Busca com filtros
      let query = supabaseClient
        .from('lote')
        .select(`
          *,
          produto:produto_id (*),
          fornecedor:fornecedor_id (*)
        `, { count: 'exact' });
      
      // Aplicar filtros
      if (filtros.produto_id) {
        query = query.eq('produto_id', filtros.produto_id);
      }
      if (filtros.fornecedor_id) {
        query = query.eq('fornecedor_id', filtros.fornecedor_id);
      }
      if (filtros.numero_lote) {
        query = query.ilike('numero_lote', `%${filtros.numero_lote}%`);
      }
      if (filtros.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo);
      }
      if (filtros.vencidos) {
        const hoje = new Date().toISOString().split('T')[0];
        query = query.lte('data_validade', hoje);
      }
      if (filtros.vencimento_proximo) {
        const hoje = new Date();
        const em30dias = new Date();
        em30dias.setDate(hoje.getDate() + 30);
        query = query.gte('data_validade', hoje.toISOString().split('T')[0])
                     .lte('data_validade', em30dias.toISOString().split('T')[0]);
      }
      
      // Aplicar paginação e ordenação
      query = query
        .order(orderBy, { ascending: orderDir === 'asc' })
        .range(offset, offset + limit - 1);
        
      const { data, error, count } = await query;
        
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const totalPages = Math.ceil((count ?? 0) / limit);
      
      return new Response(
        JSON.stringify({
          data,
          pagination: {
            page,
            limit,
            total: count,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // POST method handler (create)
    if (req.method === 'POST') {
      const lote = await req.json() as Lote;
      
      // Validações básicas
      if (!lote.produto_id) {
        return new Response(
          JSON.stringify({ error: 'ID do produto é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!lote.numero_lote) {
        return new Response(
          JSON.stringify({ error: 'Número do lote é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (lote.quantidade_inicial === undefined) {
        return new Response(
          JSON.stringify({ error: 'Quantidade inicial é obrigatória' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Se quantidade atual não foi informada, assume a mesma da quantidade inicial
      if (lote.quantidade_atual === undefined) {
        lote.quantidade_atual = lote.quantidade_inicial;
      }
      
      // Inserir lote
      const { data, error } = await supabaseClient
        .from('lote')
        .insert({
          produto_id: lote.produto_id,
          numero_lote: lote.numero_lote,
          data_fabricacao: lote.data_fabricacao,
          data_validade: lote.data_validade,
          quantidade_inicial: lote.quantidade_inicial,
          quantidade_atual: lote.quantidade_atual,
          preco_custo_unitario: lote.preco_custo_unitario,
          fornecedor_id: lote.fornecedor_id,
          observacoes: lote.observacoes,
          ativo: lote.ativo !== undefined ? lote.ativo : true
        })
        .select()
        .single();
        
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // PUT method handler (update)
    if (req.method === 'PUT' && id) {
      const lote = await req.json() as Lote;
      
      // Remove id do objeto de atualização
      if (lote.id) delete lote.id;
      
      // Validações específicas para atualização
      if (lote.quantidade_inicial !== undefined && lote.quantidade_atual === undefined) {
        // Se só alterou a quantidade inicial, atualizar a atual também
        const { data: loteAtual } = await supabaseClient
          .from('lote')
          .select('quantidade_inicial, quantidade_atual')
          .eq('id', id)
          .single();
          
        if (loteAtual) {
          // Mantém a mesma diferença entre quantidade inicial e atual
          const diferenca = loteAtual.quantidade_inicial - loteAtual.quantidade_atual;
          lote.quantidade_atual = Math.max(0, lote.quantidade_inicial - diferenca);
        }
      }
      
      // Atualizar lote
      const { data, error } = await supabaseClient
        .from('lote')
        .update({
          produto_id: lote.produto_id,
          numero_lote: lote.numero_lote,
          data_fabricacao: lote.data_fabricacao,
          data_validade: lote.data_validade,
          quantidade_inicial: lote.quantidade_inicial,
          quantidade_atual: lote.quantidade_atual,
          preco_custo_unitario: lote.preco_custo_unitario,
          fornecedor_id: lote.fornecedor_id,
          observacoes: lote.observacoes,
          ativo: lote.ativo
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // DELETE method handler
    if (req.method === 'DELETE' && id) {
      // Em vez de excluir fisicamente, apenas inativa o lote
      const { data, error } = await supabaseClient
        .from('lote')
        .update({ ativo: false })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Lote inativado com sucesso', lote: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro na edge function gerenciar-lotes:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}) 