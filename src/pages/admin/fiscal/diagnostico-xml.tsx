import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, AlertTriangle, CheckCircle, PlayCircle, Wrench } from 'lucide-react';
import { diagnosticarDownloadsXML, testarDownloadXML } from '@/services/notaFiscal/notaFiscal.diagnostics';
import { AdminPageLayout } from '@/components/layouts/AdminPageLayout';

interface DiagnosticoResultado {
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
}

const DiagnosticoXML: React.FC = () => {
  const [diagnosticando, setDiagnosticando] = useState(false);
  const [resultado, setResultado] = useState<DiagnosticoResultado | null>(null);
  const [testesIndividuais, setTestesIndividuais] = useState<Record<string, boolean>>({});

  const executarDiagnostico = async () => {
    setDiagnosticando(true);
    try {
      const resultado = await diagnosticarDownloadsXML();
      setResultado(resultado);
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      alert('Erro ao executar diagnóstico: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setDiagnosticando(false);
    }
  };

  const testarDownloadIndividual = async (notaId: string) => {
    setTestesIndividuais(prev => ({ ...prev, [notaId]: true }));
    try {
      const resultado = await testarDownloadXML(notaId);
      if (resultado.sucesso) {
        alert('✅ Download testado com sucesso!\n\n' + 
              `Arquivo: ${resultado.detalhes.arquivoEncontrado}\n` +
              `Tamanho: ${resultado.detalhes.tamanhoArquivo} bytes`);
      } else {
        alert('❌ Falha no teste de download:\n\n' + 
              resultado.erro + '\n\n' +
              'Caminhos tentados:\n' + 
              resultado.detalhes.caminhoTentado.join('\n'));
      }
    } catch (error) {
      alert('Erro no teste: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setTestesIndividuais(prev => ({ ...prev, [notaId]: false }));
    }
  };

  const chamarSincronizacao = async () => {
    try {
      const response = await fetch('/api/supabase/functions/sincronizar-xml-notas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          'Content-Type': 'application/json'
        }
      });

      const resultado = await response.json();
      
      if (resultado.success) {
        alert(`✅ Sincronização concluída!\n\n` +
              `Notas processadas: ${resultado.notasProcessadas}\n` +
              `Notas atualizadas: ${resultado.notasAtualizadas}`);
        
        // Executar diagnóstico novamente para ver as melhorias
        await executarDiagnostico();
      } else {
        alert('❌ Erro na sincronização: ' + resultado.error);
      }
    } catch (error) {
      alert('Erro ao chamar sincronização: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  return (
    <AdminPageLayout
      title="Diagnóstico de XMLs"
      subtitle="Diagnóstico e correção de problemas com downloads de XMLs das notas fiscais"
    >
      <div className="space-y-6">
        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Executar Diagnóstico
            </CardTitle>
            <CardDescription>
              Testa o download de XML de todas as notas fiscais para identificar problemas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={executarDiagnostico} 
                disabled={diagnosticando}
                className="flex items-center gap-2"
              >
                {diagnosticando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                {diagnosticando ? 'Diagnosticando...' : 'Executar Diagnóstico'}
              </Button>

              <Button 
                onClick={chamarSincronizacao}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Wrench className="h-4 w-4" />
                Sincronizar XMLs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados do Diagnóstico */}
        {resultado && (
          <>
            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{resultado.totalNotas}</div>
                    <div className="text-sm text-blue-700">Total de Notas</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{resultado.notasComSucesso}</div>
                    <div className="text-sm text-green-700">Downloads OK</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{resultado.notasComErro}</div>
                    <div className="text-sm text-red-700">Com Problemas</div>
                  </div>
                </div>

                {resultado.notasComErro === 0 && (
                  <Alert className="mt-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      🎉 Excelente! Todas as notas fiscais têm seus XMLs acessíveis para download.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Detalhes dos Erros */}
            {resultado.errosDetalhados.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Notas com Problemas ({resultado.errosDetalhados.length})
                  </CardTitle>
                  <CardDescription>
                    Notas fiscais que apresentaram problemas no download do XML
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resultado.errosDetalhados.map((erro) => (
                      <div 
                        key={erro.id} 
                        className="border rounded-lg p-4 bg-red-50 border-red-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="destructive">
                                NF {erro.numero}/{erro.serie}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                ID: {erro.id}
                              </span>
                            </div>
                            
                            <div className="text-sm mb-2">
                              <strong>Chave de Acesso:</strong> {erro.chave}
                            </div>
                            
                            <div className="text-sm mb-2">
                              <strong>Erro:</strong> {erro.erro}
                            </div>
                            
                            <div className="text-sm">
                              <strong>Caminhos Tentados:</strong>
                              <ul className="list-disc list-inside ml-4 mt-1">
                                {erro.caminhosTentados.map((caminho, index) => (
                                  <li key={index} className="text-gray-600 font-mono text-xs">
                                    {caminho}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => testarDownloadIndividual(erro.id)}
                            disabled={testesIndividuais[erro.id]}
                            className="flex items-center gap-2"
                          >
                            {testesIndividuais[erro.id] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            Testar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>1. Executar Diagnóstico:</strong> Testa o download de XML de todas as notas fiscais</p>
              <p><strong>2. Sincronizar XMLs:</strong> Corrige automaticamente notas fiscais sem informações de arquivo</p>
              <p><strong>3. Testar Individual:</strong> Testa o download de uma nota específica com problemas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
};

export default DiagnosticoXML; 