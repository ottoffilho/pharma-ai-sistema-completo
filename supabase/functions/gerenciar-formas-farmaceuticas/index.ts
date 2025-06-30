import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

interface Database {
  public: {
    Tables: {
      formas_farmaceuticas: {
        Row: {
          id: string;
          nome: string;
          abreviatura: string | null;
          tipo_uso: string | null;
          descricao: string | null;
          desconto_maximo: number;
          valor_minimo: number;
          rotulo_config: any;
          ativo: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          abreviatura?: string | null;
          tipo_uso?: string | null;
          descricao?: string | null;
          desconto_maximo?: number;
          valor_minimo?: number;
          rotulo_config?: any;
          ativo?: boolean;
          created_by?: string | null;
        };
        Update: {
          nome?: string;
          abreviatura?: string | null;
          tipo_uso?: string | null;
          descricao?: string | null;
          desconto_maximo?: number;
          valor_minimo?: number;
          rotulo_config?: any;
          ativo?: boolean;
        };
      };
      forma_processos: {
        Row: {
          id: string;
          forma_id: string;
          ordem: number;
          nome_processo: string;
          tipo_processo: 'PRODUCAO' | 'QUALIDADE' | 'LOGISTICA';
          ponto_controle: boolean;
          tempo_estimado_min: number | null;
          instrucoes: string | null;
          equipamentos_necessarios: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          forma_id: string;
          ordem: number;
          nome_processo: string;
          tipo_processo: 'PRODUCAO' | 'QUALIDADE' | 'LOGISTICA';
          ponto_controle?: boolean;
          tempo_estimado_min?: number | null;
          instrucoes?: string | null;
          equipamentos_necessarios?: string[] | null;
        };
        Update: {
          ordem?: number;
          nome_processo?: string;
          tipo_processo?: 'PRODUCAO' | 'QUALIDADE' | 'LOGISTICA';
          ponto_controle?: boolean;
          tempo_estimado_min?: number | null;
          instrucoes?: string | null;
          equipamentos_necessarios?: string[] | null;
        };
      };
    };
  };
}

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    global: {
      headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
    },
  }
);

// Schemas de validação
const criarFormaSchema = {
  nome: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  abreviatura: { required: false, type: 'string', maxLength: 10 },
  tipo_uso: { required: false, type: 'string', maxLength: 50 },
  descricao: { required: false, type: 'string' },
  desconto_maximo: { required: false, type: 'number', min: 0, max: 100 },
  valor_minimo: { required: false, type: 'number', min: 0 },
  rotulo_config: { required: false, type: 'object' },
  ativo: { required: false, type: 'boolean' }
};

const criarProcessoSchema = {
  forma_id: { required: true, type: 'string' },
  ordem: { required: true, type: 'number', min: 1 },
  nome_processo: { required: true, type: 'string', minLength: 2 },
  tipo_processo: { required: true, type: 'string', enum: ['PRODUCAO', 'QUALIDADE', 'LOGISTICA'] },
  ponto_controle: { required: false, type: 'boolean' },
  tempo_estimado_min: { required: false, type: 'number', min: 0 },
  instrucoes: { required: false, type: 'string' },
  equipamentos_necessarios: { required: false, type: 'array' }
};

