import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      receita_id,
      cliente_nome,
      cliente_documento,
      observacoes,
      medicamentos = [],
    } = body ?? {};

    if (!receita_id) {
      return new Response(
        JSON.stringify({ success: false, error: "receita_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // Identificar usuário autenticado
    let created_by_user_id: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) created_by_user_id = userData.user.id;
    }

    // 1. Inserir ordem de produção --------------------------------------
    const { data: ordem, error: ordemError } = await supabase
      .from("ordens_producao")
      .insert({
        receita_processada_id: receita_id,
        cliente_nome: cliente_nome ?? null,
        cliente_documento: cliente_documento ?? null,
        observacoes_gerais: observacoes ?? null,
        status: "PENDENTE",
        created_by_user_id,
      })
      .select("id")
      .single();

    if (ordemError) throw ordemError;

    // 2. Inserir medicamentos (quando houver) ---------------------------
    if (Array.isArray(medicamentos) && medicamentos.length > 0) {
      const medsData = medicamentos.map((m: any) => ({
        ordem_producao_id: ordem.id,
        nome: m.nome,
        forma_farmaceutica: m.forma_farmaceutica,
        quantidade: m.quantidade,
        unidade: m.unidade,
        valor_unitario: m.valor_unitario ?? 0,
        instrucoes_uso: m.instrucoes_uso ?? null,
      }));

      const { error: medsError } = await supabase
        .from("ordem_producao_medicamentos")
        .insert(medsData);

      if (medsError) throw medsError;
    }

    return new Response(
      JSON.stringify({ success: true, data: { id: ordem.id } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("gerenciar-ordens-producao/criar – erro:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message ?? "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
}); 