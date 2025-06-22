// =====================================================
// CONFIGURAÇÕES FARMÁCIA - PHARMA.AI
// Valores configuráveis para comercialização
// =====================================================

export interface ConfiguracaoEstoque {
  // Percentuais para cálculo de estoque mínimo/máximo
  percentualEstoqueMinimoDefault: number;
  percentualEstoqueMaximoDefault: number;
  
  // Produtos de alta rotação (percentuais maiores)
  produtosAltaRotacao: {
    palavrasChave: string[];
    percentualEstoqueMinimo: number;
    percentualEstoqueMaximo: number;
  };
  
  // Produtos específicos (percentuais menores)
  produtosEspecificos: {
    palavrasChave: string[];
    percentualEstoqueMinimo: number;
    percentualEstoqueMaximo: number;
  };
  
  // Limites absolutos
  estoqueMinimo: number;
  estoqueMaximo: number;
}

export interface ConfiguracaoPaginacao {
  limitePadrao: number;
  limiteMaximo: number;
  paginaPadrao: number;
}

export interface ConfiguracaoProcessamento {
  statusNotaImportada: 'RECEBIDA' | 'PROCESSADA' | 'IMPORTADA' | 'PENDENTE';
  limiteTentativasProcessamento: number;
  timeoutProcessamento: number; // em milissegundos
}

export interface ConfiguracaoMensagens {
  notaJaImportada: string;
  produtoEncontrado: string;
  produtoNovo: string;
  loteProcessado: string;
  erroProcessamento: string;
  sucessoImportacao: string;
  inicioProcessamento: string;
}

export interface ConfiguracaoMarkup {
  // Percentuais padrão por categoria (podem ser sobrescritos)
  percentuaisPadrao: {
    alopaticos: number;
    homeopaticos: number;
    embalagens: number;
    insumos: number;
    revenda: number;
  };
  
  // Limites para validação
  markupMinimo: number;
  markupMaximo: number;
  
  // Avisos para faixas não recomendadas
  faixaAvisoMinimo: number;
  faixaAvisoMaximo: number;
}

// =====================================================
// CONFIGURAÇÃO PADRÃO (PODE SER SOBRESCRITA)
// =====================================================

export const CONFIGURACAO_PADRAO: {
  estoque: ConfiguracaoEstoque;
  paginacao: ConfiguracaoPaginacao;
  processamento: ConfiguracaoProcessamento;
  mensagens: ConfiguracaoMensagens;
  markup: ConfiguracaoMarkup;
} = {
  estoque: {
    percentualEstoqueMinimoDefault: 0.25, // 25%
    percentualEstoqueMaximoDefault: 2.0,   // 200%
    
    produtosAltaRotacao: {
      palavrasChave: ['BACH', 'FLORAL', 'RESCUE', 'EMERGENCY'],
      percentualEstoqueMinimo: 0.5, // 50%
      percentualEstoqueMaximo: 3.0   // 300%
    },
    
    produtosEspecificos: {
      palavrasChave: ['CH', 'CENTESIMAL', 'HOMEOPAT'],
      percentualEstoqueMinimo: 0.2, // 20%
      percentualEstoqueMaximo: 1.5  // 150%
    },
    
    estoqueMinimo: 1,
    estoqueMaximo: 1000
  },
  
  paginacao: {
    limitePadrao: 50,
    limiteMaximo: 200,
    paginaPadrao: 1
  },
  
  processamento: {
    statusNotaImportada: 'RECEBIDA',
    limiteTentativasProcessamento: 3,
    timeoutProcessamento: 30000 // 30 segundos
  },
  
  mensagens: {
    notaJaImportada: 'Nota fiscal {numero} já foi importada anteriormente',
    produtoEncontrado: 'Produto existente encontrado: {nome}',
    produtoNovo: 'Novo produto criado: {nome}',
    loteProcessado: 'Lote processado: {numero} (ID: {id})',
    erroProcessamento: 'Erro ao processar item: {erro}',
    sucessoImportacao: 'Importação concluída com sucesso',
    inicioProcessamento: 'Iniciando importação do XML'
  },
  
  markup: {
    percentuaisPadrao: {
      alopaticos: 2.5,    // 250%
      homeopaticos: 3.0,  // 300%
      embalagens: 2.0,    // 200%
      insumos: 2.2,       // 220%
      revenda: 1.8        // 180%
    },
    
    markupMinimo: 0.1,    // 10%
    markupMaximo: 999.0,  // 99900%
    
    faixaAvisoMinimo: 1.5, // Avisar se markup < 150%
    faixaAvisoMaximo: 8.0  // Avisar se markup > 800%
  }
};

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

