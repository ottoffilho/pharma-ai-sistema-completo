import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Tipagem para produto
interface Produto {
  id?: string;
  codigo_interno: string;
  codigo_ean?: string;
  nome: string;
  descricao?: string;
  categoria_produto_id?: string;
  forma_farmaceutica_id?: string;
  fornecedor_id?: string;
  ncm?: string;
  cfop?: string;
  origem?: number;
  cst_icms?: string;
  cst_ipi?: string;
  cst_pis?: string;
  cst_cofins?: string;
  unidade_comercial: string;
  unidade_tributaria?: string;
  preco_custo?: number;
  preco_venda?: number;
  margem_lucro?: number;
  aliquota_icms?: number;
  aliquota_ipi?: number;
  aliquota_pis?: number;
  aliquota_cofins?: number;
  estoque_minimo?: number;
  estoque_maximo?: number;
  estoque_atual?: number;
  controlado?: boolean;
  requer_receita?: boolean;
  produto_manipulado?: boolean;
  produto_revenda?: boolean;
  ativo?: boolean;
}

interface FiltrosProduto {
  nome?: string;
  categoria_id?: string;
  forma_farmaceutica_id?: string;
  fornecedor_id?: string;
  codigo?: string;
  controlado?: boolean;
  manipulado?: boolean;
  ativo?: boolean;
  estoque_baixo?: boolean;
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
    if (endpoint && endpoint !== 'gerenciar-produtos' && endpoint.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      id = endpoint;
    }
    
    // Processar os parâmetros de busca/filtros
    const params = url.searchParams;
    const filtros: FiltrosProduto = {};
    
    if (params.has('nome')) filtros.nome = params.get('nome') ?? undefined;
    if (params.has('categoria_id')) filtros.categoria_id = params.get('categoria_id') ?? undefined;
    if (params.has('forma_farmaceutica_id')) filtros.forma_farmaceutica_id = params.get('forma_farmaceutica_id') ?? undefined;
    if (params.has('fornecedor_id')) filtros.fornecedor_id = params.get('fornecedor_id') ?? undefined;
    if (params.has('codigo')) filtros.codigo = params.get('codigo') ?? undefined;
    if (params.has('controlado')) filtros.controlado = params.get('controlado') === 'true';
    if (params.has('manipulado')) filtros.manipulado = params.get('manipulado') === 'true';
    if (params.has('ativo')) filtros.ativo = params.get('ativo') === 'true';
    if (params.has('estoque_baixo')) filtros.estoque_baixo = params.get('estoque_baixo') === 'true';
    
    // Paginação
    const page = parseInt(params.get('page') ?? '1');
    const limit = parseInt(params.get('limit') ?? '20');
    const offset = (page - 1) * limit;
    
    // Ordenação
    const orderBy = params.get('order_by') ?? 'nome';
    const orderDir = (params.get('order_dir') ?? 'asc') === 'desc' ? 'desc' : 'asc';
    
