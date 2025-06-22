// =====================================================
// COMPONENTE DE IMPORTAÇÃO DE NOTA FISCAL - PHARMA.AI
// Módulo M10 - Fiscal
// =====================================================

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { importarXMLNotaFiscal } from '@/services/notaFiscalService';
import type { ResultadoImportacaoNFe } from '@/types/database';

// =====================================================
// INTERFACES E TIPOS
// =====================================================

interface ArquivoUpload {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  resultado?: ResultadoImportacaoNFe;
  erro?: string;
}

interface ImportacaoNFProps {
  onImportacaoCompleta?: (resultado: ResultadoImportacaoNFe) => void;
  className?: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export const ImportacaoNF: React.FC<ImportacaoNFProps> = ({
  onImportacaoCompleta,
  className = ''
}) => {
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([]);
  const [importandoTodos, setImportandoTodos] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  const queryClient = useQueryClient();
  const { toast: showToast } = useToast();

  // Verificar autenticação ao carregar o componente
  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (!session) {
        showToast({
          title: "Atenção",
          description: "Você precisa estar logado para importar notas fiscais.",
          variant: "destructive",
        });
      }
    };
    
    checkAuth();
  }, [showToast]);

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

      // Callback de sucesso
      if (onImportacaoCompleta) {
        onImportacaoCompleta(resultado);
      }

      // Toast de sucesso
      toast.success(`✅ Nota fiscal processada automaticamente! ${resultado.produtos_importados} produtos, ${resultado.produtos_novos} novos produtos criados, ${resultado.lotes_criados} lotes registrados.`);
    },
    onError: (error, arquivo) => {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Atualizar status do arquivo
      setArquivos(prev => prev.map(item => 
        item.file === arquivo 
          ? { ...item, status: 'error', progress: 0, erro: mensagemErro }
          : item
      ));

      // Toast de erro
      toast.error(`Erro ao importar ${arquivo.name}: ${mensagemErro}`);
    }
  });

  // =====================================================
  // CONFIGURAÇÃO DO DROPZONE
  // =====================================================

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const novosArquivos: ArquivoUpload[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      status: 'pending',
      progress: 0
    }));

    setArquivos(prev => [...prev, ...novosArquivos]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.xml'],
      'application/xml': ['.xml']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  // =====================================================
  // FUNÇÕES DE CONTROLE
  // =====================================================

  const importarArquivo = async (arquivo: ArquivoUpload) => {
    if (arquivo.status === 'uploading') return;

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
    }, 200);

    try {
      await importarMutation.mutateAsync(arquivo.file);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const importarTodos = async () => {
    const arquivosPendentes = arquivos.filter(a => a.status === 'pending');
    if (arquivosPendentes.length === 0) return;

    setImportandoTodos(true);

    try {
      for (const arquivo of arquivosPendentes) {
        await importarArquivo(arquivo);
      }
    } finally {
      setImportandoTodos(false);
    }
  };

  const removerArquivo = (id: string) => {
    setArquivos(prev => prev.filter(item => item.id !== id));
  };

  const limparTodos = () => {
    setArquivos([]);
  };

  // =====================================================
  // ESTATÍSTICAS
  // =====================================================

  const estatisticas = {
    total: arquivos.length,
    pendentes: arquivos.filter(a => a.status === 'pending').length,
    processando: arquivos.filter(a => a.status === 'uploading').length,
    sucesso: arquivos.filter(a => a.status === 'success').length,
    erro: arquivos.filter(a => a.status === 'error').length,
    produtosImportados: arquivos
      .filter(a => a.resultado)
      .reduce((total, a) => total + (a.resultado?.produtos_importados || 0), 0)
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Importação de Notas Fiscais</h2>
          <p className="text-muted-foreground">
            Faça upload dos arquivos XML das notas fiscais. O sistema criará automaticamente os produtos, atualizará o estoque e registrará os lotes.
          </p>
        </div>
        
        {arquivos.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={limparTodos}
              disabled={importandoTodos}
            >
              Limpar Todos
            </Button>
            <Button
              onClick={importarTodos}
              disabled={estatisticas.pendentes === 0 || importandoTodos}
            >
              {importandoTodos ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Todos ({estatisticas.pendentes})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Status de Autenticação */}
      {isAuthenticated === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você precisa estar logado para importar notas fiscais. Faça login e tente novamente.
          </AlertDescription>
        </Alert>
      )}

      {isAuthenticated === true && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Usuário autenticado. Você pode importar notas fiscais.
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      {arquivos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{estatisticas.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{estatisticas.sucesso}</div>
                <div className="text-sm text-muted-foreground">Sucesso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{estatisticas.produtosImportados}</div>
                <div className="text-sm text-muted-foreground">Produtos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Área de Upload */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            
            {isDragActive ? (
              <p className="text-lg font-medium">Solte os arquivos XML aqui...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Arraste arquivos XML aqui ou clique para selecionar
                </p>
                <p className="text-sm text-muted-foreground">
                  Suporte para múltiplos arquivos XML de NF-e (máx. 10MB cada)<br/>
                  <span className="text-green-600 font-medium">✓ Processamento automático: produtos, estoque e lotes</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Arquivos */}
      {arquivos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Arquivos para Importação</CardTitle>
            <CardDescription>
              Acompanhe o progresso da importação de cada arquivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {arquivos.map((arquivo) => (
              <ArquivoItem
                key={arquivo.id}
                arquivo={arquivo}
                onImportar={() => importarArquivo(arquivo)}
                onRemover={() => removerArquivo(arquivo.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// =====================================================
// COMPONENTE DE ITEM DE ARQUIVO
// =====================================================

interface ArquivoItemProps {
  arquivo: ArquivoUpload;
  onImportar: () => void;
  onRemover: () => void;
}

const ArquivoItem: React.FC<ArquivoItemProps> = ({
  arquivo,
  onImportar,
  onRemover
}) => {
  const getStatusIcon = () => {
    switch (arquivo.status) {
      case 'pending':
        return <FileText className="h-5 w-5 text-muted-foreground" />;
      case 'uploading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (arquivo.status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'uploading':
        return <Badge variant="default">Processando</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg">
      {/* Ícone de Status */}
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>

      {/* Informações do Arquivo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium truncate">{arquivo.file.name}</p>
          {getStatusBadge()}
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span>{(arquivo.file.size / 1024 / 1024).toFixed(2)} MB</span>
          <span>{new Date(arquivo.file.lastModified).toLocaleDateString()}</span>
        </div>

        {/* Barra de Progresso */}
        {arquivo.status === 'uploading' && (
          <div className="mt-2">
            <Progress value={arquivo.progress} className="h-2" />
          </div>
        )}

        {/* Resultado da Importação */}
        {arquivo.resultado && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center space-x-4 text-xs">
              <span className="text-green-600">
                ✓ {arquivo.resultado.produtos_importados} produtos importados
              </span>
              <span className="text-blue-600">
                {arquivo.resultado.produtos_novos} novos
              </span>
              <span className="text-orange-600">
                {arquivo.resultado.lotes_criados} lotes criados
              </span>
            </div>
          </div>
        )}

        {/* Erros */}
        {arquivo.erro && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {arquivo.erro}
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de Erros Detalhados */}
        {arquivo.resultado?.erros && arquivo.resultado.erros.length > 0 && (
          <div className="mt-2">
            <details className="text-xs">
              <summary className="cursor-pointer text-red-600">
                {arquivo.resultado.erros.length} erro(s) encontrado(s)
              </summary>
              <ul className="mt-1 space-y-1 text-red-600">
                {arquivo.resultado.erros.map((erro, index) => (
                  <li key={index}>• {erro}</li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex-shrink-0 flex items-center space-x-2">
        {arquivo.status === 'pending' && (
          <Button
            size="sm"
            onClick={onImportar}
            disabled={arquivo.status === 'uploading'}
          >
            <Upload className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemover}
          disabled={arquivo.status === 'uploading'}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default ImportacaoNF; 