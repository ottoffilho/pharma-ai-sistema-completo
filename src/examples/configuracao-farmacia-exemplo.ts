// =====================================================
// EXEMPLO DE CONFIGURAÇÃO PERSONALIZADA - PHARMA.AI
// Como personalizar o sistema para diferentes farmácias
// =====================================================

import { 
  atualizarConfiguracao, 
  obterConfiguracao, 
  CONFIGURACAO_PADRAO 
} from '@/constants/configuracao-farmacia';

// =====================================================
// EXEMPLO 1: FARMÁCIA DE MANIPULAÇÃO ESPECIALIZADA EM HOMEOPATIA
// =====================================================

export const configurarFarmaciaHomeopatica = () => {
  atualizarConfiguracao({
    estoque: {
      ...CONFIGURACAO_PADRAO.estoque,
      // Produtos homeopáticos têm alta rotação nesta farmácia
      produtosAltaRotacao: {
        palavrasChave: ['CH', 'DH', 'LM', 'FC', 'TM', 'FLORAL', 'BACH', 'HOMEOPAT'],
        percentualEstoqueMinimo: 0.8, // 80% - estoque alto
        percentualEstoqueMaximo: 4.0   // 400% - estoque muito alto
      },
      // Produtos alopáticos são específicos
      produtosEspecificos: {
        palavrasChave: ['ÁCIDO', 'SULFATO', 'CLORIDRATO', 'VITAMINA'],
        percentualEstoqueMinimo: 0.1, // 10% - estoque baixo
        percentualEstoqueMaximo: 1.2  // 120% - estoque controlado
      }
    },
    
    processamento: {
      ...CONFIGURACAO_PADRAO.processamento,
      statusNotaImportada: 'PROCESSADA', // Status específico da farmácia
      limiteTentativasProcessamento: 5    // Mais tentativas para produtos complexos
    },
    
    mensagens: {
      ...CONFIGURACAO_PADRAO.mensagens,
      produtoEncontrado: '✅ Produto homeopático encontrado: {nome}',
      produtoNovo: '🆕 Novo produto homeopático cadastrado: {nome}',
      sucessoImportacao: '🎉 Importação de produtos homeopáticos concluída!'
    },
    
    markup: {
      ...CONFIGURACAO_PADRAO.markup,
      percentuaisPadrao: {
        alopaticos: 2.0,     // 200% - menor markup para alopáticos
        homeopaticos: 3.5,   // 350% - maior markup para homeopáticos
        embalagens: 1.8,     // 180% - markup baixo para embalagens
        insumos: 2.0,        // 200% - markup padrão
        revenda: 1.5         // 150% - markup baixo para revenda
      }
    }
  });
};

// =====================================================
// EXEMPLO 2: FARMÁCIA COMERCIAL COM FOCO EM VOLUME
// =====================================================

export const configurarFarmaciaComercial = () => {
  atualizarConfiguracao({
    paginacao: {
      limitePadrao: 100,    // Mais itens por página
      limiteMaximo: 500,    // Limite maior para operações em lote
      paginaPadrao: 1
    },
    
    estoque: {
      ...CONFIGURACAO_PADRAO.estoque,
      percentualEstoqueMinimoDefault: 0.5, // 50% - estoque maior
      percentualEstoqueMaximoDefault: 5.0,  // 500% - estoque muito maior
      
      produtosAltaRotacao: {
        palavrasChave: ['PARACETAMOL', 'IBUPROFENO', 'DIPIRONA', 'VITAMINA C'],
        percentualEstoqueMinimo: 1.0, // 100% - estoque igual à compra
        percentualEstoqueMaximo: 10.0 // 1000% - estoque massivo
      },
      
      estoqueMinimo: 5,     // Mínimo maior
      estoqueMaximo: 10000  // Máximo muito maior
    },
    
    markup: {
      ...CONFIGURACAO_PADRAO.markup,
      percentuaisPadrao: {
        alopaticos: 1.8,     // 180% - markup menor para competitividade
        homeopaticos: 2.5,   // 250% - markup moderado
        embalagens: 1.5,     // 150% - markup baixo
        insumos: 1.6,        // 160% - markup baixo
        revenda: 1.4         // 140% - markup muito baixo
      },
      
      faixaAvisoMinimo: 1.2, // Avisar se markup < 120%
      faixaAvisoMaximo: 3.0  // Avisar se markup > 300%
    }
  });
};

// =====================================================
// EXEMPLO 3: FARMÁCIA PREMIUM COM PRODUTOS ESPECIALIZADOS
// =====================================================

export const configurarFarmaciaPremium = () => {
  atualizarConfiguracao({
    estoque: {
      ...CONFIGURACAO_PADRAO.estoque,
      produtosAltaRotacao: {
        palavrasChave: ['IMPORTED', 'PREMIUM', 'ORGÂNICO', 'NATURAL', 'BIO'],
        percentualEstoqueMinimo: 0.3, // 30% - estoque controlado
        percentualEstoqueMaximo: 2.0  // 200% - estoque moderado
      }
    },
    
    processamento: {
      ...CONFIGURACAO_PADRAO.processamento,
      statusNotaImportada: 'PENDENTE', // Revisão manual para produtos premium
      timeoutProcessamento: 60000      // 60 segundos - mais tempo para análise
    },
    
    mensagens: {
      ...CONFIGURACAO_PADRAO.mensagens,
      produtoEncontrado: '💎 Produto premium localizado: {nome}',
      produtoNovo: '✨ Novo produto premium cadastrado: {nome}',
      loteProcessado: '📦 Lote premium processado: {numero} (Qualidade verificada)',
      sucessoImportacao: '🏆 Importação premium concluída com excelência!'
    },
    
    markup: {
      ...CONFIGURACAO_PADRAO.markup,
      percentuaisPadrao: {
        alopaticos: 3.0,     // 300% - markup alto
        homeopaticos: 4.0,   // 400% - markup muito alto
        embalagens: 2.5,     // 250% - markup alto mesmo para embalagens
        insumos: 3.2,        // 320% - markup alto
        revenda: 2.8         // 280% - markup alto
      },
      
      markupMinimo: 1.5,     // 150% mínimo
      faixaAvisoMinimo: 2.0, // Avisar se markup < 200%
      faixaAvisoMaximo: 10.0 // Avisar se markup > 1000%
    }
  });
};

