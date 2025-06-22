import { useQuery } from '@tanstack/react-query';
import { buscarEstatisticasEstoque, calcularGiroEstoque } from '@/services/estoqueService';
import { EstatisticasEstoque } from '@/types/database';

/**
 * Hook personalizado para gerenciar métricas e dados do estoque
 * 
 * @param enabled Define se as consultas serão executadas automaticamente
 * @param staleTime Tempo de validade do cache em milissegundos
 * @returns Objeto contendo dados e estados de carregamento do estoque
 */
export function useEstoque(enabled = true, staleTime = 1000 * 60 * 5) {
  // Consulta para estatísticas gerais do estoque
  const { 
    data: estatisticas, 
    isLoading: isLoadingEstatisticas,
    isError: isErrorEstatisticas,
    refetch: refetchEstatisticas
  } = useQuery<EstatisticasEstoque>({
    queryKey: ['estatisticas-estoque'],
    queryFn: () => buscarEstatisticasEstoque(),
    staleTime,
    enabled,
  });

  // Consulta para giro de estoque
  const {
    data: giroEstoque,
    isLoading: isLoadingGiro,
    isError: isErrorGiro,
    refetch: refetchGiro
  } = useQuery<number>({
    queryKey: ['giro-estoque'],
    queryFn: () => calcularGiroEstoque(),
    staleTime,
    enabled,
  });

  /**
   * Formata um valor monetário no padrão brasileiro
   * 
   * @param valor Valor a ser formatado
   * @returns String formatada como moeda brasileira
   */
  const formatarDinheiro = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);
  };

  /**
   * Recarrega todas as métricas de estoque
   */
  const recarregarDados = () => {
    refetchEstatisticas();
    refetchGiro();
  };

  // Calcular algumas métricas derivadas
  const valorTotalFormatado = formatarDinheiro(estatisticas?.valor_total_estoque || 0);
  const giroEstoqueFormatado = `${(giroEstoque || 0).toFixed(1)}x`;
  const isLoading = isLoadingEstatisticas || isLoadingGiro;
  const isError = isErrorEstatisticas || isErrorGiro;

  return {
    // Dados brutos
    estatisticas,
    giroEstoque,
    
    // Estados
    isLoading,
    isError,
    
    // Valores formatados
    valorTotalFormatado,
    giroEstoqueFormatado,
    
    // Funções utilitárias
    formatarDinheiro,
    recarregarDados
  };
} 