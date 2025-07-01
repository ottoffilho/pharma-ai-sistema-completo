// =====================================================
// PARSER DE XML PARA NOTA FISCAL - PHARMA.AI
// =====================================================

import { getTextContent, limparNomeProduto, normalizarUnidadeEQuantidade } from './notaFiscal.utils';

/**
 * Processa o XML da NF-e e extrai dados estruturados
 */
export const processarXMLNFe = async (xmlText: string): Promise<Record<string, unknown>> => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Verificar se há erros no parsing
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML inválido ou malformado');
    }

    // Extrair dados principais da NF-e
    const infNFe = xmlDoc.querySelector('infNFe');
    if (!infNFe) {
      throw new Error('Elemento infNFe não encontrado no XML');
    }

    const chaveAcesso = infNFe.getAttribute('Id')?.replace('NFe', '') || '';

    // Dados de identificação
    const ide = infNFe.querySelector('ide');
    const numeroNF = parseInt(getTextContent(ide, 'nNF') || '0');
    const serie = parseInt(getTextContent(ide, 'serie') || '0');
    const modelo = parseInt(getTextContent(ide, 'mod') || '55');
    
    // Processar datas corretamente
    const dataEmissaoRaw = getTextContent(ide, 'dhEmi') || '';
    const dataSaidaEntradaRaw = getTextContent(ide, 'dhSaiEnt');
    
    // Converter datas para formato ISO
    const dataEmissao = dataEmissaoRaw ? new Date(dataEmissaoRaw).toISOString() : new Date().toISOString();
    const dataSaidaEntrada = dataSaidaEntradaRaw ? new Date(dataSaidaEntradaRaw).toISOString() : null;

    // Dados do emitente (fornecedor)
    const emit = infNFe.querySelector('emit');
    const fornecedor = extrairDadosFornecedor(emit);

    // Dados dos totais
    const total = infNFe.querySelector('total ICMSTot');
    const valorProdutos = parseFloat(getTextContent(total, 'vProd') || '0');
    const valorFrete = parseFloat(getTextContent(total, 'vFrete') || '0');
    const valorTotalNota = parseFloat(getTextContent(total, 'vNF') || '0');
    const valorICMS = parseFloat(getTextContent(total, 'vICMS') || '0');
    const valorIPI = parseFloat(getTextContent(total, 'vIPI') || '0');
    const valorPIS = parseFloat(getTextContent(total, 'vPIS') || '0');
    const valorCOFINS = parseFloat(getTextContent(total, 'vCOFINS') || '0');
    const valorTotalTributos = parseFloat(getTextContent(total, 'vTotTrib') || '0');

    // Processar itens
    const detElements = infNFe.querySelectorAll('det');
    const itens = Array.from(detElements).map((det, index) => 
      extrairDadosItem(det, index + 1)
    );

    return {
      chaveAcesso,
      numeroNF,
      serie,
      modelo,
      dataEmissao,
      dataSaidaEntrada,
      fornecedor,
      valorProdutos,
      valorFrete,
      valorTotalNota,
      valorICMS,
      valorIPI,
      valorPIS,
      valorCOFINS,
      valorTotalTributos,
      itens
    };

  } catch (error) {
    console.error('Erro ao processar XML:', error);
    throw error;
  }
};

/**
 * Extrai dados do fornecedor do XML
 */
export const extrairDadosFornecedor = (emit: Element | null): Record<string, unknown> => {
  if (!emit) throw new Error('Dados do emitente não encontrados');

  const endereco = emit.querySelector('enderEmit');

  return {
    cnpj: getTextContent(emit, 'CNPJ'),
    razaoSocial: getTextContent(emit, 'xNome'),
    nomeFantasia: getTextContent(emit, 'xFant'),
    inscricaoEstadual: getTextContent(emit, 'IE'),
    inscricaoMunicipal: getTextContent(emit, 'IM'),
    cnae: getTextContent(emit, 'CNAE'),
    crt: parseInt(getTextContent(emit, 'CRT') || '0'),
    telefone: getTextContent(emit, 'fone'),
    logradouro: getTextContent(endereco, 'xLgr'),
    numero: getTextContent(endereco, 'nro'),
    complemento: getTextContent(endereco, 'xCpl'),
    bairro: getTextContent(endereco, 'xBairro'),
    cidade: getTextContent(endereco, 'xMun'),
    uf: getTextContent(endereco, 'UF'),
    cep: getTextContent(endereco, 'CEP'),
    codigoMunicipio: getTextContent(endereco, 'cMun')
  };
};

/**
 * Extrai dados de um item do XML
 */
