// =====================================================
// UTILITÁRIOS DE VALIDAÇÃO DE ARQUIVOS - PHARMA.AI
// =====================================================

import { ValidacaoArquivo, CONFIGURACAO_PADRAO, MENSAGENS_ERRO } from '@/types/importacao';

/**
 * Valida um arquivo antes do upload
 */
export function validarArquivo(file: File): ValidacaoArquivo {
  const erros: string[] = [];
  const avisos: string[] = [];

  // Validar tamanho
  const tamanhoMB = file.size / (1024 * 1024);
  if (tamanhoMB > CONFIGURACAO_PADRAO.limite_arquivo_mb) {
    erros.push(
      MENSAGENS_ERRO.ARQUIVO_MUITO_GRANDE.replace(
        '{limite}', 
        CONFIGURACAO_PADRAO.limite_arquivo_mb.toString()
      )
    );
  }

  // Validar tipo
  const tipoValido = CONFIGURACAO_PADRAO.tipos_permitidos.some(tipo => 
    file.type === tipo || file.name.toLowerCase().endsWith(tipo)
  );
  
  if (!tipoValido) {
    erros.push(MENSAGENS_ERRO.TIPO_INVALIDO);
  }

  // Validar nome do arquivo
  if (file.name.length > 255) {
    avisos.push('Nome do arquivo muito longo. Pode causar problemas no processamento.');
  }

  // Validar caracteres especiais no nome
  if (/[<>:"/\\|?*]/.test(file.name)) {
    avisos.push('Nome do arquivo contém caracteres especiais que podem causar problemas.');
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos,
    tamanho: file.size,
    tipo: file.type || 'unknown'
  };
}

/**
 * Valida o conteúdo XML de uma nota fiscal
 */
export async function validarXMLNotaFiscal(file: File): Promise<{
  valido: boolean;
  erros: string[];
  avisos: string[];
  metadados?: {
    numeroNota?: string;
    cnpjEmitente?: string;
    valorTotal?: number;
    dataEmissao?: string;
  };
}> {
  const erros: string[] = [];
  const avisos: string[] = [];
  const metadados: Record<string, unknown> = {};

  try {
    const conteudo = await lerArquivoTexto(file);
    
    // Verificar se é XML válido
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(conteudo, 'text/xml');
    
    // Verificar erros de parsing
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      erros.push(MENSAGENS_ERRO.XML_INVALIDO);
      return { valido: false, erros, avisos };
    }

    // Verificar se é uma NFe válida
    const nfeElement = xmlDoc.querySelector('NFe, nfeProc');
    if (!nfeElement) {
      erros.push('Arquivo XML não é uma Nota Fiscal Eletrônica válida');
      return { valido: false, erros, avisos };
    }

    // Extrair metadados básicos
    try {
      const ide = xmlDoc.querySelector('ide');
      const emit = xmlDoc.querySelector('emit');
      const total = xmlDoc.querySelector('total ICMSTot');

      if (ide) {
        metadados.numeroNota = ide.querySelector('nNF')?.textContent;
        metadados.dataEmissao = ide.querySelector('dhEmi')?.textContent;
      }

      if (emit) {
        metadados.cnpjEmitente = emit.querySelector('CNPJ')?.textContent;
      }

      if (total) {
        const valorTotalElement = total.querySelector('vNF');
        if (valorTotalElement) {
          metadados.valorTotal = parseFloat(valorTotalElement.textContent || '0');
        }
      }

      // Verificar se tem produtos
      const produtos = xmlDoc.querySelectorAll('det');
      if (produtos.length === 0) {
        avisos.push('Nenhum produto encontrado na nota fiscal');
      } else if (produtos.length > 100) {
        avisos.push(`Nota fiscal com muitos produtos (${produtos.length}). Processamento pode ser lento.`);
      }

    } catch (error) {
      avisos.push('Não foi possível extrair todos os metadados da nota fiscal');
    }

  } catch (error) {
    erros.push('Erro ao ler o arquivo XML');
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos,
    metadados
  };
}

/**
 * Lê o conteúdo de um arquivo como texto
 */
function lerArquivoTexto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Formata o tamanho do arquivo para exibição
 */
export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Gera um ID único para o arquivo
 */
export function gerarIdArquivo(file: File): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const fileName = file.name.replace(/[^a-zA-Z0-9]/g, '');
  
  return `${timestamp}-${random}-${fileName}`.substring(0, 50);
}

/**
 * Verifica se um arquivo é duplicado baseado no nome e tamanho
 */
export function verificarDuplicata(
  novoArquivo: File, 
  arquivosExistentes: File[]
): boolean {
  return arquivosExistentes.some(arquivo => 
    arquivo.name === novoArquivo.name && 
    arquivo.size === novoArquivo.size
  );
} 