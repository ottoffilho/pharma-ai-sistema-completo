// =====================================================
// SERVIÇO: Lotes
// Descrição: Gerenciamento de lotes de produtos
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database';

type Lote = Database['public']['Tables']['lote']['Row'];
type LoteInsert = Database['public']['Tables']['lote']['Insert'];
type LoteUpdate = Database['public']['Tables']['lote']['Update'];

export interface LoteComProduto extends Lote {
  produtos?: {
    id: string;
    nome: string;
    codigo_interno?: string;
    unidade_medida: string;
  };
}

export interface LoteFormData {
  produto_id: string;
  numero_lote: string;
  data_fabricacao?: string;
  data_validade?: string;
  quantidade_inicial: number;
  quantidade_atual: number;
  preco_custo_unitario?: number;
  fornecedor_id?: string;
  observacoes?: string;
}

export interface FiltrosLote {
  produto_id?: string;
  numero_lote?: string;
  fornecedor_id?: string;
  data_validade_inicio?: string;
  data_validade_fim?: string;
  apenas_vencidos?: boolean;
  apenas_proximos_vencimento?: boolean;
}

export interface PaginacaoLote {
  pagina: number;
  itensPorPagina: number;
}

export interface ResultadoPaginado<T> {
  dados: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

// =====================================================
// FUNÇÕES PRINCIPAIS
// =====================================================

export const loteService = {
  // Listar lotes com filtros e paginação
  async listarLotes(
    filtros: FiltrosLote = {},
    paginacao: PaginacaoLote = { pagina: 1, itensPorPagina: 50 }
  ): Promise<ResultadoPaginado<LoteComProduto>> {
    try {
      console.log('🔍 Listando lotes com filtros:', filtros);

      // Query base com relacionamentos
      let query = supabase
        .from('lote')
        .select(`
          *,
          produtos!produto_id (
            id,
            nome,
            codigo_interno,
            unidade_medida
          )
        `);

      // Aplicar filtros
      if (filtros.produto_id) {
        query = query.eq('produto_id', filtros.produto_id);
      }

      if (filtros.numero_lote) {
        query = query.ilike('numero_lote', `%${filtros.numero_lote}%`);
      }

      if (filtros.fornecedor_id) {
        query = query.eq('fornecedor_id', filtros.fornecedor_id);
      }

      if (filtros.data_validade_inicio) {
        query = query.gte('data_validade', filtros.data_validade_inicio);
      }

      if (filtros.data_validade_fim) {
        query = query.lte('data_validade', filtros.data_validade_fim);
      }

      if (filtros.apenas_vencidos) {
        const hoje = new Date().toISOString().split('T')[0];
        query = query.lt('data_validade', hoje);
      }

      if (filtros.apenas_proximos_vencimento) {
        const hoje = new Date();
        const dataLimite = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000));
        query = query
          .gte('data_validade', hoje.toISOString().split('T')[0])
          .lte('data_validade', dataLimite.toISOString().split('T')[0]);
      }

      // Filtrar apenas lotes ativos
      query = query.eq('ativo', true);

      // Contar total de registros
      const { count } = await supabase
        .from('lote')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      // Aplicar ordenação e paginação
      const offset = (paginacao.pagina - 1) * paginacao.itensPorPagina;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + paginacao.itensPorPagina - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao listar lotes:', error);
        throw new Error(`Erro ao listar lotes: ${error.message}`);
      }

      const totalPaginas = Math.ceil((count || 0) / paginacao.itensPorPagina);

      console.log(`✅ ${data?.length || 0} lotes encontrados`);

