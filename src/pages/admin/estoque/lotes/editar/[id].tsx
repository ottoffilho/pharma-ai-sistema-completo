// =====================================================
// PÁGINA DE EDIÇÃO DE LOTE - PHARMA.AI (REDESENHADA)
// Módulo M04 - Gestão de Estoque
// =====================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Package,
  Edit,
  AlertTriangle,
  Loader2,
  Settings,
  CheckCircle,
  Save,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  Zap,
  Info,
  Lock,
  Unlock,
  TrendingUp,
  AlertCircle,
  Barcode,
  Building2,
  Edit3,
  Heart,
  FileText,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import LoteInsumoForm from '@/components/estoque/LoteInsumoForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

const EditarLotePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Buscar dados do lote para verificar se existe
  const { data: lote, isLoading, error } = useQuery({
    queryKey: ['lote-editar', id],
    queryFn: async () => {
      if (!id) throw new Error('ID do lote não fornecido');

      const { data, error } = await supabase
        .from('lote')
        .select(`
          *,
          produtos (
            id,
            nome,
            codigo_interno,
            tipo,
            unidade_medida,
            categoria
          ),
          fornecedores (
            id,
            nome,
            documento
          )
        `)
        .eq('id', id)
        .eq('ativo', true)
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Lote não encontrado');
      
      return data;
    },
    enabled: !!id,
  });

  // Calcular porcentagem de uso
  const getPorcentagemUtilizada = (inicial: number, atual: number) => {
    if (inicial === 0) return 0;
    return Math.round(((inicial - atual) / inicial) * 100);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Package className="h-16 w-16 text-orange-400/20" />
              </div>
              <Package className="h-16 w-16 text-orange-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Carregando dados do lote...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                Erro ao carregar dados do lote: {(error as Error).message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => navigate('/admin/estoque/lotes')}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Lotes
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!lote) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 mb-6">
              <AlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Lote não encontrado
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              O lote que você está tentando editar não existe ou foi removido do sistema.
            </p>
            <Button
              onClick={() => navigate('/admin/estoque/lotes')}
              className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para lista
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const porcentagemUtilizada = getPorcentagemUtilizada(lote.quantidade_inicial, lote.quantidade_atual);

  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-8">
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-amber-400/20 dark:from-orange-600/10 dark:to-amber-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-400/20 to-yellow-400/20 dark:from-amber-600/10 dark:to-yellow-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/estoque/lotes')}
                className="gap-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                Modo de Edição
              </Badge>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-xl">
                <Edit3 className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Editar Lote {lote.numero_lote}
                </h1>
                <p className="text-lg text-muted-foreground mb-3">
                  {lote.produtos?.nome || 'Produto não encontrado'}
                </p>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-1">
                    <Package className="h-3 w-3" />
                    {lote.produtos?.tipo}
                  </Badge>
                  {lote.produtos?.categoria && (
                    <Badge variant="outline" className="gap-1">
                      <Layers className="h-3 w-3" />
                      {lote.produtos.categoria}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produto/Insumo</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400 line-clamp-1">{lote.produtos?.nome}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lote.produtos?.codigo_interno}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Atual</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{lote.quantidade_atual}</p>
                  <p className="text-xs text-muted-foreground mt-1">de {lote.quantidade_inicial} {lote.produtos?.unidade_medida || 'UN'}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <Progress value={100 - porcentagemUtilizada} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-400 line-clamp-1">
                    {lote.fornecedores?.nome || 'Não informado'}
                  </p>
                  {lote.fornecedores?.documento && (
                    <p className="text-xs text-muted-foreground mt-1">CNPJ: {lote.fornecedores.documento}</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilização</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{porcentagemUtilizada}%</p>
                  <p className="text-xs text-muted-foreground mt-1">do lote consumido</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Ajuda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Rastreabilidade</p>
                  <p className="text-xs text-muted-foreground">Dados protegidos para garantia</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Atualização Rápida</p>
                  <p className="text-xs text-muted-foreground">Salve com um clique</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Validação Automática</p>
                  <p className="text-xs text-muted-foreground">Campos verificados em tempo real</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wrapper Customizado para o Formulário */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-yellow-500/5 dark:from-orange-900/10 dark:via-amber-900/10 dark:to-yellow-900/10 rounded-2xl blur-xl" />
          
          <Card className="relative border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
                  <Edit className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle>Formulário de Edição</CardTitle>
                  <CardDescription>
                    Altere as informações do lote conforme necessário
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LoteInsumoForm 
                isEditing={true}
                loteId={id}
              />
            </CardContent>
          </Card>
        </div>

        {/* Cards de Informação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campos Editáveis */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Unlock className="h-4 w-4 text-emerald-600" />
                Campos Editáveis
              </CardTitle>
              <CardDescription>
                Informações que podem ser modificadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm">Quantidade atual do lote</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm">Data de validade</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm">Preço de custo unitário</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm">Observações e notas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campos Protegidos */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-600" />
                Campos Protegidos
              </CardTitle>
              <CardDescription>
                Informações que não podem ser alteradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <Barcode className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm">Número do lote (rastreabilidade)</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <Package className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm">Produto/insumo vinculado</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm">Quantidade inicial</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm">Data de criação</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer com informações adicionais */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>ID: {lote.id}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Última atualização: {new Date(lote.updated_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditarLotePage;