function validateData(data: any, schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const fieldRules = rules as any;

    // Verificar se campo obrigatório está presente
    if (fieldRules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Campo '${field}' é obrigatório`);
      continue;
    }

    // Pular validação se campo não é obrigatório e está vazio
    if (!fieldRules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Validar tipo
    if (fieldRules.type === 'string' && typeof value !== 'string') {
      errors.push(`Campo '${field}' deve ser uma string`);
    } else if (fieldRules.type === 'number' && typeof value !== 'number') {
      errors.push(`Campo '${field}' deve ser um número`);
    } else if (fieldRules.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Campo '${field}' deve ser um boolean`);
    } else if (fieldRules.type === 'object' && typeof value !== 'object') {
      errors.push(`Campo '${field}' deve ser um objeto`);
    } else if (fieldRules.type === 'array' && !Array.isArray(value)) {
      errors.push(`Campo '${field}' deve ser um array`);
    }

    // Validar comprimento mínimo e máximo para strings
    if (fieldRules.type === 'string' && typeof value === 'string') {
      if (fieldRules.minLength && value.length < fieldRules.minLength) {
        errors.push(`Campo '${field}' deve ter pelo menos ${fieldRules.minLength} caracteres`);
      }
      if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
        errors.push(`Campo '${field}' pode ter no máximo ${fieldRules.maxLength} caracteres`);
      }
    }

    // Validar valores mínimo e máximo para números
    if (fieldRules.type === 'number' && typeof value === 'number') {
      if (fieldRules.min !== undefined && value < fieldRules.min) {
        errors.push(`Campo '${field}' deve ser maior ou igual a ${fieldRules.min}`);
      }
      if (fieldRules.max !== undefined && value > fieldRules.max) {
        errors.push(`Campo '${field}' deve ser menor ou igual a ${fieldRules.max}`);
      }
    }

    // Validar enum
    if (fieldRules.enum && !fieldRules.enum.includes(value)) {
      errors.push(`Campo '${field}' deve ser um dos valores: ${fieldRules.enum.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { method } = req;
    const url = new URL(req.url);
    const rawSegments = url.pathname.split('/').filter(Boolean);
    const fnIndex = rawSegments.findIndex(seg => seg === 'gerenciar-formas-farmaceuticas');
    const pathSegments = fnIndex >= 0 ? rawSegments.slice(fnIndex + 1) : [];
    
    // Verificar autenticação
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Token de autorização necessário" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Roteamento baseado no método e path
    switch (method) {
      case "GET":
        // GET na raiz da função agora lista tudo
        if (pathSegments.length === 0) {
          return await listarFormasFarmaceuticas(url.searchParams);
        }
        // Manter a rota /listar para retrocompatibilidade, se necessário
        if (pathSegments.length === 1 && pathSegments[0] === "listar") {
          return await listarFormasFarmaceuticas(url.searchParams);
        } else if (pathSegments.length === 2 && pathSegments[0] === "forma" && pathSegments[1]) {
          return await obterFormaFarmaceutica(pathSegments[1]);
        } else if (pathSegments.length === 3 && pathSegments[0] === "forma" && pathSegments[1] && pathSegments[2] === "processos") {
          return await listarProcessosForma(pathSegments[1]);
        }
        break;

      case "POST":
        if (pathSegments.length === 1 && pathSegments[0] === "criar") {
          const body = await req.json();
          return await criarFormaFarmaceutica(body, user.id);
        } else if (pathSegments.length === 2 && pathSegments[0] === "processos" && pathSegments[1] === "criar") {
          const body = await req.json();
          return await criarProcesso(body);
        }
        break;

      case "PUT":
        if (pathSegments.length === 2 && pathSegments[0] === "atualizar" && pathSegments[1]) {
          const body = await req.json();
          return await atualizarFormaFarmaceutica(pathSegments[1], body);
        } else if (pathSegments.length === 3 && pathSegments[0] === "processos" && pathSegments[1] === "atualizar" && pathSegments[2]) {
          const body = await req.json();
          return await atualizarProcesso(pathSegments[2], body);
        }
        break;

      case "DELETE":
        if (pathSegments.length === 2 && pathSegments[0] === "excluir" && pathSegments[1]) {
          return await excluirFormaFarmaceutica(pathSegments[1]);
        } else if (pathSegments.length === 3 && pathSegments[0] === "processos" && pathSegments[1] === "excluir" && pathSegments[2]) {
          return await excluirProcesso(pathSegments[2]);
        }
        break;
    }

    return new Response(
      JSON.stringify({ error: "Endpoint não encontrado" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na função gerenciar-formas-farmaceuticas:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function listarFormasFarmaceuticas(searchParams: URLSearchParams) {
  const ativo = searchParams.get('ativo');
  const busca = searchParams.get('busca');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('formas_farmaceuticas')
      .select('*', { count: 'exact' })
      .order('nome', { ascending: true })
      .range(offset, offset + limit - 1);

    // Filtrar por status ativo
    if (ativo !== null) {
      query = query.eq('ativo', ativo === 'true');
    }

    // Busca por nome ou abreviatura
    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,abreviatura.ilike.%${busca}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao listar formas farmacêuticas:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao listar formas farmacêuticas", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function obterFormaFarmaceutica(id: string) {
  try {
    const { data, error } = await supabase
      .from('formas_farmaceuticas')
      .select(`
        *,
        forma_processos (
          id,
          ordem,
          nome_processo,
          tipo_processo,
          ponto_controle,
          tempo_estimado_min,
          instrucoes,
          equipamentos_necessarios
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Forma farmacêutica não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ordenar processos por ordem
    if (data.forma_processos) {
      data.forma_processos.sort((a: any, b: any) => a.ordem - b.ordem);
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao obter forma farmacêutica:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao obter forma farmacêutica", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function criarFormaFarmaceutica(body: any, userId: string) {
  const validation = validateData(body, criarFormaSchema);
  
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ error: "Dados inválidos", details: validation.errors }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Verificar se já existe forma com mesmo nome
    const { data: existingForma } = await supabase
      .from('formas_farmaceuticas')
      .select('id')
      .eq('nome', body.nome)
      .single();

    if (existingForma) {
      return new Response(
        JSON.stringify({ error: "Já existe uma forma farmacêutica com este nome" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se usuário existe na tabela usuarios (pode não existir em dev/local)
    let createdBy: string | null = null;
    const { data: usuarioExists } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .single();

    if (usuarioExists) {
      createdBy = userId;
    }

    const formaData = {
      ...body,
      created_by: createdBy,
      rotulo_config: body.rotulo_config || {}
    };

    const { data, error } = await supabase
      .from('formas_farmaceuticas')
      .insert(formaData)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao criar forma farmacêutica:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao criar forma farmacêutica", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function atualizarFormaFarmaceutica(id: string, body: any) {
  // Remover campos que não devem ser atualizados
  const { created_by, created_at, ...updateData } = body;

  try {
    // Verificar se a forma existe
    const { data: existingForma } = await supabase
      .from('formas_farmaceuticas')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingForma) {
      return new Response(
        JSON.stringify({ error: "Forma farmacêutica não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o nome não conflita com outra forma
    if (updateData.nome) {
      const { data: conflictForma } = await supabase
        .from('formas_farmaceuticas')
        .select('id')
        .eq('nome', updateData.nome)
        .neq('id', id)
        .single();

      if (conflictForma) {
        return new Response(
          JSON.stringify({ error: "Já existe uma forma farmacêutica com este nome" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { data, error } = await supabase
      .from('formas_farmaceuticas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao atualizar forma farmacêutica:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao atualizar forma farmacêutica", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function excluirFormaFarmaceutica(id: string) {
  try {
    // Soft delete - marcar como inativo
    const { data, error } = await supabase
      .from('formas_farmaceuticas')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Forma farmacêutica não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Forma farmacêutica desativada com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao excluir forma farmacêutica:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao excluir forma farmacêutica", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function listarProcessosForma(formaId: string) {
  try {
    const { data, error } = await supabase
      .from('forma_processos')
      .select('*')
      .eq('forma_id', formaId)
      .order('ordem', { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao listar processos:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao listar processos", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function criarProcesso(body: any) {
  const validation = validateData(body, criarProcessoSchema);
  
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ error: "Dados inválidos", details: validation.errors }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { data, error } = await supabase
      .from('forma_processos')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao criar processo:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao criar processo", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function atualizarProcesso(id: string, body: any) {
  try {
    const { data, error } = await supabase
      .from('forma_processos')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Processo não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao atualizar processo:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao atualizar processo", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function excluirProcesso(id: string) {
  try {
    const { data, error } = await supabase
      .from('forma_processos')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Processo não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Processo excluído com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao excluir processo:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao excluir processo", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
} 