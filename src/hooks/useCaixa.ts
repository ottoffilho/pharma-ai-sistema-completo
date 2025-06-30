/**
 * Hook personalizado para operações de caixa
 * Utiliza React Query para cache e estado de carregamento
 * Interage com CaixaService para operações via Edge Function
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import CaixaService, { 
  AbrirCaixaRequest, 
  FecharCaixaRequest, 
  HistoricoRequest,
  CaixaAberto 
} from '@/services/caixaService';

export function useCaixa() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obter caixa ativo
  const {
    data: caixaAtivo,
    isLoading: loadingCaixa,
    error: errorCaixa,
    refetch: refetchCaixa
  } = useQuery({
    queryKey: ['caixa-ativo'],
    queryFn: () => CaixaService.obterCaixaAtivo(),
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Query para histórico do caixa
  const useHistoricoCaixa = (filters: HistoricoRequest = {}) => {
    return useQuery({
      queryKey: ['caixa-historico', filters],
      queryFn: () => CaixaService.obterHistorico(filters),
      staleTime: 60000, // 1 minuto
      enabled: Object.keys(filters).length > 0 // Só executa se houver filtros
    });
  };

  // Mutation para abrir caixa
  const abrirCaixaMutation = useMutation({
    mutationFn: (request: AbrirCaixaRequest) => CaixaService.abrirCaixa(request),
    onSuccess: (data) => {
      toast({
        title: 'Sucesso',
        description: data.message || 'Caixa aberto com sucesso'
      });
      
      // Invalidar queries relacionadas ao caixa
      queryClient.invalidateQueries({ queryKey: ['caixa-ativo'] });
      queryClient.invalidateQueries({ queryKey: ['caixa-historico'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao abrir caixa',
        variant: 'destructive'
      });
    }
  });

  // Mutation para fechar caixa
  const fecharCaixaMutation = useMutation({
    mutationFn: (request: FecharCaixaRequest) => CaixaService.fecharCaixa(request),
    onSuccess: (data) => {
      toast({
        title: 'Sucesso',
        description: data.message || 'Caixa fechado com sucesso'
      });
      
      // Invalidar queries relacionadas ao caixa
      queryClient.invalidateQueries({ queryKey: ['caixa-ativo'] });
      queryClient.invalidateQueries({ queryKey: ['caixa-historico'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fechar caixa',
        variant: 'destructive'
      });
    }
  });

  // Mutation para registrar sangria
  const sangriaOuSuprimentoMutation = useMutation({
    mutationFn: async ({ tipo, valor, descricao }: { tipo: 'sangria' | 'suprimento', valor: number, descricao: string }) => {
      if (tipo === 'sangria') {
        return CaixaService.registrarSangria(valor, descricao);
      } else {
        return CaixaService.registrarSuprimento(valor, descricao);
      }
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Sucesso',
        description: data.message || `${variables.tipo === 'sangria' ? 'Sangria' : 'Suprimento'} registrado com sucesso`
      });
      
      // Invalidar queries relacionadas ao caixa
      queryClient.invalidateQueries({ queryKey: ['caixa-ativo'] });
    },
    onError: (error: Error, variables) => {
      toast({
        title: 'Erro',
        description: error.message || `Erro ao registrar ${variables.tipo}`,
        variant: 'destructive'
      });
    }
  });

  // Funções auxiliares
  const abrirCaixa = (request: AbrirCaixaRequest) => {
    abrirCaixaMutation.mutate(request);
  };

  const fecharCaixa = (request: FecharCaixaRequest) => {
    fecharCaixaMutation.mutate(request);
  };

  const registrarSangria = (valor: number, descricao: string) => {
    sangriaOuSuprimentoMutation.mutate({ tipo: 'sangria', valor, descricao });
  };

  const registrarSuprimento = (valor: number, descricao: string) => {
    sangriaOuSuprimentoMutation.mutate({ tipo: 'suprimento', valor, descricao });
  };

  const verificarCaixaAberto = (): boolean => {
    return caixaAtivo?.caixa !== null;
  };

  const obterCaixaAtual = (): CaixaAberto | null => {
    return caixaAtivo?.caixa || null;
  };

  // Estados de loading
  const isLoading = loadingCaixa || 
                   abrirCaixaMutation.isPending || 
                   fecharCaixaMutation.isPending || 
                   sangriaOuSuprimentoMutation.isPending;

  return {
    // Dados
    caixaAtivo: obterCaixaAtual(),
    isCaixaAberto: verificarCaixaAberto(),
    
    // Estados
    isLoading,
    error: errorCaixa,
    
    // Actions
    abrirCaixa,
    fecharCaixa,
    registrarSangria,
    registrarSuprimento,
    refetchCaixa,
    
    // Hooks específicos
    useHistoricoCaixa,
    
    // Estados das mutations
    isAbrindoCaixa: abrirCaixaMutation.isPending,
    isFechandoCaixa: fecharCaixaMutation.isPending,
    isRegistrandoMovimento: sangriaOuSuprimentoMutation.isPending,
    
    // Erros das mutations
    erroAbrirCaixa: abrirCaixaMutation.error,
    erroFecharCaixa: fecharCaixaMutation.error,
    erroMovimento: sangriaOuSuprimentoMutation.error
  };
}

export default useCaixa;