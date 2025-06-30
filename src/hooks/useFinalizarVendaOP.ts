// =====================================================
// HOOK: useFinalizarVendaOP
// Finaliza vendas de ordens de produção
// =====================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormaPagamento {
  tipo: string;
  valor: number;
}

interface DadosCliente {
  nome?: string;
  documento?: string;
  telefone?: string;
}

interface FinalizarVendaParams {
  ordem_producao_id: string;
  forma_pagamento: FormaPagamento[];
  dados_cliente?: DadosCliente;
  observacoes?: string;
  usuario_id: string;
}

interface VendaFinalizada {
  venda_id: string;
  numero_venda: string;
  total: number;
  status: string;
}

interface UseFinalizarVendaOPReturn {
  loading: boolean;
  error: string | null;
  finalizarVenda: (params: FinalizarVendaParams) => Promise<VendaFinalizada>;
}

export const useFinalizarVendaOP = (): UseFinalizarVendaOPReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const finalizarVenda = useCallback(async (params: FinalizarVendaParams): Promise<VendaFinalizada> => {
    try {
      setLoading(true);
      setError(null);

      // Validações básicas
      if (!params.ordem_producao_id) {
        throw new Error('ID da ordem de produção é obrigatório');
      }

      if (!params.forma_pagamento || params.forma_pagamento.length === 0) {
        throw new Error('Forma de pagamento é obrigatória');
      }

      if (!params.usuario_id) {
        throw new Error('ID do usuário é obrigatório');
      }

      // Validar total dos pagamentos
      const totalPagamentos = params.forma_pagamento.reduce((acc, pag) => acc + pag.valor, 0);
      if (totalPagamentos <= 0) {
        throw new Error('Total dos pagamentos deve ser maior que zero');
      }

      console.log('🔄 Finalizando venda de ordem de produção...', {
        ordem_id: params.ordem_producao_id,
        total: totalPagamentos,
        usuario: params.usuario_id
      });

      const { data, error: funcError } = await supabase.functions.invoke(
        'pdv-ordem-producao',
        {
          body: params,
          path: 'finalizar'
        }
      );

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao finalizar venda');
      }

      const vendaFinalizada = data.data as VendaFinalizada;

      toast({
        title: "✅ Venda finalizada com sucesso!",
        description: `Venda ${vendaFinalizada.numero_venda} - ${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(vendaFinalizada.total)}`,
        duration: 5000,
      });

      console.log('✅ Venda finalizada:', vendaFinalizada);

      return vendaFinalizada;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      console.error('❌ Erro ao finalizar venda:', err);

      toast({
        title: "Erro ao finalizar venda",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });

      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    error,
    finalizarVenda
  };
}; 