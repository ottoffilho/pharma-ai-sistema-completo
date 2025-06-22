// =====================================================
// SERVIÇO DE NOTAS FISCAIS - PHARMA.AI
// Módulo M10 - Fiscal
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import { TABLES, formatSupabaseError, uploadFile, STORAGE_BUCKETS, downloadFile, getSignedUrl } from './supabase';
import { FornecedorService } from './fornecedorService';
import { buscarProdutoPorCodigo, atualizarEstoqueProduto } from './produtoService';
import { MarkupService } from './markupService';
import { loteService } from './loteService';
import logger from '@/lib/logger';
import { mapearTipoParaCategoria, CATEGORIAS_MARKUP, type CategoriaMarkup } from '@/constants/categorias';
import type {
  NotaFiscal,
  NotaFiscalCompleta,
  CreateNotaFiscal,
  UpdateNotaFiscal,
  ItemNotaFiscal,
  CreateItemNotaFiscal,
  FiltrosNotaFiscal,
  PaginationParams,
  PaginatedResponse,
  ImportacaoNFe,
  ResultadoImportacaoNFe,
  UUID
} from '../types/database';

// =====================================================
// CRUD BÁSICO DE NOTAS FISCAIS
// =====================================================

/**
 * Busca notas fiscais com filtros e paginação
 */
export const buscarNotasFiscais = async (
  filtros: FiltrosNotaFiscal = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<NotaFiscalCompleta>> => {
  try {
    const {
      page = 1,
      limit = 50,
      orderBy = 'data_emissao',
      orderDirection = 'desc'
    } = pagination;

    const offset = (page - 1) * limit;

    // Query base com relacionamentos
    let query = supabase
      .from(TABLES.NOTA_FISCAL)
      .select(`
        *,
        fornecedor:fornecedor_id(
          id, 
          cnpj, 
          razao_social, 
          nome_fantasia,
          cidade,
          uf
        )
      `);

    // Aplicar filtros
    if (filtros.fornecedor_id) {
      query = query.eq('fornecedor_id', filtros.fornecedor_id);
    }

    if (filtros.data_emissao_inicio) {
      query = query.gte('data_emissao', filtros.data_emissao_inicio);
    }

    if (filtros.data_emissao_fim) {
      query = query.lte('data_emissao', filtros.data_emissao_fim);
    }

    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }

    if (filtros.numero_nf) {
      query = query.eq('numero_nf', filtros.numero_nf);
    }

    if (filtros.chave_acesso) {
      query = query.eq('chave_acesso', filtros.chave_acesso);
    }

    // Contar total de registros
    const { count } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .select('*', { count: 'exact', head: true });

    // Aplicar ordenação e paginação
    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Erro ao buscar notas fiscais:', error);
    throw error;
  }
};

/**
 * Busca nota fiscal por ID com todos os relacionamentos
 */
export const buscarNotaFiscalPorId = async (id: UUID): Promise<NotaFiscalCompleta | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .select(`
        *,
        fornecedor:fornecedor_id(*),
        itens:itens_nota_fiscal(
          *,
          produto:produto_id(
            id,
            codigo_interno,
            nome,
            unidade_comercial,
            categoria_produto:categoria_produto_id(nome),
            forma_farmaceutica:forma_farmaceutica_id(nome, sigla)
          ),
          lote:lote_id(
            id,
            numero_lote,
            data_fabricacao,
            data_validade,
            quantidade_atual
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Nota fiscal não encontrada
      }
      throw new Error(formatSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar nota fiscal por ID:', error);
    throw error;
  }
};

/**
 * Busca nota fiscal por chave de acesso
 */
export const buscarNotaFiscalPorChave = async (chaveAcesso: string): Promise<NotaFiscal | null> => {
  try {
    logger.database('Buscando nota fiscal por chave', { chave: chaveAcesso });

    const { data, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .select('*')
      .eq('chave_acesso', chaveAcesso)
      .maybeSingle();

    if (error) {
      logger.error('Erro ao buscar nota fiscal por chave', error);
      return null;
    }

    logger.database(data ? 'Nota fiscal encontrada' : 'Nota fiscal não encontrada', { numeroNF: data?.numero_nf });
    return data;
  } catch (error) {
    logger.error('Erro no serviço de busca por chave', error);
    return null;
  }
};

/**
 * Cria uma nova nota fiscal
 */
export const criarNotaFiscal = async (notaFiscal: CreateNotaFiscal): Promise<NotaFiscal> => {
  try {
    // Validar se chave de acesso já existe
    const notaExistente = await buscarNotaFiscalPorChave(notaFiscal.chave_acesso);
    if (notaExistente) {
      throw new Error(`Nota fiscal com chave "${notaFiscal.chave_acesso}" já existe`);
    }

    const { data, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .insert(notaFiscal)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar nota fiscal:', error);
    throw error;
  }
};

/**
 * Atualiza uma nota fiscal existente
 */
export const atualizarNotaFiscal = async (notaFiscal: UpdateNotaFiscal): Promise<NotaFiscal> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .update(notaFiscal)
      .eq('id', notaFiscal.id)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar nota fiscal:', error);
    throw error;
  }
};

// =====================================================
// GERENCIAMENTO DE ITENS DA NOTA FISCAL
// =====================================================

/**
 * Busca itens de uma nota fiscal
 */
export const buscarItensNotaFiscal = async (notaFiscalId: UUID): Promise<ItemNotaFiscal[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ITEM_NOTA_FISCAL)
      .select(`
        *,
        produto:produto_id(
          id,
          codigo_interno,
          nome,
          unidade_comercial
        ),
        lote:lote_id(
          id,
          numero_lote,
          data_validade
        )
      `)
      .eq('nota_fiscal_id', notaFiscalId)
      .order('numero_item');

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar itens da nota fiscal:', error);
    throw error;
  }
};

/**
 * Cria um item da nota fiscal
 */
export const criarItemNotaFiscal = async (item: CreateItemNotaFiscal): Promise<ItemNotaFiscal> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ITEM_NOTA_FISCAL)
      .insert(item)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar item da nota fiscal:', error);
    throw error;
  }
};

// =====================================================
// IMPORTAÇÃO DE XML DE NF-e
// =====================================================

/**
 * Processa arquivo XML de NF-e e importa para o banco
 */
export const importarXMLNotaFiscal = async (
  arquivo: File,
  opcoes: Partial<ImportacaoNFe> = {}
): Promise<ResultadoImportacaoNFe> => {
  const resultado: ResultadoImportacaoNFe = {
    sucesso: false,
    produtos_importados: 0,
    produtos_novos: 0,
    produtos_atualizados: 0,
    lotes_criados: 0,
    erros: [],
    avisos: []
  };

  try {
    logger.import('Iniciando importação do XML', { arquivo: arquivo.name });
    
    // 0. Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      logger.error('Usuário não autenticado para importação');
      resultado.erros.push('Usuário não autenticado. Faça login para importar notas fiscais.');
      return resultado;
    }

    // 1. Upload do arquivo XML para storage
    const nomeArquivo = `${Date.now()}_${arquivo.name}`;
    const caminhoArquivo = `uploads/${nomeArquivo}`;
    
    await uploadFile(STORAGE_BUCKETS.NF_XML, caminhoArquivo, arquivo);

    // 2. Ler e processar o XML
    const xmlText = await arquivo.text();
    
    const dadosNFe = await processarXMLNFe(xmlText);
    logger.import('XML processado', {
      chave: dadosNFe.chaveAcesso,
      numero: dadosNFe.numeroNF,
      itens: dadosNFe.itens?.length || 0
    });

    // 3. Verificar se nota já existe
    const notaExistente = await buscarNotaFiscalPorChave(dadosNFe.chaveAcesso);
    if (notaExistente) {
      logger.warn('Tentativa de importar nota já existente');
      resultado.erros.push(`Nota fiscal ${dadosNFe.numeroNF} já foi importada anteriormente`);
      return resultado;
    }

    // 4. Importar/atualizar fornecedor
    const fornecedorId = await importarFornecedorDoXML(dadosNFe.fornecedor);
    resultado.fornecedor_id = fornecedorId;

    // 5. Processar produtos e lotes
    const produtosProcessados = await processarProdutosDoXML(dadosNFe.itens, fornecedorId);
    resultado.produtos_importados = produtosProcessados.total;
    resultado.produtos_novos = produtosProcessados.novos;
    resultado.produtos_atualizados = produtosProcessados.atualizados;
    resultado.lotes_criados = produtosProcessados.lotes;

    // 6. Criar nota fiscal
    const notaFiscal = await criarNotaFiscal({
      chave_acesso: dadosNFe.chaveAcesso,
      numero_nf: dadosNFe.numeroNF,
      serie: dadosNFe.serie,
      modelo: dadosNFe.modelo,
      data_emissao: dadosNFe.dataEmissao,
      data_saida_entrada: dadosNFe.dataSaidaEntrada,
      fornecedor_id: fornecedorId,
      valor_produtos: dadosNFe.valorProdutos,
      valor_frete: dadosNFe.valorFrete,
      valor_seguro: 0,
      valor_desconto: 0,
      valor_outras_despesas: 0,
      valor_total_nota: dadosNFe.valorTotalNota,
      valor_icms: dadosNFe.valorICMS,
      valor_ipi: dadosNFe.valorIPI,
      valor_pis: dadosNFe.valorPIS,
      valor_cofins: dadosNFe.valorCOFINS,
      valor_total_tributos: dadosNFe.valorTotalTributos,
      status: 'PROCESSADA',
      xml_arquivo_path: caminhoArquivo,
      xml_arquivo_nome: arquivo.name,
      xml_arquivo_tamanho: arquivo.size
    });

    resultado.nota_fiscal_id = notaFiscal.id;
    console.log('✅ Nota fiscal criada:', notaFiscal.id);

    // 7. Criar itens da nota fiscal e atualizar estoque
    console.log('📝 Criando itens da nota fiscal...');
    const produtosProcessadosArray = produtosProcessados.produtosProcessados as { produtoId: UUID; loteId?: UUID; item: Record<string, unknown> }[];
    
    for (let i = 0; i < produtosProcessadosArray.length; i++) {
      const produtoProcessado = produtosProcessadosArray[i];
      console.log(`📝 Processando item ${i + 1}/${produtosProcessadosArray.length}...`);
      
      try {
        const produtoProcessado = produtosProcessadosArray[i];
        const item = produtoProcessado.item;
        
        // 7.1. Criar item da nota fiscal
        await criarItemNotaFiscal({
          nota_fiscal_id: notaFiscal.id,
          produto_id: produtoProcessado.produtoId,
          numero_item: item.numeroItem as number,
          codigo_produto: (item.produto as any)?.codigoInterno || '',
          codigo_ean: (item.produto as any)?.codigoEAN || undefined,
          descricao_produto: (item.produto as any)?.nome || '',
          ncm: item.ncm as string,
          cfop: item.cfop as string,
          unidade_comercial: (item.produto as any)?.unidadeComercial || 'UN',
          unidade_tributaria: (item.produto as any)?.unidadeTributaria || undefined,
          quantidade_comercial: item.quantidadeComercial as number,
          quantidade_tributaria: item.quantidadeTributaria as number || undefined,
          valor_unitario_comercial: item.valorUnitarioComercial as number,
          valor_unitario_tributario: item.valorUnitarioTributario as number || undefined,
          valor_total_produto: item.valorTotalProduto as number,
          valor_frete: item.valorFrete as number || undefined,
          valor_seguro: undefined,
          valor_desconto: undefined,
          valor_outras_despesas: undefined,
          origem_produto: item.origemMercadoria as number || undefined,
          cst_icms: item.cstICMS as string || undefined,
          modalidade_bc_icms: undefined,
          valor_bc_icms: item.baseCalculoICMS as number || undefined,
          aliquota_icms: item.aliquotaICMS as number || undefined,
          valor_icms: item.valorICMS as number || undefined,
          cst_ipi: item.cstIPI as string || undefined,
          aliquota_ipi: undefined,
          valor_bc_ipi: undefined,
          valor_ipi: item.valorIPI as number || undefined,
          cst_pis: item.cstPIS as string || undefined,
          aliquota_pis: item.aliquotaPIS as number || undefined,
          valor_bc_pis: undefined,
          valor_pis: item.valorPIS as number || undefined,
          cst_cofins: item.cstCOFINS as string || undefined,
          aliquota_cofins: item.aliquotaCOFINS as number || undefined,
          valor_bc_cofins: undefined,
          valor_cofins: item.valorCOFINS as number || undefined,
          produto_criado: true,
          lote_criado: !!produtoProcessado.loteId,
          processado: true,
          informacoes_adicionais: undefined
        });

        // 7.2. Atualizar estoque do produto (entrada de mercadoria)
        const quantidadeEntrada = item.quantidadeComercial as number;
        await atualizarEstoqueProduto(produtoProcessado.produtoId, quantidadeEntrada, 'entrada');
        
        // Item processado silenciosamente
      } catch (error) {
        console.error(`❌ Erro ao criar item ${i + 1}:`, error);
        resultado.erros.push(`Erro ao criar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    logger.import('Importação concluída com sucesso', { 
      produtosImportados: resultado.produtos_importados,
      novos: resultado.produtos_novos,
      lotes: resultado.lotes_criados
    });
    resultado.sucesso = true;
    return resultado;

  } catch (error) {
    logger.error('Erro na importação do XML', error);
    resultado.erros.push(error instanceof Error ? error.message : 'Erro desconhecido');
    return resultado;
  }
};

