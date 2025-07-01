// =====================================================
// PROCESSAMENTO DE PRODUTOS DA NF-E - PHARMA.AI
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import { TABLES, formatSupabaseError } from '../supabase';
import { FornecedorService } from '../fornecedorService';
import { buscarProdutoPorCodigo, atualizarEstoqueProduto } from '../produtoService';
import { MarkupService } from '../markupService';
import { loteService } from '../loteService';
import { classificarCategoriaProduto, normalizarUnidadeEQuantidade } from '../produto/produto.classification.service';
import type { UUID } from '../../types/database';

/**
 * Importa ou atualiza fornecedor baseado nos dados do XML
 */
export const importarFornecedorDoXML = async (dadosFornecedor: Record<string, unknown>): Promise<UUID> => {
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
export const processarProdutosDoXML = async (itens: Record<string, unknown>[], fornecedorId: UUID): Promise<Record<string, unknown>> => {
  console.log('📦 Iniciando processamento de produtos. Total de itens:', itens.length);
  
  let novos = 0;
  let atualizados = 0;
  let lotes = 0;
  const produtosProcessados: { produtoId: UUID; loteId?: UUID; item: Record<string, unknown> }[] = [];
  
  // Cache para evitar consultas duplicadas
  const cacheProdutos = new Map<string, any>();
  
  for (let index = 0; index < itens.length; index++) {
    const item = itens[index];
    
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
        const { unidade: unidadeNormalizada, quantidade: quantidadeNormalizada } = normalizarUnidadeEQuantidade(
            produtoData.unidadeComercial,
            item.quantidadeComercial as number,
            produtoData.nome
        );

        const valorTotalItem = (item.valorUnitarioComercial as number) * (item.quantidadeComercial as number);
        const custoUnitarioNormalizado = valorTotalItem / quantidadeNormalizada;

        console.log(`💰 Custo do produto (normalizado): ${custoUnitarioNormalizado} por ${unidadeNormalizada}`);
        
        // Determinar categoria diretamente baseado no NCM e nome do produto
        const categoria = classificarCategoriaProduto(produtoData.ncm, produtoData.nome);
        console.log(`🏷️ Categoria de produto classificada: ${categoria}`);
        
        console.log(`📊 Categoria para markup determinada: ${categoria}`);
        console.log(`📋 Produto: "${produtoData.nome}" | NCM: "${produtoData.ncm}" | Categoria: "${categoria}"`);
        console.log('💹 Calculando markup...');
        
        // Calcular markup automático
        const markupService = new MarkupService();
        const markupCalculado = await markupService.calcularMarkup(custoUnitarioNormalizado, categoria);
        
        console.log('✅ Markup calculado:', markupCalculado);
        
        const novoProduto = {
          // Campos obrigatórios da tabela produtos
          nome: produtoData.nome || 'Produto Importado',
          tipo: 'insumo', // Tipo genérico simplificado
          unidade_medida: unidadeNormalizada,
          custo_unitario: custoUnitarioNormalizado,
          markup: markupCalculado.markup,
          fornecedor_id: fornecedorId,
          categoria: categoria,
          
          // Campos adicionais para produtos da NF-e
          codigo_interno: produtoData.codigoInterno,
          codigo_ean: produtoData.codigoEAN === 'SEM GTIN' ? null : produtoData.codigoEAN,
          ncm: produtoData.ncm || '',
          cfop: produtoData.cfop,
          
          // Informações fiscais
          cst_icms: produtoData.cstIcms,
          cst_ipi: produtoData.cstIpi,
          cst_pis: produtoData.cstPis,
          cst_cofins: produtoData.cstCofins,
          
          // Controle
          estoque_atual: 0,
          estoque_minimo: 1,
          ativo: true
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
          // Criar ou atualizar lote usando o serviço de lotes
          const loteCriado = await loteService.criarLoteDoXML({
            produto_id: produto.id,
            numero_lote: produtoData.lote.numeroLote,
            data_validade: produtoData.lote.dataValidade,
            quantidade: (item.quantidadeComercial as number), // Sempre usar valor normalizado
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