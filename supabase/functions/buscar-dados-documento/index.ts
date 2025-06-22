import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const BRASIL_API_BASE_URL = 'https://brasilapi.com.br/api'
const RECEITAWS_API_URL = 'https://receitaws.com.br/v1/cnpj'

interface CNPJData {
  cnpj: string
  identificador_matriz_filial: number
  descricao_matriz_filial: string
  razao_social: string
  nome_fantasia: string
  situacao_cadastral: string
  descricao_situacao_cadastral: string
  data_situacao_cadastral: string
  motivo_situacao_cadastral: number
  nome_cidade_exterior: string | null
  codigo_natureza_juridica: number
  data_inicio_atividade: string
  cnae_fiscal: number
  cnae_fiscal_descricao: string
  descricao_tipo_logradouro: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cep: string
  uf: string
  codigo_municipio: number
  municipio: string
  ddd_telefone_1: string
  ddd_telefone_2: string
  ddd_fax: string
  qualificacao_do_responsavel: number
  capital_social: number
  porte: string
  descricao_porte: string
  opcao_pelo_simples: boolean
  data_opcao_pelo_simples: string | null
  data_exclusao_do_simples: string | null
  opcao_pelo_mei: boolean
  situacao_especial: string | null
  data_situacao_especial: string | null
  qsa: Array<{
    identificador_de_socio: number
    nome_socio: string
    cnpj_cpf_do_socio: string
    codigo_qualificacao_socio: number
    percentual_capital_social: number
    data_entrada_sociedade: string
    cpf_representante_legal: string | null
    nome_representante_legal: string | null
    codigo_qualificacao_representante_legal: number | null
  }>
}

interface CPFData {
  cpf: string
  nome: string
  situacao: string
  nascimento: string
}

// Função para validar CNPJ (versão completa com cálculo de dígitos)
function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14 || /^(\d)\1{13}/.test(cnpj)) {
    return false;
  }
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) {
    return false;
  }
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) {
    return false;
  }
  return true;
}

// Função para validar CPF (versão completa com cálculo de dígitos)
function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}/.test(cpf)) {
    return false;
  }

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  if (resto !== parseInt(cpf.substring(9, 10), 10)) {
    return false;
  }

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  if (resto !== parseInt(cpf.substring(10, 11), 10)) {
    return false;
  }

  return true;
}

// Função alternativa para buscar CNPJ na ReceitaWS (caso a Brasil API falhe)
async function buscarDadosCNPJFallback(cnpj: string): Promise<Record<string, unknown> | null> {
  try {
    console.log(`Tentando consulta alternativa de CNPJ: ${cnpj}`);
    
    // Adicionar timeout e opções para a requisição
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos de timeout
    
    const requestOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PharmaAI-App/1.0'
      },
      signal: controller.signal
    };
    
    const url = `${RECEITAWS_API_URL}/${cnpj}`;
    console.log(`Chamando API alternativa: ${url}`);
    
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);
    
    console.log(`Status da resposta alternativa: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Erro na API alternativa: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Dados recebidos da API alternativa: ${data.status || 'sem status'}`);
    
    if (data.status === 'ERROR') {
      return { 
        success: false, 
        message: data.message || 'CNPJ não encontrado na base de dados alternativa' 
      };
    }
    
    // Verificar se a empresa está ativa
    const situacao = (data.situacao || '').toUpperCase();
    if (situacao !== 'ATIVA') {
      return {
        success: false,
        message: `Empresa não está ativa. Situação: ${data.situacao || 'Desconhecida'}`
      };
    }
    
    // Formatar telefone (se existir)
    const telefone = data.telefone || null;
    
    // Formatar os dados para retorno
    return {
      success: true,
      documento: cnpj,
      tipo_pessoa: 'PJ',
      razao_social: data.nome || '',
      nome_fantasia: data.fantasia || null,
      endereco_completo: `${data.logradouro || ''} ${data.numero || ''} ${data.complemento || ''} ${data.bairro || ''}`.trim(),
      cep: data.cep || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      telefone: telefone,
      situacao_cadastral: data.situacao || '',
      porte: data.porte || '',
      cnae_principal: {
        codigo: data.atividade_principal?.[0]?.code || '',
        descricao: data.atividade_principal?.[0]?.text || ''
      },
      data_abertura: data.abertura || '',
      capital_social: data.capital_social || '',
      natureza_juridica: data.natureza_juridica || '',
      dados_preenchidos: true // Indica que dados foram preenchidos automaticamente
    };
  } catch (error) {
    console.error(`Erro na API alternativa para CNPJ ${cnpj}:`, error);
    return null; // Retorna nulo para indicar falha e não será usado
  }
}

