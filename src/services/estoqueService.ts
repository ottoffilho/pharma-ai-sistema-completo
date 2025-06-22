// =====================================================
// SERVIÇO DE ESTOQUE - PHARMA.AI
// Módulo M02 - Estoque
// =====================================================

import supabase, { formatSupabaseError } from './supabase';
import type { EstatisticasEstoque, Produto, ProdutoCompleto, UUID } from '../types/database';

/**
 * Obtém estatísticas gerais do estoque
 */
export const buscarEstatisticasEstoque = async (): Promise<EstatisticasEstoque> => {
  try {
    // 1. Buscar produtos e seus estoques
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        estoque_atual,
        estoque_minimo,
        custo_unitario,
        controlado,
        lotes:lote(id, data_validade)
      `)
      .eq('ativo', true);

    if (produtosError) {
      throw new Error(formatSupabaseError(produtosError));
    }

    const hoje = new Date();
    const trintaDiasDepois = new Date();
    trintaDiasDepois.setDate(hoje.getDate() + 30);

    // 2. Calcular métricas
    let valorTotalEstoque = 0;
    let produtosEstoqueBaixo = 0;
    let produtosVencimentoProximo = 0;
    let produtosControlados = 0;

    (produtos || []).forEach((produto: {
      id: string;
      nome: string;
      estoque_atual: number;
      estoque_minimo: number;
      custo_unitario: number;
      controlado: boolean;
      lotes?: Array<{
        id: string;
        data_validade: string | null;
      }>;
    }) => {
      // Valor total do estoque
      valorTotalEstoque += (produto.estoque_atual || 0) * (produto.custo_unitario || 0);
      
      // Produtos com estoque abaixo do mínimo
      if (produto.estoque_atual <= produto.estoque_minimo) {
        produtosEstoqueBaixo++;
      }
      
      // Produtos controlados
      if (produto.controlado) {
        produtosControlados++;
      }
      
      // Produtos com lotes próximos do vencimento
      if (produto.lotes && Array.isArray(produto.lotes)) {
        const temLoteVencendo = produto.lotes.some((lote: {
          id: string;
          data_validade: string | null;
        }) => {
          if (!lote.data_validade) return false;
          
          const dataValidade = new Date(lote.data_validade);
          return dataValidade <= trintaDiasDepois && dataValidade >= hoje;
        });
        
        if (temLoteVencendo) {
          produtosVencimentoProximo++;
        }
      }
    });

    // 3. Retornar resultado
    return {
      total_produtos: produtos?.length || 0,
      produtos_estoque_baixo: produtosEstoqueBaixo,
      produtos_vencimento_proximo: produtosVencimentoProximo,
      valor_total_estoque: valorTotalEstoque,
      produtos_controlados: produtosControlados
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do estoque:', error);
    throw error;
  }
};

/**
 * Calcula o giro de estoque baseado nas movimentações dos últimos 12 meses
 */
export const calcularGiroEstoque = async (): Promise<number> => {
  try {
    // Data de 12 meses atrás
    const dataInicio = new Date();
    dataInicio.setFullYear(dataInicio.getFullYear() - 1);

    // Verificar se a tabela estoque_movimentacao existe
    const { data: movimentacoes, error: movimentacoesError } = await supabase
      .from('estoque_movimentacao')
      .select('quantidade, produto_id')
      .eq('tipo', 'saida')
      .gte('created_at', dataInicio.toISOString())
      .limit(1);

    // Se a tabela não existir, retornar valor padrão
    if (movimentacoesError && movimentacoesError.code === '42P01') {
      console.log('⚠️ Tabela estoque_movimentacao não existe ainda. Retornando giro padrão.');
      return 0.5; // Valor padrão para giro de estoque
    }

    if (movimentacoesError) {
      throw new Error(formatSupabaseError(movimentacoesError));
    }

    // Buscar todas as movimentações de saída dos últimos 12 meses
    const { data: todasMovimentacoes, error: todasError } = await supabase
      .from('estoque_movimentacao')
      .select('quantidade, produto_id')
      .eq('tipo', 'saida')
      .gte('created_at', dataInicio.toISOString());

    if (todasError) {
      throw new Error(formatSupabaseError(todasError));
    }

    // Calcular total vendido
    const totalVendido = (todasMovimentacoes || []).reduce((sum, mov) => sum + mov.quantidade, 0);

    // Buscar estoque médio (usando dados atuais como aproximação)
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('estoque_atual, custo_unitario')
      .eq('ativo', true);

    if (produtosError) {
      throw new Error(formatSupabaseError(produtosError));
    }

    const estoqueTotal = (produtos || []).reduce((sum, produto) => sum + produto.estoque_atual, 0);

    // Calcular giro: Total vendido / Estoque médio
    if (estoqueTotal === 0) {
      return 0;
    }

    const giro = totalVendido / estoqueTotal;
    return Math.round(giro * 10) / 10; // Arredondar para 1 casa decimal

  } catch (error) {
    console.error('Erro ao calcular giro de estoque:', error);
    
    // Se for erro de tabela não existir, retornar valor padrão silenciosamente
    if (error instanceof Error && error.message.includes('does not exist')) {
      return 0.5;
    }
    
    // Para outros erros, propagar
    throw error;
  }
};

/**
 * Calcula a variação percentual entre dois valores
 */
export const calcularVariacaoPercentual = (valorAtual: number, valorAnterior: number): string => {
  if (valorAnterior === 0) return '+0%';
  
  const variacao = ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100;
  const sinal = variacao >= 0 ? '+' : '';
  
  return `${sinal}${variacao.toFixed(1)}%`;
};

// Exportar todos os métodos
export default {
  buscarEstatisticasEstoque,
  calcularGiroEstoque,
  calcularVariacaoPercentual
}; 