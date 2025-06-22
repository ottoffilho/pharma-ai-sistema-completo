// =====================================================
// TIPOS PARA SISTEMA DE VENDAS/PDV - PHARMA.AI
// Seguindo as diretrizes do projeto
// =====================================================

import { UUID, Timestamp } from './database';

// =====================================================
// TIPOS BASE DE VENDAS
// =====================================================

export type StatusVenda = 'rascunho' | 'aberta' | 'finalizada' | 'cancelada';
export type FormaPagamento = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'boleto' | 'convenio';
export type StatusPagamento = 'pendente' | 'parcial' | 'pago' | 'cancelado';

// =====================================================
// INTERFACE DE VENDA
// =====================================================

export interface Venda {
  id: UUID;
  numero_venda: string; // Número sequencial da venda
  
  // Cliente
  cliente_id?: UUID;
  cliente_nome?: string;
  cliente_documento?: string;
  cliente_telefone?: string;
  
  // Valores
  subtotal: number;
  desconto_valor: number;
  desconto_percentual: number;
  total: number;
  troco?: number;
  
  // Status
  status: StatusVenda;
  status_pagamento: StatusPagamento;
  
  // Operação
  usuario_id: UUID; // Quem realizou a venda
  data_venda: Timestamp;
  observacoes?: string;
  
  // Receita associada (se aplicável)
  receita_id?: UUID;
  
  // Controle
  created_at: Timestamp;
  updated_at: Timestamp;
}

// =====================================================
// ITENS DA VENDA
// =====================================================

export interface ItemVenda {
  id: UUID;
  venda_id: UUID;
  produto_id: UUID;
  lote_id?: UUID;
  
  // Produto
  produto_nome: string;
  produto_codigo?: string;
  
  // Quantidades
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  
  // Desconto específico do item
  desconto_valor: number;
  desconto_percentual: number;
  
  // Observações específicas do item
  observacoes?: string;
  
  // Controle
  created_at: Timestamp;
  updated_at: Timestamp;
}

// =====================================================
// PAGAMENTOS DA VENDA
// =====================================================

export interface PagamentoVenda {
  id: UUID;
  venda_id: UUID;
  
  // Pagamento
  forma_pagamento: FormaPagamento;
  valor: number;
  
  // Específicos para cartão
  numero_autorizacao?: string;
  bandeira_cartao?: string;
  
  // Específicos para PIX/transferência
  codigo_transacao?: string;
  
  // Observações
  observacoes?: string;
  
  // Controle
  usuario_id: UUID;
  data_pagamento: Timestamp;
  created_at: Timestamp;
}

// =====================================================
// CLIENTE SIMPLIFICADO
// =====================================================

export interface ClienteVenda {
  id: UUID;
  nome: string;
  cpf?: string; // CPF para pessoa física
  cnpj?: string; // CNPJ para pessoa jurídica
  documento?: string; // CPF/CNPJ (campo genérico para compatibilidade)
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  data_nascimento?: string;
  
  // Histórico
  total_compras?: number;
  ultima_compra?: Timestamp;
  
  // Programa fidelidade
  pontos_fidelidade?: number;
  
  // Controle
  ativo?: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// =====================================================
// CARRINHO DE COMPRAS (SESSÃO PDV)
// =====================================================

export interface ItemCarrinho {
  produto_id: UUID;
  produto_nome: string;
  produto_codigo?: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  estoque_disponivel: number;
  desconto_valor?: number;
  desconto_percentual?: number;
  observacoes?: string;
  lote_id?: UUID;
  lote_numero?: string;
  lote_validade?: string;
}

export interface CarrinhoCompras {
  itens: ItemCarrinho[];
  subtotal: number;
  desconto_total: number;
  total: number;
  observacoes?: string;
  cliente?: ClienteVenda;
}

// =====================================================
// INTERFACES COMPLETAS COM RELACIONAMENTOS
// =====================================================

export interface VendaCompleta extends Venda {
  itens: ItemVenda[];
  pagamentos: PagamentoVenda[];
  cliente?: ClienteVenda;
  usuario_nome?: string;
}

export interface ItemVendaCompleto extends ItemVenda {
  produto: {
    id: UUID;
    nome: string;
    codigo_interno?: string;
    codigo_ean?: string;
    categoria?: string;
    estoque_atual: number;
    preco_venda: number;
    controlado: boolean;
    requer_receita: boolean;
  };
  lote?: {
    id: UUID;
    numero_lote: string;
    data_validade?: string;
    quantidade_atual: number;
  };
}

// =====================================================
// FILTROS E BUSCA
// =====================================================

export interface FiltrosVenda {
  data_inicio?: string;
  data_fim?: string;
  status?: StatusVenda;
  status_pagamento?: StatusPagamento;
  usuario_id?: UUID;
  cliente_id?: UUID;
  forma_pagamento?: FormaPagamento;
  valor_minimo?: number;
  valor_maximo?: number;
  numero_venda?: string;
}

export interface FiltrosCliente {
  nome?: string;
  documento?: string;
  telefone?: string;
  ativo?: boolean;
}

export interface FiltroProdutoPDV {
  termo_busca?: string; // Busca por nome, código interno, EAN
  categoria_id?: UUID;
  apenas_com_estoque?: boolean;
  apenas_ativos?: boolean;
  controlado?: boolean;
  manipulado?: boolean;
}

// =====================================================
// RELATÓRIOS E ESTATÍSTICAS
// =====================================================

export interface EstatisticasVendas {
  // Vendas do período
  total_vendas_periodo: number;
  valor_total_vendas: number;
  ticket_medio: number;
  
