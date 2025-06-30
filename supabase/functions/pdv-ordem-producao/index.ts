import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  status?: string;
  limite?: number;
  offset?: number;
}

serve(async (req) => {
  // Pré-flight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Variáveis de ambiente obrigatórias
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const functionIndex = pathSegments.findIndex((p) => p === "pdv-ordem-producao");
    const subPath = functionIndex >= 0 ? pathSegments.slice(functionIndex + 1) : [];

    // Garante que valores vazios (""), undefined ou null virem "listar"
    const ação = subPath[0] || "listar";

    if (ação === "listar") {
      if (req.method !== "POST") {
        return new Response("Método não permitido", { status: 405, headers: corsHeaders });
      }

      const body: RequestBody = await req.json();
      const { status, limite = 100, offset = 0 } = body;

      // Buscar ordens de produção prontas para venda com dados completos
      let query = supabase
        .from('ordens_producao')
        .select(`
          id,
          numero_ordem,
          status,
          observacoes_gerais,
          data_criacao,
          data_finalizacao,
          prioridade,
          receita_id,
          usuario_responsavel_id,
          farmaceutico_responsavel_id,
          created_at,
          updated_at,
          receitas!receita_id (
            id,
            cliente_id,
            clientes!cliente_id (
              id,
              nome,
              cpf,
              cnpj
            )
          )
        `)
        .eq('status', 'pronta') // Apenas ordens prontas para venda
        .order('created_at', { ascending: false })
        .range(offset, offset + limite - 1);

      // Se um status específico foi solicitado, filtrar por ele
      if (status && status !== 'pronta') {
        query = query.eq('status', status);
      }

      const { data: ordens, error } = await query;

      if (error) throw error;

      // Para cada ordem, buscar os itens e calcular valor total
      const ordensComDetalhes = await Promise.all(
        (ordens || []).map(async (ordem) => {
          // Buscar itens da ordem
          const { data: itens, error: itensError } = await supabase
            .from('itens_ordem_producao')
            .select(`
              id,
              produto_id,
              quantidade_necessaria,
              quantidade_produzida,
              preco_unitario,
              preco_total,
              produtos!produto_id (
                id,
                nome,
                preco_venda
              )
            `)
            .eq('ordem_producao_id', ordem.id);

          if (itensError) {
            console.error('Erro ao buscar itens da ordem:', itensError);
          }

          // Calcular valor total da ordem
          const valorTotal = (itens || []).reduce((total, item) => {
            return total + (item.preco_total || (item.quantidade_produzida * item.preco_unitario) || 0);
          }, 0);

          // Formatar dados para o PDV
          const cliente = ordem.receitas?.clientes;
          
          return {
            id: ordem.id,
            numero_ordem: ordem.numero_ordem,
            cliente_id: cliente?.id || null,
            cliente_nome: cliente?.nome || 'Cliente não informado',
            valor_total: valorTotal,
            data_conclusao: ordem.data_finalizacao || ordem.updated_at,
            itens_count: (itens || []).length,
            itens: (itens || []).map(item => ({
              nome: item.produtos?.nome || 'Produto não encontrado',
              quantidade: item.quantidade_produzida || item.quantidade_necessaria,
              valor_unitario: item.preco_unitario || item.produtos?.preco_venda || 0,
              valor_total: item.preco_total || (item.quantidade_produzida * item.preco_unitario) || 0
            }))
          };
        })
      );

      return new Response(
        JSON.stringify({ success: true, data: ordensComDetalhes }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se subPath[0] não for "listar", assume que é o ID para buscar detalhes
    const ordemId = ação;

    if (!ordemId) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da ordem não informado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method !== "POST") {
      return new Response("Método não permitido", { status: 405, headers: corsHeaders });
    }

    // Buscar detalhes completos da ordem específica
    const { data: ordem, error: ordemError } = await supabase
      .from('ordens_producao')
      .select(`
        id,
        numero_ordem,
        status,
        observacoes_gerais,
        data_criacao,
        data_finalizacao,
        prioridade,
        receita_id,
        usuario_responsavel_id,
        farmaceutico_responsavel_id,
        created_at,
        updated_at,
        receitas!receita_id (
          id,
          cliente_id,
          clientes!cliente_id (
            id,
            nome,
            cpf,
            cnpj,
            telefone,
            email
          )
        )
      `)
      .eq('id', ordemId)
      .single();

    if (ordemError) throw ordemError;

    // Buscar itens da ordem
    const { data: itens, error: itensError } = await supabase
      .from('itens_ordem_producao')
      .select(`
        id,
        produto_id,
        quantidade_necessaria,
        quantidade_produzida,
        preco_unitario,
        preco_total,
        observacoes,
        produtos!produto_id (
          id,
          nome,
          preco_venda,
          categoria_id,
          categorias!categoria_id (
            nome
          )
        )
      `)
      .eq('ordem_producao_id', ordemId);

    if (itensError) throw itensError;

    // Calcular valor total
    const valorTotal = (itens || []).reduce((total, item) => {
      return total + (item.preco_total || (item.quantidade_produzida * item.preco_unitario) || 0);
    }, 0);

    // Formatar resposta completa
    const cliente = ordem.receitas?.clientes;
    const detalhesCompletos = {
      id: ordem.id,
      numero_ordem: ordem.numero_ordem,
      status: ordem.status,
      cliente: {
        id: cliente?.id || null,
        nome: cliente?.nome || 'Cliente não informado',
        documento: cliente?.cpf || cliente?.cnpj || null,
        telefone: cliente?.telefone || null,
        email: cliente?.email || null
      },
      valor_total: valorTotal,
      data_criacao: ordem.data_criacao,
      data_finalizacao: ordem.data_finalizacao,
      observacoes: ordem.observacoes_gerais,
      itens: (itens || []).map(item => ({
        id: item.id,
        nome: item.produtos?.nome || 'Produto não encontrado',
        categoria: item.produtos?.categorias?.nome || 'Sem categoria',
        quantidade_necessaria: item.quantidade_necessaria,
        quantidade_produzida: item.quantidade_produzida,
        quantidade: item.quantidade_produzida || item.quantidade_necessaria,
        valor_unitario: item.preco_unitario || item.produtos?.preco_venda || 0,
        valor_total: item.preco_total || (item.quantidade_produzida * item.preco_unitario) || 0,
        observacoes: item.observacoes
      }))
    };

    return new Response(
      JSON.stringify({ success: true, data: detalhesCompletos }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na Edge Function pdv-ordem-producao:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}); 