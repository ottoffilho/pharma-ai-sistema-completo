// =====================================================
// UTILITÁRIOS DE VALIDAÇÃO PARA CLIENTES
// =====================================================

/**
 * Remove caracteres não numéricos de uma string
 */
export function apenasNumeros(texto: string): string {
  return texto.replace(/\D/g, '');
}

/**
 * Valida CPF brasileiro
 */
export function validarCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  const numerosCPF = apenasNumeros(cpf);
  
  if (numerosCPF.length !== 11) return false;
  
  // Verifica sequências inválidas
  if (/^(\d)\1{10}$/.test(numerosCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numerosCPF.charAt(i)) * (10 - i);
  }
  let digito1 = 11 - (soma % 11);
  if (digito1 > 9) digito1 = 0;
  
  if (parseInt(numerosCPF.charAt(9)) !== digito1) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numerosCPF.charAt(i)) * (11 - i);
  }
  let digito2 = 11 - (soma % 11);
  if (digito2 > 9) digito2 = 0;
  
  return parseInt(numerosCPF.charAt(10)) === digito2;
}

/**
 * Valida CNPJ brasileiro
 */
export function validarCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  
  const numerosCNPJ = apenasNumeros(cnpj);
  
  if (numerosCNPJ.length !== 14) return false;
  
  // Verifica sequências inválidas
  if (/^(\d)\1{13}$/.test(numerosCNPJ)) return false;
  
  // Validação do primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  
  for (let i = 0; i < 12; i++) {
    soma += parseInt(numerosCNPJ.charAt(i)) * pesos1[i];
  }
  
  let digito1 = soma % 11;
  digito1 = digito1 < 2 ? 0 : 11 - digito1;
  
  if (parseInt(numerosCNPJ.charAt(12)) !== digito1) return false;
  
  // Validação do segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  
  for (let i = 0; i < 13; i++) {
    soma += parseInt(numerosCNPJ.charAt(i)) * pesos2[i];
  }
  
  let digito2 = soma % 11;
  digito2 = digito2 < 2 ? 0 : 11 - digito2;
  
  return parseInt(numerosCNPJ.charAt(13)) === digito2;
}

/**
 * Formata CPF (###.###.###-##)
 */
export function formatarCPF(cpf: string): string {
  const numeros = apenasNumeros(cpf);
  if (numeros.length !== 11) return cpf;
  
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ (##.###.###/####-##)
 */
export function formatarCNPJ(cnpj: string): string {
  const numeros = apenasNumeros(cnpj);
  if (numeros.length !== 14) return cnpj;
  
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone brasileiro
 */
export function formatarTelefone(telefone: string): string {
  const numeros = apenasNumeros(telefone);
  
  if (numeros.length === 10) {
    // Telefone fixo: (##) ####-####
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (numeros.length === 11) {
    // Celular: (##) #####-####
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return telefone;
}

/**
 * Valida email
 */
export function validarEmail(email: string): boolean {
  if (!email) return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Determina o tipo de documento baseado no conteúdo
 */
export function determinarTipoDocumento(documento: string): 'cpf' | 'cnpj' | 'invalido' {
  const numeros = apenasNumeros(documento);
  
  if (numeros.length === 11) {
    return validarCPF(documento) ? 'cpf' : 'invalido';
  } else if (numeros.length === 14) {
    return validarCNPJ(documento) ? 'cnpj' : 'invalido';
  }
  
  return 'invalido';
}

/**
 * Formata documento automaticamente (CPF ou CNPJ)
 */
export function formatarDocumento(documento: string): string {
  const tipo = determinarTipoDocumento(documento);
  
  switch (tipo) {
    case 'cpf':
      return formatarCPF(documento);
    case 'cnpj':
      return formatarCNPJ(documento);
    default:
      return documento;
  }
}

/**
 * Valida se uma data não é futura
 */
export function validarDataNascimento(data: string): boolean {
  if (!data) return true; // Data é opcional
  
  const dataInformada = new Date(data);
  const hoje = new Date();
  
  return dataInformada <= hoje;
} 