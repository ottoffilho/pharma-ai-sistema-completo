// =====================================================
// HOOK PARA GESTÃO DE CLIENTES
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Cliente, ClienteFormData, ClienteFilters, ClienteStats } from '@/types/cliente';

// =====================================================
// FUNÇÕES DE API
// =====================================================

async function buscarClientes(filtros: ClienteFilters = {}) {
  let query = supabase
    .from('clientes')
    .select('*')
    .order(filtros.ordem || 'nome', { ascending: filtros.direcao !== 'desc' });

  // Aplicar filtros
  if (filtros.busca) {
    query = query.or(`nome.ilike.%${filtros.busca}%,cpf.ilike.%${filtros.busca}%,cnpj.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%,telefone.ilike.%${filtros.busca}%`);
  }

  if (filtros.ativo !== 'todos' && filtros.ativo !== undefined) {
    query = query.eq('ativo', filtros.ativo);
  }

  if (filtros.tipo_documento && filtros.tipo_documento !== 'todos') {
    if (filtros.tipo_documento === 'cpf') {
      query = query.not('cpf', 'is', null);
    } else if (filtros.tipo_documento === 'cnpj') {
      query = query.not('cnpj', 'is', null);
    }
  }

  if (filtros.data_inicio) {
    query = query.gte('created_at', filtros.data_inicio);
  }

  if (filtros.data_fim) {
    query = query.lte('created_at', filtros.data_fim);
  }

  if (filtros.sem_compras) {
    query = query.eq('total_compras', 0);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

async function buscarClientePorId(id: string) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function criarCliente(dadosCliente: ClienteFormData) {
  const { data, error } = await supabase
    .from('clientes')
    .insert([{
      ...dadosCliente,
      ativo: dadosCliente.ativo ?? true
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('cpf')) {
        throw new Error('Este CPF já está cadastrado no sistema');
      } else if (error.message.includes('cnpj')) {
        throw new Error('Este CNPJ já está cadastrado no sistema');
      } else {
        throw new Error('Cliente já existe no sistema');
      }
    }
    throw new Error(error.message);
  }

  return data;
}

async function atualizarCliente(id: string, dadosCliente: Partial<ClienteFormData>) {
  const { data, error } = await supabase
    .from('clientes')
    .update({
      ...dadosCliente,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('cpf')) {
        throw new Error('Este CPF já está cadastrado no sistema');
      } else if (error.message.includes('cnpj')) {
        throw new Error('Este CNPJ já está cadastrado no sistema');
      } else {
        throw new Error('Dados duplicados no sistema');
      }
    }
    throw new Error(error.message);
  }

  return data;
}

async function desativarCliente(id: string) {
  const { data, error } = await supabase
    .from('clientes')
    .update({ 
      ativo: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function reativarCliente(id: string) {
  const { data, error } = await supabase
    .from('clientes')
    .update({ 
      ativo: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function buscarEstatisticasClientes(): Promise<ClienteStats> {
  // Buscar dados básicos dos clientes
  const { data: clientes, error: errorClientes } = await supabase
    .from('clientes')
    .select('ativo, total_compras');

  if (errorClientes) {
    throw new Error(errorClientes.message);
  }

  // Calcular estatísticas
  const total = clientes?.length || 0;
  const ativos = clientes?.filter(c => c.ativo).length || 0;
  const inativos = total - ativos;
  const com_compras = clientes?.filter(c => c.total_compras && c.total_compras > 0).length || 0;
  const sem_compras = total - com_compras;
  const total_vendas = clientes?.reduce((acc, c) => acc + (c.total_compras || 0), 0) || 0;
  const ticket_medio = com_compras > 0 ? total_vendas / com_compras : 0;

  return {
    total,
    ativos,
    inativos,
    com_compras,
    sem_compras,
    total_vendas,
    ticket_medio
  };
}

async function buscarHistoricoComprasCliente(clienteId: string) {
  const { data, error } = await supabase
    .from('vendas')
    .select(`
      id,
      numero_venda,
      data_venda,
      total,
      status,
      status_pagamento,
      itens_venda (count)
    `)
    .eq('cliente_id', clienteId)
    .order('data_venda', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data?.map(venda => ({
    ...venda,
    itens_count: venda.itens_venda?.[0]?.count || 0
  })) || [];
}

// =====================================================
// HOOKS
// =====================================================

export function useClientes(filtros: ClienteFilters = {}) {
  return useQuery({
    queryKey: ['clientes', filtros],
    queryFn: () => buscarClientes(filtros),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => buscarClientePorId(id),
    enabled: !!id,
  });
}

export function useEstatisticasClientes() {
  return useQuery({
    queryKey: ['clientes', 'estatisticas'],
    queryFn: buscarEstatisticasClientes,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

export function useHistoricoComprasCliente(clienteId: string) {
  return useQuery({
    queryKey: ['cliente', clienteId, 'historico-compras'],
    queryFn: () => buscarHistoricoComprasCliente(clienteId),
    enabled: !!clienteId,
  });
}

export function useCriarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar cliente');
    },
  });
}

export function useAtualizarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<ClienteFormData> }) =>
      atualizarCliente(id, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', data.id] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar cliente');
    },
  });
}

export function useDesativarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: desativarCliente,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', data.id] });
      toast.success('Cliente desativado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao desativar cliente');
    },
  });
}

export function useReativarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reativarCliente,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', data.id] });
      toast.success('Cliente reativado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao reativar cliente');
    },
  });
} 