      return {
        dados: data || [],
        total: count || 0,
        pagina: paginacao.pagina,
        totalPaginas
      };

    } catch (error) {
      console.error('❌ Erro no serviço de listagem de lotes:', error);
      throw error;
    }
  },

  // Buscar lote por ID
  async buscarLotePorId(id: string): Promise<LoteComProduto | null> {
    try {
      console.log('🔍 Buscando lote por ID:', id);

      const { data, error } = await supabase
        .from('lote')
        .select(`
          *,
          produtos!produto_id (
            id,
            nome,
            codigo_interno,
            unidade_medida
          )
        `)
        .eq('id', id)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Lote não encontrado');
          return null;
        }
        console.error('❌ Erro ao buscar lote:', error);
        throw new Error(`Erro ao buscar lote: ${error.message}`);
      }

      console.log('✅ Lote encontrado:', data?.numero_lote);
      return data;

    } catch (error) {
      console.error('❌ Erro no serviço de busca de lote:', error);
      throw error;
    }
  },

  // Buscar lote por número e produto
  async buscarLotePorNumeroEProduto(numeroLote: string, produtoId: string): Promise<Lote | null> {
    try {
      console.log('🔍 Buscando lote por número e produto:', { numeroLote, produtoId });

      const { data, error } = await supabase
        .from('lote')
        .select('*')
        .eq('numero_lote', numeroLote)
        .eq('produto_id', produtoId)
        .eq('ativo', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar lote por número e produto:', error);
        throw new Error(`Erro ao buscar lote: ${error.message}`);
      }

      if (data) {
        console.log('✅ Lote encontrado:', data.numero_lote);
      } else {
        console.log('ℹ️ Lote não encontrado para:', { numeroLote, produtoId });
      }

      return data;

    } catch (error) {
      console.error('❌ Erro no serviço de busca de lote:', error);
      throw error;
    }
  },

  // Criar novo lote
  async criarLote(loteData: LoteFormData): Promise<Lote> {
    try {
      console.log('➕ Criando novo lote:', loteData.numero_lote);

      const { data, error } = await supabase
        .from('lote')
        .insert({
          produto_id: loteData.produto_id,
          numero_lote: loteData.numero_lote,
          data_fabricacao: loteData.data_fabricacao || null,
          data_validade: loteData.data_validade || null,
          quantidade_inicial: loteData.quantidade_inicial,
          quantidade_atual: loteData.quantidade_atual,
          preco_custo_unitario: loteData.preco_custo_unitario || null,
          fornecedor_id: loteData.fornecedor_id || null,
          observacoes: loteData.observacoes || null,
          ativo: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar lote:', error);
        throw new Error(`Erro ao criar lote: ${error.message}`);
      }

      console.log('✅ Lote criado com sucesso:', data.numero_lote);
      return data;

    } catch (error) {
      console.error('❌ Erro no serviço de criação de lote:', error);
      throw error;
    }
  },

  // Atualizar lote
  async atualizarLote(id: string, loteData: Partial<LoteFormData>): Promise<Lote> {
    try {
      console.log('📝 Atualizando lote:', id);

      const updateData: LoteUpdate = {};
      
      if (loteData.numero_lote !== undefined) updateData.numero_lote = loteData.numero_lote;
      if (loteData.data_fabricacao !== undefined) updateData.data_fabricacao = loteData.data_fabricacao || null;
      if (loteData.data_validade !== undefined) updateData.data_validade = loteData.data_validade || null;
      if (loteData.quantidade_inicial !== undefined) updateData.quantidade_inicial = loteData.quantidade_inicial;
      if (loteData.quantidade_atual !== undefined) updateData.quantidade_atual = loteData.quantidade_atual;
      if (loteData.preco_custo_unitario !== undefined) updateData.preco_custo_unitario = loteData.preco_custo_unitario || null;
      if (loteData.fornecedor_id !== undefined) updateData.fornecedor_id = loteData.fornecedor_id || null;
      if (loteData.observacoes !== undefined) updateData.observacoes = loteData.observacoes || null;

      const { data, error } = await supabase
        .from('lote')
        .update(updateData)
        .eq('id', id)
        .eq('ativo', true)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar lote:', error);
        throw new Error(`Erro ao atualizar lote: ${error.message}`);
      }

      console.log('✅ Lote atualizado com sucesso');
      return data;

    } catch (error) {
      console.error('❌ Erro no serviço de atualização de lote:', error);
      throw error;
    }
  },

  // Excluir lote (soft delete)
  async excluirLote(id: string): Promise<void> {
    try {
      console.log('🗑️ Excluindo lote:', id);

      const { error } = await supabase
        .from('lote')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir lote:', error);
        throw new Error(`Erro ao excluir lote: ${error.message}`);
      }

      console.log('✅ Lote excluído com sucesso');

    } catch (error) {
      console.error('❌ Erro no serviço de exclusão de lote:', error);
      throw error;
    }
  },

  // Buscar lotes próximos ao vencimento
  async buscarLotesProximosVencimento(dias: number = 30): Promise<LoteComProduto[]> {
    try {
      console.log('⚠️ Buscando lotes próximos ao vencimento...');

      const hoje = new Date();
      const dataLimite = new Date(hoje.getTime() + (dias * 24 * 60 * 60 * 1000));
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('lote')
        .select(`
          *,
          produtos!produto_id (
            id,
            nome,
            codigo_interno,
            unidade_medida
          )
        `)
        .lte('data_validade', dataLimiteStr)
        .eq('ativo', true)
        .gt('quantidade_atual', 0)
        .order('data_validade', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar lotes próximos ao vencimento:', error);
        throw new Error(`Erro ao buscar lotes próximos ao vencimento: ${error.message}`);
      }

      console.log('✅ Lotes próximos ao vencimento encontrados:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('❌ Erro no serviço de busca de lotes próximos ao vencimento:', error);
      throw error;
    }
  },

  // Buscar lotes vencidos
  async buscarLotesVencidos(): Promise<LoteComProduto[]> {
    try {
      console.log('🚨 Buscando lotes vencidos...');

      const hoje = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('lote')
        .select(`
          *,
          produtos!produto_id (
            id,
            nome,
            codigo_interno,
            unidade_medida
          )
        `)
        .lt('data_validade', hoje)
        .eq('ativo', true)
        .gt('quantidade_atual', 0)
        .order('data_validade', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar lotes vencidos:', error);
        throw new Error(`Erro ao buscar lotes vencidos: ${error.message}`);
      }

      console.log('✅ Lotes vencidos encontrados:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('❌ Erro no serviço de busca de lotes vencidos:', error);
      throw error;
    }
  },

  // Atualizar quantidade do lote
  async atualizarQuantidade(id: string, novaQuantidade: number, motivo?: string): Promise<Lote> {
    try {
      console.log('📊 Atualizando quantidade do lote:', { id, novaQuantidade, motivo });

      const { data, error } = await supabase
        .from('lote')
        .update({
          quantidade_atual: novaQuantidade,
          observacoes: motivo ? `${motivo} - ${new Date().toLocaleString()}` : undefined
        })
        .eq('id', id)
        .eq('ativo', true)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar quantidade do lote:', error);
        throw new Error(`Erro ao atualizar quantidade do lote: ${error.message}`);
      }

      console.log('✅ Quantidade do lote atualizada com sucesso');
      return data;

    } catch (error) {
      console.error('❌ Erro no serviço de atualização de quantidade:', error);
      throw error;
    }
  },

  // Buscar lotes por produto
  async buscarLotesPorProduto(produtoId: string): Promise<LoteComProduto[]> {
    try {
      console.log('🔍 Buscando lotes por produto:', produtoId);

      const { data, error } = await supabase
        .from('lote')
        .select(`
          *,
          produtos!produto_id (
            id,
            nome,
            codigo_interno,
            unidade_medida
          )
        `)
        .eq('produto_id', produtoId)
        .eq('ativo', true)
        .order('data_validade', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar lotes por produto:', error);
        throw new Error(`Erro ao buscar lotes por produto: ${error.message}`);
      }

      console.log('✅ Lotes encontrados para o produto:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('❌ Erro no serviço de busca de lotes por produto:', error);
      throw error;
    }
  },

  // Função específica para criar lote a partir de XML de nota fiscal
  async criarLoteDoXML(dadosLote: {
    produto_id: string;
    numero_lote: string;
    data_validade?: string;
    quantidade: number;
    preco_custo_unitario?: number;
    fornecedor_id?: string;
  }): Promise<Lote> {
    try {
      console.log('📄 Criando lote a partir do XML:', dadosLote);

      // Verificar se já existe um lote com o mesmo número para o mesmo produto
      const loteExistente = await this.buscarLotePorNumeroEProduto(
        dadosLote.numero_lote, 
        dadosLote.produto_id
      );

      if (loteExistente) {
        console.log('ℹ️ Lote já existe, atualizando quantidade...');
        
        // Atualizar quantidade do lote existente
        const novaQuantidade = loteExistente.quantidade_atual + dadosLote.quantidade;
        
        return await this.atualizarLote(loteExistente.id, {
          quantidade_atual: novaQuantidade,
          quantidade_inicial: loteExistente.quantidade_inicial + dadosLote.quantidade,
          preco_custo_unitario: dadosLote.preco_custo_unitario || loteExistente.preco_custo_unitario
        });
      } else {
        console.log('➕ Criando novo lote...');
        
        // Criar novo lote
        return await this.criarLote({
          produto_id: dadosLote.produto_id,
          numero_lote: dadosLote.numero_lote,
          data_validade: dadosLote.data_validade,
          quantidade_inicial: dadosLote.quantidade,
          quantidade_atual: dadosLote.quantidade,
          preco_custo_unitario: dadosLote.preco_custo_unitario,
          fornecedor_id: dadosLote.fornecedor_id
        });
      }

    } catch (error) {
      console.error('❌ Erro no serviço de criação de lote do XML:', error);
      throw error;
    }
  }
}; 