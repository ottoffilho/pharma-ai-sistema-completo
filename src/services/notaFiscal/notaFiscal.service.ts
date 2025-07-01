// =====================================================
// SERVIÇO PRINCIPAL DE NOTA FISCAL - PHARMA.AI
// Módulo M10 - Fiscal
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import { TABLES, formatSupabaseError } from '../supabase';
import logger from '@/lib/logger';
import type {
  NotaFiscal,
  NotaFiscalCompleta,
  CreateNotaFiscal,
  UpdateNotaFiscal,
  ItemNotaFiscal,
  CreateItemNotaFiscal,
  FiltrosNotaFiscal,
  PaginationParams,
  PaginatedResponse,
  UUID
} from '../../types/database';

// =====================================================
// CRUD BÁSICO DE NOTAS FISCAIS
// =====================================================

/**
 * Busca notas fiscais com filtros e paginação
 */
export const buscarNotasFiscais = async (
  filtros: FiltrosNotaFiscal = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<any>> => {
  try {
    const {
      page = 1,
      limit = 50,
      orderBy = 'data_emissao',
      orderDirection = 'desc'
    } = pagination;

    const offset = (page - 1) * limit;

    // Query base com relacionamentos
    let query = supabase
      .from(TABLES.NOTA_FISCAL)
      .select(`
        *,
        fornecedor:fornecedor_id(
          id, 
          cnpj, 
          razao_social, 
          nome_fantasia,
          cidade,
          uf
        )
      `);

    // Aplicar filtros
    if (filtros.fornecedor_id) {
      query = query.eq('fornecedor_id', filtros.fornecedor_id);
    }

    if (filtros.data_emissao_inicio) {
      query = query.gte('data_emissao', filtros.data_emissao_inicio);
    }

    if (filtros.data_emissao_fim) {
      query = query.lte('data_emissao', filtros.data_emissao_fim);
    }

    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }

    if (filtros.numero_nf) {
      query = query.eq('numero_nf', filtros.numero_nf);
    }

    if (filtros.chave_acesso) {
      query = query.eq('chave_acesso', filtros.chave_acesso);
    }

    // Contar total de registros
    const { count } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .select('*', { count: 'exact', head: true });

    // Aplicar ordenação e paginação
    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Erro ao buscar notas fiscais:', error);
    throw error;
  }
};

/**
 * Busca nota fiscal por ID com todos os relacionamentos
 */
export const buscarNotaFiscalPorId = async (id: UUID): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .select(`
        *,
        fornecedor:fornecedor_id(*),
        itens:itens_nota_fiscal(
          *,
          produto:produto_id(
            id,
            codigo_interno,
            nome,
            unidade_comercial,
            categoria_produto:categoria_produto_id(nome),
            forma_farmaceutica:forma_farmaceutica_id(nome, sigla)
          ),
          lote:lote_id(
            id,
            numero_lote,
            data_fabricacao,
            data_validade,
            quantidade_atual
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Nota fiscal não encontrada
      }
      throw new Error(formatSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar nota fiscal por ID:', error);
    throw error;
  }
};

/**
 * Busca nota fiscal por chave de acesso
 */
export const buscarNotaFiscalPorChave = async (chaveAcesso: string): Promise<any> => {
  try {
    logger.database('Buscando nota fiscal por chave', { chave: chaveAcesso });

    const { data, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .select('*')
      .eq('chave_acesso', chaveAcesso)
      .maybeSingle();

    if (error) {
      logger.error('Erro ao buscar nota fiscal por chave', error);
      return null;
    }

    logger.database(data ? 'Nota fiscal encontrada' : 'Nota fiscal não encontrada', { numeroNF: data?.numero_nf });
    return data;
  } catch (error) {
    logger.error('Erro no serviço de busca por chave', error);
    return null;
  }
};

/**
 * Cria uma nova nota fiscal
 */
export const criarNotaFiscal = async (notaFiscal: CreateNotaFiscal): Promise<any> => {
  try {
    // Validar se chave de acesso já existe
    const notaExistente = await buscarNotaFiscalPorChave(notaFiscal.chave_acesso);
    if (notaExistente) {
      throw new Error(`Nota fiscal com chave "${notaFiscal.chave_acesso}" já existe`);
    }

    const { data, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .insert(notaFiscal)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar nota fiscal:', error);
    throw error;
  }
};

/**
 * Atualiza uma nota fiscal existente
 */
export const atualizarNotaFiscal = async (notaFiscal: UpdateNotaFiscal): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .update(notaFiscal)
      .eq('id', notaFiscal.id)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar nota fiscal:', error);
    throw error;
  }
};

// =====================================================
// GERENCIAMENTO DE ITENS DA NOTA FISCAL
// =====================================================

/**
 * Busca itens de uma nota fiscal
 */
export const buscarItensNotaFiscal = async (notaFiscalId: UUID): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ITEM_NOTA_FISCAL)
      .select(`
        *,
        produto:produto_id(
          id,
          codigo_interno,
          nome,
          unidade_comercial
        ),
        lote:lote_id(
          id,
          numero_lote,
          data_validade
        )
      `)
      .eq('nota_fiscal_id', notaFiscalId)
      .order('numero_item');

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar itens da nota fiscal:', error);
    throw error;
  }
};

/**
 * Cria um item da nota fiscal
 */
export const criarItemNotaFiscal = async (item: CreateItemNotaFiscal): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ITEM_NOTA_FISCAL)
      .insert(item)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar item da nota fiscal:', error);
    throw error;
  }
}; 