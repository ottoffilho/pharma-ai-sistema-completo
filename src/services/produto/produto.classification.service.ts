// =====================================================
// SERVIÇO DE CLASSIFICAÇÃO DE PRODUTOS - PHARMA.AI
// =====================================================

import { CATEGORIAS_MARKUP, type CategoriaMarkup } from '@/constants/categorias';

/**
 * Remove informações fiscais do nome do produto
 */
export const limparNomeProduto = (nome: string): string => {
  if (!nome) return nome;
  
  // Remove informações fiscais que frequentemente aparecem no final do nome
  let nomeLimpo = nome;
  
  // Remove padrões como: IVA: X.XX% pIcmsSt: XX.XX% BcIcmsSt: XX.XX vIcmsSt: X.XX
  nomeLimpo = nomeLimpo.replace(/\s+IVA:\s*[\d.,]+%.*$/gi, '');
  
  // Remove padrões como: pIcmsSt: XX.XX% BcIcmsSt: XX.XX vIcmsSt: X.XX
  nomeLimpo = nomeLimpo.replace(/\s+pIcmsSt:.*$/gi, '');
  
  // Remove outros padrões fiscais comuns
  nomeLimpo = nomeLimpo.replace(/\s+ICMS.*$/gi, '');
  nomeLimpo = nomeLimpo.replace(/\s+ST:.*$/gi, '');
  nomeLimpo = nomeLimpo.replace(/\s+BC:.*$/gi, '');
  
  // Remove espaços extras
  nomeLimpo = nomeLimpo.trim();
  
  return nomeLimpo;
};

/**
 * Normaliza unidade e quantidade de produtos
 */
export const normalizarUnidadeEQuantidade = (
  uCom: string,
  qCom: number,
  nomeProduto: string,
): { unidade: string; quantidade: number } => {
  const uComUpper = (uCom || '').toUpperCase();
  let unidadeBase = uComUpper;
  let quantidadeCalculada = qCom;

  // 1. Extrai o fator numérico da unidade, se houver (ex: '2' de '2 KG')
  const matchUnidadeComposta = uComUpper.match(/^([\d.,]+)\s*([A-ZÀ-Ü]+)/);
  if (matchUnidadeComposta) {
    const valorNumericoStr = matchUnidadeComposta[1].replace(',', '.');
    const valorNumerico = parseFloat(valorNumericoStr);
    const unidadeExtraida = matchUnidadeComposta[2];
    
    if (!isNaN(valorNumerico)) {
        quantidadeCalculada *= valorNumerico;
        unidadeBase = unidadeExtraida;
    }
  }

  // 2. Converte para a unidade final
  switch (unidadeBase) {
    case 'KG':
    case 'K':
      return { unidade: 'g', quantidade: quantidadeCalculada * 1000 };
    case 'L':
      return { unidade: 'ml', quantidade: quantidadeCalculada * 1000 };
    case 'G':
      return { unidade: 'g', quantidade: quantidadeCalculada };
    case 'ML':
      return { unidade: 'ml', quantidade: quantidadeCalculada };
    case 'MIL':
        return { unidade: 'unid', quantidade: quantidadeCalculada * 1000 };
    case 'UN':
    case 'UND':
    case 'UNID':
    case 'UNIDADE':
    case 'PC':
      // Se a unidade for genérica (UN), verifica se o nome do produto especifica a unidade
      const nomeMatch = nomeProduto.toUpperCase().match(/\((\d+)\s*(ML|G|MG|U)\)/);
      if (nomeMatch) {
          const valorNome = parseInt(nomeMatch[1], 10);
          const unidadeNome = nomeMatch[2];
          if (!isNaN(valorNome)) {
              return { 
                  unidade: unidadeNome === 'U' ? 'unid' : unidadeNome.toLowerCase(), 
                  quantidade: valorNome * qCom 
              };
          }
      }
      return { unidade: 'unid', quantidade: quantidadeCalculada };
    default:
      // Se a unidade não for reconhecida, retorna como 'unid' por padrão
      return { unidade: 'unid', quantidade: quantidadeCalculada };
  }
};

