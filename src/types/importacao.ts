// =====================================================
// TIPOS PARA IMPORTAÇÃO DE NOTA FISCAL - PHARMA.AI
// =====================================================

export interface ArquivoUpload {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  resultado?: ResultadoImportacaoNFe;
  erro?: string;
  validacao?: ValidacaoArquivo;
}

export interface ValidacaoArquivo {
  valido: boolean;
  erros: string[];
  avisos: string[];
  tamanho: number;
  tipo: string;
}

export interface ResultadoImportacaoNFe {
  sucesso: boolean;
  nota_fiscal_id: string;
  fornecedor_id: string;
  produtos_importados: number;
  produtos_atualizados: number;
  produtos_novos: number;
  valor_total: number;
  numero_nota: string;
  data_emissao: string;
  detalhes: {
    fornecedor: {
      nome: string;
      cnpj: string;
      criado: boolean;
    };
    produtos: ProdutoImportado[];
  };
  logs: LogImportacao[];
}

export interface ProdutoImportado {
  id: string;
  nome: string;
  codigo: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  unidade_medida: string;
  acao: 'criado' | 'atualizado' | 'ignorado';
  motivo?: string;
}

export interface LogImportacao {
  timestamp: string;
  nivel: 'info' | 'warning' | 'error';
  mensagem: string;
  detalhes?: Record<string, unknown>;
}

export interface ConfiguracaoImportacao {
  permitir_sobrescrita: boolean;
  criar_fornecedor_automatico: boolean;
  validar_cnpj: boolean;
  processar_duplicatas: 'ignorar' | 'atualizar' | 'criar_novo';
  limite_arquivo_mb: number;
  tipos_permitidos: string[];
}

export interface EstatisticasImportacao {
  total: number;
  pendentes: number;
  processando: number;
  sucesso: number;
  erro: number;
  produtos_importados: number;
  valor_total_importado: number;
}

// Constantes
export const CONFIGURACAO_PADRAO: ConfiguracaoImportacao = {
  permitir_sobrescrita: true,
  criar_fornecedor_automatico: true,
  validar_cnpj: true,
  processar_duplicatas: 'atualizar',
  limite_arquivo_mb: 10,
  tipos_permitidos: ['.xml', 'text/xml', 'application/xml']
};

export const MENSAGENS_ERRO = {
  ARQUIVO_MUITO_GRANDE: 'Arquivo muito grande. Limite máximo: {limite}MB',
  TIPO_INVALIDO: 'Tipo de arquivo não suportado. Use apenas arquivos XML',
  XML_INVALIDO: 'Arquivo XML inválido ou corrompido',
  NOTA_DUPLICADA: 'Nota fiscal já foi importada anteriormente',
  FORNECEDOR_NAO_ENCONTRADO: 'Fornecedor não encontrado no sistema',
  PRODUTOS_NAO_ENCONTRADOS: 'Nenhum produto válido encontrado na nota fiscal',
  ERRO_CONEXAO: 'Erro de conexão com o servidor',
  ERRO_DESCONHECIDO: 'Erro desconhecido durante a importação'
} as const; 