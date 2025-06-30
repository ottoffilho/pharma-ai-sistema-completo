/**
 * Service para operações de caixa usando Edge Function
 * Interage com a Edge Function 'caixa-operations' para:
 * - Abrir/fechar caixa
 * - Registrar movimentações (sangrias/suprimentos)
 * - Obter status do caixa
 * - Buscar histórico
 */

import { supabase } from '@/integrations/supabase/client';

export interface CaixaAberto {
  id: string;
  usuario_id: string;
  data_abertura: string;
  valor_inicial: number;
  status: 'aberto' | 'fechado';
  observacoes?: string;
  usuario?: {
    nome: string;
  };
  vendas?: Array<{ count: number }>;
}

export interface CaixaFechado extends CaixaAberto {
  data_fechamento: string;
  valor_final: number;
  valor_vendas: number;
  diferenca: number;
  usuario_fechamento: string;
  observacoes_fechamento?: string;
  usuario_fechamento_info?: {
    nome: string;
  };
}

export interface ResumoFechamento {
  valor_inicial: number;
  valor_vendas: number;
  valor_esperado: number;
  valor_final: number;
  diferenca: number;
}

export interface AbrirCaixaRequest {
  valor_inicial: number;
  observacoes?: string;
}

export interface FecharCaixaRequest {
  caixa_id: string;
  valor_final: number;
  observacoes?: string;
}

export interface HistoricoRequest {
  limite?: number;
  offset?: number;
  data_inicio?: string;
  data_fim?: string;
}

export class CaixaService {
  private static getAuthHeaders() {
    const session = supabase.auth.getSession();
    return session ? {
      'Authorization': `Bearer ${session.data.session?.access_token}`,
      'Content-Type': 'application/json'
    } : {};
  }

  /**
   * Abre um novo caixa
   */
  static async abrirCaixa(request: AbrirCaixaRequest): Promise<{ success: boolean; message: string; caixa?: CaixaAberto }> {
    const headers = this.getAuthHeaders();
    
    const response = await supabase.functions.invoke('caixa-operations', {
      body: request,
      headers,
      query: { action: 'abrir-caixa' }
    });

    if (response.error) {
      throw new Error(response.error.message || 'Erro ao abrir caixa');
    }

    return response.data;
  }

  /**
   * Fecha o caixa atual
   */
  static async fecharCaixa(request: FecharCaixaRequest): Promise<{ success: boolean; message: string; resumo?: ResumoFechamento }> {
    const headers = this.getAuthHeaders();
    
    const response = await supabase.functions.invoke('caixa-operations', {
      body: request,
      headers,
      query: { action: 'fechar-caixa' }
    });

    if (response.error) {
      throw new Error(response.error.message || 'Erro ao fechar caixa');
    }

    return response.data;
  }

  /**
   * Obtém o caixa atualmente aberto
   */
  static async obterCaixaAtivo(): Promise<{ caixa: CaixaAberto | null }> {
    const headers = this.getAuthHeaders();
    
    const response = await supabase.functions.invoke('caixa-operations', {
      headers,
      query: { action: 'obter-caixa-ativo' }
    });

    if (response.error) {
      throw new Error(response.error.message || 'Erro ao buscar caixa ativo');
    }

    return response.data;
  }

  /**
   * Obtém histórico de operações de caixa
   */
  static async obterHistorico(filters: HistoricoRequest = {}): Promise<{ historico: CaixaFechado[] }> {
    const headers = this.getAuthHeaders();
    
    const queryParams = new URLSearchParams({
      action: 'historico-caixa',
      ...(filters.limite && { limite: filters.limite.toString() }),
      ...(filters.offset && { offset: filters.offset.toString() }),
      ...(filters.data_inicio && { data_inicio: filters.data_inicio }),
      ...(filters.data_fim && { data_fim: filters.data_fim })
    });
    
    const response = await supabase.functions.invoke('caixa-operations', {
      headers,
      query: Object.fromEntries(queryParams)
    });

    if (response.error) {
      throw new Error(response.error.message || 'Erro ao buscar histórico do caixa');
    }

    return response.data;
  }

  /**
   * Verifica se há caixa aberto (método auxiliar)
   */
  static async verificarCaixaAberto(): Promise<boolean> {
    try {
      const result = await this.obterCaixaAtivo();
      return result.caixa !== null;
    } catch (error) {
      console.error('Erro ao verificar caixa aberto:', error);
      return false;
    }
  }

  /**
   * Registra sangria (retirada de dinheiro do caixa)
   */
  static async registrarSangria(valor: number, descricao: string): Promise<{ success: boolean; message: string }> {
    // Esta funcionalidade ainda não está implementada na Edge Function
    // Por enquanto, mantemos a implementação direta no banco
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: caixaAberto } = await supabase
      .from('abertura_caixa')
      .select('id')
      .eq('status', 'aberto')
      .order('data_abertura', { ascending: false })
      .limit(1);

    if (!caixaAberto || caixaAberto.length === 0) {
      throw new Error('Não há caixa aberto para registrar sangria');
    }

    const { error } = await supabase
      .from('movimentos_caixa')
      .insert({
        abertura_caixa_id: caixaAberto[0].id,
        tipo: 'sangria',
        descricao,
        valor,
        usuario_id: user.id
      });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Sangria registrada com sucesso'
    };
  }

  /**
   * Registra suprimento (adição de dinheiro no caixa)
   */
  static async registrarSuprimento(valor: number, descricao: string): Promise<{ success: boolean; message: string }> {
    // Esta funcionalidade ainda não está implementada na Edge Function
    // Por enquanto, mantemos a implementação direta no banco
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: caixaAberto } = await supabase
      .from('abertura_caixa')
      .select('id')
      .eq('status', 'aberto')
      .order('data_abertura', { ascending: false })
      .limit(1);

    if (!caixaAberto || caixaAberto.length === 0) {
      throw new Error('Não há caixa aberto para registrar suprimento');
    }

    const { error } = await supabase
      .from('movimentos_caixa')
      .insert({
        abertura_caixa_id: caixaAberto[0].id,
        tipo: 'suprimento',
        descricao,
        valor,
        usuario_id: user.id
      });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Suprimento registrado com sucesso'
    };
  }
}

export default CaixaService;