// =====================================================
// FUNÇÕES AUXILIARES PARA PROCESSAMENTO DE XML
// =====================================================

/**
 * Processa o XML da NF-e e extrai dados estruturados
 */
const processarXMLNFe = async (xmlText: string): Promise<Record<string, unknown>> => {
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
const extrairDadosFornecedor = (emit: Element | null): Record<string, unknown> => {
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
 * Remove informações fiscais do nome do produto
 */
const limparNomeProduto = (nome: string): string => {
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
 * Extrai dados de um item do XML
 */
const extrairDadosItem = (det: Element, numeroItem: number): Record<string, unknown> => {
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

  return {
    numeroItem,
    produto: {
      codigoInterno,
      codigoEAN,
      nome,
      ncm,
      cfop,
      unidadeComercial,
      unidadeTributaria,
      lote
    },
    quantidadeComercial,
    valorUnitarioComercial,
    quantidadeTributaria,
    valorUnitarioTributario,
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

/**
 * Função auxiliar para extrair texto de elementos XML
 */
const getTextContent = (parent: Element | null, tagName: string): string => {
  if (!parent) return '';
  const element = parent.querySelector(tagName);
  return element?.textContent?.trim() || '';
};

/**
 * Importa ou atualiza fornecedor baseado nos dados do XML
 */
const importarFornecedorDoXML = async (dadosFornecedor: Record<string, unknown>): Promise<UUID> => {
  return await FornecedorService.buscarOuCriarFornecedor({
    cnpj: dadosFornecedor.cnpj as string,
    razaoSocial: dadosFornecedor.razaoSocial as string,
    nomeFantasia: dadosFornecedor.nomeFantasia as string,
    inscricaoEstadual: dadosFornecedor.inscricaoEstadual as string,
    telefone: dadosFornecedor.telefone as string,
    logradouro: dadosFornecedor.logradouro as string,
    numero: dadosFornecedor.numero as string,
    complemento: dadosFornecedor.complemento as string,
    bairro: dadosFornecedor.bairro as string,
    cidade: dadosFornecedor.cidade as string,
    uf: dadosFornecedor.uf as string,
    cep: dadosFornecedor.cep as string,
  });
};

/**
 * Processa produtos do XML e retorna estatísticas
 */
const processarProdutosDoXML = async (itens: Record<string, unknown>[], fornecedorId: UUID): Promise<Record<string, unknown>> => {
  console.log('📦 Iniciando processamento de produtos. Total de itens:', itens.length);
  
  let novos = 0;
  let atualizados = 0;
  let lotes = 0;
  const produtosProcessados: { produtoId: UUID; loteId?: UUID; item: Record<string, unknown> }[] = [];
  
  // Cache para evitar consultas duplicadas
  const cacheProdutos = new Map<string, Produto | null>();
  
  for (let index = 0; index < itens.length; index++) {
    const item = itens[index];
    // Produto sendo processado silenciosamente (${index + 1}/${itens.length})
    
    try {
      const produtoData = item.produto as {
        codigoInterno: string;
        nome: string;
        ncm?: string;
        codigoEAN?: string;
        cfop?: string;
        unidadeComercial?: string;
        unidadeTributaria?: string;
        origem?: number;
        cstIcms?: string;
        cstIpi?: string;
        cstPis?: string;
        cstCofins?: string;
        aliquotaIcms?: number;
        aliquotaIpi?: number;
        aliquotaPis?: number;
        aliquotaCofins?: number;
        lote?: {
          numeroLote: string;
          dataValidade?: string;
          quantidade?: number;
        };
      };
      
      if (!produtoData || !produtoData.codigoInterno) {
        console.warn('⚠️ Item sem código interno válido:', item);
        continue;
      }
      
      console.log(`🔍 Buscando produto com código: ${produtoData.codigoInterno}`);
      
      // 1. Verificar se produto já existe (com cache para evitar consultas duplicadas)
      let produto = cacheProdutos.get(produtoData.codigoInterno);
      
      if (produto === undefined) {
        console.log('🔍 Produto não está no cache, buscando no banco...');
        // Primeira consulta para este código - buscar no banco
        produto = await buscarProdutoPorCodigo(produtoData.codigoInterno);
        cacheProdutos.set(produtoData.codigoInterno, produto);
        console.log('✅ Busca no banco concluída');
      } else {
        console.log('✅ Produto encontrado no cache');
      }
      
      if (produto) {
        // Produto existe - atualizar se necessário
        atualizados++;
        console.log(`✅ Produto existente encontrado: ${produto.nome}`);
      } else {
        console.log('🆕 Produto não existe, criando novo...');
        
        // Produto não existe - criar novo
        const custoProduto = (item.valorUnitarioComercial as number) || 0;
        console.log(`💰 Custo do produto: ${custoProduto}`);
        
        // Determinar categoria para markup baseado no tipo de produto classificado
        const tipoProduto = classificarTipoProduto(produtoData.ncm, produtoData.nome);
        // Forçar categoria correta para embalagens
        let categoria = mapearTipoParaCategoria(tipoProduto);
        if (tipoProduto.toUpperCase() === 'EMBALAGEM') {
          categoria = CATEGORIAS_MARKUP.EMBALAGENS;
        }
        console.log(`🏷️ Tipo de produto classificado: ${tipoProduto}`);
        
        console.log(`📊 Categoria para markup determinada: ${categoria}`);
        console.log(`📋 Produto: "${produtoData.nome}" | NCM: "${produtoData.ncm}" | Tipo: "${tipoProduto}" | Categoria Markup: "${categoria}"`);
        console.log('💹 Calculando markup...');
        
        // Calcular markup automático
        const markupService = new MarkupService();
        const markupCalculado = await markupService.calcularMarkup(custoProduto, categoria);
        
        console.log('✅ Markup calculado:', markupCalculado);
        
        const novoProduto = {
          // Campos obrigatórios da tabela produtos
          nome: produtoData.nome || 'Produto Importado',
          tipo: classificarTipoProduto(produtoData.ncm, produtoData.nome), // Classificação automática
          unidade_medida: produtoData.unidadeComercial || 'UN', // Campo obrigatório  
          custo_unitario: custoProduto, // Campo obrigatório
          markup: markupCalculado.markup,
          markup_personalizado: false, // Usar markup padrão da categoria
          fornecedor_id: fornecedorId,
          categoria: categoria,
          
          // Campos adicionais para produtos da NF-e
          codigo_interno: produtoData.codigoInterno,
          codigo_ean: produtoData.codigoEAN === 'SEM GTIN' ? null : produtoData.codigoEAN,
          ncm: produtoData.ncm || '',
          cfop: produtoData.cfop,
          unidade_comercial: produtoData.unidadeComercial,
          unidade_tributaria: produtoData.unidadeTributaria,
          origem: produtoData.origem || 0,
          
          // Informações fiscais
          cst_icms: produtoData.cstIcms,
          cst_ipi: produtoData.cstIpi,
          cst_pis: produtoData.cstPis,
          cst_cofins: produtoData.cstCofins,
          aliquota_icms: produtoData.aliquotaIcms || 0,
          aliquota_ipi: produtoData.aliquotaIpi || 0,
          aliquota_pis: produtoData.aliquotaPis || 0,
          aliquota_cofins: produtoData.aliquotaCofins || 0,
          
          // Controle
          preco_custo: custoProduto,
          preco_venda: markupCalculado.preco_venda,
          estoque_atual: 0,
          estoque_minimo: 1,
          produto_revenda: true,
          ativo: true,
          is_deleted: false
        };

        const { data: produtoInserido, error: errorProduto } = await supabase
          .from(TABLES.PRODUTO)
          .insert(novoProduto)
          .select()
          .single();

        if (errorProduto) {
          throw new Error(formatSupabaseError(errorProduto));
        }
        
        // Atualizar variável para ter consistência
        produto = produtoInserido;
        
        // Atualizar cache com o produto criado
        cacheProdutos.set(produtoData.codigoInterno, produto);
        novos++;
        console.log(`✅ Novo produto criado: ${produto.nome}`);
      }
      
      // 2. Processar lote se existir
      let loteId: UUID | undefined;
      if (produtoData.lote) {
        try {
          // Processando lote silenciosamente
          
          // Criar ou atualizar lote usando o serviço de lotes
          const loteCriado = await loteService.criarLoteDoXML({
            produto_id: produto.id,
            numero_lote: produtoData.lote.numeroLote,
            data_validade: produtoData.lote.dataValidade,
            quantidade: produtoData.lote.quantidade || (item.quantidadeComercial as number),
            preco_custo_unitario: item.valorUnitarioComercial as number,
            fornecedor_id: fornecedorId
          });
          
          loteId = loteCriado.id;
          lotes++;
          console.log(`✅ Lote processado: ${loteCriado.numero_lote} (ID: ${loteId})`);
          
        } catch (error) {
          console.error(`❌ Erro ao processar lote ${produtoData.lote.numeroLote}:`, error);
          // Continuar processamento mesmo com erro no lote
        }
      }
      
      // 3. Adicionar à lista de produtos processados
      produtosProcessados.push({
        produtoId: produto.id,
        loteId,
        item
      });
      
      console.log(`✅ Produto ${index + 1} processado com sucesso`);
      
    } catch (error) {
      console.error(`❌ Erro ao processar produto ${index + 1}:`, error);
      // Continuar processamento mesmo com erro em um item
    }
  }
  
  console.log('📦 Processamento de produtos concluído:', {
    total: itens.length,
    novos,
    atualizados,
    lotes,
    processados: produtosProcessados.length
  });
  
  return {
    total: itens.length,
    novos,
    atualizados,
    lotes,
    produtosProcessados
  };
};

// =====================================================
// FUNÇÕES AUXILIARES PARA ESTOQUE
// =====================================================

/**
 * Calcula estoque mínimo inteligente baseado no tipo de produto
 */
const calcularEstoqueMinimoInteligente = (nomeProduto: string, quantidadeComprada: number): number => {
  const nome = nomeProduto.toUpperCase();
  
  // Para produtos de alta rotação (Florais de Bach), manter estoque maior
  if (nome.includes('BACH') || nome.includes('FLORAL')) {
    return Math.max(2, Math.ceil(quantidadeComprada * 0.5));
  }
  
  // Para tinturas-mãe, estoque moderado
  if (nome.includes('TM') || nome.includes('TINTURA')) {
    return Math.max(1, Math.ceil(quantidadeComprada * 0.3));
  }
  
  // Para homeopáticos (CH), estoque baixo pois são específicos
  if (nome.includes('CH') || nome.includes('CENTESIMAL')) {
    return Math.max(1, Math.ceil(quantidadeComprada * 0.2));
  }
  
  // Padrão: 25% da quantidade comprada, mínimo 1
  return Math.max(1, Math.ceil(quantidadeComprada * 0.25));
};

/**
 * Calcula estoque máximo inteligente baseado no tipo de produto
 */
const calcularEstoqueMaximoInteligente = (nomeProduto: string, quantidadeComprada: number): number => {
  const nome = nomeProduto.toUpperCase();
  
  // Para produtos de alta rotação (Florais de Bach), estoque maior
  if (nome.includes('BACH') || nome.includes('FLORAL')) {
    return Math.max(10, quantidadeComprada * 3);
  }
  
  // Para tinturas-mãe, estoque moderado
  if (nome.includes('TM') || nome.includes('TINTURA')) {
    return Math.max(5, quantidadeComprada * 2);
  }
  
  // Para homeopáticos (CH), estoque controlado
  if (nome.includes('CH') || nome.includes('CENTESIMAL')) {
    return Math.max(3, Math.ceil(quantidadeComprada * 1.5));
  }
  
  // Padrão: 2x a quantidade comprada, mínimo 5
  return Math.max(5, quantidadeComprada * 2);
};

// =====================================================
// FUNÇÃO DE CLASSIFICAÇÃO DE TIPO DE PRODUTO
// =====================================================

/**
 * Classifica o tipo do produto baseado em NCM e nome
 * Com foco específico em farmácia de manipulação
 */
function classificarTipoProduto(ncm: string, nome: string): string {
  const ncmLimpo = (ncm || '').replace(/\D/g, '');
  const nomeUpper = (nome || '').toUpperCase();

  // === EMBALAGENS ESPECÍFICAS PARA FARMÁCIA DE MANIPULAÇÃO ===
  
  // NCMs específicos de embalagens para farmácia
  const ncmEmbalagensFarmacia = [
    // Cápsulas vazias (NOVA REGRA PRIORITÁRIA)
    '96020010', // Cápsulas de gelatina digeríveis vazias
    '96020090', // Cápsulas vazias - RELEASE CAPS (ADICIONADO EXPLICITAMENTE)
    
    // Frascos e recipientes de plástico
    '39232990', // Outros artigos de plástico (categoria que inclui frascos, potes)
    '39233000', // Garrafas, frascos e artigos similares
    '39233090', // Potes plásticos, bisnagas, frascos de plástico
    '39234000', // Bobinas, carretéis e suportes similares
    '39269090', // Outras obras de plástico (aplicadores anais, etc.)
    '39239090', // Outras obras de plásticos (colheres de medida, aplicadores)
    '39199090', // Outros artigos de plástico
    
    // Frascos e recipientes de vidro
    '70109010', // Frascos de vidro para medicamentos
    '70109090', // Vidros âmbar e outros recipientes de vidro
    '70179000', // Cânulas de vidro para laboratório farmacêutico
    '70139900', // Vidros para esmalte
    
    // Tampas e vedações
    '39235000', // Tampas, rolhas e outros dispositivos de fechamento
    '40169900', // Outras obras de borracha vulcanizada
    
    // Recipientes de metal
    '76121000', // Recipientes de alumínio (bisnagas)
    '76160000', // Outros artefatos de alumínio
    
    // Papel e materiais auxiliares
    '48194000', // Sacos de papel
    '48211000', // Rótulos de papel ou cartão, impressos
    '48219000', // Outros rótulos de papel ou cartão
    '48239090', // Outros papéis, cartões de celulose (papel pH)
    '28112230', // Sílica gel dessecante
    
    // Seringas, aplicadores e acessórios
    '39269090', // Aplicadores de plástico
    '39239090', // Colheres de medida de plástico
    '40149090', // Bulbos de silicone
    '84248990', // Válvulas espumadoras
    '84249090', // Outros aparelhos mecânicos (dispensadores, aplicadores)
    '90183119', // Dosadores orais, seringas graduadas
    '38221990', // Papel indicador de pH
  ];
  
  // Verificação por NCM completo (8 dígitos)
  if (ncmEmbalagensFarmacia.includes(ncmLimpo)) {
    return 'EMBALAGEM';
  }
  
  // Verificação por prefixos de NCM de embalagens
  const prefixosEmbalagemFarmacia = [
    '3923', // Artigos de transporte ou embalagem, de plásticos
    '3926', // Outras obras de plásticos
    '4819', // Caixas, sacos e embalagens de papel/cartão
    '4821', // Rótulos de papel ou cartão
    '4823', // Outros papéis, cartões de celulose
    '7010', // Garrafas, frascos e recipientes de vidro
    '7013', // Objetos de vidro para mesa/cozinha
    '7017', // Artigos de vidro para laboratório (cânulas, tubos)
    '7020', // Outras obras de vidro
    '7612', // Recipientes de alumínio (bisnagas)
    '2811', // Produtos químicos auxiliares (sílica gel)
    '4014', // Artigos de borracha vulcanizada (bulbos)
    '3822', // Reagentes de diagnóstico (papel pH)
    '8309', // Rolhas, tampas e fechos
    '8424', // Válvulas e aparelhos mecânicos (válvulas espumadoras)
    '9018', // Instrumentos para medicina/veterinária (seringas, dosadores)
    '9602', // Cápsulas de gelatina, cachês vazios, etc. (NOVA REGRA)
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
    'SERINGA', 'AGULHA', 'CONTA-GOTAS', 'GOTEJADOR', 'VIDRO', 'PLÁSTICO',
    'RECIPIENTE', 'CONTAINER', 'LACRE', 'SELO', 'ETIQUETA', 'ADESIVO',
    'SACO', 'SACOLA', 'ENVELOPE', 'CAIXA', 'CARTUCHO', 'TUBO',
    'BOIÃO', 'JARRO', 'FLACONETE', 'VIAL', 'AMPOULE',
    
    // Materiais específicos encontrados nos XMLs
    'CANULA', 'CÂNULA', 'BULBO', 'SILICONE', 'APLICADOR', 'COLHER MEDIDA',
    'SACHE', 'SACHÊ', 'SILICA GEL', 'PAPEL INDICADOR', 'PAPEL PH',
    'BUCHA', 'FLIPTOP', 'FLIP TOP', 'VEDACAO', 'VEDAÇÃO', 'ALUMINIO', 'ALUMÍNIO',
    'ESPUMADOR', 'VALV ESPUMADORA', 'DOSADOR ORAL', 'DISK TOP', 'FURADA',
    'SLIM LOOK', 'DISPENSADOR', 'APLICADOR MECANICO', 'APARELHO APLICADOR',
    
    // Tipos específicos de vidro e plástico
    'AMBAR', 'ÂMBAR', 'BRANCO', 'TRANSPARENTE', 'INJEPLAST', 'ESMALTE',
    'GOTEJADOR BL', 'GOTEJADOR BDR', 'FURO SOLUTIONS', 'QUADRADO'
  ];
  
  if (palavrasEmbalagem.some(palavra => nomeUpper.includes(palavra))) {
    return 'EMBALAGEM';
  }

  // =====================================================
  // HOMEOPÁTICOS – REGRA PRIORITÁRIA
  // =====================================================
  const regexHomeopaticoPrioritario = /(\b\d+(CH|DH|LM|FC)\b|\bCH\s?\d+\b|HOMEOPAT(?:ICO|ICA)|FLORAL|BACH|DINAMIZAÇÃO|POTÊNCIA)/;
  if (regexHomeopaticoPrioritario.test(nomeUpper)) {
    return 'HOMEOPATICO';
  }

  // === COSMÉTICOS POR NCM ===
  const ncmCosmeticos = ['3301', '3302', '3303', '3304', '3305', '3306', '3307'];
  if (ncmCosmeticos.some(prefixo => ncmLimpo.startsWith(prefixo))) {
    return 'COSMÉTICO';
  }

  // === MEDICAMENTOS POR NCM ===
  const ncmMedicamentos = ['3003', '3004', '3002'];
  if (ncmMedicamentos.some(prefixo => ncmLimpo.startsWith(prefixo))) {
    return 'MEDICAMENTO';
  }

  // === INSUMOS/MATÉRIAS-PRIMAS POR NCM ===
  // REMOVIDO: Verificação genérica por prefixos '29' que conflitava com produtos alopáticos específicos
  // A classificação por NCM específico agora tem prioridade

  // === CLASSIFICAÇÃO POR PALAVRAS-CHAVE FARMACÊUTICAS ===
  
  // Produtos alopáticos específicos (princípios ativos sintéticos)
  if (/(ÁCIDO|ACIDO|SULFATO|CLORIDRATO|FOSFATO|CITRATO|TARTARATO|MALEATO|SUCCINATO|PROPANODIOL|MONOHIDRAT|DIHIDRAT|ANIDRO|DAPAGLIFLOZINA|METFORMINA|LOSARTANA|ENALAPRIL|CAPTOPRIL|OMEPRAZOL|LANSOPRAZOL|ATORVASTATINA|SINVASTATINA|LEVOTIROXINA|CARVEDILOL|BISOPROLOL|FUROSEMIDA|HIDROCLOROTIAZIDA|AMLODIPINO|VALSARTANA|TELMISARTANA|IRBESARTANA|GLIMEPIRIDA|GLIBENCLAMIDA|INSULINA|PARACETAMOL|IBUPROFENO|DICLOFENACO|NIMESULIDA|CELECOXIBE|PREDNISONA|PREDNISOLONA|DEXAMETASONA|BETAMETASONA|FLUTICASONA|BUDESONIDA|AMOXICILINA|AZITROMICINA|CIPROFLOXACINO|LEVOFLOXACINO|CEFALEXINA|CLINDAMICINA|METRONIDAZOL|FLUCONAZOL|ITRACONAZOL|SERTRALINA|FLUOXETINA|PAROXETINA|VENLAFAXINA|BUPROPIONA|RISPERIDONA|QUETIAPINA|OLANZAPINA|ARIPIPRAZOL|CLONAZEPAM|LORAZEPAM|ALPRAZOLAM|DIAZEPAM|ZOLPIDEM|ZOPICLONA|DONEPEZILA|RIVASTIGMINA|MEMANTINA)/.test(nomeUpper)) {
    return 'MATERIA_PRIMA';
  }
  
  // Novos produtos alopáticos identificados nos XMLs analisados (atualizado V6 - 2025-01-31)
  if (/(NALTREXONE|NALTREXONA|AEROSIL|DIACEREINA|ALANTOINA|GLUCONOLACTONA|ANASTROZOL|TESTOSTERONA|ESTRADIOL|LIOTIRONINA|CAFEINA|BIOTINA|CIANOCOBALAMINA|METILCOBALAMINA|TETRACAINA|N-ACETIL|L-CISTEINA|MINOXIDIL|CRISINA|D-RIBOSE|COENZIMA|UBIDECARENONA|TOCOFEROL|COLAGENO|PEPTAN|L-CARNITINA|L-TRIPTOFANO|L-TEANINA|CREATINA|CERAMIDAS|TREONATO|DIMAGNESIO|VITAMINA B|VITAMINA C|VITAMINA E|VITAMINA K|VITAMINA D|VITAMINA H|RESVERATROL|QUERCETINA|HIDROXITRIPTOFANO|CANFORA|CARBINOL|BETAINA|MAGNESIO|CALCIO|INDOL|DI-INDOL|GLUCOSAMINA|MSM|TRICOXIN|PSYLIUM|BETAÍNA|MALATO|CITRATO DE CALCIO|CARBONATO DE MAGNESIO|DUTASTERIDA|L-CITRULINA|L-LISINA|COLECALCIFEROL|ASHWAGANDHA|BERBERINA|SILICA|COLOIDAL|ACARBOSE|PREGABALINA|DULOXETINA|BITARTARATO|CURCUMINA)/.test(nomeUpper)) {
    return 'MATERIA_PRIMA';
  }

  // Extratos naturais específicos (produtos fitoterápicos)
  if (/(EXTRATO|GINKGO|BILOBA|HAMAMELIS|BOLDO|PASSIFLORA|POLIPODIO|LEUCOTOMOS|VALERIANA|GARRA DO DIABO|PINUS PINASTER|PANAX GINSENG|CUCUMIS MELO|SILIMARINA)/.test(nomeUpper)) {
    return 'MATERIA_PRIMA';
  }

  // Enzimas e probióticos
  if (/(LIPASE|LACTOBACILLUS|ACIDOPHILUS|PROBIOTICO)/.test(nomeUpper)) {
    return 'MATERIA_PRIMA';
  }

  // Óleos e componentes específicos
  if (/(ÓLEO DE SILICONE|DIMETHICONE|COLÁGENO|HIDROLISADO|PEPTAN|LEVEDO DE CERVEJA|AMIDO DE MILHO)/.test(nomeUpper)) {
    return 'INSUMO';
  }

  // === CLASSIFICAÇÃO POR NCM ESPECÍFICO DOS PRODUTOS ALOPÁTICOS ===
  
  // NCMs de extratos vegetais e fitoterápicos (13xxxx)
  if (['13021930', '13021960', '13021950', '13021999'].includes(ncmLimpo)) {
    return 'MATERIA_PRIMA';
  }

  // NCMs de hormônios e derivados (2937xxxx) - ATUALIZADO
  if (['29372990', '29372349', '29379090'].includes(ncmLimpo)) {
    return 'MATERIA_PRIMA';
  }

  // NCMs de vitaminas específicas (2936xxxx) - ATUALIZADO V3
  if (['29362710', '29362610', '29362812', '29362931', '29362940', '29362921', '29362690', '29362890', '29362911', '29362310', '29362410'].includes(ncmLimpo)) {
    return 'MATERIA_PRIMA';
  }

  // NCMs de cafeína e estimulantes (2939xxxx)
  if (['29393010'].includes(ncmLimpo)) {
    return 'MATERIA_PRIMA';
  }

  // NCMs de aminoácidos e derivados (29xxxx) - ATUALIZADO V6 - CORREÇÃO MINOXIDIL
  if (['29181500', '29181690', '29156019', '29239090', '29224990', '29252919', '29252990', '29223990', '29224110', '29224910', '29241999', '29309019', '29335991', '29335919', '29389090', '29391900', '29400019', '29181990', '29224190', '29335999', '29339999', '29329999', '29322000', '29397990', '29349999', '29333120', '29333999', '29221999', '29072900', '29398090', '29231000'].includes(ncmLimpo)) {
    return 'MATERIA_PRIMA';
  }

  // NCMs de enzimas e proteínas (35xxxx, 29xxxx) - ATUALIZADO V4
  if (['35079049', '35040090', '29146200', '35079039', '35079029'].includes(ncmLimpo)) {
    return 'MATERIA_PRIMA';
  }

  // NCMs de compostos orgânicos específicos (29xxxx)
  if (['29189999', '29332190', '29322000', '29339919', '29339969', '29339999', '29171310', '29142990', '29072900', '29147990', '29309079', '29329912', '29329999'].includes(ncmLimpo)) {
    return 'MATERIA_PRIMA';
  }

  // NCMs de óleos e gorduras (15xxxx) - NOVO
  if (['15159090'].includes(ncmLimpo)) {
    return 'INSUMO';
  }

  // NCMs de suplementos e preparações (21xxxx) - ATUALIZADO
  if (['21021090', '21069030', '21022000', '21069090'].includes(ncmLimpo)) {
    return 'INSUMO';
  }

  // NCMs de excipientes farmacêuticos especializados (28xxxx) - NOVO V5
  if (['28112220', '28112230'].includes(ncmLimpo)) {
    return 'INSUMO';
  }

  // NCMs de minerais e sais farmacêuticos (28xxxx, 25xxxx, 33xxxx, 39xxxx) - ATUALIZADO V4
  // REMOVIDO: 96020090 (cápsulas vazias) - deve ser classificado como EMBALAGEM
  if (['28369911', '25262000', '28321090', '33012990', '33029019', '33049910', '39139090', '96020010'].includes(ncmLimpo)) {
    return 'INSUMO';
  }

  // NCMs de fibras e materiais naturais (03xxxx) - NOVO
  if (['03061990'].includes(ncmLimpo)) {
    return 'INSUMO';
  }

  // NCMs de triglicerídeos e preparações lipídicas (38xxxx) - ATUALIZADO
  if (['39100019', '38249923'].includes(ncmLimpo)) {
    return 'INSUMO';
  }

  // =====================================================
  // AJUSTE ESPECÍFICO – EXTRATO DE CUCUMIS MELO (NCM 08134090)
  // =====================================================
  // Embora 08134090 seja um NCM de frutas secas, no contexto da farmácia
  // de manipulação ele representa extrato vegetal com uso terapêutico.
  // Devemos tratar como MATÉRIA-PRIMA para aplicar o markup "alopáticos".
  if (ncmLimpo === '08134090') {
    return 'MATERIA_PRIMA';
  }

  // NCMs de alimentos/suplementos (11xxxx, 12xxxx, 08xxxx, 09xxxx, 21xxxx) - ATUALIZADO V4
  if (['11081200', '11062000', '12119090', '09109900', '21021090', '21069030', '21069090'].includes(ncmLimpo)) {
    return 'INSUMO';
  }

  // === CONTINUAR COM OUTRAS CLASSIFICAÇÕES ===
  
  // Cosméticos e produtos de beleza
  if (/(ÓLEO ESSENCIAL|BATOM|PROTETOR SOLAR|HIDRATANTE|SHAMPOO|CONDICIONADOR|SABONETE|PERFUME|COLÔNIA|DESODORANTE|CREME FACIAL|LOÇÃO|SÉRUM|MÁSCARA|ESFOLIANTE|TÔNICO|DEMAQUILANTE|BASE|PÓ|RÍMEL|SOMBRA|BLUSH|GLOSS|ESMALTE|REMOVEDOR|ACETONA|MAQUIAGEM|COSMÉTICO|BELEZA|ANTI-IDADE|ANTIRRUGAS|CLAREADOR|BRONZEADOR|AUTOBRONZEADOR|FPS|PROTEÇÃO SOLAR)/.test(nomeUpper)) {
    return 'COSMÉTICO';
  }
  
  // Insumos e excipientes
  if (/(EXCIPIENTE|VEÍCULO|INSUMO|CONSERVANTE|ESTABILIZANTE|DILUENTE)/.test(nomeUpper)) {
    return 'INSUMO';
  }
  
  // Formas farmacêuticas - Medicamentos
  if (/(COMPRIMIDO|CÁPSULA|CREME|SOLUÇÃO|GEL|POMADA|XAROPE|SUSPENSÃO|ELIXIR)/.test(nomeUpper)) {
    return 'MEDICAMENTO';
  }
  
  // Matérias-primas ativas
  if (/(PRINCÍPIO ATIVO|MATÉRIA PRIMA|ATIVO|EXTRATO|TINTURA)/.test(nomeUpper)) {
    return 'MATERIA_PRIMA';
  }
  
  // Homeopáticos específicos
  if (/(CH|DH|LM|FC|TM|FLORAL|BACH|DINAMIZAÇÃO|POTÊNCIA)/.test(nomeUpper)) {
    return 'HOMEOPATICO';
  }

  // === FALLBACK INTELIGENTE ===
  
  // Se contém números que parecem potência homeopática
  if (/\d+(CH|DH|LM|FC)/.test(nomeUpper)) {
    return 'HOMEOPATICO';
  }
  
  // Se o nome sugere manipulação
  if (/(MANIPULADO|FÓRMULA|PREPARAÇÃO)/.test(nomeUpper)) {
    return 'MEDICAMENTO';
  }
  
  // Fallback final baseado no NCM
  if (ncmLimpo.startsWith('30')) {
    return 'MEDICAMENTO'; // Grupo 30 geralmente são medicamentos
  }
  
  if (ncmLimpo.startsWith('33')) {
    return 'COSMÉTICO'; // Grupo 33 são cosméticos
  }

  // Fallback padrão
  return 'OUTRO';
}

// =====================================================
// VALIDAÇÕES
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
 * Função de teste para demonstrar a classificação de produtos alopáticos
 * Baseada nos XMLs analisados
 */
export const testarClassificacaoAlopaticos = () => {
  const produtosTeste = [
    // XML 1
    { nome: "Di-Indol Metano", ncm: "29339919" },
    { nome: "Hamamelis Extrato Seco", ncm: "13021999" },
    { nome: "Cucumis Melo", ncm: "08134090" },
    { nome: "Naltrexone Hcl (P.344)", ncm: "29391900" },
    { nome: "Diacereina", ncm: "29189999" },
    { nome: "Alantoina", ncm: "29332190" },
    { nome: "Gluconolactona", ncm: "29322000" },
    
    // XML 2  
    { nome: "Vitamina C Po", ncm: "29362710" },
    { nome: "Boldo Extrato Seco", ncm: "13021999" },
    { nome: "Talco", ncm: "25262000" },
    { nome: "L-Carnitina Base", ncm: "29239090" },
    { nome: "Passiflora Extrato Seco incarnata", ncm: "13021999" },
    { nome: "Ceramidas", ncm: "35040090" },
    
    // XML 3
    { nome: "EXT. SECO GINKGO BILOBA", ncm: "13021930" },
    { nome: "LIPASE", ncm: "35079049" },
    { nome: "TREONATO DE MAGNESIO ANIDRO", ncm: "29181690" },
    { nome: "CREATINA MONOHIDRATADA", ncm: "29252990" },
    { nome: "N-ACETIL-L-CARNITINA HCL", ncm: "29239090" },
    { nome: "L-TEANINA", ncm: "29224990" },
    { nome: "L-TRIPTOFANO", ncm: "29339919" },
    { nome: "TESTOSTERONA BASE MICRO (C5)", ncm: "29372990" },
    { nome: "VIT. B-12 CIANOCOBALAMINA", ncm: "29362610" },
    { nome: "SILIMARINA", ncm: "13021960" },

    // XML 4 (nf94342.xml) - NOVOS PRODUTOS
    { nome: "Ashwagandha Extrato 3%", ncm: "13021999" },
    { nome: "Dutasterida", ncm: "29372990" },
    { nome: "L-Citrulina DL-Malato", ncm: "29241999" },
    { nome: "L-Lisina HCl", ncm: "29224110" },
    { nome: "Vit.D3 (Colecalciferol) 40.000", ncm: "29362921" }
  ];

  console.log("🧪 TESTE DE CLASSIFICAÇÃO DE PRODUTOS ALOPÁTICOS:");
  console.log("=".repeat(60));
  
  produtosTeste.forEach((produto, index) => {
    const tipo = classificarTipoProduto(produto.ncm, produto.nome);
    const categoria = tipo === 'MATERIA_PRIMA' ? 'alopaticos' : 
                     tipo === 'INSUMO' ? 'insumos' : 'medicamentos';
    
    console.log(`${index + 1}. ${produto.nome}`);
    console.log(`   NCM: ${produto.ncm} | Tipo: ${tipo} | Categoria: ${categoria}`);
    console.log("");
  });
  
  return produtosTeste.map(produto => ({
    ...produto,
    tipo: classificarTipoProduto(produto.ncm, produto.nome)
  }));
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
 * Função para analisar um XML completo e identificar possíveis NCMs alopáticos não mapeados
 */
export const analisarXMLParaNovosAlopaticos = (produtosXML: Array<{nome: string, ncm: string}>): {
  novosNCMsPotenciais: Array<{
    ncm: string;
    nome: string;
    analise: ReturnType<typeof analisarPotencialAlopatico>;
  }>;
  resumo: {
    totalProdutos: number;
    potenciaisAlopaticos: number;
    altaConfianca: number;
    mediaConfianca: number;
    baixaConfianca: number;
  };
} => {
  const ncmsJaMapeados = new Set([
    // NCMs já incluídos na função classificarTipoProduto
    '13021930', '13021960', '13021950', '13021999',
    '29362710', '29362610', '29362812', '29362931', '29362940', '29362921',
    '29372990', '29224110', '29241999', '29181500', '29181690', '29156019',
    '29239090', '29224990', '29252990', '29223990', '29391900', '29189999',
    '29332190', '29322000', '29339919', '29339969', '29339999', '29171310',
    '29142990', '29072900', '29147990', '29309079', '29329912', '29329999',
    '35079049', '35040090', '28369911', '25262000', '21021090', '21069030',
    '21022000', '11081200', '12119090', '08134090', '39100019'
  ]);

  const novosNCMsPotenciais: Array<{
    ncm: string;
    nome: string;
    analise: ReturnType<typeof analisarPotencialAlopatico>;
  }> = [];

  const resumo = {
    totalProdutos: produtosXML.length,
    potenciaisAlopaticos: 0,
    altaConfianca: 0,
    mediaConfianca: 0,
    baixaConfianca: 0
  };

  for (const produto of produtosXML) {
    const ncmLimpo = produto.ncm.replace(/\D/g, '');
    
    // Pular NCMs já mapeados
    if (ncmsJaMapeados.has(ncmLimpo)) continue;

    const analise = analisarPotencialAlopatico(produto.ncm, produto.nome);
    
    if (analise.isProvavelAlopatico || analise.confianca >= 30) {
      novosNCMsPotenciais.push({
        ncm: ncmLimpo,
        nome: produto.nome,
        analise
      });

      resumo.potenciaisAlopaticos++;
      
      if (analise.confianca >= 70) {
        resumo.altaConfianca++;
      } else if (analise.confianca >= 40) {
        resumo.mediaConfianca++;
      } else {
        resumo.baixaConfianca++;
      }
    }
  }

  // Ordenar por confiança decrescente
  novosNCMsPotenciais.sort((a, b) => b.analise.confianca - a.analise.confianca);

  return {
    novosNCMsPotenciais,
    resumo
  };
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

// =====================================================
// RE-EXPORTAÇÕES EXPLÍCITAS (PARA PREVENIR PROBLEMAS DE HMR)
// =====================================================

// A função já está exportada acima, não precisa de re-exportação

export default {
  buscarNotasFiscais,
  buscarNotaFiscalPorId,
  buscarNotaFiscalPorChave,
  criarNotaFiscal,
  atualizarNotaFiscal,
  buscarItensNotaFiscal,
  criarItemNotaFiscal,
  importarXMLNotaFiscal,
  validarChaveAcesso,
  testarClassificacaoAlopaticos,
  analisarPotencialAlopatico,
  analisarXMLParaNovosAlopaticos
}; 

export const testarClassificacaoEmbalagens = () => {
  console.log('=== TESTE DE CLASSIFICAÇÃO DE EMBALAGENS - XMLs Analisados ===');
  
  // NCMs e produtos encontrados nos XMLs de embalagens
  const produtosTestados = [
    // XML 1 - NFe35250244015477002160550010000433811109322017
    { ncm: '39233090', nome: 'Pote R35 Branco Inv Injeplast' },
    { ncm: '39235000', nome: 'Tampa Pote R30-35 Branca Injeplast' },
    { ncm: '70179000', nome: 'Canula Vidro 72mm FI' },
    { ncm: '70109090', nome: 'Vidro Ambar 100ml R24-410 YB' },
    { ncm: '39269090', nome: 'Aplicador Anal M09 Embalado Individual' },
    { ncm: '40149090', nome: 'Bulbo Silicone Branco' },
    { ncm: '28112230', nome: 'Sache Silica Gel Branca 1g' },
    { ncm: '76121000', nome: 'Bisnaga Alum 120g-150ml Branca M9 35X180 R09' },
    
    // XML 2 e 3 - Produtos adicionais
    { ncm: '70139900', nome: 'Vidro Esmalte Quadrado 10ml Ambar C-Tampa Preta YB' },
    { ncm: '38221990', nome: 'Papel Indicador Univ pH 0-14 Merck C-100 Tiras' },
    { ncm: '39239090', nome: 'Colher Medida 5ml Cabo Longo S- Graduacao' },
    
    // Produtos para verificar se não são classificados como embalagem
    { ncm: '30049099', nome: 'Ácido Acetilsalicílico 99%' },
    { ncm: '29182200', nome: 'Ibuprofeno' },
    { ncm: '12119000', nome: 'Passiflora Incarnata TM' }
  ];
  
  console.log('Testando classificação de produtos:');
  console.log('=====================================');
  
  let embalagensCertas = 0;
  let totalEmbalagens = 11; // Total de produtos que devem ser classificados como embalagem
  
  produtosTestados.forEach((produto, index) => {
    const classificacao = classificarTipoProduto(produto.ncm, produto.nome);
    const isEmbalagem = classificacao === 'EMBALAGEM';
    const deveSerEmbalagem = index < 11; // Os primeiros 11 são embalagens
    
    if (deveSerEmbalagem && isEmbalagem) {
      embalagensCertas++;
    }
    
    const status = deveSerEmbalagem 
      ? (isEmbalagem ? '✅ CORRETO' : '❌ ERRO - deveria ser EMBALAGEM')
      : (isEmbalagem ? '❌ ERRO - não deveria ser EMBALAGEM' : '✅ CORRETO');
    
    console.log(`${index + 1}. NCM: ${produto.ncm} | ${produto.nome}`);
    console.log(`   Classificado como: ${classificacao} | ${status}`);
    console.log('');
  });
  
  console.log('=====================================');
  console.log(`RESULTADO: ${embalagensCertas}/${totalEmbalagens} embalagens classificadas corretamente`);
  console.log(`Taxa de acerto: ${((embalagensCertas / totalEmbalagens) * 100).toFixed(1)}%`);
  
  if (embalagensCertas === totalEmbalagens) {
    console.log('🎉 SUCESSO: Todos os NCMs de embalagens foram classificados corretamente!');
  } else {
    console.log('⚠️ ATENÇÃO: Alguns NCMs de embalagens não foram classificados corretamente.');
    console.log('   Verifique a implementação dos arrays ncmEmbalagensFarmacia e prefixosEmbalagemFarmacia.');
  }
};

// =====================================================
// FUNÇÕES DE DOWNLOAD E DANFE
// =====================================================

/**
 * Baixa o arquivo XML de uma nota fiscal
 */
export const baixarXMLNotaFiscal = async (notaFiscalId: UUID): Promise<void> => {
  try {
    // Buscar apenas os dados básicos da nota fiscal
    const { data: notaFiscal, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .select('*')
      .eq('id', notaFiscalId)
      .single();

    if (error || !notaFiscal) {
      throw new Error('Nota fiscal não encontrada');
    }

    let blob: Blob | null = null;
    let caminhoEncontrado = '';

    // Primeiro, tentar usar o caminho salvo no banco de dados (para novas importações)
    if (notaFiscal.xml_arquivo_path) {
      try {
        blob = await downloadFile(STORAGE_BUCKETS.NF_XML, notaFiscal.xml_arquivo_path);
        caminhoEncontrado = notaFiscal.xml_arquivo_path;
        logger.info('XML encontrado usando caminho do banco', { path: notaFiscal.xml_arquivo_path });
      } catch (error) {
        console.warn(`Arquivo não encontrado no caminho salvo: ${notaFiscal.xml_arquivo_path}`);
      }
    }

    // Se não encontrou pelo caminho salvo, tentar padrões alternativos (para importações antigas)
    if (!blob) {
      const possiveisCaminhos = [
        `uploads/${notaFiscal.chave_acesso}.xml`,
        `uploads/NFe_${notaFiscal.numero_nf}_${notaFiscal.serie}.xml`,
        `uploads/${notaFiscal.numero_nf}_${notaFiscal.serie}.xml`,
      ];

      for (const caminho of possiveisCaminhos) {
        try {
          blob = await downloadFile(STORAGE_BUCKETS.NF_XML, caminho);
          caminhoEncontrado = caminho;
          logger.info('XML encontrado usando padrão alternativo', { path: caminho });
          break;
        } catch (error) {
          console.warn(`Arquivo não encontrado em: ${caminho}`);
        }
      }
    }

    if (!blob) {
      throw new Error(`Arquivo XML não encontrado no storage. 
        
        Detalhes da nota fiscal:
        - Número: ${notaFiscal.numero_nf}
        - Série: ${notaFiscal.serie}
        - Chave de acesso: ${notaFiscal.chave_acesso}
        - Caminho esperado: ${notaFiscal.xml_arquivo_path || 'Não definido'}
        
        Possíveis causas:
        - O arquivo foi removido do storage
        - O arquivo foi salvo com nome diferente durante a importação
        - Problemas de conectividade com o storage`);
    }

    // Definir nome do arquivo para download
    const nomeArquivo = notaFiscal.xml_arquivo_nome || 
      `NFe_${notaFiscal.numero_nf}_Serie_${notaFiscal.serie}_${notaFiscal.chave_acesso.slice(-8)}.xml`;

    // Criar URL para download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    
    // Adicionar ao DOM temporariamente para trigger do download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL temporária
    URL.revokeObjectURL(url);
    
    logger.info('XML baixado com sucesso', { 
      notaFiscalId, 
      numeroNF: notaFiscal.numero_nf,
      caminhoEncontrado,
      nomeArquivo
    });
  } catch (error) {
    logger.error('Erro ao baixar XML da nota fiscal', error);
    throw error;
  }
};

/**
 * Gera e exibe o DANFE de uma nota fiscal
 */
export const visualizarDANFE = async (notaFiscalId: UUID): Promise<void> => {
  try {
    // Buscar dados básicos da nota fiscal com fornecedor
    const { data: notaFiscal, error: nfError } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .select(`
        *,
        fornecedor:fornecedor_id(*)
      `)
      .eq('id', notaFiscalId)
      .single();

    if (nfError || !notaFiscal) {
      throw new Error('Nota fiscal não encontrada');
    }

    // Buscar itens da nota fiscal
    const { data: itens, error: itensError } = await supabase
      .from(TABLES.ITEM_NOTA_FISCAL)
      .select('*')
      .eq('nota_fiscal_id', notaFiscalId)
      .order('numero_item');

    if (itensError) {
      throw new Error('Erro ao buscar itens da nota fiscal');
    }

    // Por enquanto, vamos abrir uma nova janela com os dados da nota fiscal
    // Em uma implementação completa, isso geraria um PDF do DANFE
    const danfeWindow = window.open('', '_blank', 'width=800,height=600');
    if (!danfeWindow) {
      throw new Error('Não foi possível abrir a janela do DANFE. Verifique se o bloqueador de pop-ups está desabilitado.');
    }

    // Gerar HTML do DANFE
    const danfeHTML = gerarHTMLDANFE(notaFiscal, itens || []);
    
    danfeWindow.document.write(danfeHTML);
    danfeWindow.document.close();
    
    logger.info('DANFE visualizado com sucesso', { notaFiscalId, numeroNF: notaFiscal.numero_nf });
  } catch (error) {
    logger.error('Erro ao visualizar DANFE', error);
    throw error;
  }
};

/**
 * Gera HTML do DANFE para visualização
 */
const gerarHTMLDANFE = (notaFiscal: any, itens: any[]): string => {
  const formatarDinheiro = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Dados do fornecedor com fallbacks
  const fornecedor = notaFiscal.fornecedor || {};
  const razaoSocial = fornecedor.razao_social || fornecedor.nome || 'N/A';
  const nomeFantasia = fornecedor.nome_fantasia || '';
  const cnpj = fornecedor.cnpj || fornecedor.documento || 'N/A';
  const endereco = fornecedor.endereco || '';
  const cidade = fornecedor.cidade || '';
  const uf = fornecedor.estado || '';
  const cep = fornecedor.cep || '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DANFE - Nota Fiscal ${notaFiscal.numero_nf}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          margin: 20px;
          line-height: 1.3;
        }
        .header {
          text-align: center;
          border: 2px solid #000;
          padding: 10px;
          margin-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 16px;
          font-weight: bold;
        }
        .header h2 {
          margin: 5px 0;
          font-size: 14px;
        }
        .info-section {
          border: 1px solid #000;
          margin-bottom: 10px;
          padding: 8px;
        }
        .info-section h3 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: bold;
          background-color: #f0f0f0;
          padding: 3px;
        }
        .info-row {
          display: flex;
          margin-bottom: 5px;
        }
        .info-label {
          font-weight: bold;
          min-width: 120px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
          font-size: 10px;
        }
        .items-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .totals {
          border: 1px solid #000;
          padding: 8px;
          background-color: #f9f9f9;
        }
        .totals .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .totals .total-final {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</h1>
        <h2>NF-e Nº ${notaFiscal.numero_nf} - Série ${notaFiscal.serie}</h2>
        <div style="font-size: 10px; margin-top: 5px;">
          Chave de Acesso: ${notaFiscal.chave_acesso}
        </div>
      </div>

      <div class="info-section">
        <h3>DADOS DO EMITENTE</h3>
        <div class="info-row">
          <span class="info-label">Razão Social:</span>
          <span>${razaoSocial}</span>
        </div>
        ${nomeFantasia ? `
          <div class="info-row">
            <span class="info-label">Nome Fantasia:</span>
            <span>${nomeFantasia}</span>
          </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">CNPJ:</span>
          <span>${cnpj}</span>
        </div>
        ${endereco ? `
          <div class="info-row">
            <span class="info-label">Endereço:</span>
            <span>${endereco}${cidade ? ` - ${cidade}` : ''}${uf ? `/${uf}` : ''}${cep ? ` - CEP: ${cep}` : ''}</span>
          </div>
        ` : ''}
      </div>

      <div class="info-section">
        <h3>DADOS DA NOTA FISCAL</h3>
        <div class="info-row">
          <span class="info-label">Data de Emissão:</span>
          <span>${formatarData(notaFiscal.data_emissao)}</span>
        </div>
        ${notaFiscal.data_saida_entrada ? `
          <div class="info-row">
            <span class="info-label">Data de Entrada:</span>
            <span>${formatarData(notaFiscal.data_saida_entrada)}</span>
          </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span>${notaFiscal.status}</span>
        </div>
      </div>

      <div class="info-section">
        <h3>PRODUTOS / SERVIÇOS</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Código</th>
              <th>Descrição</th>
              <th>NCM</th>
              <th>Qtd</th>
              <th>Unid</th>
              <th>Valor Unit</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${itens.map(item => `
              <tr>
                <td>${item.numero_item}</td>
                <td>${item.codigo_produto}</td>
                <td>${item.descricao_produto}</td>
                <td>${item.ncm}</td>
                <td>${item.quantidade_comercial}</td>
                <td>${item.unidade_comercial}</td>
                <td>${formatarDinheiro(item.valor_unitario_comercial)}</td>
                <td>${formatarDinheiro(item.valor_total_produto)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="totals">
        <div class="total-row">
          <span>Valor dos Produtos:</span>
          <span>${formatarDinheiro(notaFiscal.valor_produtos)}</span>
        </div>
        ${notaFiscal.valor_frete && notaFiscal.valor_frete > 0 ? `
          <div class="total-row">
            <span>Valor do Frete:</span>
            <span>${formatarDinheiro(notaFiscal.valor_frete)}</span>
          </div>
        ` : ''}
        ${notaFiscal.valor_seguro && notaFiscal.valor_seguro > 0 ? `
          <div class="total-row">
            <span>Valor do Seguro:</span>
            <span>${formatarDinheiro(notaFiscal.valor_seguro)}</span>
          </div>
        ` : ''}
        ${notaFiscal.valor_desconto && notaFiscal.valor_desconto > 0 ? `
          <div class="total-row">
            <span>Valor do Desconto:</span>
            <span>-${formatarDinheiro(notaFiscal.valor_desconto)}</span>
          </div>
        ` : ''}
        <div class="total-row">
          <span>ICMS:</span>
          <span>${formatarDinheiro(notaFiscal.valor_icms || 0)}</span>
        </div>
        <div class="total-row">
          <span>IPI:</span>
          <span>${formatarDinheiro(notaFiscal.valor_ipi || 0)}</span>
        </div>
        <div class="total-row">
          <span>PIS:</span>
          <span>${formatarDinheiro(notaFiscal.valor_pis || 0)}</span>
        </div>
        <div class="total-row">
          <span>COFINS:</span>
          <span>${formatarDinheiro(notaFiscal.valor_cofins || 0)}</span>
        </div>
        <div class="total-row total-final">
          <span>VALOR TOTAL DA NOTA:</span>
          <span>${formatarDinheiro(notaFiscal.valor_total_nota)}</span>
        </div>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px;">
          Imprimir DANFE
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; margin-left: 10px;">
          Fechar
        </button>
      </div>
    </body>
    </html>
  `;
};

/**
 * Testa o download de XML de uma nota fiscal específica
 */
export const testarDownloadXML = async (notaFiscalId: UUID): Promise<{
  sucesso: boolean;
  erro?: string;
  detalhes: {
    notaFiscal: any;
    caminhoTentado: string[];
    arquivoEncontrado?: string;
    tamanhoArquivo?: number;
  };
}> => {
  try {
    // Buscar dados da nota fiscal
    const { data: notaFiscal, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .select('*')
      .eq('id', notaFiscalId)
      .single();

    if (error || !notaFiscal) {
      return {
        sucesso: false,
        erro: 'Nota fiscal não encontrada',
        detalhes: {
          notaFiscal: null,
          caminhoTentado: []
        }
      };
    }

    const caminhosTentados: string[] = [];
    let arquivoEncontrado: string | undefined;
    let tamanhoArquivo: number | undefined;

    // Primeiro, tentar usando o caminho salvo no banco de dados
    if (notaFiscal.xml_arquivo_path) {
      try {
        caminhosTentados.push(notaFiscal.xml_arquivo_path);
        const blob = await downloadFile(STORAGE_BUCKETS.NF_XML, notaFiscal.xml_arquivo_path);
        arquivoEncontrado = notaFiscal.xml_arquivo_path;
        tamanhoArquivo = blob.size;
        
        return {
          sucesso: true,
          detalhes: {
            notaFiscal,
            caminhoTentado: caminhosTentados,
            arquivoEncontrado,
            tamanhoArquivo
          }
        };
      } catch (error) {
        console.warn(`Arquivo não encontrado no caminho salvo: ${notaFiscal.xml_arquivo_path}`);
      }
    }

    // Se não encontrou pelo caminho salvo, tentar padrões alternativos
    const possiveisCaminhos = [
      `uploads/${notaFiscal.chave_acesso}.xml`,
      `uploads/NFe_${notaFiscal.numero_nf}_${notaFiscal.serie}.xml`,
      `uploads/${notaFiscal.numero_nf}_${notaFiscal.serie}.xml`,
    ];

    for (const caminho of possiveisCaminhos) {
      try {
        caminhosTentados.push(caminho);
        const blob = await downloadFile(STORAGE_BUCKETS.NF_XML, caminho);
        arquivoEncontrado = caminho;
        tamanhoArquivo = blob.size;
        
        return {
          sucesso: true,
          detalhes: {
            notaFiscal,
            caminhoTentado: caminhosTentados,
            arquivoEncontrado,
            tamanhoArquivo
          }
        };
      } catch (error) {
        console.warn(`Arquivo não encontrado em: ${caminho}`);
      }
    }

    return {
      sucesso: false,
      erro: 'Arquivo XML não encontrado em nenhum dos caminhos testados',
      detalhes: {
        notaFiscal,
        caminhoTentado: caminhosTentados
      }
    };

  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      detalhes: {
        notaFiscal: null,
        caminhoTentado: []
      }
    };
  }
};

/**
 * Diagnóstica problemas com downloads de XML em todas as notas fiscais
 */
export const diagnosticarDownloadsXML = async (): Promise<{
  totalNotas: number;
  notasComSucesso: number;
  notasComErro: number;
  errosDetalhados: Array<{
    id: string;
    numero: string;
    serie: string;
    chave: string;
    erro: string;
    caminhosTentados: string[];
  }>;
}> => {
  try {
    // Buscar todas as notas fiscais
    const { data: notas, error } = await supabase
      .from(TABLES.NOTA_FISCAL)
      .select('id, numero_nf, serie, chave_acesso, xml_arquivo_path')
      .order('created_at', { ascending: false })
      .limit(50); // Limitar para evitar sobrecarga

    if (error || !notas) {
      throw new Error('Erro ao buscar notas fiscais');
    }

    let notasComSucesso = 0;
    let notasComErro = 0;
    const errosDetalhados: Array<{
      id: string;
      numero: string;
      serie: string;
      chave: string;
      erro: string;
      caminhosTentados: string[];
    }> = [];

    for (const nota of notas) {
      const resultado = await testarDownloadXML(nota.id);
      
      if (resultado.sucesso) {
        notasComSucesso++;
      } else {
        notasComErro++;
        errosDetalhados.push({
          id: nota.id,
          numero: nota.numero_nf,
          serie: nota.serie,
          chave: nota.chave_acesso,
          erro: resultado.erro || 'Erro desconhecido',
          caminhosTentados: resultado.detalhes.caminhoTentado
        });
      }
    }

    return {
      totalNotas: notas.length,
      notasComSucesso,
      notasComErro,
      errosDetalhados
    };

  } catch (error) {
    throw new Error(`Erro no diagnóstico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};