// =====================================================
// UTILITÁRIOS DE NOTA FISCAL - PHARMA.AI
// =====================================================

/**
 * Valida chave de acesso da NF-e
 */
export const validarChaveAcesso = (chave: string): boolean => {
  // Chave deve ter 44 dígitos
  if (chave.length !== 44) return false;
  
  // Deve conter apenas números
  if (!/^\d+$/.test(chave)) return false;
  
  // Validação do dígito verificador (algoritmo módulo 11)
  const digitos = chave.slice(0, 43);
  const dv = parseInt(chave.charAt(43));
  
  let soma = 0;
  let peso = 2;
  
  for (let i = digitos.length - 1; i >= 0; i--) {
    soma += parseInt(digitos.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  
  const resto = soma % 11;
  const dvCalculado = resto < 2 ? 0 : 11 - resto;
  
  return dv === dvCalculado;
};

/**
 * Função auxiliar para extrair texto de elementos XML
 */
export const getTextContent = (parent: Element | null, tagName: string): string => {
  if (!parent) return '';
  const element = parent.querySelector(tagName);
  return element?.textContent?.trim() || '';
};

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
 * Normalizar unidade e quantidade
 */
export const normalizarUnidadeEQuantidade = (
  uCom: string,
  qCom: number,
  nomeProduto: string,
): { unidade: string; quantidade: number } => {
  const uComUpper = (uCom || '').toUpperCase();
  let unidadeBase = uComUpper;
  let quantidadeCalculada = qCom;
  let fatorConversao = 1;

  // 1. Extrair valor numérico e unidade da string 'uCom' (ex: "1 KG" ou "5,385K")
  const matchUnidadeComposta = uComUpper.match(/^([\d.,]+)\s*([A-ZÀ-Ü]+)/);
  if (matchUnidadeComposta) {
    const valorNumericoStr = matchUnidadeComposta[1].replace(',', '.');
    const valorNumerico = parseFloat(valorNumericoStr);
    const unidadeExtraida = matchUnidadeComposta[2];

    if (!isNaN(valorNumerico)) {
      // Multiplica a quantidade do XML pelo valor encontrado na unidade
      quantidadeCalculada *= valorNumerico; 
      unidadeBase = unidadeExtraida;
    }
  }

  // 2. Normalizar a unidade base e definir o fator de conversão
  let unidadeFinal = unidadeBase;
  switch (unidadeBase) {
    case 'KG':
    case 'K':
      unidadeFinal = 'G';
      fatorConversao = 1000;
      break;
    case 'L':
      unidadeFinal = 'ML';
      fatorConversao = 1000;
      break;
    case 'G':
      unidadeFinal = 'G';
      break;
    case 'ML':
      unidadeFinal = 'ML';
      break;
    case 'MIL': // "5 MIL"
      unidadeFinal = 'U';
      fatorConversao = 1000;
      break;
    case 'UN':
    case 'UND':
    case 'UNID':
    case 'UNIDADE':
    case 'PC':
      unidadeFinal = 'U';
      // Se a unidade for genérica, tenta extrair a informação do nome do produto
      const nomeMatch = nomeProduto.toUpperCase().match(/\((\d+)\s*(ML|G|MG|U)\)/);
      if (nomeMatch) {
        const valorNome = parseInt(nomeMatch[1], 10);
        const unidadeNome = nomeMatch[2];
        if (!isNaN(valorNome)) {
          quantidadeCalculada = valorNome * qCom;
          unidadeFinal = unidadeNome;
          fatorConversao = 1; // Reseta o fator pois a quantidade já foi extraída
        }
      }
      break;
  }

  // 3. Aplicar o fator de conversão à quantidade calculada
  const quantidadeFinal = quantidadeCalculada * fatorConversao;

  return { unidade: unidadeFinal.toLowerCase(), quantidade: quantidadeFinal };
}; 