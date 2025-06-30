// =====================================================
// HOOK: useOrdensProducaoProntas
// Gerencia ordens de produção prontas para PDV
// =====================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrdemProducaoPronta {
  id: string;
  numero_ordem: string;
  cliente_id?: string;
  cliente_nome?: string;
  valor_total?: number;
  data_conclusao?: string;
  itens_count?: number;
}

interface UseOrdensProducaoProntasReturn {
  ordens: OrdemProducaoPronta[];
  loading: boolean;
  error: string | null;
  buscarOrdens: () => Promise<void>;
  buscarOrdemDetalhes: (id: string) => Promise<any>;
  refetch: () => Promise<void>;
}

export const useOrdensProducaoProntas = (): UseOrdensProducaoProntasReturn => {
  const [ordens, setOrdens] = useState<OrdemProducaoPronta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const buscarOrdens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: funcError } = await supabase.functions.invoke(
        'pdv-ordem-producao',
        { path: 'listar', body: {} }
      );

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar ordens');
      }

      setOrdens(data.data || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast({
        title: "Erro ao buscar ordens",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const buscarOrdemDetalhes = useCallback(async (id: string) => {
    try {
      const { data, error: funcError } = await supabase.functions.invoke(
        'pdv-ordem-producao',
        { path: id, body: {} }
      );

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar detalhes da ordem');
      }

      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: "Erro ao buscar detalhes",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const refetch = useCallback(async () => {
    await buscarOrdens();
  }, [buscarOrdens]);

  return {
    ordens,
    loading,
    error,
    buscarOrdens,
    buscarOrdemDetalhes,
    refetch
  };
}; 