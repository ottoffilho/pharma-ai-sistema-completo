// =====================================================
// SERVIÇO DE VENDAS - PHARMA.AI
// Usando MCP Supabase para todas as operações
// =====================================================

import { 
  Venda, 
  ItemVenda, 
  PagamentoVenda, 
  ClienteVenda,
  VendaCompleta,
  CreateVenda,
  CreateItemVenda,
  CreatePagamentoVenda,
  CreateClienteVenda,
  FiltrosVenda,
  FiltroProdutoPDV,
  ProcessarVendaResponse,
  ValidarEstoqueResponse,
  EstatisticasVendas,
  AberturaCaixa,
  FechamentoCaixa
} from '@/types/vendas';
import { UUID } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// INTERFACE DO SERVIÇO
// =====================================================

export interface VendasServiceInterface {
  // Vendas
  listarVendas(filtros?: FiltrosVenda): Promise<VendaCompleta[]>;
  obterVenda(id: UUID): Promise<VendaCompleta | null>;
  criarVenda(venda: CreateVenda): Promise<ProcessarVendaResponse>;
  atualizarVenda(id: UUID, venda: Partial<CreateVenda>): Promise<boolean>;
  cancelarVenda(id: UUID, motivo?: string): Promise<boolean>;
  finalizarVenda(id: UUID): Promise<ProcessarVendaResponse>;
  
  // Itens da Venda
  adicionarItem(item: CreateItemVenda): Promise<ItemVenda>;
  atualizarItem(id: UUID, item: Partial<CreateItemVenda>): Promise<boolean>;
  removerItem(id: UUID): Promise<boolean>;
  
  // Pagamentos
  adicionarPagamento(pagamento: CreatePagamentoVenda): Promise<PagamentoVenda>;
  removerPagamento(id: UUID): Promise<boolean>;
  
  // Clientes
  listarClientes(termo?: string): Promise<ClienteVenda[]>;
  obterCliente(id: UUID): Promise<ClienteVenda | null>;
  criarCliente(cliente: CreateClienteVenda): Promise<ClienteVenda>;
  atualizarCliente(id: UUID, cliente: Partial<CreateClienteVenda>): Promise<boolean>;
  
  // Produtos para PDV
  buscarProdutosPDV(filtros: FiltroProdutoPDV): Promise<any[]>;
  validarEstoque(itens: CreateItemVenda[]): Promise<ValidarEstoqueResponse>;
  
  // Caixa
  abrirCaixa(valorInicial: number, observacoes?: string): Promise<AberturaCaixa>;
  fecharCaixa(aberturaCaixaId: UUID, valorContado: number, observacoes?: string): Promise<FechamentoCaixa>;
  obterCaixaAtivo(): Promise<AberturaCaixa | null>;
  
  // Relatórios
  obterEstatisticas(dataInicio?: string, dataFim?: string): Promise<EstatisticasVendas>;
}

// =====================================================
// IMPLEMENTAÇÃO DO SERVIÇO
// =====================================================

class VendasService implements VendasServiceInterface {
  
  // =====================================================
  // VENDAS
  // =====================================================
  