export const extrairDadosItem = (det: Element, numeroItem: number): Record<string, unknown> => {
  const prod = det.querySelector('prod');
  const imposto = det.querySelector('imposto');

  // Dados do produto
  const codigoInterno = getTextContent(prod, 'cProd');
  const codigoEAN = getTextContent(prod, 'cEAN');
  const nomeOriginal = getTextContent(prod, 'xProd');
  const nome = limparNomeProduto(nomeOriginal); // Aplicar limpeza do nome
  const ncm = getTextContent(prod, 'NCM');
  const cfop = getTextContent(prod, 'CFOP');
  const unidadeComercial = getTextContent(prod, 'uCom');
  const unidadeTributaria = getTextContent(prod, 'uTrib');

  // Quantidades e valores
  const quantidadeComercial = parseFloat(getTextContent(prod, 'qCom') || '0');
  const valorUnitarioComercial = parseFloat(getTextContent(prod, 'vUnCom') || '0');
  const quantidadeTributaria = parseFloat(getTextContent(prod, 'qTrib') || '0');
  const valorUnitarioTributario = parseFloat(getTextContent(prod, 'vUnTrib') || '0');
  const valorTotalProduto = parseFloat(getTextContent(prod, 'vProd') || '0');
  const valorFrete = parseFloat(getTextContent(prod, 'vFrete') || '0');

  // Dados fiscais - ICMS
  const icms = imposto?.querySelector('ICMS')?.firstElementChild;
  const origemMercadoria = parseInt(getTextContent(icms, 'orig') || '0');
  const cstICMS = getTextContent(icms, 'CST');
  const baseCalculoICMS = parseFloat(getTextContent(icms, 'vBC') || '0');
  const aliquotaICMS = parseFloat(getTextContent(icms, 'pICMS') || '0');
  const valorICMS = parseFloat(getTextContent(icms, 'vICMS') || '0');

  // Dados fiscais - IPI
  const ipi = imposto?.querySelector('IPI IPITrib');
  const cstIPI = getTextContent(ipi, 'CST');
  const valorIPI = parseFloat(getTextContent(ipi, 'vIPI') || '0');

  // Dados fiscais - PIS
  const pis = imposto?.querySelector('PIS PISAliq');
  const cstPIS = getTextContent(pis, 'CST');
  const aliquotaPIS = parseFloat(getTextContent(pis, 'pPIS') || '0');
  const valorPIS = parseFloat(getTextContent(pis, 'vPIS') || '0');

  // Dados fiscais - COFINS
  const cofins = imposto?.querySelector('COFINS COFINSAliq');
  const cstCOFINS = getTextContent(cofins, 'CST');
  const aliquotaCOFINS = parseFloat(getTextContent(cofins, 'pCOFINS') || '0');
  const valorCOFINS = parseFloat(getTextContent(cofins, 'vCOFINS') || '0');

  const valorTotalTributos = parseFloat(getTextContent(imposto, 'vTotTrib') || '0');

  // Dados do lote (se existir)
  const rastro = prod?.querySelector('rastro');
  let lote = null;
  if (rastro) {
    lote = {
      numeroLote: getTextContent(rastro, 'nLote'),
      dataFabricacao: getTextContent(rastro, 'dFab'),
      dataValidade: getTextContent(rastro, 'dVal'),
      quantidade: parseFloat(getTextContent(rastro, 'qLote') || '0')
    };
  }

  // Normalizar unidade e quantidade
  const { unidade: unidadeNormalizada, quantidade: quantidadeNormalizada } =
    normalizarUnidadeEQuantidade(unidadeComercial, quantidadeComercial, nome);

  const valorUnitarioNormalizado =
    quantidadeNormalizada > 0
      ? valorTotalProduto / quantidadeNormalizada
      : valorUnitarioComercial;

  return {
    numeroItem,
    produto: {
      codigoInterno,
      codigoEAN,
      nome,
      ncm,
      cfop,
      unidadeComercial: unidadeNormalizada,
      unidadeTributaria: unidadeTributaria, // Manter original por enquanto
      lote
    },
    quantidadeComercial: quantidadeNormalizada,
    valorUnitarioComercial: valorUnitarioNormalizado,
    quantidadeTributaria: quantidadeTributaria, // Manter original
    valorUnitarioTributario: valorUnitarioTributario, // Manter original
    valorTotalProduto,
    valorFrete,
    cfop,
    ncm,
    origemMercadoria,
    cstICMS,
    baseCalculoICMS,
    aliquotaICMS,
    valorICMS,
    cstIPI,
    valorIPI,
    cstPIS,
    aliquotaPIS,
    valorPIS,
    cstCOFINS,
    aliquotaCOFINS,
    valorCOFINS,
    valorTotalTributos
  };
};