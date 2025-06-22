import { useState, useEffect } from 'react';
import { vendasService } from '@/services/vendasService';
import { useToast } from '@/hooks/use-toast';

export interface VendasCardsData {
  vendas: {
    hoje: number;
    ontem: number;
    mes: number;
    valorHoje: number;
    valorOntem: number;
    valorMes: number;
    ticketMedio: number;
    tempoMedioVenda: number; // em minutos
  };
  pdv: {
    vendasAbertas: number;
    vendasPendentes: number;
    produtosMaisVendidos: Array<{
      produto_nome: string;
      quantidade: number;
      valor_total: number;
    }>;
  };
  caixa: {
    status: 'aberto' | 'fechado';
    valorAtual: number;
    ultimoFechamento: string | null;
    diferenca: number;
  };
  pagamentos: {
    dinheiro: number;
    pix: number;
    cartaoCredito: number;
    cartaoDebito: number;
  };
}

export interface UseVendasCardsReturn {
  data: VendasCardsData | null;
  isLoading: boolean;
  error: string | null;
  formatarDinheiro: (valor: number) => string;
  formatarTempo: (minutos: number) => string;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVendasCards(): UseVendasCardsReturn {
  const [data, setData] = useState<VendasCardsData | null>(null);
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

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar dados de hoje
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      const hojeStr = hoje.toISOString().split('T')[0];
      const ontemStr = ontem.toISOString().split('T')[0];
      const inicioMesStr = inicioMes.toISOString().split('T')[0];

      // Buscar estatísticas reais usando apenas métodos existentes
      const [estatisticasHoje, estatisticasOntem, estatisticasMes] = await Promise.all([
        vendasService.obterEstatisticas(hojeStr, hojeStr),
        vendasService.obterEstatisticas(ontemStr, ontemStr),
        vendasService.obterEstatisticas(inicioMesStr, hojeStr)
      ]);

      // Buscar vendas pendentes e abertas
      const vendasAbertas = await vendasService.listarVendas({ status: 'aberta' });
      const vendasPendentes = await vendasService.listarVendas({ status_pagamento: 'pendente' });

      // Buscar status do caixa
      const caixaAberto = await vendasService.obterCaixaAtivo();

      // Buscar vendas do mês para calcular produtos mais vendidos e pagamentos
      const vendasDoMes = await vendasService.listarVendas({ 
        data_inicio: inicioMesStr, 
        data_fim: hojeStr 
      });

      // Calcular produtos mais vendidos manualmente a partir das vendas
      const produtosMaisVendidos = calcularProdutosMaisVendidos(vendasDoMes);

      // Calcular estatísticas de pagamentos manualmente
      const estatisticasPagamentos = calcularEstatisticasPagamentos(vendasDoMes);

      // Dados reais baseados nas consultas ao Supabase
      const dadosReais: VendasCardsData = {
        vendas: {
          hoje: estatisticasHoje?.total_vendas || 0,
          ontem: estatisticasOntem?.total_vendas || 0,
          mes: estatisticasMes?.total_vendas || 0,
          valorHoje: estatisticasHoje?.valor_total || 0,
          valorOntem: estatisticasOntem?.valor_total || 0,
          valorMes: estatisticasMes?.valor_total || 0,
          ticketMedio: estatisticasHoje?.ticket_medio || 0,
          tempoMedioVenda: 15 // Valor padrão, pode ser calculado posteriormente
        },
        pdv: {
          vendasAbertas: vendasAbertas?.length || 0,
          vendasPendentes: vendasPendentes?.length || 0,
          produtosMaisVendidos: produtosMaisVendidos.slice(0, 3)
        },
        caixa: {
          status: caixaAberto ? 'aberto' : 'fechado',
          valorAtual: caixaAberto?.valor_inicial || 0,
          ultimoFechamento: caixaAberto?.created_at ? 
            new Date(caixaAberto.created_at).toLocaleString('pt-BR') : null,
          diferenca: 0 // Valor padrão, pode ser calculado posteriormente
        },
        pagamentos: {
          dinheiro: estatisticasPagamentos.dinheiro,
          pix: estatisticasPagamentos.pix,
          cartaoCredito: estatisticasPagamentos.cartao_credito,
          cartaoDebito: estatisticasPagamentos.cartao_debito
        }
      };

      setData(dadosReais);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados dos cards';
      setError(errorMessage);
      console.error('Erro ao carregar dados dos cards:', err);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calcula os produtos mais vendidos a partir das vendas
   */
  const calcularProdutosMaisVendidos = (vendas: any[]) => {
    const produtosMap = new Map<string, { produto_nome: string; quantidade: number; valor_total: number }>();

    vendas.forEach(venda => {
      if (venda.itens) {
        venda.itens.forEach((item: any) => {
          const key = item.produto_nome;
          const existing = produtosMap.get(key) || { 
            produto_nome: item.produto_nome, 
            quantidade: 0, 
            valor_total: 0 
          };
          
          existing.quantidade += item.quantidade;
          existing.valor_total += item.preco_total;
          produtosMap.set(key, existing);
        });
      }
    });

    return Array.from(produtosMap.values())
      .sort((a, b) => b.quantidade - a.quantidade);
  };

  /**
   * Calcula as estatísticas de pagamentos a partir das vendas
   */
  const calcularEstatisticasPagamentos = (vendas: any[]) => {
    const estatisticas = {
      dinheiro: 0,
      pix: 0,
      cartao_credito: 0,
      cartao_debito: 0
    };

    vendas.forEach(venda => {
      if (venda.pagamentos) {
        venda.pagamentos.forEach((pagamento: any) => {
          switch (pagamento.forma_pagamento) {
            case 'dinheiro':
              estatisticas.dinheiro += pagamento.valor;
              break;
            case 'pix':
              estatisticas.pix += pagamento.valor;
              break;
            case 'cartao_credito':
              estatisticas.cartao_credito += pagamento.valor;
              break;
            case 'cartao_debito':
              estatisticas.cartao_debito += pagamento.valor;
              break;
          }
        });
      }
    });

    return estatisticas;
  };

  const refresh = async () => {
    await carregarDados();
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return {
    data,
    isLoading,
    error,
    formatarDinheiro,
    formatarTempo,
    refresh,
    refetch: refresh
  };
} 