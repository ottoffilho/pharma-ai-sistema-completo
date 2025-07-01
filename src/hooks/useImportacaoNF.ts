// =====================================================
// HOOK PARA IMPORTAÇÃO DE NOTA FISCAL - PHARMA.AI
// =====================================================

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { 
  ArquivoUpload, 
  EstatisticasImportacao,
  ConfiguracaoImportacao,
  CONFIGURACAO_PADRAO 
} from '@/types/importacao';
import { 
  validarArquivo, 
  validarXMLNotaFiscal, 
  gerarIdArquivo,
  verificarDuplicata 
} from '@/utils/validacaoArquivos';
import { importarXMLNotaFiscal } from '@/services/notaFiscal';

export interface UseImportacaoNFOptions {
  configuracao?: Partial<ConfiguracaoImportacao>;
  onImportacaoCompleta?: (resultado: ResultadoImportacaoNFe) => void;
  onErro?: (erro: string, arquivo: ArquivoUpload) => void;
}

export function useImportacaoNF(options: UseImportacaoNFOptions = {}) {
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([]);
  const [importandoTodos, setImportandoTodos] = useState(false);
  const [configuracao] = useState<ConfiguracaoImportacao>({
    ...CONFIGURACAO_PADRAO,
    ...options.configuracao
  });

  const queryClient = useQueryClient();

  // Mutation para importação individual
  const importarMutation = useMutation({
    mutationFn: (arquivo: File) => importarXMLNotaFiscal(arquivo),
    onSuccess: (resultado, arquivo) => {
      // Atualizar status do arquivo
      setArquivos(prev => prev.map(item => 
        item.file === arquivo 
          ? { ...item, status: 'success', progress: 100, resultado }
          : item
      ));

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });

      // Callback de sucesso
      if (options.onImportacaoCompleta) {
        options.onImportacaoCompleta(resultado);
      }

      // Toast de sucesso
      toast.success(
        `✅ ${arquivo.name} importado com sucesso! ${resultado.produtos_importados} produtos processados.`,
        {
          description: `Fornecedor: ${resultado.detalhes.fornecedor.nome}`,
          duration: 5000
        }
      );
    },
    onError: (error, arquivo) => {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Atualizar status do arquivo
      setArquivos(prev => prev.map(item => 
        item.file === arquivo 
          ? { ...item, status: 'error', progress: 0, erro: mensagemErro }
          : item
      ));

      // Callback de erro
      const arquivoAtual = arquivos.find(a => a.file === arquivo);
      if (options.onErro && arquivoAtual) {
        options.onErro(mensagemErro, arquivoAtual);
      }

      // Toast de erro
      toast.error(`❌ Erro ao importar ${arquivo.name}`, {
        description: mensagemErro,
        duration: 8000
      });
    }
  });

  // Adicionar arquivos com validação
  const adicionarArquivos = useCallback(async (novosArquivos: File[]) => {
    const arquivosValidados: ArquivoUpload[] = [];

    for (const file of novosArquivos) {
      // Verificar duplicatas
      const arquivosExistentes = arquivos.map(a => a.file);
      if (verificarDuplicata(file, arquivosExistentes)) {
        toast.warning(`⚠️ Arquivo ${file.name} já foi adicionado`);
        continue;
      }

      // Validação básica
      const validacaoBasica = validarArquivo(file);
      
      // Validação XML (assíncrona)
      let validacaoXML;
      try {
        validacaoXML = await validarXMLNotaFiscal(file);
      } catch (error) {
        validacaoXML = {
          valido: false,
          erros: ['Erro ao validar XML'],
          avisos: []
        };
      }

      // Combinar validações
      const validacao = {
        valido: validacaoBasica.valido && validacaoXML.valido,
        erros: [...validacaoBasica.erros, ...validacaoXML.erros],
        avisos: [...validacaoBasica.avisos, ...validacaoXML.avisos],
        tamanho: validacaoBasica.tamanho,
        tipo: validacaoBasica.tipo
      };

      const arquivo: ArquivoUpload = {
        file,
        id: gerarIdArquivo(file),
        status: validacao.valido ? 'pending' : 'error',
        progress: 0,
        validacao,
        erro: validacao.erros.length > 0 ? validacao.erros.join('; ') : undefined
      };

      arquivosValidados.push(arquivo);

      // Mostrar avisos se houver
      if (validacao.avisos.length > 0) {
        toast.warning(`⚠️ ${file.name}`, {
          description: validacao.avisos.join('; '),
          duration: 6000
        });
      }

      // Mostrar erros se houver
      if (!validacao.valido) {
        toast.error(`❌ ${file.name} inválido`, {
          description: validacao.erros.join('; '),
          duration: 8000
        });
      }
    }

    setArquivos(prev => [...prev, ...arquivosValidados]);
    
    return arquivosValidados;
  }, [arquivos]);

  // Importar arquivo individual
  const importarArquivo = useCallback(async (arquivo: ArquivoUpload) => {
    if (arquivo.status === 'uploading' || arquivo.status === 'processing') return;
    if (!arquivo.validacao?.valido) {
      toast.error('Arquivo inválido não pode ser importado');
      return;
    }

    // Atualizar status para uploading
    setArquivos(prev => prev.map(item => 
      item.id === arquivo.id 
        ? { ...item, status: 'uploading', progress: 0 }
        : item
    ));

    // Simular progresso
    const progressInterval = setInterval(() => {
      setArquivos(prev => prev.map(item => 
        item.id === arquivo.id && item.status === 'uploading'
          ? { ...item, progress: Math.min(item.progress + 10, 90) }
          : item
      ));
    }, 300);

    try {
      // Atualizar para processing antes da chamada
      setArquivos(prev => prev.map(item => 
        item.id === arquivo.id 
          ? { ...item, status: 'processing', progress: 90 }
          : item
      ));

      await importarMutation.mutateAsync(arquivo.file);
    } finally {
      clearInterval(progressInterval);
    }
  }, [importarMutation]);

  // Importar todos os arquivos válidos
  const importarTodos = useCallback(async () => {
    const arquivosValidos = arquivos.filter(a => 
      a.status === 'pending' && a.validacao?.valido
    );
    
    if (arquivosValidos.length === 0) {
      toast.warning('Nenhum arquivo válido para importar');
      return;
    }

    setImportandoTodos(true);

    try {
      for (const arquivo of arquivosValidos) {
        await importarArquivo(arquivo);
        // Pequena pausa entre importações para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      setImportandoTodos(false);
    }
  }, [arquivos, importarArquivo]);

  // Remover arquivo
  const removerArquivo = useCallback((id: string) => {
    setArquivos(prev => prev.filter(item => item.id !== id));
  }, []);

  // Limpar todos os arquivos
  const limparTodos = useCallback(() => {
    setArquivos([]);
  }, []);

  // Reprocessar arquivo com erro
  const reprocessarArquivo = useCallback(async (id: string) => {
    const arquivo = arquivos.find(a => a.id === id);
    if (!arquivo) return;

    // Revalidar arquivo
    const validacao = validarArquivo(arquivo.file);
    const validacaoXML = await validarXMLNotaFiscal(arquivo.file);
    
    const novaValidacao = {
      valido: validacao.valido && validacaoXML.valido,
      erros: [...validacao.erros, ...validacaoXML.erros],
      avisos: [...validacao.avisos, ...validacaoXML.avisos],
      tamanho: validacao.tamanho,
      tipo: validacao.tipo
    };

    // Atualizar arquivo
    setArquivos(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            status: novaValidacao.valido ? 'pending' : 'error',
            validacao: novaValidacao,
            erro: novaValidacao.erros.length > 0 ? novaValidacao.erros.join('; ') : undefined,
            progress: 0
          }
        : item
    ));

    // Se válido, importar automaticamente
    if (novaValidacao.valido) {
      const arquivoAtualizado = arquivos.find(a => a.id === id);
      if (arquivoAtualizado) {
        await importarArquivo(arquivoAtualizado);
      }
    }
  }, [arquivos, importarArquivo]);

  // Calcular estatísticas
  const estatisticas: EstatisticasImportacao = {
    total: arquivos.length,
    pendentes: arquivos.filter(a => a.status === 'pending').length,
    processando: arquivos.filter(a => a.status === 'uploading' || a.status === 'processing').length,
    sucesso: arquivos.filter(a => a.status === 'success').length,
    erro: arquivos.filter(a => a.status === 'error').length,
    produtos_importados: arquivos
      .filter(a => a.resultado)
      .reduce((total, a) => total + (a.resultado?.produtos_importados || 0), 0),
    valor_total_importado: arquivos
      .filter(a => a.resultado)
      .reduce((total, a) => total + (a.resultado?.valor_total || 0), 0)
  };

  return {
    // Estado
    arquivos,
    importandoTodos,
    configuracao,
    estatisticas,
    isLoading: importarMutation.isPending,

    // Ações
    adicionarArquivos,
    importarArquivo,
    importarTodos,
    removerArquivo,
    limparTodos,
    reprocessarArquivo
  };
} 