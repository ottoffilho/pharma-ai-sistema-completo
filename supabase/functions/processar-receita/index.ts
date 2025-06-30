import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helpers ---------------------------------------------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Pré-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { raw_recipe_id, extracted_data, validation_notes } = await req.json();

    if (!raw_recipe_id || !extracted_data) {
      return new Response(
        JSON.stringify({ success: false, error: "Parâmetros obrigatórios ausentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // Tentar identificar usuário autenticado (caso token presente)
    let processed_by_user_id: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) processed_by_user_id = userData.user.id;
    }

    // Ajustar raw_recipe_id se for modo manual (prefixo "manual-")
    const rawRecipeIdDb = typeof raw_recipe_id === "string" && raw_recipe_id.startsWith("manual-")
      ? null
      : raw_recipe_id;

    // Inserir na tabela receitas_processadas ---------------------------
    const insertData: Record<string, unknown> = {
        processed_by_user_id: processed_by_user_id,
        medications: extracted_data.medications,
        patient_name: extracted_data.patient_name ?? null,
        patient_dob: extracted_data.patient_dob ?? null,
        prescriber_name: extracted_data.prescriber_name ?? null,
        prescriber_identifier: extracted_data.prescriber_identifier ?? null,
        validation_status: "validated",
        validation_notes: validation_notes ?? "",
    };
    if (rawRecipeIdDb) insertData.raw_recipe_id = rawRecipeIdDb;

    const { data: recipe, error } = await supabase
      .from("receitas_processadas")
      .insert(insertData)
      .select("id")
      .single();

    if (error) throw error;

    // Atualizar status da receita bruta --------------------------------
    if (rawRecipeIdDb) {
      await supabase
        .from("receitas_brutas")
        .update({ processing_status: "processed" })
        .eq("id", rawRecipeIdDb);
    }

    return new Response(
      JSON.stringify({ success: true, recipe_id: recipe.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("processar-receita – erro:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message ?? "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
}); 