/**
 * Calcula estoque mínimo inteligente baseado no tipo de produto
 */
export const calcularEstoqueMinimoInteligente = (nomeProduto: string, quantidadeComprada: number): number => {
  const nomeUpper = nomeProduto.toUpperCase();
  
  // Florais - alta rotação (50% da quantidade comprada)
  if (nomeUpper.includes('FLORAL') || nomeUpper.includes('BACH') || nomeUpper.includes('RESCUE')) {
    return Math.ceil(quantidadeComprada * 0.5);
  }
  
  // Homeopáticos CH - rotação moderada (20% da quantidade comprada)
  if (/\bCH\d+\b/.test(nomeUpper) || /\b\d+CH\b/.test(nomeUpper)) {
    return Math.ceil(quantidadeComprada * 0.2);
  }
  
  // Tinturas-mãe - rotação média (30% da quantidade comprada)
  if (nomeUpper.includes('TM') || nomeUpper.includes('TINTURA')) {
    return Math.ceil(quantidadeComprada * 0.3);
  }
  
  // Padrão para outros produtos (25% da quantidade comprada)
  return Math.ceil(quantidadeComprada * 0.25);
};

/**
 * Calcula estoque máximo inteligente baseado no tipo de produto
 */
export const calcularEstoqueMaximoInteligente = (nomeProduto: string, quantidadeComprada: number): number => {
  const nomeUpper = nomeProduto.toUpperCase();
  
  // Florais - alta demanda (300% da quantidade comprada)
  if (nomeUpper.includes('FLORAL') || nomeUpper.includes('BACH') || nomeUpper.includes('RESCUE')) {
    return Math.ceil(quantidadeComprada * 3);
  }
  
  // Homeopáticos CH - demanda controlada (150% da quantidade comprada)
  if (/\bCH\d+\b/.test(nomeUpper) || /\b\d+CH\b/.test(nomeUpper)) {
    return Math.ceil(quantidadeComprada * 1.5);
  }
  
  // Tinturas-mãe - boa rotação (200% da quantidade comprada)
  if (nomeUpper.includes('TM') || nomeUpper.includes('TINTURA')) {
    return Math.ceil(quantidadeComprada * 2);
  }
  
  // Padrão para outros produtos (200% da quantidade comprada)
  return Math.ceil(quantidadeComprada * 2);
};

/**
 * Função para analisar se um NCM pode ser de produto alopático
 * Baseada em padrões identificados nos XMLs analisados
 */
