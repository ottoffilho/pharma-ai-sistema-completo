// =====================================================
// DIAGNÓSTICOS DE NOTA FISCAL - PHARMA.AI
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import { TABLES, STORAGE_BUCKETS, downloadFile } from '../supabase';
import type { UUID } from '../../types/database';
import { buscarProdutoPorCodigo } from '../produtoService';
import { classificarCategoriaProduto, analisarPotencialAlopatico } from '../produto/produto.classification.service';
import type { CategoriaMarkup } from '@/constants/categorias';
import { CATEGORIAS_MARKUP } from '@/constants/categorias';

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
    const categoria = classificarCategoriaProduto(produto.ncm, produto.nome);
    
    console.log(`${index + 1}. ${produto.nome}`);
    console.log(`   NCM: ${produto.ncm} | Categoria: ${categoria}`);
    console.log("");
  });
  
  return produtosTeste.map(produto => ({
    ...produto,
    categoria: classificarCategoriaProduto(produto.ncm, produto.nome)
  }));
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
  const totalEmbalagens = 11; // Total de produtos que devem ser classificados como embalagem
  
  produtosTestados.forEach((produto, index) => {
    const classificacao = classificarCategoriaProduto(produto.ncm, produto.nome);
    const isEmbalagem = classificacao === 'embalagens';
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

    // Cast para any para evitar erros de tipo com propriedades que podem existir
    const nf = notaFiscal as any;

    // Primeiro, tentar usando o caminho salvo no banco de dados
    if (nf.xml_arquivo_path) {
      try {
        caminhosTentados.push(nf.xml_arquivo_path);
        const blob = await downloadFile(STORAGE_BUCKETS.NF_XML, nf.xml_arquivo_path);
        arquivoEncontrado = nf.xml_arquivo_path;
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
        console.warn(`Arquivo não encontrado no caminho salvo: ${nf.xml_arquivo_path}`);
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
      .select('id, numero_nf, serie, chave_acesso')
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
          numero: nota.numero_nf.toString(),
          serie: nota.serie.toString(),
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