  async listarVendas(filtros?: FiltrosVenda): Promise<VendaCompleta[]> {
    try {
      let query = supabase
        .from('vendas')
        .select(`
          *,
          clientes(nome, cpf, cnpj, documento, telefone, email),
          usuarios!vendas_usuario_id_fkey(nome),
          itens_venda(
            id,
            produto_id,
            produto_nome,
            produto_codigo,
            quantidade,
            preco_unitario,
            preco_total,
            desconto_valor,
            desconto_percentual,
            observacoes
          ),
          pagamentos_venda(
            id,
            forma_pagamento,
            valor,
            numero_autorizacao,
            bandeira_cartao,
            codigo_transacao,
            data_pagamento
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros se fornecidos
      if (filtros?.dataInicio && filtros.dataFim) {
        query = query
          .gte('data_venda', filtros.dataInicio)
          .lte('data_venda', filtros.dataFim);
      }

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros?.statusPagamento) {
        query = query.eq('status_pagamento', filtros.statusPagamento);
      }

      if (filtros?.clienteId) {
        query = query.eq('cliente_id', filtros.clienteId);
      }

      if (filtros?.usuarioId) {
        query = query.eq('usuario_id', filtros.usuarioId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao listar vendas:', error);
        throw new Error('Erro ao listar vendas');
      }

      // Transformar dados para o formato esperado
      return data?.map(venda => ({
        ...venda,
        cliente_nome_completo: venda.clientes?.nome || '',
        cliente_documento: venda.clientes?.cpf || venda.clientes?.cnpj || venda.clientes?.documento || '',
        usuario_nome: venda.usuarios?.nome || '',
        itens: venda.itens_venda || [],
        pagamentos: venda.pagamentos_venda || []
      })) || [];

    } catch (error) {
      console.error('Erro ao listar vendas:', error);
      throw error;
    }
  }
  
  async obterVenda(id: UUID): Promise<VendaCompleta | null> {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          clientes(nome, cpf, cnpj, documento, telefone, email),
          usuarios!vendas_usuario_id_fkey(nome),
          itens_venda(
            id,
            produto_id,
            produto_nome,
            produto_codigo,
            quantidade,
            preco_unitario,
            preco_total,
            desconto_valor,
            desconto_percentual,
            observacoes
          ),
          pagamentos_venda(
            id,
            forma_pagamento,
            valor,
            numero_autorizacao,
            bandeira_cartao,
            codigo_transacao,
            data_pagamento
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Venda não encontrada
        }
        console.error('Erro ao obter venda:', error);
        throw new Error('Erro ao obter venda');
      }

      if (!data) return null;

      // Transformar dados para o formato esperado
      return {
        ...data,
        cliente_nome_completo: data.clientes?.nome || '',
        cliente_documento: data.clientes?.cpf || data.clientes?.cnpj || data.clientes?.documento || '',
        usuario_nome: data.usuarios?.nome || '',
        itens: data.itens_venda || [],
        pagamentos: data.pagamentos_venda || []
      };

    } catch (error) {
      console.error('Erro ao obter venda:', error);
      throw error;
    }
  }
  
  async criarVenda(venda: CreateVenda): Promise<ProcessarVendaResponse> {
    try {
      // Iniciar transação usando RPC (Stored Procedure)
      const { data, error } = await supabase.rpc('processar_venda_completa', {
        venda_data: venda
      });

      if (error) {
        console.error('Erro ao criar venda:', error);
        return {
          sucesso: false,
          erro: error.message
        };
      }

      return {
        sucesso: true,
        venda: data
      };

    } catch (error) {
      console.error('Erro ao criar venda:', error);
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  async finalizarVenda(id: UUID): Promise<ProcessarVendaResponse> {
    try {
      const { data, error } = await supabase.rpc('finalizar_venda', {
        venda_id: id
      });

      if (error) {
        console.error('Erro ao finalizar venda:', error);
        return {
          sucesso: false,
          erro: error.message
        };
      }

      return {
        sucesso: true,
        venda: data
      };

    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  async atualizarVenda(id: UUID, venda: Partial<CreateVenda>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('vendas')
        .update({
          cliente_id: venda.cliente_id,
          observacoes: venda.observacoes,
          desconto_total: venda.desconto_total,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar venda:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      return false;
    }
  }
  
  async cancelarVenda(id: UUID, motivo?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('cancelar_venda', {
        venda_id: id,
        motivo_cancelamento: motivo
      });

      if (error) {
        console.error('Erro ao cancelar venda:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      return false;
    }
  }
  
  // =====================================================
  // ITENS DA VENDA
  // =====================================================
  
  async adicionarItem(item: CreateItemVenda): Promise<ItemVenda> {
    try {
      const { data, error } = await supabase
        .from('itens_venda')
        .insert({
          venda_id: item.venda_id,
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          produto_codigo: item.produto_codigo,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          preco_total: item.preco_total,
          desconto_valor: item.desconto_valor,
          desconto_percentual: item.desconto_percentual,
          observacoes: item.observacoes
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar item:', error);
        throw new Error('Erro ao adicionar item');
      }

      return data;
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      throw error;
    }
  }
  
  async atualizarItem(id: UUID, item: Partial<CreateItemVenda>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('itens_venda')
        .update({
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          preco_total: item.preco_total,
          desconto_valor: item.desconto_valor,
          desconto_percentual: item.desconto_percentual,
          observacoes: item.observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar item:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      return false;
    }
  }
  
  async removerItem(id: UUID): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('itens_venda')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover item:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao remover item:', error);
      return false;
    }
  }
  
  // =====================================================
  // PAGAMENTOS
  // =====================================================
  
  async adicionarPagamento(pagamento: CreatePagamentoVenda): Promise<PagamentoVenda> {
    try {
      const { data, error } = await supabase
        .from('pagamentos_venda')
        .insert({
          venda_id: pagamento.venda_id,
          forma_pagamento: pagamento.forma_pagamento,
          valor: pagamento.valor,
          numero_autorizacao: pagamento.numero_autorizacao,
          bandeira_cartao: pagamento.bandeira_cartao,
          codigo_transacao: pagamento.codigo_transacao,
          data_pagamento: pagamento.data_pagamento || new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar pagamento:', error);
        throw new Error('Erro ao adicionar pagamento');
      }

      return data;
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error);
      throw error;
    }
  }
  
  async removerPagamento(id: UUID): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pagamentos_venda')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover pagamento:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao remover pagamento:', error);
      return false;
    }
  }
  
  // =====================================================
  // CLIENTES
  // =====================================================
  
  async listarClientes(termo?: string): Promise<ClienteVenda[]> {
    try {
      let query = supabase
        .from('clientes')
        .select('*')
        .eq('ativo', true)
        .order('nome')
        .limit(50);

      if (termo) {
        query = query.or(`nome.ilike.%${termo}%,cpf.ilike.%${termo}%,cnpj.ilike.%${termo}%,telefone.ilike.%${termo}%,documento.ilike.%${termo}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao listar clientes:', error);
        throw new Error('Erro ao listar clientes');
      }

      // Transformar para o formato esperado
      return data?.map(cliente => ({
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
        cnpj: cliente.cnpj,
        telefone: cliente.telefone,
        email: cliente.email,
        endereco: cliente.endereco,
        cidade: cliente.cidade,
        estado: cliente.estado,
        cep: cliente.cep,
        data_nascimento: cliente.data_nascimento,
        documento: cliente.cpf || cliente.cnpj || cliente.documento || '',
        created_at: cliente.created_at,
        updated_at: cliente.updated_at
      })) || [];

    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      throw error;
    }
  }
  
