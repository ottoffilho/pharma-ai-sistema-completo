import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Save, 
  RotateCcw, 
  Calculator, 
  TrendingUp, 
  Package, 
  Pill, 
  Box,
  FlaskConical
} from 'lucide-react';
import { MarkupService } from '@/services/markupService';
import type { ConfiguracaoMarkup, CategoriaMarkup } from '@/types/markup';

const ConfiguracaoMarkupPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const markupService = new MarkupService();

  // Estados para edição
  const [editandoConfig, setEditandoConfig] = useState<Partial<ConfiguracaoMarkup>>({});
  const [editandoCategorias, setEditandoCategorias] = useState<Record<string, Partial<CategoriaMarkup>>>({});

  // Buscar configuração geral
  const { data: configuracao, isLoading: loadingConfig } = useQuery({
    queryKey: ['markup-configuracao'],
    queryFn: () => markupService.buscarConfiguracaoGeral(),
  });

  // Buscar categorias
  const { data: categorias, isLoading: loadingCategorias } = useQuery({
    queryKey: ['markup-categorias'],
    queryFn: () => markupService.buscarCategorias(),
  });

  // Mutation para salvar configuração geral
  const salvarConfigMutation = useMutation({
    mutationFn: (config: Partial<ConfiguracaoMarkup>) =>
      markupService.atualizarConfiguracaoGeral(config),
    onSuccess: () => {
      toast({
        title: "Configuração salva",
        description: "A configuração geral de markup foi salva com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['markup-configuracao'] });
      setEditandoConfig({});
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutation para salvar categoria
  const salvarCategoriaMutation = useMutation({
    mutationFn: ({ categoria, dados }: { categoria: string; dados: Partial<CategoriaMarkup> }) =>
      markupService.atualizarCategoria(categoria, dados),
    onSuccess: () => {
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['markup-categorias'] });
      setEditandoCategorias({});
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar categoria",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleSalvarConfig = () => {
    if (Object.keys(editandoConfig).length > 0) {
      // Garantir que apenas campos válidos sejam enviados
      const configLimpa: Partial<ConfiguracaoMarkup> = {};
      
      if (editandoConfig.markup_global_padrao !== undefined) {
        configLimpa.markup_global_padrao = editandoConfig.markup_global_padrao;
      }
      if (editandoConfig.markup_minimo !== undefined) {
        configLimpa.markup_minimo = editandoConfig.markup_minimo;
      }
      if (editandoConfig.markup_maximo !== undefined) {
        configLimpa.markup_maximo = editandoConfig.markup_maximo;
      }
      if (editandoConfig.permitir_markup_zero !== undefined) {
        configLimpa.permitir_markup_zero = editandoConfig.permitir_markup_zero;
      }
      if (editandoConfig.aplicar_automatico_importacao !== undefined) {
        configLimpa.aplicar_automatico_importacao = editandoConfig.aplicar_automatico_importacao;
      }
      
      console.log('Enviando configuração:', configLimpa);
      salvarConfigMutation.mutate(configLimpa);
    }
  };

  const handleSalvarCategoria = (categoria: string) => {
    const dados = editandoCategorias[categoria];
    if (dados && Object.keys(dados).length > 0) {
      salvarCategoriaMutation.mutate({ categoria, dados });
    }
  };

  const getIconeCategoria = (categoria: string) => {
    switch (categoria) {
      case 'alopaticos':
        return <Pill className="h-5 w-5 text-red-500" />;
      case 'embalagens':
        return <Box className="h-5 w-5 text-gray-500" />;
      case 'homeopaticos':
        return <FlaskConical className="h-5 w-5 text-green-500" />;
      case 'revenda':
        return <Package className="h-5 w-5 text-blue-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNomeCategoria = (categoria: string) => {
    switch (categoria) {
      case 'alopaticos':
        return 'Alopáticos';
      case 'embalagens':
        return 'Embalagens';
      case 'homeopaticos':
        return 'Homeopáticos';
      case 'revenda':
        return 'Revenda';
      default:
        return categoria.charAt(0).toUpperCase() + categoria.slice(1);
    }
  };

  if (loadingConfig || loadingCategorias) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configuração de Markup</h1>
            <p className="text-muted-foreground">
              Configure os percentuais de markup por categoria de produto
            </p>
          </div>
        </div>

        {/* Configuração Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Controles Globais do Sistema
            </CardTitle>
            <CardDescription>
              Definições de limites e fallbacks que se aplicam a todo o sistema de precificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="markup-padrao">Markup Padrão (Fallback)</Label>
                <Input
                  id="markup-padrao"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editandoConfig.markup_global_padrao ?? configuracao?.markup_global_padrao ?? 0}
                  onChange={(e) =>
                    setEditandoConfig(prev => ({
                      ...prev,
                      markup_global_padrao: parseFloat(e.target.value) || 0
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usado quando produto não tem categoria definida
                </p>
              </div>
              <div>
                <Label htmlFor="markup-minimo">Limite Mínimo Global</Label>
                <Input
                  id="markup-minimo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editandoConfig.markup_minimo ?? configuracao?.markup_minimo ?? 0}
                  onChange={(e) =>
                    setEditandoConfig(prev => ({
                      ...prev,
                      markup_minimo: parseFloat(e.target.value) || 0
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nenhuma categoria pode ter markup menor
                </p>
              </div>
              <div>
                <Label htmlFor="markup-maximo">Limite Máximo Global</Label>
                <Input
                  id="markup-maximo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editandoConfig.markup_maximo ?? configuracao?.markup_maximo ?? 0}
                  onChange={(e) =>
                    setEditandoConfig(prev => ({
                      ...prev,
                      markup_maximo: parseFloat(e.target.value) || 0
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nenhuma categoria pode exceder este valor
                </p>
              </div>
            </div>

            {/* Configurações Adicionais */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Regras Globais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${configuracao?.permitir_markup_zero ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Markup zero: {configuracao?.permitir_markup_zero ? 'Permitido' : 'Bloqueado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${configuracao?.aplicar_automatico_importacao ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                  <span>Auto-aplicar em importações: {configuracao?.aplicar_automatico_importacao ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleSalvarConfig}
                disabled={salvarConfigMutation.isPending || Object.keys(editandoConfig).length === 0}
              >
                {salvarConfigMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Configuração
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditandoConfig({})}
                disabled={Object.keys(editandoConfig).length === 0}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuração por Categoria */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Markup por Categoria</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {categorias?.map((categoria) => (
              <Card key={categoria.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getIconeCategoria(categoria.categoria_nome)}
                    {getNomeCategoria(categoria.categoria_nome)}
                  </CardTitle>
                  <CardDescription>
                    Markup específico para {getNomeCategoria(categoria.categoria_nome).toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`markup-${categoria.categoria_nome}`}>Markup Padrão (%)</Label>
                    <Input
                      id={`markup-${categoria.categoria_nome}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        editandoCategorias[categoria.categoria_nome]?.markup_padrao ??
                        categoria.markup_padrao ?? 0
                      }
                      onChange={(e) =>
                        setEditandoCategorias(prev => ({
                          ...prev,
                          [categoria.categoria_nome]: {
                            ...prev[categoria.categoria_nome],
                            markup_padrao: parseFloat(e.target.value) || 0
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSalvarCategoria(categoria.categoria_nome)}
                      disabled={
                        salvarCategoriaMutation.isPending ||
                        !editandoCategorias[categoria.categoria_nome] ||
                        Object.keys(editandoCategorias[categoria.categoria_nome] || {}).length === 0
                      }
                    >
                      {salvarCategoriaMutation.isPending ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-3 w-3" />
                      )}
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditandoCategorias(prev => {
                          const { [categoria.categoria_nome]: removed, ...rest } = prev;
                          return rest;
                        })
                      }
                      disabled={!editandoCategorias[categoria.categoria_nome]}
                    >
                      <RotateCcw className="mr-2 h-3 w-3" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Informações Úteis */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">💡 Como Funciona o Sistema de Markup</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">🎯 Controles Globais</h4>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Fallback:</strong> Usado quando produto não tem categoria</li>
                  <li>• <strong>Limites:</strong> Min/Max aplicados a todas as categorias</li>
                  <li>• <strong>Regras:</strong> Políticas que valem para todo o sistema</li>
                  <li>• <strong>Segurança:</strong> Evita markups prejudiciais</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📊 Markup por Categoria</h4>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Específico:</strong> Cada categoria tem seu próprio markup</li>
                  <li>• <strong>Otimizado:</strong> Ajustado conforme tipo de produto</li>
                  <li>• <strong>Prioridade:</strong> Sempre usado quando categoria existe</li>
                  <li>• <strong>Flexível:</strong> Permite estratégias diferenciadas</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm"><strong>Exemplo prático:</strong> 
                Se um produto alopático tem categoria "alopaticos" (markup 2.2), ele usa 2.2. 
                Se um produto importado não tem categoria, usa o fallback global (ex: 2.0).
                Mas nenhum pode ter markup menor que o mínimo global (ex: 1.0) ou maior que o máximo (ex: 10.0).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ConfiguracaoMarkupPage; 