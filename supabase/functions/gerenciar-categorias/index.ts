import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    
    // Get request data
    const { method, path } = req.url.split('/').slice(-2);
    const id = path || null;
    
    // GET method handler
    if (req.method === 'GET') {
      // If ID is provided, get specific category
      if (id && id !== 'gerenciar-categorias') {
        const { data, error } = await supabaseClient
          .from('categoria_produto')
          .select('*')
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
      
      // Otherwise, list all categories
      const { data, error } = await supabaseClient
        .from('categoria_produto')
        .select('*')
        .order('nome', { ascending: true });
        
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // POST method handler (create)
    if (req.method === 'POST') {
      const input = await req.json();
      
      // Validate input
      if (!input.nome) {
        return new Response(
          JSON.stringify({ error: 'Nome da categoria é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Insert new category
      const { data, error } = await supabaseClient
        .from('categoria_produto')
        .insert([
          {
            nome: input.nome,
            descricao: input.descricao,
            codigo: input.codigo,
            ativo: input.ativo !== undefined ? input.ativo : true
          }
        ])
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
      const input = await req.json();
      
      // Update category
      const { data, error } = await supabaseClient
        .from('categoria_produto')
        .update({
          nome: input.nome,
          descricao: input.descricao,
          codigo: input.codigo,
          ativo: input.ativo
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
      const { error } = await supabaseClient
        .from('categoria_produto')
        .delete()
        .eq('id', id);
        
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Categoria removida com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}) 