/**
 * Interpola mensagens com variáveis
 */
export const interpolaMensagem = (template: string, variaveis: Record<string, any>): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variaveis[key]?.toString() || match;
  });
};

/**
 * Valida se o markup está dentro dos limites configurados
 */
export const validarMarkup = (markup: number, config: ConfiguracaoMarkup): {
  valido: boolean;
  aviso?: string;
  erro?: string;
} => {
  if (markup < config.markupMinimo) {
    return {
      valido: false,
      erro: `Markup muito baixo. Mínimo permitido: ${config.markupMinimo * 100}%`
    };
  }
  
  if (markup > config.markupMaximo) {
    return {
      valido: false,
      erro: `Markup muito alto. Máximo permitido: ${config.markupMaximo * 100}%`
    };
  }
  
  if (markup < config.faixaAvisoMinimo) {
    return {
      valido: true,
      aviso: `Markup baixo (${(markup * 100).toFixed(1)}%). Recomendado: acima de ${config.faixaAvisoMinimo * 100}%`
    };
  }
  
  if (markup > config.faixaAvisoMaximo) {
    return {
      valido: true,
      aviso: `Markup alto (${(markup * 100).toFixed(1)}%). Recomendado: abaixo de ${config.faixaAvisoMaximo * 100}%`
    };
  }
  
  return { valido: true };
};

/**
 * Calcula estoque baseado na configuração
 */
export const calcularEstoque = (
  nomeProduto: string, 
  quantidadeComprada: number, 
  config: ConfiguracaoEstoque,
  tipo: 'minimo' | 'maximo'
): number => {
  const nomeUpper = nomeProduto.toUpperCase();
  
  // Verificar se é produto de alta rotação
  const isAltaRotacao = config.produtosAltaRotacao.palavrasChave.some(
    palavra => nomeUpper.includes(palavra)
  );
  
  // Verificar se é produto específico
  const isEspecifico = config.produtosEspecificos.palavrasChave.some(
    palavra => nomeUpper.includes(palavra)
  );
  
  let percentual: number;
  
  if (tipo === 'minimo') {
    if (isAltaRotacao) {
      percentual = config.produtosAltaRotacao.percentualEstoqueMinimo;
    } else if (isEspecifico) {
      percentual = config.produtosEspecificos.percentualEstoqueMinimo;
    } else {
      percentual = config.percentualEstoqueMinimoDefault;
    }
  } else {
    if (isAltaRotacao) {
      percentual = config.produtosAltaRotacao.percentualEstoqueMaximo;
    } else if (isEspecifico) {
      percentual = config.produtosEspecificos.percentualEstoqueMaximo;
    } else {
      percentual = config.percentualEstoqueMaximoDefault;
    }
  }
  
  const calculado = Math.ceil(quantidadeComprada * percentual);
  
  // Aplicar limites absolutos
  if (tipo === 'minimo') {
    return Math.max(config.estoqueMinimo, calculado);
  } else {
    return Math.min(config.estoqueMaximo, Math.max(config.estoqueMinimo, calculado));
  }
};

// =====================================================
// CONFIGURAÇÃO GLOBAL (PODE SER SOBRESCRITA)
// =====================================================

let configuracaoAtual = { ...CONFIGURACAO_PADRAO };

/**
 * Atualiza a configuração global
 */
export const atualizarConfiguracao = (novaConfig: Partial<typeof CONFIGURACAO_PADRAO>): void => {
  configuracaoAtual = {
    ...configuracaoAtual,
    ...novaConfig,
    // Merge profundo para objetos aninhados
    estoque: { ...configuracaoAtual.estoque, ...novaConfig.estoque },
    paginacao: { ...configuracaoAtual.paginacao, ...novaConfig.paginacao },
    processamento: { ...configuracaoAtual.processamento, ...novaConfig.processamento },
    mensagens: { ...configuracaoAtual.mensagens, ...novaConfig.mensagens },
    markup: { ...configuracaoAtual.markup, ...novaConfig.markup }
  };
};

/**
 * Obtém a configuração atual
 */
export const obterConfiguracao = () => configuracaoAtual;

/**
 * Reseta para configuração padrão
 */
export const resetarConfiguracao = (): void => {
  configuracaoAtual = { ...CONFIGURACAO_PADRAO };
}; 