    // GET method handler
    if (req.method === 'GET') {
      // Se um ID específico foi fornecido na URL
      if (id) {
        const { data, error } = await supabaseClient
          .from('produto')
          .select(`
            *,
            categoria_produto:categoria_produto_id (*),
            forma_farmaceutica:forma_farmaceutica_id (*),
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
        .from('produto')
        .select(`
          *,
          categoria_produto:categoria_produto_id (*),
          forma_farmaceutica:forma_farmaceutica_id (*)
        `, { count: 'exact' });
      
      // Aplicar filtros
      if (filtros.nome) {
        query = query.ilike('nome', `%${filtros.nome}%`);
      }
      if (filtros.categoria_id) {
        query = query.eq('categoria_produto_id', filtros.categoria_id);
      }
      if (filtros.forma_farmaceutica_id) {
        query = query.eq('forma_farmaceutica_id', filtros.forma_farmaceutica_id);
      }
      if (filtros.fornecedor_id) {
        query = query.eq('fornecedor_id', filtros.fornecedor_id);
      }
      if (filtros.codigo) {
        query = query.or(`codigo_interno.ilike.%${filtros.codigo}%,codigo_ean.ilike.%${filtros.codigo}%`);
      }
      if (filtros.controlado !== undefined) {
        query = query.eq('controlado', filtros.controlado);
      }
      if (filtros.manipulado !== undefined) {
        query = query.eq('produto_manipulado', filtros.manipulado);
      }
      if (filtros.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo);
      }
      if (filtros.estoque_baixo) {
        query = query.lte('estoque_atual', supabaseClient.rpc('GREATEST', { a: 'estoque_minimo', b: 1 }));
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
      const produto = await req.json() as Produto;
      
      // Validações básicas
      if (!produto.codigo_interno) {
        return new Response(
          JSON.stringify({ error: 'Código interno é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!produto.nome) {
        return new Response(
          JSON.stringify({ error: 'Nome do produto é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!produto.unidade_comercial) {
        return new Response(
          JSON.stringify({ error: 'Unidade comercial é obrigatória' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Inserir produto
      const { data, error } = await supabaseClient
        .from('produto')
        .insert({
          codigo_interno: produto.codigo_interno,
          codigo_ean: produto.codigo_ean,
          nome: produto.nome,
          descricao: produto.descricao,
          categoria_produto_id: produto.categoria_produto_id,
          forma_farmaceutica_id: produto.forma_farmaceutica_id,
          fornecedor_id: produto.fornecedor_id,
          ncm: produto.ncm,
          cfop: produto.cfop,
          origem: produto.origem,
          cst_icms: produto.cst_icms,
          cst_ipi: produto.cst_ipi,
          cst_pis: produto.cst_pis,
          cst_cofins: produto.cst_cofins,
          unidade_comercial: produto.unidade_comercial,
          unidade_tributaria: produto.unidade_tributaria,
          preco_custo: produto.preco_custo,
          preco_venda: produto.preco_venda,
          margem_lucro: produto.margem_lucro,
          aliquota_icms: produto.aliquota_icms,
          aliquota_ipi: produto.aliquota_ipi,
          aliquota_pis: produto.aliquota_pis,
          aliquota_cofins: produto.aliquota_cofins,
          estoque_minimo: produto.estoque_minimo,
          estoque_maximo: produto.estoque_maximo,
          estoque_atual: produto.estoque_atual,
          controlado: produto.controlado,
          requer_receita: produto.requer_receita,
          produto_manipulado: produto.produto_manipulado,
          produto_revenda: produto.produto_revenda,
          ativo: produto.ativo !== undefined ? produto.ativo : true
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
      const produto = await req.json() as Produto;
      
      // Remove id do objeto de atualização
      if (produto.id) delete produto.id;
      
      // Atualizar produto
      const { data, error } = await supabaseClient
        .from('produto')
        .update({
          codigo_interno: produto.codigo_interno,
          codigo_ean: produto.codigo_ean,
          nome: produto.nome,
          descricao: produto.descricao,
          categoria_produto_id: produto.categoria_produto_id,
          forma_farmaceutica_id: produto.forma_farmaceutica_id,
          fornecedor_id: produto.fornecedor_id,
          ncm: produto.ncm,
          cfop: produto.cfop,
          origem: produto.origem,
          cst_icms: produto.cst_icms,
          cst_ipi: produto.cst_ipi,
          cst_pis: produto.cst_pis,
          cst_cofins: produto.cst_cofins,
          unidade_comercial: produto.unidade_comercial,
          unidade_tributaria: produto.unidade_tributaria,
          preco_custo: produto.preco_custo,
          preco_venda: produto.preco_venda,
          margem_lucro: produto.margem_lucro,
          aliquota_icms: produto.aliquota_icms,
          aliquota_ipi: produto.aliquota_ipi,
          aliquota_pis: produto.aliquota_pis,
          aliquota_cofins: produto.aliquota_cofins,
          estoque_minimo: produto.estoque_minimo,
          estoque_maximo: produto.estoque_maximo,
          estoque_atual: produto.estoque_atual,
          controlado: produto.controlado,
          requer_receita: produto.requer_receita,
          produto_manipulado: produto.produto_manipulado,
          produto_revenda: produto.produto_revenda,
          ativo: produto.ativo
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
      // Em vez de excluir fisicamente, apenas inativa o produto
      const { data, error } = await supabaseClient
        .from('produto')
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
        JSON.stringify({ success: true, message: 'Produto inativado com sucesso', produto: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro na edge function gerenciar-produtos:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}) 