// Função principal para buscar dados do CNPJ
async function buscarDadosCNPJ(cnpj: string): Promise<Record<string, unknown>> {
  try {
    console.log(`Iniciando consulta de CNPJ: ${cnpj}`)
    
    // Adicionar timeout e opções para a requisição
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
    
    const requestOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PharmaAI-App/1.0'
      },
      signal: controller.signal
    };
    
    const url = `${BRASIL_API_BASE_URL}/cnpj/v1/${cnpj}`;
    console.log(`Chamando API: ${url}`);
    
    const response = await fetch(url, requestOptions)
    clearTimeout(timeoutId);
    
    console.log(`Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`CNPJ não encontrado na API principal: ${cnpj}`);
        
        // Tentar API alternativa
        console.log('Tentando API alternativa...');
        const resultadoAlternativo = await buscarDadosCNPJFallback(cnpj);
        if (resultadoAlternativo && resultadoAlternativo.success) {
          console.log('API alternativa retornou dados com sucesso');
          return resultadoAlternativo;
        }
        
        return { success: false, message: 'CNPJ não encontrado nas bases de dados' }
      }
      
      if (response.status === 429) {
        console.log('Limite de requisições excedido na API principal');
        
        // Tentar API alternativa
        console.log('Tentando API alternativa por causa do limite excedido...');
        const resultadoAlternativo = await buscarDadosCNPJFallback(cnpj);
        if (resultadoAlternativo && resultadoAlternativo.success) {
          console.log('API alternativa retornou dados com sucesso');
          return resultadoAlternativo;
        }
        
        return { success: false, message: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }
      }
      
      if (response.status >= 500) {
        console.log('Erro no servidor da API principal');
        
        // Tentar API alternativa
        console.log('Tentando API alternativa devido a erro no servidor principal...');
        const resultadoAlternativo = await buscarDadosCNPJFallback(cnpj);
        if (resultadoAlternativo && resultadoAlternativo.success) {
          console.log('API alternativa retornou dados com sucesso');
          return resultadoAlternativo;
        }
        
        return { success: false, message: 'Serviço de consulta de CNPJ indisponível no momento. Tente novamente mais tarde.' }
      }
      
      let errorText = '';
      try {
        const errorData = await response.text();
        errorText = errorData;
        console.log(`Erro detalhado: ${errorData}`);
      } catch (e) {
        console.log('Não foi possível ler detalhes do erro');
      }
      
      // Tentar API alternativa para qualquer outro erro
      console.log('Tentando API alternativa devido a erro não especificado...');
      const resultadoAlternativo = await buscarDadosCNPJFallback(cnpj);
      if (resultadoAlternativo && resultadoAlternativo.success) {
        console.log('API alternativa retornou dados com sucesso');
        return resultadoAlternativo;
      }
      
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }
    
    const data: CNPJData = await response.json();
    console.log(`Dados recebidos para CNPJ ${cnpj}: Razão Social: ${data.razao_social}`);
    
    // Verificar se a empresa está ativa (aceita 'ATIVA', 'ATIVO', case-insensitive)
    const situacao = (data.situacao_cadastral || '').toUpperCase();
    if (situacao !== 'ATIVA' && situacao !== 'ATIVO') {
      return {
        success: false,
        message: `Empresa não está ativa. Situação: ${data.descricao_situacao_cadastral || data.situacao_cadastral}`
      }
    }
    
    // Formatar telefone (se existir)
    let telefone = null;
    if (data.ddd_telefone_1) {
      const ddd = data.ddd_telefone_1.substring(0, 2);
      const numero = data.ddd_telefone_1.substring(2).trim();
      if (numero) {
        telefone = `(${ddd}) ${numero}`;
      }
    }
    
    // Formatar os dados para retorno
    const endereco_completo = [
      data.descricao_tipo_logradouro,
      data.logradouro,
      data.numero,
      data.complemento,
      data.bairro
    ].filter(Boolean).join(' ');
    
    return {
      success: true,
      documento: data.cnpj,
      tipo_pessoa: 'PJ',
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia || null,
      endereco_completo: endereco_completo,
      cep: data.cep,
      municipio: data.municipio,
      uf: data.uf,
      telefone: telefone,
      situacao_cadastral: data.descricao_situacao_cadastral,
      porte: data.descricao_porte,
      cnae_principal: {
        codigo: data.cnae_fiscal,
        descricao: data.cnae_fiscal_descricao
      },
      data_abertura: data.data_inicio_atividade,
      capital_social: data.capital_social,
      natureza_juridica: data.codigo_natureza_juridica,
      dados_preenchidos: true // Indica que dados foram preenchidos automaticamente
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`Erro ao buscar CNPJ ${cnpj}:`, errorMessage);
    
    // Tentar API alternativa como último recurso
    try {
      console.log('Tentando API alternativa como último recurso...');
      const resultadoAlternativo = await buscarDadosCNPJFallback(cnpj);
      if (resultadoAlternativo && resultadoAlternativo.success) {
        console.log('API alternativa retornou dados com sucesso');
        return resultadoAlternativo;
      }
    } catch (fallbackError) {
      console.error('Erro também na API alternativa:', fallbackError);
    }
    
    if (errorMessage.includes('AbortError') || errorMessage.includes('abort')) {
      return {
        success: false,
        message: 'Tempo limite excedido na consulta do CNPJ. Verifique sua conexão ou tente novamente mais tarde.'
      }
    }
    
    return {
      success: false,
      message: 'Erro ao consultar dados do CNPJ. Tente novamente mais tarde.',
      debug: errorMessage
    }
  }
}

// Função para buscar dados do CPF (limitada - apenas validação)
async function buscarDadosCPF(cpf: string): Promise<Record<string, unknown>> {
  // Nota: A Brasil API não oferece consulta completa de CPF por questões de privacidade
  // Apenas validamos se o CPF é válido
  
  if (!isValidCPF(cpf)) {
    return {
      success: false,
      message: 'CPF inválido'
    }
  }
  
  return {
    success: true,
    documento: cpf,
    tipo_pessoa: 'PF',
    message: 'CPF válido. Por questões de privacidade, preencha os dados manualmente.',
    dados_preenchidos: false // Indica que não foram preenchidos dados automaticamente
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Iniciando processamento de requisição');
    const body = await req.json();
    const { documento } = body;
    
    console.log(`Documento recebido: ${documento ? 'sim' : 'não'}`);
    
    if (!documento) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Documento é obrigatório'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
    
    // Remove caracteres não numéricos
    const documentoLimpo = documento.replace(/[^\d]/g, '');
    console.log(`Documento limpo: ${documentoLimpo}, Tamanho: ${documentoLimpo.length}`);
    
    let resultado;
    
    if (documentoLimpo.length === 14) {
      // É um CNPJ
      console.log('Processando como CNPJ');
      if (!isValidCNPJ(documentoLimpo)) {
        console.log('CNPJ inválido (falhou na validação de dígitos)');
        return new Response(
          JSON.stringify({
            success: false,
            message: 'CNPJ inválido. Verifique os dígitos informados.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }
      
      resultado = await buscarDadosCNPJ(documentoLimpo);
    } else if (documentoLimpo.length === 11) {
      // É um CPF
      console.log('Processando como CPF');
      resultado = await buscarDadosCPF(documentoLimpo);
    } else {
      console.log(`Documento com tamanho inválido: ${documentoLimpo.length}`);
      let mensagem;
      
      if (documentoLimpo.length < 11) {
        mensagem = 'Documento incompleto. CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos.';
      } else if (documentoLimpo.length > 14) {
        mensagem = 'Documento com muitos dígitos. CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos.';
      } else {
        mensagem = 'Documento deve ser um CNPJ (14 dígitos) ou CPF (11 dígitos)';
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          message: mensagem
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
    
    console.log('Processamento concluído', resultado.success ? 'com sucesso' : 'com erro');
    
    return new Response(
      JSON.stringify(resultado),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erro na função:', errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Erro interno do servidor',
        debug: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 