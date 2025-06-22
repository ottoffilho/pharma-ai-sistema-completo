import { useState, useEffect } from 'react';
import { vendasService } from '@/services/vendasService';
import { VendaCompleta, EstatisticasVendas, FiltrosVenda } from '@/types/vendas';
import { useToast } from '@/hooks/use-toast';

export interface UseVendasReturn {
  vendas: VendaCompleta[];
  estatisticas: EstatisticasVendas | null;
  isLoading: boolean;
  error: string | null;
  carregarVendas: (filtros?: FiltrosVenda) => Promise<void>;
  carregarEstatisticas: (dataInicio?: string, dataFim?: string) => Promise<void>;
  formatarDinheiro: (valor: number) => string;
  formatarTempo: (minutos: number) => string;
  refresh: () => Promise<void>;
}

export function useVendas(): UseVendasReturn {
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasVendas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const formatarDinheiro = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarTempo = (minutos: number): string => {
    if (minutos < 60) {
      return `${minutos}min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  };

  const carregarVendas = async (filtros?: FiltrosVenda) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await vendasService.listarVendas(filtros);
      setVendas(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar vendas';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const carregarEstatisticas = async (dataInicio?: string, dataFim?: string) => {
    try {
      const data = await vendasService.obterEstatisticas(dataInicio, dataFim);
      setEstatisticas(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
      console.error('Erro ao carregar estatísticas:', err);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const refresh = async () => {
    await Promise.all([
      carregarVendas(),
      carregarEstatisticas()
    ]);
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    vendas,
    estatisticas,
    isLoading,
    error,
    carregarVendas,
    carregarEstatisticas,
    formatarDinheiro,
    formatarTempo,
    refresh
  };
} 