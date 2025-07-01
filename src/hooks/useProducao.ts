import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OrdemProducao, StatisticsData, OrdemAndamento } from '@/types/producao';

export const useProducao = () => {
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [ordensAndamento, setOrdensAndamento] = useState<OrdemAndamento[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalOrdens: 0,
    ordensEmProducao: 0,
    ordensAguardando: 0,
    ordensFinalizadasHoje: 0,
    ordensDoMes: 0,
    taxaSucesso: 0,
    tempoMedio: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar todas as ordens de produção
  const fetchOrdens = async (): Promise<OrdemProducao[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('ordens_producao')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const ordensTyped = (data || []) as OrdemProducao[];
      setOrdens(ordensTyped);
      return ordensTyped;
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar ordens';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: "Falha ao carregar ordens de produção",
        variant: "destructive",
      });
      return [];
    }
  };

  // Calcular estatísticas baseadas nos dados reais
  const calculateStatistics = async (ordens: OrdemProducao[]) => {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      // Estatísticas básicas
      const ordensEmProducao = ordens.filter(ordem => ordem.status === 'em_producao').length;
      const ordensAguardando = ordens.filter(ordem => ordem.status === 'pendente').length;
      
      // Ordens finalizadas hoje
      const ordensFinalizadasHoje = ordens.filter(ordem => {
        if (ordem.status !== 'finalizada' || !ordem.data_finalizacao) return false;
        const dataFinalizacao = new Date(ordem.data_finalizacao);
        return dataFinalizacao >= hoje;
      }).length;

      // Ordens do mês
      const ordensDoMes = ordens.filter(ordem => {
        if (!ordem.created_at) return false;
        const dataCriacao = new Date(ordem.created_at);
        return dataCriacao >= inicioMes;
      }).length;

      // Taxa de sucesso (ordens finalizadas vs total do mês)
      const ordensFinalizadasMes = ordens.filter(ordem => {
        if (ordem.status !== 'finalizada' || !ordem.data_finalizacao) return false;
        const dataFinalizacao = new Date(ordem.data_finalizacao);
        return dataFinalizacao >= inicioMes;
      }).length;

      const taxaSucesso = ordensDoMes > 0 ? (ordensFinalizadasMes / ordensDoMes) * 100 : 0;

      // Tempo médio (placeholder - necessário implementar lógica de cálculo real)
      const tempoMedio = 0; // TODO: Implementar cálculo baseado em etapas de produção

      // Próximo prazo urgente (baseado em ordens em produção)
      const ordensUrgentes = ordens.filter(ordem => 
        ordem.status === 'em_producao' && ordem.prioridade === 'urgente'
      );
      const proximoPrazo = ordensUrgentes.length > 0 ? 
        `${ordensUrgentes.length} urgente${ordensUrgentes.length > 1 ? 's' : ''}` : 
        undefined;

      const newStatistics: StatisticsData = {
        totalOrdens: ordens.length,
        ordensEmProducao,
        ordensAguardando,
        ordensFinalizadasHoje,
        proximoPrazo,
        ordensDoMes,
        taxaSucesso: Math.round(taxaSucesso * 10) / 10,
        tempoMedio,
      };

      setStatistics(newStatistics);
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  };

  // Buscar ordens em andamento com detalhes
  const fetchOrdensAndamento = async () => {
    try {
      const { data, error } = await supabase
        .from('ordens_producao')
        .select(`
          *,
          receitas (
            medicamento_nome
          )
        `)
        .eq('status', 'em_producao')
        .eq('is_deleted', false)
        .order('data_criacao', { ascending: true });

      if (error) {
        // Se der erro na query com JOIN, tenta sem JOIN
        console.warn('Erro no JOIN com receitas, tentando sem:', error);
        
        const { data: dataSimple, error: errorSimple } = await supabase
          .from('ordens_producao')
          .select('*')
          .eq('status', 'em_producao')
          .eq('is_deleted', false)
          .order('data_criacao', { ascending: true });
          
        if (errorSimple) {
          throw errorSimple;
        }
        
        const ordensComProgresso = (dataSimple || []).map((ordem) => ({
          ...ordem,
          produto_nome: `Produto ${ordem.numero_ordem}`,
        })) as OrdemAndamento[];

        setOrdensAndamento(ordensComProgresso);
        return;
      }

      // Adicionar dados de produto
      const ordensComProgresso = (data || []).map((ordem) => ({
        ...ordem,
        produto_nome: (ordem as any).receitas?.medicamento_nome || `Produto ${ordem.numero_ordem}`,
      })) as OrdemAndamento[];

      setOrdensAndamento(ordensComProgresso);
    } catch (error) {
      console.error('Erro ao buscar ordens em andamento:', error);
      // Em caso de erro, define lista vazia em vez de falhar
      setOrdensAndamento([]);
    }
  };

  // Inicializar dados
  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const ordens = await fetchOrdens();
      await calculateStatistics(ordens);
      await fetchOrdensAndamento();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na inicialização dos dados';
      console.error('Erro na inicialização:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar dados
  const refreshData = async () => {
    try {
      await initializeData();
      toast({
        title: "Dados atualizados",
        description: "Informações de produção foram atualizadas",
      });
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      const errorMessage = error instanceof Error ? error.message : "Falha ao atualizar dados de produção";
      toast({
        title: "Erro ao atualizar",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    initializeData();
  }, []);

  // Subscription para mudanças em tempo real
  useEffect(() => {
    const subscription = supabase
      .channel('ordens_producao_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ordens_producao' 
        }, 
        (payload) => {
          console.log('Mudança detectada em ordens_producao:', payload);
          // Recarregar dados em tempo real
          initializeData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    ordens,
    ordensAndamento,
    statistics,
    loading,
    error,
    refreshData,
    fetchOrdens,
    calculateStatistics,
  };
}; 