  async obterCliente(id: UUID): Promise<ClienteVenda | null> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Cliente não encontrado
        }
        console.error('Erro ao obter cliente:', error);
        throw new Error('Erro ao obter cliente');
      }

      if (!data) return null;

      // Transformar para o formato esperado
      return {
        id: data.id,
        nome: data.nome,
        cpf: data.cpf,
        cnpj: data.cnpj,
        telefone: data.telefone,
        email: data.email,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        data_nascimento: data.data_nascimento,
        documento: data.cpf || data.cnpj || data.documento || '',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

    } catch (error) {
      console.error('Erro ao obter cliente:', error);
      throw error;
    }
  }
  
  async criarCliente(cliente: CreateClienteVenda): Promise<ClienteVenda> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: cliente.nome,
          cpf: cliente.cpf,
          cnpj: cliente.cnpj,
          telefone: cliente.telefone,
          email: cliente.email,
          endereco: cliente.endereco,
          cidade: cliente.cidade,
          estado: cliente.estado,
          cep: cliente.cep,
          data_nascimento: cliente.data_nascimento,
          ativo: true
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente:', error);
        throw new Error('Erro ao criar cliente');
      }

      // Transformar para o formato esperado
      return {
        id: data.id,
        nome: data.nome,
        cpf: data.cpf,
        cnpj: data.cnpj,
        telefone: data.telefone,
        email: data.email,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        data_nascimento: data.data_nascimento,
        documento: data.cpf || data.cnpj || data.documento || '',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }
  
  async atualizarCliente(id: UUID, cliente: Partial<CreateClienteVenda>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nome: cliente.nome,
          cpf: cliente.cpf,
          cnpj: cliente.cnpj,
          telefone: cliente.telefone,
          email: cliente.email,
          endereco: cliente.endereco,
          cidade: cliente.cidade,
          estado: cliente.estado,
          cep: cliente.cep,
          data_nascimento: cliente.data_nascimento,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar cliente:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return false;
    }
  }
  
  // =====================================================
  // PRODUTOS PARA PDV
  // =====================================================
  
  async buscarProdutosPDV(filtros: FiltroProdutoPDV): Promise<any[]> {
    try {
      let query = supabase
        .from('produtos')
        .select(`
          *,
          categorias_produto(nome),
          forma_farmaceutica(nome),
          fornecedores(nome_fantasia),
          lote(quantidade_atual, data_validade, ativo)
        `)
        .eq('ativo', true);

      if (filtros.termo_busca) {
        query = query.or(`nome.ilike.%${filtros.termo_busca}%,codigo_barras.ilike.%${filtros.termo_busca}%,codigo_produto.ilike.%${filtros.termo_busca}%`);
      }

      if (filtros.categoria_id) {
        query = query.eq('categoria_produto_id', filtros.categoria_id);
      }

      if (filtros.apenas_com_estoque) {
        // Esta lógica pode precisar de uma view ou função no banco
        query = query.not('lote', 'is', null);
      }

      query = query.limit(filtros.limite || 50);

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar produtos PDV:', error);
        throw new Error('Erro ao buscar produtos');
      }

      // Calcular estoque total e transformar dados
      return data?.map(produto => {
        const estoqueTotal = produto.lote
          ?.filter((l: any) => l.ativo && (!l.data_validade || new Date(l.data_validade) > new Date()))
          ?.reduce((sum: number, l: any) => sum + (l.quantidade_atual || 0), 0) || 0;

        return {
          ...produto,
          categoria_nome: produto.categorias_produto?.nome || '',
          forma_farmaceutica_nome: produto.forma_farmaceutica?.nome || '',
          fornecedor_nome: produto.fornecedores?.nome_fantasia || '',
          estoque_total: estoqueTotal
        };
      }) || [];

    } catch (error) {
      console.error('Erro ao buscar produtos PDV:', error);
      throw error;
    }
  }
  
  async validarEstoque(itens: CreateItemVenda[]): Promise<ValidarEstoqueResponse> {
    try {
      // Usar RPC para validação complexa de estoque
      const { data, error } = await supabase.rpc('validar_estoque_vendas', {
        itens_venda: itens
      });

      if (error) {
        console.error('Erro ao validar estoque:', error);
        return {
          valido: false,
          erros: ['Erro interno ao validar estoque']
        };
      }

      return data;

    } catch (error) {
      console.error('Erro ao validar estoque:', error);
      return {
        valido: false,
        erros: ['Erro interno ao validar estoque']
      };
    }
  }
  
  // =====================================================
  // CAIXA
  // =====================================================
  
  async obterCaixaAtivo(): Promise<AberturaCaixa | null> {
    try {
      const { data, error } = await supabase
        .from('abertura_caixa')
        .select(`
          *,
          usuarios(nome)
        `)
        .is('data_fechamento', null)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao obter caixa ativo:', error);
        throw new Error('Erro ao obter caixa ativo');
      }

      return data;

    } catch (error) {
      console.error('Erro ao obter caixa ativo:', error);
      throw error;
    }
  }
  
  async abrirCaixa(valorInicial: number, observacoes?: string): Promise<AberturaCaixa> {
    try {
      const { data, error } = await supabase.rpc('abrir_caixa', {
        valor_inicial: valorInicial,
        observacoes_abertura: observacoes
      });

      if (error) {
        console.error('Erro ao abrir caixa:', error);
        throw new Error('Erro ao abrir caixa');
      }

      return data;

    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      throw error;
    }
  }
  
  async fecharCaixa(aberturaCaixaId: UUID, valorContado: number, observacoes?: string): Promise<FechamentoCaixa> {
    try {
      const { data, error } = await supabase.rpc('fechar_caixa', {
        abertura_caixa_id: aberturaCaixaId,
        valor_contado: valorContado,
        observacoes_fechamento: observacoes
      });

      if (error) {
        console.error('Erro ao fechar caixa:', error);
        throw new Error('Erro ao fechar caixa');
      }

      return data;

    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      throw error;
    }
  }
  
  // =====================================================
  // RELATÓRIOS E ESTATÍSTICAS
  // =====================================================
  
  async obterEstatisticas(dataInicio?: string, dataFim?: string): Promise<EstatisticasVendas> {
    try {
      const { data, error } = await supabase.rpc('obter_estatisticas_vendas', {
        data_inicio: dataInicio,
        data_fim: dataFim
      });

      if (error) {
        console.error('Erro ao obter estatísticas:', error);
        throw new Error('Erro ao obter estatísticas');
      }

      return data || {
        total_vendas: 0,
        valor_total: 0,
        ticket_medio: 0,
        vendas_por_dia: [],
        produtos_mais_vendidos: [],
        formas_pagamento: []
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        total_vendas: 0,
        valor_total: 0,
        ticket_medio: 0,
        vendas_por_dia: [],
        produtos_mais_vendidos: [],
        formas_pagamento: []
      };
    }
  }
}

// Exportar instância única do serviço
export const vendasService = new VendasService();
export default vendasService; 