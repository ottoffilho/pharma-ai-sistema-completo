// =====================================================
// SERVIÇOS DE DOCUMENTOS DE NOTA FISCAL - PHARMA.AI
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import { TABLES, STORAGE_BUCKETS, downloadFile } from '../supabase';
import logger from '@/lib/logger';
import type { UUID } from '../../types/database';

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

    // Cast para any para evitar erros de tipo com propriedades que podem existir
    const nf = notaFiscal as any;

    // Primeiro, tentar usar o caminho salvo no banco de dados (para novas importações)
    if (nf.xml_arquivo_path) {
      try {
        blob = await downloadFile(STORAGE_BUCKETS.NF_XML, nf.xml_arquivo_path);
        caminhoEncontrado = nf.xml_arquivo_path;
        logger.info('XML encontrado usando caminho do banco', { path: nf.xml_arquivo_path });
      } catch (error) {
        console.warn(`Arquivo não encontrado no caminho salvo: ${nf.xml_arquivo_path}`);
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
        - Caminho esperado: ${nf.xml_arquivo_path || 'Não definido'}
        
        Possíveis causas:
        - O arquivo foi removido do storage
        - O arquivo foi salvo com nome diferente durante a importação
        - Problemas de conectividade com o storage`);
    }

    // Definir nome do arquivo para download
    const nomeArquivo = nf.xml_arquivo_nome || 
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