export const analisarPotencialAlopatico = (ncm: string, nome: string): {
  isProvavelAlopatico: boolean;
  confianca: number; // 0-100
  motivos: string[];
  sugestaoCategoria: string;
} => {
  const ncmLimpo = (ncm || '').replace(/\D/g, '');
  const nomeUpper = (nome || '').toUpperCase();
  
  let confianca = 0;
  const motivos: string[] = [];
  let isProvavelAlopatico = false;

  // === ANÁLISE POR PADRÕES DE NCM ===
  
  // NCMs que são claramente alopáticos (alta confiança)
  const ncmsAlopaticosConfirmados = [
    // Hormônios (2937xxxx)
    '29372990', '29372100', '29372200', '29372300', '29372910', '29372930',
    
    // Aminoácidos específicos (29xxxx)
    '29224110', '29224120', '29224190', '29224990', '29241999', '29252990',
    '29223990', '29239090', '29181690', '29156019', '29181500',
    
    // Vitaminas (2936xxxx)
    '29362710', '29362610', '29362921', '29362812', '29362931', '29362940',
    
    // Compostos orgânicos farmacêuticos específicos
    '29391900', '29189999', '29332190', '29322000', '29339919', '29339969',
    '29171310', '29142990', '29072900', '29147990', '29309079', '29329912', '29329999',
    
    // Enzimas farmacêuticas
    '35079049', '35040090'
  ];

  if (ncmsAlopaticosConfirmados.includes(ncmLimpo)) {
    confianca += 95;
    motivos.push(`NCM ${ncmLimpo} já confirmado como alopático`);
    isProvavelAlopatico = true;
  }

  // === ANÁLISE POR PREFIXOS DE NCM ===
  
  // Prefixos que indicam alta probabilidade de alopáticos
  const prefixosAltaProbabilidade = [
    { prefixo: '2937', descricao: 'Hormônios', confianca: 90 },
    { prefixo: '2936', descricao: 'Vitaminas', confianca: 85 },
    { prefixo: '2922', descricao: 'Aminoácidos', confianca: 80 },
    { prefixo: '2924', descricao: 'Compostos com função amina', confianca: 75 },
    { prefixo: '2925', descricao: 'Compostos com função imina', confianca: 70 }
  ];

  for (const { prefixo, descricao, confianca: conf } of prefixosAltaProbabilidade) {
    if (ncmLimpo.startsWith(prefixo)) {
      confianca += conf;
      motivos.push(`NCM prefixo ${prefixo} (${descricao}) - alta probabilidade alopático`);
      isProvavelAlopatico = true;
      break;
    }
  }

  // Prefixos que podem ser alopáticos (média probabilidade)
  const prefixosMediaProbabilidade = [
    { prefixo: '2918', descricao: 'Ácidos carboxílicos', confianca: 60 },
    { prefixo: '2915', descricao: 'Ácidos monocarboxílicos saturados', confianca: 55 },
    { prefixo: '2933', descricao: 'Compostos heterocíclicos', confianca: 65 },
    { prefixo: '2939', descricao: 'Alcaloides vegetais', confianca: 70 },
    { prefixo: '3507', descricao: 'Enzimas', confianca: 75 }
  ];

  for (const { prefixo, descricao, confianca: conf } of prefixosMediaProbabilidade) {
    if (ncmLimpo.startsWith(prefixo) && confianca < 70) {
      confianca += conf;
      motivos.push(`NCM prefixo ${prefixo} (${descricao}) - média probabilidade alopático`);
      if (conf >= 60) isProvavelAlopatico = true;
      break;
    }
  }

  // === ANÁLISE POR PALAVRAS-CHAVE NO NOME ===

  // Palavras que indicam alta probabilidade de alopático
  const palavrasAltaConfianca = [
    'CLORIDRATO', 'SULFATO', 'FOSFATO', 'CITRATO', 'TARTARATO', 'MALEATO',
    'MONOHIDRATADA', 'DIHIDRATADA', 'ANIDRO', 'TESTOSTERONA', 'DUTASTERIDA',
    'VITAMINA', 'COLECALCIFEROL', 'CIANOCOBALAMINA', 'TOCOFEROL',
    'L-CARNITINA', 'L-LISINA', 'L-TRIPTOFANO', 'L-TEANINA', 'L-CITRULINA',
    'CREATINA', 'ALANTOINA', 'CERAMIDAS', 'GLUCONOLACTONA'
  ];

  const palavrasEncontradas = palavrasAltaConfianca.filter(palavra => 
    nomeUpper.includes(palavra)
  );

  if (palavrasEncontradas.length > 0) {
    confianca += palavrasEncontradas.length * 15;
    motivos.push(`Palavras-chave alopáticas encontradas: ${palavrasEncontradas.join(', ')}`);
    isProvavelAlopatico = true;
  }

  // Palavras que indicam média probabilidade
  const palavrasMediaConfianca = [
    'ÁCIDO', 'ACIDO', 'EXTRATO', 'PRINCIPIO ATIVO', 'MATERIA PRIMA',
    'BASE', 'PO', 'CRISTAL', 'PURO', 'FARMACEUTICO', 'USP', 'EP', 'BP'
  ];

  const palavrasMediasEncontradas = palavrasMediaConfianca.filter(palavra => 
    nomeUpper.includes(palavra)
  );

  if (palavrasMediasEncontradas.length > 0 && confianca < 70) {
    confianca += palavrasMediasEncontradas.length * 8;
    motivos.push(`Indicadores farmacêuticos: ${palavrasMediasEncontradas.join(', ')}`);
    if (confianca >= 50) isProvavelAlopatico = true;
  }

  // === ANÁLISE POR PADRÕES DE NOMENCLATURA ===

  // Padrões típicos de nomenclatura farmacêutica
  const padroesNomenclatura = [
    { regex: /^[A-Z]-[A-Z]/i, descricao: 'Padrão L-aminoácido', confianca: 20 },
    { regex: /\b(HCL|HCl)\b/i, descricao: 'Sal cloridrato', confianca: 25 },
    { regex: /\b\d+%?\b/, descricao: 'Concentração específica', confianca: 10 },
    { regex: /\b(MICRO|NANO)\b/i, descricao: 'Forma farmacêutica especial', confianca: 15 },
    { regex: /\b(USP|EP|BP|DAB)\b/, descricao: 'Padrão farmacopeico', confianca: 30 }
  ];

  for (const { regex, descricao, confianca: conf } of padroesNomenclatura) {
    if (regex.test(nome)) {
      confianca += conf;
      motivos.push(`Padrão nomenclatura: ${descricao}`);
    }
  }

  // === LIMITAÇÃO DE CONFIANÇA ===
  confianca = Math.min(100, confianca);

  // === DETERMINAR SUGESTÃO DE CATEGORIA ===
  let sugestaoCategoria: CategoriaMarkup = CATEGORIAS_MARKUP.REVENDA; // padrão

  if (isProvavelAlopatico && confianca >= 70) {
    sugestaoCategoria = CATEGORIAS_MARKUP.ALOPATICOS;
  } else if (confianca >= 40) {
    // Análise mais específica
    if (ncmLimpo.startsWith('1302')) {
      sugestaoCategoria = CATEGORIAS_MARKUP.ALOPATICOS; // extratos vegetais medicinais
    } else if (ncmLimpo.startsWith('25') || ncmLimpo.startsWith('28')) {
      sugestaoCategoria = CATEGORIAS_MARKUP.REVENDA; // minerais e sais
    } else if (ncmLimpo.startsWith('39') || ncmLimpo.startsWith('48')) {
      sugestaoCategoria = CATEGORIAS_MARKUP.EMBALAGENS; // materiais de embalagem
    } else {
      sugestaoCategoria = CATEGORIAS_MARKUP.REVENDA; // outros insumos farmacêuticos
    }
  }

  return {
    isProvavelAlopatico,
    confianca,
    motivos,
    sugestaoCategoria
  };
};

