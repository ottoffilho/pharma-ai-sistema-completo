import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface EstoqueCardsData {
  insumos: {
    total: number;
    estoqueMinimo: number;
    valorTotal: number;
  };
  embalagens: {
    total: number;
    valorTotal: number;
  };
  lotes: {
    totalMes: number;
    taxaAprovacao: number;
  };
  nfe: {
    totalImportadas: number;
    tempoMedio: number;
  };
}

/**
 * Hook para buscar dados reais dos cards da Central de Estoque
 */
export function useEstoqueCards() {
  const { data, isLoading, error, refetch } = useQuery<EstoqueCardsData>({
    queryKey: ['estoque-cards-data'],
    queryFn: async () => {
      try {
        // 1. Buscar dados de produtos (antiga tabela insumos)
        const { data: produtos, error: produtosError } = await supabase
          .from('produtos')
          .select('id, estoque_atual, estoque_minimo, custo_unitario')
          .eq('is_deleted', false);

        if (produtosError) throw produtosError;

        // 2. Buscar dados de embalagens (agora na tabela unificada 'produtos')
        const { data: embalagens, error: embalagensError } = await supabase
          .from('produtos')
          .select('id, estoque_atual, preco_custo, tipo')
          .eq('tipo', 'EMBALAGEM')
          .eq('is_deleted', false);

        if (embalagensError) throw embalagensError;

        // 3. Buscar lotes do mês atual
        const inicioMes = startOfMonth(new Date());
        const fimMes = endOfMonth(new Date());

        const { data: lotes, error: lotesError } = await supabase
          .from('lote')
          .select('id, created_at')
          .gte('created_at', inicioMes.toISOString())
          .lte('created_at', fimMes.toISOString())
          .eq('ativo', true);

        if (lotesError) throw lotesError;

        // 4. Buscar dados de NF-e
        const { data: nfe, error: nfeError } = await supabase
          .from('notas_fiscais')
          .select('id, status, created_at')
          .order('created_at', { ascending: false })
          .limit(100);

        if (nfeError) throw nfeError;

        // Calcular métricas de insumos
        const totalInsumos = produtos?.length || 0;
        const insumosEstoqueMinimo = produtos?.filter(i => 
          i.estoque_atual <= i.estoque_minimo
        ).length || 0;
        const valorTotalInsumos = produtos?.reduce((sum, i) => 
          sum + (i.estoque_atual * (i.custo_unitario || 0)), 0
        ) || 0;

        // Calcular métricas de embalagens
        const totalEmbalagens = embalagens?.length || 0;
        const valorTotalEmbalagens = embalagens?.reduce((sum, e: any) => 
          sum + (e.estoque_atual * (e.preco_custo || 0)), 0
        ) || 0;

        // Calcular métricas de lotes
        const totalLotesMes = lotes?.length || 0;
        const taxaAprovacao = totalLotesMes > 0 ? 100 : 0; // Assumindo 100% de aprovação por enquanto

        // Calcular métricas de NF-e
        const totalNFe = nfe?.length || 0;
        const tempoMedioNFe = 2.5; // Tempo médio em segundos (placeholder)

        return {
          insumos: {
            total: totalInsumos,
            estoqueMinimo: insumosEstoqueMinimo,
            valorTotal: valorTotalInsumos,
          },
          embalagens: {
            total: totalEmbalagens,
            valorTotal: valorTotalEmbalagens,
          },
          lotes: {
            totalMes: totalLotesMes,
            taxaAprovacao,
          },
          nfe: {
            totalImportadas: totalNFe,
            tempoMedio: tempoMedioNFe,
          },
        };
      } catch (error) {
        console.error('Erro ao buscar dados dos cards:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });

  /**
   * Formata um valor monetário no padrão brasileiro
   */
  const formatarDinheiro = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);
  };

  /**
   * Formata tempo em segundos
   */
  const formatarTempo = (segundos: number): string => {
    if (segundos < 1) return '< 1 seg';
    return `${segundos.toFixed(1)} seg`;
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    formatarDinheiro,
    formatarTempo,
  };
} 