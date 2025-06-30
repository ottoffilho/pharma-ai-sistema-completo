import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Edge Function: verificar-estoque-receita
 * ----------------------------------------------------
 * Recebe lista de medicamentos (produto_id e quantidade necessária)
 * e retorna se há estoque suficiente em todos os itens.
 *
 * Request body (JSON):
 * {
 *   "medicamentos": [
 *     { "produto_id": "uuid", "quantidade": 2 },
 *     ...
 *   ]
 * }
 *
 * Resposta 200 OK:
 *  ✔ Quando há estoque
 *    { "success": true, "ok": true }
 *  ✘ Quando falta estoque
 *    {
 *      "success": true,
 *      "ok": false,
 *      "faltantes": [
 *        { "id": "uuid", "nome": "Produto X", "necessario": 5, "disponivel": 2 }
 *      ]
 *    }
 * ----------------------------------------------------
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json();
    const medicamentos = Array.isArray(body?.medicamentos) ? body.medicamentos : [];

    // Validação básica ------------------------------------------------------
    if (medicamentos.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Lista de medicamentos vazia ou inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    for (const m of medicamentos) {
      if (!m?.produto_id || typeof m.quantidade !== "number" || m.quantidade <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: "Medicamentos devem conter produto_id e quantidade > 0" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Setup Supabase client --------------------------------------------------
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // Buscar todos produtos relevantes (por ID ou nome)
    // 1) IDs fornecidos
    const produtosPorId = medicamentos.filter((m: any) => m.produto_id).map((m: any) => m.produto_id);

    let produtos: any[] = [];

    if (produtosPorId.length > 0) {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, estoque_atual")
        .in("id", produtosPorId);
      if (error) throw error;
      produtos = data;
    }

    // 2) Itens sem ID: fazer busca por nome exato
    for (const item of medicamentos) {
      if (!item.produto_id && item.nome) {
        const { data, error } = await supabase
          .from("produtos")
          .select("id, nome, estoque_atual")
          .ilike("nome", item.nome)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          produtos.push(data);
          item.produto_id = data.id; // preencher para validação
        }
      }
    }

    // Mapear estoque por id
    const estoqueMap: Record<string, { nome: string; estoque_atual: number }> = {};
    for (const p of produtos) {
      estoqueMap[p.id] = { nome: p.nome, estoque_atual: p.estoque_atual };
    }

    const faltantes = medicamentos.reduce((acc: any[], item: any) => {
      const produtoInfo = estoqueMap[item.produto_id];
      if (!produtoInfo) {
        acc.push({ id: item.produto_id ?? '', nome: item.nome ?? 'Produto não encontrado', necessario: item.quantidade, disponivel: 0 });
        return acc;
      }
      if (produtoInfo.estoque_atual < item.quantidade) {
        acc.push({ id: item.produto_id, nome: produtoInfo.nome, necessario: item.quantidade, disponivel: produtoInfo.estoque_atual });
      }
      return acc;
    }, [] as any[]);

    const ok = faltantes.length === 0;

    return new Response(
      JSON.stringify({ success: true, ok, ...(ok ? {} : { faltantes }) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verificar-estoque-receita – erro:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message ?? "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
}); 