// =====================================================
// EXEMPLO 4: CONFIGURAÇÃO PERSONALIZADA VIA PARÂMETROS
// =====================================================

export const configurarFarmaciaPersonalizada = (config: {
  tipo: 'homeopatica' | 'comercial' | 'premium' | 'custom';
  markupBase?: number;
  estoqueConservador?: boolean;
  mensagensPersonalizadas?: boolean;
}) => {
  
  switch (config.tipo) {
    case 'homeopatica':
      configurarFarmaciaHomeopatica();
      break;
      
    case 'comercial':
      configurarFarmaciaComercial();
      break;
      
    case 'premium':
      configurarFarmaciaPremium();
      break;
      
    case 'custom':
      // Configuração totalmente personalizada
      const markupMultiplier = config.markupBase || 1.0;
      
      atualizarConfiguracao({
        estoque: {
          ...CONFIGURACAO_PADRAO.estoque,
          percentualEstoqueMinimoDefault: config.estoqueConservador ? 0.1 : 0.5,
          percentualEstoqueMaximoDefault: config.estoqueConservador ? 1.5 : 3.0
        },
        
        markup: {
          ...CONFIGURACAO_PADRAO.markup,
          percentuaisPadrao: {
            alopaticos: 2.5 * markupMultiplier,
            homeopaticos: 3.0 * markupMultiplier,
            embalagens: 2.0 * markupMultiplier,
            insumos: 2.2 * markupMultiplier,
            revenda: 1.8 * markupMultiplier
          }
        },
        
        mensagens: config.mensagensPersonalizadas ? {
          ...CONFIGURACAO_PADRAO.mensagens,
          produtoEncontrado: '🔍 Produto identificado: {nome}',
          produtoNovo: '➕ Produto adicionado: {nome}',
          sucessoImportacao: '✅ Importação finalizada!'
        } : CONFIGURACAO_PADRAO.mensagens
      });
      break;
  }
};

// =====================================================
// UTILITÁRIOS PARA DEMONSTRAÇÃO
// =====================================================

export const demonstrarConfiguracoes = () => {
  console.log('=== DEMONSTRAÇÃO DE CONFIGURAÇÕES PHARMA.AI ===\n');
  
  // Configuração padrão
  console.log('📋 CONFIGURAÇÃO PADRÃO:');
  console.log('Markup alopáticos:', CONFIGURACAO_PADRAO.markup.percentuaisPadrao.alopaticos * 100 + '%');
  console.log('Estoque mínimo padrão:', CONFIGURACAO_PADRAO.estoque.percentualEstoqueMinimoDefault * 100 + '%');
  console.log('Status importação:', CONFIGURACAO_PADRAO.processamento.statusNotaImportada);
  console.log('');
  
  // Farmácia homeopática
  configurarFarmaciaHomeopatica();
  const configHomeo = obterConfiguracao();
  console.log('🌿 FARMÁCIA HOMEOPÁTICA:');
  console.log('Markup homeopáticos:', configHomeo.markup.percentuaisPadrao.homeopaticos * 100 + '%');
  console.log('Estoque produtos alta rotação:', configHomeo.estoque.produtosAltaRotacao.percentualEstoqueMinimo * 100 + '%');
  console.log('Status importação:', configHomeo.processamento.statusNotaImportada);
  console.log('');
  
  // Farmácia comercial
  configurarFarmaciaComercial();
  const configComercial = obterConfiguracao();
  console.log('🏪 FARMÁCIA COMERCIAL:');
  console.log('Markup alopáticos:', configComercial.markup.percentuaisPadrao.alopaticos * 100 + '%');
  console.log('Limite paginação:', configComercial.paginacao.limitePadrao);
  console.log('Estoque máximo:', configComercial.estoque.estoqueMaximo);
  console.log('');
  
  // Farmácia premium
  configurarFarmaciaPremium();
  const configPremium = obterConfiguracao();
  console.log('💎 FARMÁCIA PREMIUM:');
  console.log('Markup alopáticos:', configPremium.markup.percentuaisPadrao.alopaticos * 100 + '%');
  console.log('Markup mínimo:', configPremium.markup.markupMinimo * 100 + '%');
  console.log('Timeout processamento:', configPremium.processamento.timeoutProcessamento / 1000 + 's');
  console.log('');
};

// =====================================================
// EXPORT PARA USO EM PRODUÇÃO
// =====================================================

export const CONFIGURACOES_PREDEFINIDAS = {
  homeopatica: configurarFarmaciaHomeopatica,
  comercial: configurarFarmaciaComercial,
  premium: configurarFarmaciaPremium,
  personalizada: configurarFarmaciaPersonalizada
};

// Exemplo de uso:
// import { CONFIGURACOES_PREDEFINIDAS } from '@/examples/configuracao-farmacia-exemplo';
// CONFIGURACOES_PREDEFINIDAS.homeopatica(); 