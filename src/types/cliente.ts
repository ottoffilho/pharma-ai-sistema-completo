// =====================================================
// TIPOS PARA MÓDULO DE GESTÃO DE CLIENTES
// =====================================================

export interface Cliente {
  id: string;
  nome: string;
  documento?: string; // Campo genérico mantido para compatibilidade
  cpf?: string; // CPF específico (11 dígitos)
  cnpj?: string; // CNPJ específico (14 dígitos)
  telefone?: string;
  email?: string;
  endereco?: string;
  data_nascimento?: string; // ISO date string
  total_compras?: number;
  ultima_compra?: string; // ISO datetime string
  pontos_fidelidade?: number;
  ativo?: boolean;
  created_at?: string; // ISO datetime string
  updated_at?: string; // ISO datetime string
}

export interface ClienteFormData {
  nome: string;
  cpf?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  data_nascimento?: string;
  ativo?: boolean;
}

export interface ClienteFilters {
  busca?: string;
  tipo_documento?: 'cpf' | 'cnpj' | 'todos';
  ativo?: boolean | 'todos';
  data_inicio?: string;
  data_fim?: string;
  sem_compras?: boolean;
  ordem?: 'nome' | 'total_compras' | 'ultima_compra' | 'created_at';
  direcao?: 'asc' | 'desc';
}

export interface ClienteStats {
  total: number;
  ativos: number;
  inativos: number;
  com_compras: number;
  sem_compras: number;
  total_vendas: number;
  ticket_medio: number;
}

export interface EstatisticasClienteDetalhes {
  total_vendas: number;
  ticket_medio: number;
  ultima_compra: string | null;
  produtos_favoritos: string[];
  freq_compras_mes: number;
}

export interface ClienteHistoricoCompra {
  id: string;
  numero_venda: string;
  data_venda: string;
  total: number;
  status: string;
  status_pagamento: string;
  itens_count: number;
}

// Constantes para validação
export const CLIENTE_VALIDATION = {
  nome: {
    min: 2,
    max: 100,
    required: true
  },
  cpf: {
    length: 11,
    pattern: /^\d{11}$/
  },
  cnpj: {
    length: 14,
    pattern: /^\d{14}$/
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  telefone: {
    min: 10,
    max: 15,
    pattern: /^[\d\s()-+]+$/
  }
} as const;

export const CLIENTE_STATUS_OPTIONS = [
  { value: true, label: 'Ativo', color: 'success' },
  { value: false, label: 'Inativo', color: 'destructive' }
] as const;

export const TIPO_DOCUMENTO_OPTIONS = [
  { value: 'cpf', label: 'CPF (Pessoa Física)' },
  { value: 'cnpj', label: 'CNPJ (Pessoa Jurídica)' },
  { value: 'todos', label: 'Todos os tipos' }
] as const; 