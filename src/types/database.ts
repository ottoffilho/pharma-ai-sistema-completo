// =====================================================
// TIPOS DO BANCO DE DADOS - PHARMA.AI
// Baseado na análise da Nota Fiscal XML
// Seguindo as diretrizes do projeto
// =====================================================

// Tipos base
export type UUID = string;
export type Timestamp = string;

// =====================================================
// MÓDULO M01: CADASTROS ESSENCIAIS
// =====================================================

export interface Fornecedor {
  id: UUID;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  cnae?: string;
  crt?: number; // Código de Regime Tributário
  telefone?: string;
  email?: string;
  
  // Endereço
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  codigo_municipio: string;
  pais: string;
  
  // Controle
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CategoriasProduto {
  id: UUID;
  nome: string;
  descricao?: string;
  codigo?: string;
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface FormaFarmaceutica {
  id: UUID;
  nome: string; // TM, CH, FC, etc.
  descricao?: string;
  sigla?: string;
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Produto {
  id: UUID;
  codigo_interno: string; // cProd do XML
  codigo_ean?: string; // cEAN do XML (pode ser "SEM GTIN")
  nome: string; // xProd do XML
  descricao?: string;
  
  // Classificações
  categoria_produto_id?: UUID;
  forma_farmaceutica_id?: UUID;
  fornecedor_id?: UUID;
  
  // Dados Fiscais
  ncm: string; // NCM do XML
  cfop?: string; // CFOP padrão para o produto
  origem?: number; // Origem da mercadoria (0, 1, 2, etc.)
  cst_icms?: string; // CST do ICMS
  cst_ipi?: string; // CST do IPI
  cst_pis?: string; // CST do PIS
  cst_cofins?: string; // CST do COFINS
  
  // Unidades
  unidade_comercial: string; // uCom do XML
  unidade_tributaria?: string; // uTrib do XML
  
  // Preços e Custos
  preco_custo?: number;
  preco_venda?: number;
  margem_lucro?: number;
  
  // Impostos (percentuais padrão)
  aliquota_icms?: number;
  aliquota_ipi?: number;
  aliquota_pis?: number;
  aliquota_cofins?: number;
  
  // Controle de Estoque
  estoque_minimo: number;
  estoque_maximo: number;
  estoque_atual: number;
  
  // Flags de Controle
  controlado: boolean; // Medicamento controlado
  requer_receita: boolean;
  produto_manipulado: boolean;
  produto_revenda: boolean;
  ativo: boolean;
  
  // Controle
  created_at: Timestamp;
  updated_at: Timestamp;
  
  categoria?: string; // Categoria simplificada (alopaticos, embalagens, homeopaticos, revenda)
}

// =====================================================
// MÓDULO M04: GESTÃO DE ESTOQUE
// =====================================================

export interface Lote {
  id: UUID;
  produto_id: UUID; // Referência para a tabela produtos
  numero_lote: string; // nLote do XML
  data_fabricacao?: string; // dFab do XML
  data_validade?: string; // dVal do XML
  quantidade_inicial: number;
  quantidade_atual: number;
  preco_custo_unitario?: number;
  fornecedor_id?: UUID;
  observacoes?: string;
  
  // Controle
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface EstoqueMovimentacao {
  id: UUID;
  produto_id: UUID; // Referência para insumos ou produtos
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  quantidade_anterior?: number;
  quantidade_nova?: number;
  motivo?: string;
  documento_referencia?: string;
  usuario_id?: UUID;
  
  // Controle
  created_at: Timestamp;
  updated_at: Timestamp;
}

// =====================================================
// MÓDULO M10: FISCAL
// =====================================================

export interface NotaFiscal {
  id: UUID;
  
  // Identificação da NF-e
  chave_acesso: string; // Chave de 44 dígitos
  numero_nf: number;
  serie: number;
  modelo: number; // 55 = NF-e
  
  // Datas
  data_emissao: Timestamp;
  data_saida_entrada?: Timestamp;
  data_recebimento?: Timestamp;
  
  // Emitente
  fornecedor_id: UUID;
  
  // Valores Totais
  valor_produtos: number;
  valor_frete?: number;
  valor_seguro?: number;
  valor_desconto?: number;
  valor_outras_despesas?: number;
  valor_total_nota: number;
  
  // Impostos Totais
  base_calculo_icms?: number;
  valor_icms?: number;
  valor_ipi?: number;
  valor_pis?: number;
  valor_cofins?: number;
  valor_total_tributos?: number;
  
  // Transporte
  modalidade_frete?: number; // 0=Emitente, 1=Destinatário, etc.
  transportadora_cnpj?: string;
  transportadora_nome?: string;
  peso_liquido?: number;
  peso_bruto?: number;
  quantidade_volumes?: number;
  
  // Status e Controle
  status: 'RECEBIDA' | 'PROCESSADA' | 'CANCELADA';
  observacoes?: string;
  
  // Informações do arquivo XML
  xml_arquivo_path?: string;
  xml_arquivo_nome?: string;
  xml_arquivo_tamanho?: number;
  
  // Controle
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ItemNotaFiscal {
  id: UUID;
  nota_fiscal_id: UUID;
  produto_id?: UUID;
  
  // Sequencial do item na nota
  numero_item: number;
  
  // Dados do produto direto do XML
  codigo_produto: string;
  codigo_ean?: string;
  descricao_produto: string;
  ncm: string;
  cfop: string;
  unidade_comercial: string;
  unidade_tributaria?: string;
  
  // Quantidades e Valores
  quantidade_comercial: number;
  quantidade_tributaria?: number;
  valor_unitario_comercial: number;
  valor_unitario_tributario?: number;
  valor_total_produto: number;
  valor_frete?: number;
  valor_seguro?: number;
  valor_desconto?: number;
  valor_outras_despesas?: number;
  
  // ICMS
  origem_produto?: number;
  cst_icms?: string;
  modalidade_bc_icms?: number;
  valor_bc_icms?: number;
  aliquota_icms?: number;
  valor_icms?: number;
  
  // IPI
  cst_ipi?: string;
  aliquota_ipi?: number;
  valor_bc_ipi?: number;
  valor_ipi?: number;
  
  // PIS
  cst_pis?: string;
  aliquota_pis?: number;
  valor_bc_pis?: number;
  valor_pis?: number;
  
  // COFINS
  cst_cofins?: string;
  aliquota_cofins?: number;
  valor_bc_cofins?: number;
  valor_cofins?: number;
  
  // Controle de processamento
  produto_criado?: boolean;
  lote_criado?: boolean;
  processado?: boolean;
  informacoes_adicionais?: string;
  
  // Controle
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

// =====================================================
// TIPOS PARA FORMULÁRIOS E DTOs
// =====================================================

// Tipos para criação (sem campos auto-gerados)
export type CreateFornecedor = Omit<Fornecedor, 'id' | 'created_at' | 'updated_at'>;
export type CreateCategoriasProduto = Omit<CategoriasProduto, 'id' | 'created_at' | 'updated_at'>;
export type CreateFormaFarmaceutica = Omit<FormaFarmaceutica, 'id' | 'created_at' | 'updated_at'>;
export type CreateProduto = Omit<Produto, 'id' | 'created_at' | 'updated_at'>;
export type CreateLote = Omit<Lote, 'id' | 'created_at' | 'updated_at'>;
export type CreateEstoqueMovimentacao = Omit<EstoqueMovimentacao, 'id' | 'created_at' | 'updated_at'>;
export type CreateNotaFiscal = Omit<NotaFiscal, 'id' | 'created_at' | 'updated_at'>;
export type CreateItemNotaFiscal = Omit<ItemNotaFiscal, 'id' | 'created_at' | 'updated_at'>;

// Tipos para atualização (todos os campos opcionais exceto ID)
export type UpdateFornecedor = Partial<CreateFornecedor> & { id: UUID };
export type UpdateCategoriasProduto = Partial<CreateCategoriasProduto> & { id: UUID };
export type UpdateFormaFarmaceutica = Partial<CreateFormaFarmaceutica> & { id: UUID };
export type UpdateProduto = Partial<CreateProduto> & { id: UUID };
export type UpdateLote = Partial<CreateLote> & { id: UUID };
export type UpdateEstoqueMovimentacao = Partial<CreateEstoqueMovimentacao> & { id: UUID };
export type UpdateNotaFiscal = Partial<CreateNotaFiscal> & { id: UUID };
export type UpdateItemNotaFiscal = Partial<CreateItemNotaFiscal> & { id: UUID };

// =====================================================
// TIPOS PARA VIEWS E JOINS
// =====================================================

// Produto com relacionamentos
export interface ProdutoCompleto extends Produto {
  categoria_produto?: CategoriasProduto;
  forma_farmaceutica?: FormaFarmaceutica;
  fornecedor?: Fornecedor;
  lotes?: Lote[];
}

// Nota Fiscal com relacionamentos
export interface NotaFiscalCompleta extends NotaFiscal {
  fornecedor: Fornecedor;
  itens: ItemNotaFiscalCompleto[];
}

// Item da Nota Fiscal com relacionamentos
export interface ItemNotaFiscalCompleto extends ItemNotaFiscal {
  produto: ProdutoCompleto;
  lote?: Lote;
}

// =====================================================
// TIPOS PARA FILTROS E BUSCA
// =====================================================

export interface FiltrosProduto {
  nome?: string;
  categoria_produto_id?: UUID;
  forma_farmaceutica_id?: UUID;
  fornecedor_id?: UUID;
  controlado?: boolean;
  ativo?: boolean;
  estoque_baixo?: boolean; // estoque_atual <= estoque_minimo
}

export interface FiltrosNotaFiscal {
  fornecedor_id?: UUID;
  data_emissao_inicio?: string;
  data_emissao_fim?: string;
  status?: NotaFiscal['status'];
  numero_nf?: number;
  chave_acesso?: string;
}

export interface FiltrosLote {
  produto_id?: UUID;
  data_validade_inicio?: string;
  data_validade_fim?: string;
  vencimento_proximo?: boolean; // validade <= 30 dias
  numero_lote?: string;
}

// =====================================================
// TIPOS PARA PAGINAÇÃO
// =====================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =====================================================
// TIPOS PARA IMPORTAÇÃO DE NF-e
// =====================================================

export interface ImportacaoNFe {
  arquivo_xml: File;
  fornecedor_id?: UUID;
  processar_automaticamente?: boolean;
}

export interface ResultadoImportacaoNFe {
  sucesso: boolean;
  nota_fiscal_id?: UUID;
  fornecedor_id?: UUID;
  produtos_importados: number;
  produtos_novos: number;
  produtos_atualizados: number;
  lotes_criados: number;
  erros: string[];
  avisos: string[];
}

// =====================================================
// TIPOS PARA DASHBOARD E RELATÓRIOS
// =====================================================

export interface EstatisticasEstoque {
  total_produtos: number;
  produtos_estoque_baixo: number;
  produtos_vencimento_proximo: number;
  valor_total_estoque: number;
  produtos_controlados: number;
}

export interface EstatisticasFinanceiras {
  valor_total_compras_mes: number;
  valor_total_compras_ano: number;
  numero_notas_mes: number;
  numero_notas_ano: number;
  fornecedores_ativos: number;
}

// =====================================================
// TIPOS PARA VALIDAÇÃO
// =====================================================

export interface ValidacaoCNPJ {
  cnpj: string;
  valido: boolean;
  formatado: string;
}

export interface ValidacaoNCM {
  ncm: string;
  valido: boolean;
  descricao?: string;
}

export interface ValidacaoChaveNFe {
  chave: string;
  valida: boolean;
  uf: string;
  ano: string;
  mes: string;
  cnpj_emitente: string;
  modelo: string;
  serie: string;
  numero: string;
  codigo_verificador: string;
}

export interface CreateNotaFiscal {
  chave_acesso: string;
  numero_nf: number;
  serie: number;
  modelo: number;
  data_emissao: string;
  data_saida_entrada?: string;
  fornecedor_id?: UUID;
  
  // Valores
  valor_produtos: number;
  valor_frete?: number;
  valor_seguro?: number;
  valor_desconto?: number;
  valor_outras_despesas?: number;
  valor_total_nota: number;
  
  // Impostos
  valor_icms?: number;
  valor_ipi?: number;
  valor_pis?: number;
  valor_cofins?: number;
  valor_total_tributos?: number;
  
  // Status
  status?: string;
  
  // Informações do arquivo XML
  xml_arquivo_path?: string;
  xml_arquivo_nome?: string;
  xml_arquivo_tamanho?: number;
} 