/**
 * Classifica a categoria de um produto baseado no NCM e nome
 */
export function classificarCategoriaProduto(ncm: string, nome: string): string {
  const ncmLimpo = (ncm || '').replace(/\D/g, '');
  const nomeUpper = (nome || '').toUpperCase();

  // === NCMs específicos para cada categoria ===
  
  // NCMs de alopáticos confirmados
  const ncmsAlopaticos = [
    // Extratos vegetais medicinais
    '13021930', '13021960', '13021950', '13021999',
    // Vitaminas
    '29362710', '29362610', '29362812', '29362931', '29362940', '29362921',
    // Hormônios
    '29372990',
    // Aminoácidos e compostos relacionados
    '29224110', '29241999', '29181500', '29181690', '29156019', '29239090',
    '29224990', '29252990', '29223990',
    // Alcaloides e outros princípios ativos
    '29391900', '29189999', '29332190', '29322000', '29339919', '29339969',
    '29339999', '29171310', '29142990', '29072900', '29147990', '29309079',
    '29329912', '29329999',
    // Enzimas
    '35079049', '35040090',
    // Sais e minerais farmacêuticos
    '28369911',
    // NCMs da nota fiscal 35250244015477001600550010006460541000139487
    '29349999',
    '29389090',
    '29335991',
    '29309019',
    '29231000',
    '29181990',
    '33012990',
    '33049910'
  ];

  if (ncmsAlopaticos.includes(ncmLimpo)) {
    return 'alopaticos';
  }

  // NCMs de embalagens farmacêuticas
  const ncmsEmbalagensFarmacia = [
    '39233090', '39235000', '39239090', '39100019',
    '70179000', '70109090', '70139900',
    '39269090', '40149090', '28112230',
    '76121000', '38221990'
  ];

  if (ncmsEmbalagensFarmacia.includes(ncmLimpo)) {
    return 'embalagens';
  }

  // === Prefixos de NCM por categoria ===
  
  // Prefixos de embalagens
  const prefixosEmbalagemFarmacia = ['3923', '3925', '3926', '7017', '7010', '7613'];
  if (prefixosEmbalagemFarmacia.some(prefixo => ncmLimpo.startsWith(prefixo))) {
    return 'embalagens';
  }

  // === Análise por palavras-chave no nome ===
  
  // Palavras-chave de embalagens
  const palavrasEmbalagem = [
    'POTE', 'TAMPA', 'VIDRO', 'FRASCO', 'BISNAGA', 'APLICADOR',
    'BULBO', 'SACHE', 'ENVELOPE', 'ROTULO', 'ETIQUETA', 'CAIXA',
    'EMBALAGEM', 'RECIPIENTE', 'TUBO', 'CANULA', 'BOCAL', 'DOSADOR',
    'COLHER MEDIDA', 'MEDIDOR', 'CONTA GOTAS', 'SPRAY', 'VALVULA'
  ];

  if (palavrasEmbalagem.some(palavra => nomeUpper.includes(palavra))) {
    return 'embalagens';
  }

  // Palavras-chave de alopáticos (substâncias ativas)
  const palavrasAlopaticos = [
    'EXTRATO SECO', 'EXTRATO', 'PRINCIPIO ATIVO', 'MATERIA PRIMA',
    'BASE', 'CLORIDRATO', 'SULFATO', 'FOSFATO', 'CITRATO',
    'VITAMINA', 'VIT.', 'VIT ', 'ÁCIDO', 'ACIDO',
    'ENZIMA', 'LIPASE', 'PROTEASE', 'AMILASE',
    'L-CARNITINA', 'L-LISINA', 'L-TRIPTOFANO', 'L-TEANINA',
    'CREATINA', 'ALANTOINA', 'GLUCONOLACTONA', 'CERAMIDAS',
    'TESTOSTERONA', 'DUTASTERIDA', 'SILIMARINA'
  ];

  if (palavrasAlopaticos.some(palavra => nomeUpper.includes(palavra))) {
    return 'alopaticos';
  }

  // === Análise específica por NCM quando não há match direto ===
  
  // NCMs gerais de talco e minerais não farmacêuticos
  if (ncmLimpo === '25262000') { // Talco
    // Talco pode ser matéria-prima (alopático) ou produto final
    if (nomeUpper.includes('PO') || nomeUpper.includes('FARMACEUTICO')) {
      return 'alopaticos';
    }
  }
  
  // NCMs genéricos que dependem do contexto
  if (ncmLimpo === '12119090') { // Plantas medicinais
    return 'alopaticos';
  }

  if (ncmLimpo === '21021090' || ncmLimpo === '21069030' || ncmLimpo === '21022000') {
    // Preparações alimentícias - podem ser suplementos
    return 'alopaticos';
  }

  if (ncmLimpo === '11081200') { // Amidos
    // Amidos geralmente são excipientes farmacêuticos
    return 'alopaticos';
  }

  if (ncmLimpo === '08134090') { // Frutas secas
    // Pode ser matéria-prima para extratos
    if (nomeUpper.includes('EXTRATO') || nomeUpper.includes('PO')) {
      return 'alopaticos';
    }
  }
  
  // Fallback final baseado no NCM
  if (ncmLimpo.startsWith('30')) {
    return 'alopaticos'; // Grupo 30 geralmente são medicamentos
  }
  
  if (ncmLimpo.startsWith('33')) {
    return 'revenda'; // Grupo 33 são cosméticos
  }

  // Fallback padrão
  return 'revenda';
} 