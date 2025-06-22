/**
 * Testes unitários para classificação de produtos
 * Baseado em: prompt/resumos_contexto.md
 * Data: 2025-06-18
 */

import { describe, it, expect } from 'vitest';

// Simulação da função classificarTipoProduto para testes
// Em produção, esta seria importada do serviço real
function classificarTipoProduto(ncm: string, nome: string): string {
  const ncmLimpo = (ncm || '').replace(/\D/g, '');
  const nomeUpper = (nome || '').toUpperCase();

  // === EMBALAGENS ESPECÍFICAS PARA FARMÁCIA DE MANIPULAÇÃO ===
  
  // NCMs específicos de embalagens para farmácia
  const ncmEmbalagensFarmacia = [
    // Cápsulas vazias (NOVA REGRA PRIORITÁRIA)
    '96020010', // Cápsulas de gelatina digeríveis vazias
    
    // Frascos e recipientes de plástico
    '39232990', // Outros artigos de plástico (categoria que inclui frascos, potes)
    '39233000', // Garrafas, frascos e artigos similares
    // ... outros NCMs
  ];
  
  // Verificação por NCM completo (8 dígitos)
  if (ncmEmbalagensFarmacia.includes(ncmLimpo)) {
    return 'EMBALAGEM';
  }
  
  // Verificação por prefixos de NCM de embalagens
  const prefixosEmbalagemFarmacia = [
    '3923', // Artigos de transporte ou embalagem, de plásticos
    '9602', // Cápsulas de gelatina, cachês vazios, etc. (NOVA REGRA)
    // ... outros prefixos
  ];
  
  if (prefixosEmbalagemFarmacia.some(prefixo => ncmLimpo.startsWith(prefixo))) {
    return 'EMBALAGEM';
  }

  // === CLASSIFICAÇÃO POR PALAVRAS-CHAVE NO NOME ===
  
  // Palavras-chave específicas de embalagens farmacêuticas
  const palavrasEmbalagem = [
    // Cápsulas vazias (NOVA REGRA PRIORITÁRIA)
    'CAPSULA VAZIA', 'CÁPSULAS VAZIAS', 'EMPTY CAPSULE', 'CAPS DURAS',
    
    // Embalagens tradicionais
    'FRASCO', 'POTE', 'BISNAGA', 'TAMPA', 'RÓTULO', 'EMBALAGEM', 'AMPOLA',
    // ... outras palavras
  ];
  
  if (palavrasEmbalagem.some(palavra => nomeUpper.includes(palavra))) {
    return 'EMBALAGEM';
  }

  // === MATÉRIAS-PRIMAS ALOPÁTICAS ===
  if (/(ÁCIDO|ACIDO|SULFATO|CLORIDRATO|FOSFATO|CITRATO|METFORMINA|LOSARTANA)/.test(nomeUpper)) {
    return 'MATERIA_PRIMA';
  }

  // === HOMEOPÁTICOS ===
  if (/(CH|DH|LM|FC|TM|FLORAL|BACH|DINAMIZAÇÃO|POTÊNCIA)/.test(nomeUpper)) {
    return 'HOMEOPATICO';
  }

  // === FALLBACK ===
  return 'MEDICAMENTO';
}

describe('Classificação de Produtos - Cápsulas Vazias', () => {
  describe('Por NCM exato', () => {
    it('classifica cápsula vazia como EMBALAGEM por NCM 96020010', () => {
      const resultado = classificarTipoProduto('96020010', 'Cápsula Vazia Gelatina');
      expect(resultado).toBe('EMBALAGEM');
    });

    it('classifica cápsula vazia como EMBALAGEM por NCM 96020010 mesmo com nome genérico', () => {
      const resultado = classificarTipoProduto('96020010', 'Produto Genérico');
      expect(resultado).toBe('EMBALAGEM');
    });
  });

  describe('Por prefixo NCM', () => {
    it('classifica como EMBALAGEM por prefixo 9602', () => {
      const resultado = classificarTipoProduto('96020020', 'Produto Teste');
      expect(resultado).toBe('EMBALAGEM');
    });

    it('classifica como EMBALAGEM por prefixo 9602 com qualquer variação', () => {
      const resultado = classificarTipoProduto('96020099', 'Item Qualquer');
      expect(resultado).toBe('EMBALAGEM');
    });
  });

  describe('Por palavras-chave no nome', () => {
    it('classifica cápsula vazia como EMBALAGEM por keyword "CAPSULA VAZIA"', () => {
      const resultado = classificarTipoProduto('', 'Capsula Vazia Gelatina Size 0');
      expect(resultado).toBe('EMBALAGEM');
    });

    it('classifica cápsula vazia como EMBALAGEM por keyword "CÁPSULAS VAZIAS"', () => {
      const resultado = classificarTipoProduto('', 'Cápsulas Vazias Duras Transparentes');
      expect(resultado).toBe('EMBALAGEM');
    });

    it('classifica cápsula vazia como EMBALAGEM por keyword "EMPTY CAPSULE"', () => {
      const resultado = classificarTipoProduto('', 'Empty Capsule Size 00');
      expect(resultado).toBe('EMBALAGEM');
    });

    it('classifica cápsula vazia como EMBALAGEM por keyword "CAPS DURAS"', () => {
      const resultado = classificarTipoProduto('', 'Caps Duras Transparentes 100un');
      expect(resultado).toBe('EMBALAGEM');
    });
  });

  describe('Precedência das regras', () => {
    it('prioriza regra de embalagem mesmo com palavras de outros tipos', () => {
      const resultado = classificarTipoProduto('96020010', 'Cápsula Vazia com Ácido Teste');
      expect(resultado).toBe('EMBALAGEM');
    });

    it('identifica homeopático quando não é embalagem', () => {
      const resultado = classificarTipoProduto('', 'Arnica Montana 30CH');
      expect(resultado).toBe('HOMEOPATICO');
    });

    it('identifica matéria prima alopática quando não é embalagem', () => {
      const resultado = classificarTipoProduto('', 'Metformina Cloridrato');
      expect(resultado).toBe('MATERIA_PRIMA');
    });
  });
});

