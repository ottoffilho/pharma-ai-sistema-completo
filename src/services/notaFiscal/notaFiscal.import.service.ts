// =====================================================
// SERVIÇO DE IMPORTAÇÃO XML DE NOTA FISCAL - PHARMA.AI
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import { uploadFile, STORAGE_BUCKETS } from '../supabase';
import { atualizarEstoqueProduto } from '../produtoService';
import logger from '@/lib/logger';
import { buscarNotaFiscalPorChave, criarNotaFiscal, criarItemNotaFiscal } from './notaFiscal.service';
import { processarXMLNFe } from './notaFiscal.xml.parser';
import { importarFornecedorDoXML, processarProdutosDoXML } from './notaFiscal.produto.processor';
import type {
  ImportacaoNFe,
  ResultadoImportacaoNFe,
  UUID
} from '../../types/database';

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