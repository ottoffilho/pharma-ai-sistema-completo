import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface UnidadeMedida {
  id?: string;
  codigo: string;
  descricao: string;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Supabase client (service role)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const endpoint = segments[segments.length - 1];
  let id: string | null = null;
  if (endpoint && endpoint !== 'gerenciar-unidades-medida' && endpoint.match(/^[0-9a-f-]{36}$/)) {
    id = endpoint;
  }

  try {
    // LISTAR ==============================================================
    if (req.method === 'GET') {
      if (id) {
        const { data, error } = await supabase
          .from('unidades_medida')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('*')
        .order('codigo', { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // CRIAR ===============================================================
    if (req.method === 'POST') {
      const body = (await req.json()) as UnidadeMedida;
      if (!body.codigo || !body.descricao) {
        return new Response(JSON.stringify({ error: 'codigo e descricao são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data, error } = await supabase
        .from('unidades_medida')
        .insert([{ codigo: body.codigo, descricao: body.descricao }])
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 });
    }

    // ATUALIZAR ===========================================================
    if (req.method === 'PUT' && id) {
      const body = (await req.json()) as UnidadeMedida;
      const { data, error } = await supabase
        .from('unidades_medida')
        .update({ codigo: body.codigo, descricao: body.descricao, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // DELETAR =============================================================
    if (req.method === 'DELETE' && id) {
      const { error } = await supabase.from('unidades_medida').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Método não suportado ou ID inválido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 