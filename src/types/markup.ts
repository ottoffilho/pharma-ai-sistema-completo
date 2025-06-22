export interface ConfiguracaoMarkup {
  id: number;
  markup_global_padrao: number;
  markup_minimo: number;
  markup_maximo: number;
  permitir_markup_zero: boolean;
  aplicar_automatico_importacao: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaMarkup {
  id: number;
  categoria_nome: string;
  markup_padrao: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface HistoricoPreco {
  id: number;
  entidade_tipo: 'insumo' | 'embalagem' | 'produto';
  entidade_id: string;
  preco_custo_anterior: number | null;
  preco_custo_novo: number | null;
  markup_anterior: number | null;
  markup_novo: number | null;
  preco_venda_anterior: number | null;
  preco_venda_novo: number | null;
  motivo: string | null;
  usuario_id: string;
  created_at: string;
}

export interface MarkupCalculationResult {
  preco_venda: number;
  margem_lucro: number;
  markup_aplicado: number;
}

export interface MarkupFormData {
  markup: number;
  markup_personalizado: boolean;
}

export interface CalcularPrecoParams {
  preco_custo: number;
  markup: number;
}

export interface ValidarMarkupParams {
  markup: number;
  categoria?: string;
  configuracao?: ConfiguracaoMarkup;
}

// Enums para facilitar o uso
export enum TipoEntidade {
  INSUMO = 'insumo',
  EMBALAGEM = 'embalagem',
  PRODUTO = 'produto'
}

export enum CategoriaMarkupEnum {
  ALOPATICOS = 'alopaticos',
  EMBALAGENS = 'embalagens',
  HOMEOPATICOS = 'homeopaticos',
  REVENDA = 'revenda'
} 