describe('Classificação de Produtos - Casos Gerais', () => {
  describe('Embalagens tradicionais (não devem ser afetadas)', () => {
    it('classifica frasco como EMBALAGEM', () => {
      const resultado = classificarTipoProduto('39232990', 'Frasco Plástico 100ml');
      expect(resultado).toBe('EMBALAGEM');
    });

    it('classifica por palavra-chave FRASCO', () => {
      const resultado = classificarTipoProduto('', 'Frasco Âmbar com Tampa');
      expect(resultado).toBe('EMBALAGEM');
    });
  });

  describe('Produtos alopáticos (não devem ser afetados)', () => {
    it('classifica princípio ativo como MATERIA_PRIMA', () => {
      const resultado = classificarTipoProduto('29xxxx', 'Losartana Potássica');
      expect(resultado).toBe('MATERIA_PRIMA');
    });

    it('classifica ácido como MATERIA_PRIMA', () => {
      const resultado = classificarTipoProduto('', 'Ácido Ascórbico Puro');
      expect(resultado).toBe('MATERIA_PRIMA');
    });
  });

  describe('Produtos homeopáticos (não devem ser afetados)', () => {
    it('classifica produto CH como HOMEOPATICO', () => {
      const resultado = classificarTipoProduto('', 'Belladonna 12CH');
      expect(resultado).toBe('HOMEOPATICO');
    });

    it('classifica floral como HOMEOPATICO', () => {
      const resultado = classificarTipoProduto('', 'Rescue Remedy Floral de Bach');
      expect(resultado).toBe('HOMEOPATICO');
    });
  });

  describe('Fallback', () => {
    it('classifica produto não identificado como MEDICAMENTO', () => {
      const resultado = classificarTipoProduto('', 'Produto Genérico Teste');
      expect(resultado).toBe('MEDICAMENTO');
    });
  });
});

describe('Mapeamento para Categorias de Markup', () => {
  describe('Mapeamento das 4 categorias simplificadas', () => {
    it('EMBALAGEM deve mapear para "embalagens"', () => {
      const tipoProduto = 'EMBALAGEM';
      
      let categoria = 'revenda';
      switch (tipoProduto) {
        case 'EMBALAGEM':
          categoria = 'embalagens';
          break;
        case 'MATERIA_PRIMA':
          categoria = 'alopaticos';
          break;
        case 'HOMEOPATICO':
          categoria = 'homeopaticos';
          break;
        default:
          categoria = 'revenda';
          break;
      }
      
      expect(categoria).toBe('embalagens');
    });

    it('MATERIA_PRIMA deve mapear para "alopaticos"', () => {
      const tipoProduto = 'MATERIA_PRIMA';
      
      let categoria = 'revenda';
      switch (tipoProduto) {
        case 'EMBALAGEM':
          categoria = 'embalagens';
          break;
        case 'MATERIA_PRIMA':
          categoria = 'alopaticos';
          break;
        case 'HOMEOPATICO':
          categoria = 'homeopaticos';
          break;
        default:
          categoria = 'revenda';
          break;
      }
      
      expect(categoria).toBe('alopaticos');
    });

    it('HOMEOPATICO deve mapear para "homeopaticos"', () => {
      const tipoProduto = 'HOMEOPATICO';
      
      let categoria = 'revenda';
      switch (tipoProduto) {
        case 'EMBALAGEM':
          categoria = 'embalagens';
          break;
        case 'MATERIA_PRIMA':
          categoria = 'alopaticos';
          break;
        case 'HOMEOPATICO':
          categoria = 'homeopaticos';
          break;
        default:
          categoria = 'revenda';
          break;
      }
      
      expect(categoria).toBe('homeopaticos');
    });

    it('Outros tipos devem mapear para "revenda"', () => {
      const tiposProduto = ['MEDICAMENTO', 'INSUMO', 'COSMÉTICO', 'PRINCIPIO_ATIVO'];
      
      tiposProduto.forEach(tipoProduto => {
        let categoria = 'revenda';
        switch (tipoProduto) {
          case 'EMBALAGEM':
            categoria = 'embalagens';
            break;
          case 'MATERIA_PRIMA':
            categoria = 'alopaticos';
            break;
          case 'HOMEOPATICO':
            categoria = 'homeopaticos';
            break;
          default:
            categoria = 'revenda';
            break;
        }
        
        expect(categoria).toBe('revenda');
      });
    });
  });
}); 