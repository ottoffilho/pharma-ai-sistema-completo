// =====================================================
// SERVIÇO DE MOVIMENTAÇÃO DE ESTOQUE - PHARMA.AI
// Módulo M02 - Estoque
// =====================================================

import supabase, { formatSupabaseError } from './supabase';
import type { 
  EstoqueMovimentacao, 
  CreateEstoqueMovimentacao, 
  UpdateEstoqueMovimentacao,
  UUID 
} from '../types/database';

/**
 * Registra uma movimentação de estoque
 */
export const registrarMovimentacao = async (
  movimentacao: CreateEstoqueMovimentacao
): Promise<EstoqueMovimentacao> => {
  try {
    const { data, error } = await supabase
      .from('estoque_movimentacao')
      .insert(movimentacao)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    throw error;
  }
};

/**
 * Busca movimentações por produto
 */
export const buscarMovimentacoesPorProduto = async (
  produtoId: UUID,
  limite?: number
): Promise<EstoqueMovimentacao[]> => {
  try {
    let query = supabase
      .from('estoque_movimentacao')
      .select('*')
      .eq('produto_id', produtoId)
      .order('created_at', { ascending: false });

    if (limite) {
      query = query.limit(limite);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar movimentações por produto:', error);
    throw error;
  }
};

/**
 * Busca movimentações por período
 */
export const buscarMovimentacoesPorPeriodo = async (
  dataInicio: string,
  dataFim: string,
  tipo?: 'entrada' | 'saida' | 'ajuste'
): Promise<EstoqueMovimentacao[]> => {
  try {
    let query = supabase
      .from('estoque_movimentacao')
      .select('*')
      .gte('created_at', dataInicio)
      .lte('created_at', dataFim)
      .order('created_at', { ascending: false });

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar movimentações por período:', error);
    throw error;
  }
};

/**
 * Calcula total de movimentações por tipo
 */
export const calcularTotalMovimentacoes = async (
  produtoId: UUID,
  tipo: 'entrada' | 'saida' | 'ajuste',
  dataInicio?: string
): Promise<number> => {
  try {
    let query = supabase
      .from('estoque_movimentacao')
      .select('quantidade')
      .eq('produto_id', produtoId)
      .eq('tipo', tipo);

    if (dataInicio) {
      query = query.gte('created_at', dataInicio);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return (data || []).reduce((total, mov) => total + mov.quantidade, 0);
  } catch (error) {
    console.error('Erro ao calcular total de movimentações:', error);
    throw error;
  }
};

/**
 * Registra entrada de estoque
 */
export const registrarEntrada = async (
  produtoId: UUID,
  quantidade: number,
  quantidadeAnterior: number,
  motivo?: string,
  documentoReferencia?: string,
  usuarioId?: UUID
): Promise<EstoqueMovimentacao> => {
  const movimentacao: CreateEstoqueMovimentacao = {
    produto_id: produtoId,
    tipo: 'entrada',
    quantidade,
    quantidade_anterior: quantidadeAnterior,
    quantidade_nova: quantidadeAnterior + quantidade,
    motivo,
    documento_referencia: documentoReferencia,
    usuario_id: usuarioId
  };

  return await registrarMovimentacao(movimentacao);
};

/**
 * Registra saída de estoque
 */
export const registrarSaida = async (
  produtoId: UUID,
  quantidade: number,
  quantidadeAnterior: number,
  motivo?: string,
  documentoReferencia?: string,
  usuarioId?: UUID
): Promise<EstoqueMovimentacao> => {
  const movimentacao: CreateEstoqueMovimentacao = {
    produto_id: produtoId,
    tipo: 'saida',
    quantidade,
    quantidade_anterior: quantidadeAnterior,
    quantidade_nova: quantidadeAnterior - quantidade,
    motivo,
    documento_referencia: documentoReferencia,
    usuario_id: usuarioId
  };

  return await registrarMovimentacao(movimentacao);
};

/**
 * Registra ajuste de estoque
 */
export const registrarAjuste = async (
  produtoId: UUID,
  quantidadeNova: number,
  quantidadeAnterior: number,
  motivo?: string,
  usuarioId?: UUID
): Promise<EstoqueMovimentacao> => {
  const quantidade = quantidadeNova - quantidadeAnterior;
  
  const movimentacao: CreateEstoqueMovimentacao = {
    produto_id: produtoId,
    tipo: 'ajuste',
    quantidade: Math.abs(quantidade),
    quantidade_anterior: quantidadeAnterior,
    quantidade_nova: quantidadeNova,
    motivo,
    usuario_id: usuarioId
  };

  return await registrarMovimentacao(movimentacao);
};

// Exportar todos os métodos
export default {
  registrarMovimentacao,
  buscarMovimentacoesPorProduto,
  buscarMovimentacoesPorPeriodo,
  calcularTotalMovimentacoes,
  registrarEntrada,
  registrarSaida,
  registrarAjuste
}; 