  // Comparativo
  crescimento_vendas: number; // % em relação ao período anterior
  crescimento_valor: number;
  
  // Por forma de pagamento
  vendas_por_forma_pagamento: {
    forma_pagamento: FormaPagamento;
    quantidade: number;
    valor_total: number;
    percentual: number;
  }[];
  
  // Top produtos
  produtos_mais_vendidos: {
    produto_id: UUID;
    produto_nome: string;
    quantidade_vendida: number;
    valor_total: number;
  }[];
  
  // Por vendedor
  vendas_por_usuario: {
    usuario_id: UUID;
    usuario_nome: string;
    quantidade_vendas: number;
    valor_total: number;
    ticket_medio: number;
  }[];
}

export interface RelatorioVendasDiario {
  data: string;
  abertura_caixa?: Timestamp;
  fechamento_caixa?: Timestamp;
  usuario_abertura?: string;
  usuario_fechamento?: string;
  
  // Totais
  total_vendas: number;
  valor_total: number;
  ticket_medio: number;
  
  // Por forma de pagamento
  formas_pagamento: {
    forma: FormaPagamento;
    quantidade: number;
    valor: number;
  }[];
  
  // Resumo de produtos
  produtos_vendidos: number;
  itens_vendidos: number;
}

// =====================================================
// OPERAÇÕES DE CAIXA
// =====================================================

export interface AberturaCaixa {
  id: UUID;
  usuario_id: UUID;
  data_abertura: Timestamp;
  valor_inicial: number;
  observacoes?: string;
  created_at: Timestamp;
}

export interface FechamentoCaixa {
  id: UUID;
  abertura_caixa_id: UUID;
  usuario_id: UUID;
  data_fechamento: Timestamp;
  
  // Valores calculados
  valor_vendas: number;
  valor_entrada: number;
  valor_saida: number;
  valor_esperado: number;
  valor_contado: number;
  diferenca: number;
  
  observacoes?: string;
  created_at: Timestamp;
}

// =====================================================
// TIPOS PARA CRIAÇÃO E ATUALIZAÇÃO
// =====================================================

export type CreateVenda = Omit<Venda, 'id' | 'numero_venda' | 'created_at' | 'updated_at'>;
export type CreateItemVenda = Omit<ItemVenda, 'id' | 'created_at' | 'updated_at'>;
export type CreatePagamentoVenda = Omit<PagamentoVenda, 'id' | 'created_at'>;
export type CreateClienteVenda = Omit<ClienteVenda, 'id' | 'total_compras' | 'ultima_compra' | 'pontos_fidelidade' | 'created_at' | 'updated_at'>;

export type UpdateVenda = Partial<CreateVenda> & { id: UUID };
export type UpdateItemVenda = Partial<CreateItemVenda> & { id: UUID };
export type UpdateClienteVenda = Partial<CreateClienteVenda> & { id: UUID };

// =====================================================
// RESPONSES ESPECÍFICOS
// =====================================================

export interface ProcessarVendaResponse {
  sucesso: boolean;
  venda_id?: UUID;
  numero_venda?: string;
  total?: number;
  erro?: string;
  validacoes?: {
    campo: string;
    mensagem: string;
  }[];
}

export interface ValidarEstoqueResponse {
  valido: boolean;
  erros: {
    produto_id: UUID;
    produto_nome: string;
    quantidade_solicitada: number;
    quantidade_disponivel: number;
  }[];
}

export interface CalcularTrocaResponse {
  valor_recebido: number;
  valor_venda: number;
  troco: number;
  diferenca: number; // Positivo = troco, Negativo = falta
} 