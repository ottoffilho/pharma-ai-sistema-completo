// =====================================================
// PÁGINA DE DETALHES DO LOTE - PHARMA.AI (REDESENHADA)
// Módulo M04 - Gestão de Estoque
// =====================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft,
  Package,
  Calendar,
  Building2,
  Barcode,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Edit,
  FileText,
  MapPin,
  Calculator,
  Clock,
  Activity,
  Layers,
  Info,
  Sparkles,
  Heart,
  Shield,
  Zap,
  Star,
  Award,
  Hash,
  Truck,
  DollarSign,
  BarChart3,
  Loader2,
  Eye,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';

const DetalhesLotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Buscar dados do lote
  const { data: lote, isLoading, error } = useQuery({
    queryKey: ['lote', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lote')
        .select(`
          *,
          produtos (
            id,
            nome,
            codigo_interno,
            unidade_medida,
            categoria,
            tipo
          ),
          fornecedores (
            id,
            nome,
            documento,
            telefone,
            email
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
    onError: (error: Error) => {
      console.error('Erro ao carregar lote:', error);
      toast({
        title: "Erro ao carregar",
        description: "Ocorreu um erro ao carregar os dados do lote.",
        variant: "destructive",
      });
    }
  });

  // Função para determinar status do lote
  const getStatusLote = (lote: any) => {
    if (!lote.data_validade) return { status: 'sem-validade', label: 'Sem validade', variant: 'secondary' as const, icon: Info };
    
    const hoje = new Date();
    const dataValidade = new Date(lote.data_validade);
    const diasParaVencer = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasParaVencer < 0) {
      return { status: 'vencido', label: 'Vencido', variant: 'destructive' as const, icon: AlertTriangle };
    } else if (diasParaVencer <= 30) {
      return { status: 'vencimento-proximo', label: 'Vence em breve', variant: 'outline' as const, icon: Clock };
    } else {
      return { status: 'valido', label: 'Válido', variant: 'default' as const, icon: CheckCircle };
    }
  };

  // Calcular dias para vencimento
  const getDiasParaVencimento = (dataValidade: string | null) => {
    if (!dataValidade) return null;
    const hoje = new Date();
    const validade = new Date(dataValidade);
    return Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Calcular porcentagem do estoque utilizado
  const getPorcentagemUtilizada = (inicial: number, atual: number) => {
    if (inicial === 0) return 0;
    return Math.round(((inicial - atual) / inicial) * 100);
  };

  // Calcular score de qualidade (fictício para demonstração)
  const getScoreQualidade = (lote: any) => {
    let score = 100;
    const diasParaVencer = getDiasParaVencimento(lote.data_validade);
    
    if (diasParaVencer !== null) {
      if (diasParaVencer < 0) score -= 50;
      else if (diasParaVencer < 30) score -= 20;
      else if (diasParaVencer < 90) score -= 10;
    }
    
    const porcentagemUtilizada = getPorcentagemUtilizada(lote.quantidade_inicial, lote.quantidade_atual);
    if (porcentagemUtilizada > 90) score -= 10;
    
    return Math.max(0, score);
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
            <p className="text-muted-foreground animate-pulse">Carregando detalhes do lote...</p>
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
              O lote que você está procurando não existe ou foi removido do sistema.
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

  const status = getStatusLote(lote);
  const diasParaVencimento = getDiasParaVencimento(lote.data_validade);
  const porcentagemUtilizada = getPorcentagemUtilizada(lote.quantidade_inicial, lote.quantidade_atual);
  const scoreQualidade = getScoreQualidade(lote);
  const StatusIcon = status.icon;

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
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 hover:bg-white/70 dark:hover:bg-gray-800/70"
                >
                  <Star className="h-4 w-4" />
                  Favoritar
                </Button>
                <Button
                  onClick={() => navigate(`/admin/estoque/lotes/editar/${id}`)}
                  className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg"
                >
                  <Edit className="h-4 w-4" />
                  Editar Lote
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-xl">
                <Package className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Lote {lote.numero_lote}
                </h1>
                <p className="text-lg text-muted-foreground mb-3">
                  {lote.produtos?.nome || 'Produto não encontrado'}
                </p>
                <div className="flex items-center gap-3">
                  <Badge variant={status.variant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                  {diasParaVencimento !== null && diasParaVencimento > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {diasParaVencimento} dias para vencer
                    </Badge>
                  )}
                  <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-indigo-400 border-0">
                    <Activity className="h-3 w-3 mr-1" />
                    {porcentagemUtilizada}% utilizado
                  </Badge>
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
                  <p className="text-sm text-muted-foreground">Score de Qualidade</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{scoreQualidade}%</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <Progress value={scoreQualidade} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade Atual</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{lote.quantidade_atual}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lote.produtos?.unidade_medida || 'UN'}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400">Estoque saudável</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor do Lote</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    R$ {((lote.preco_custo_unitario || 0) * lote.quantidade_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Calculator className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-600 dark:text-purple-400">Custo unitário: R$ {(lote.preco_custo_unitario || 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dias em Estoque</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {Math.floor((new Date().getTime() - new Date(lote.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 dark:text-orange-400">Rotatividade normal</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Detalhadas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Informações do Lote */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
                    <Layers className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  Informações do Lote
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Barcode className="h-4 w-4 text-muted-foreground" />
                      <label className="text-sm font-medium text-muted-foreground">Número do Lote</label>
                    </div>
                    <p className="font-semibold text-lg">{lote.numero_lote}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <label className="text-sm font-medium text-muted-foreground">Data de Validade</label>
                    </div>
                    <p className="font-semibold text-lg">
                      {lote.data_validade 
                        ? format(new Date(lote.data_validade), 'dd/MM/yyyy', { locale: ptBR })
                        : 'Não informada'
                      }
                    </p>
                  </div>
                </div>

                {lote.data_fabricacao && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <label className="text-sm font-medium text-muted-foreground">Data de Fabricação</label>
                    </div>
                    <p className="font-medium">
                      {format(new Date(lote.data_fabricacao), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}

                {lote.observacoes && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <label className="text-sm font-medium text-muted-foreground">Observações</label>
                    </div>
                    <p className="text-sm leading-relaxed">{lote.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card do Fornecedor */}
            {lote.fornecedores && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                      <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    Fornecedor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <Truck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{lote.fornecedores.nome}</p>
                      {lote.fornecedores.documento && (
                        <p className="text-sm text-muted-foreground mt-1">CNPJ: {lote.fornecedores.documento}</p>
                      )}
                    </div>
                  </div>
                  
                  {(lote.fornecedores.telefone || lote.fornecedores.email) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lote.fornecedores.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lote.fornecedores.telefone}</span>
                        </div>
                      )}
                      {lote.fornecedores.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lote.fornecedores.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Card de Estoque */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Controle de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Inicial</span>
                    <span className="font-semibold">{lote.quantidade_inicial}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Atual</span>
                    <span className="font-semibold text-emerald-600">{lote.quantidade_atual}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Utilizado</span>
                    <span className="font-semibold text-orange-600">
                      {lote.quantidade_inicial - lote.quantidade_atual}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilização</span>
                    <span className="font-medium">{porcentagemUtilizada}%</span>
                  </div>
                  <Progress 
                    value={porcentagemUtilizada} 
                    className="h-2"
                    indicatorClassName={
                      porcentagemUtilizada > 80 ? 'bg-red-500' :
                      porcentagemUtilizada > 60 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card de Alertas */}
            {(diasParaVencimento !== null && diasParaVencimento <= 30) && (
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-yellow-500 to-orange-500" />
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Alerta de Validade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`p-4 rounded-lg ${
                    diasParaVencimento < 0 
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400' 
                      : 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {diasParaVencimento < 0 ? (
                      <p className="font-medium">
                        ⚠️ Este lote está vencido há {Math.abs(diasParaVencimento)} dias
                      </p>
                    ) : (
                      <p className="font-medium">
                        ⏰ Este lote vence em {diasParaVencimento} dias
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card do Produto */}
            {lote.produtos && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Informações do Produto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Nome</p>
                    <p className="font-semibold">{lote.produtos.nome}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Código</span>
                    <span className="font-mono text-sm">{lote.produtos.codigo_interno}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tipo</span>
                    <Badge variant="secondary">{lote.produtos.tipo}</Badge>
                  </div>
                  
                  {lote.produtos.categoria && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Categoria</span>
                      <span className="text-sm font-medium">{lote.produtos.categoria}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Linha do Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">Lote criado</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(lote.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Última atualização</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(lote.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
            <span>Status: {lote.ativo ? 'Ativo' : 'Inativo'}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DetalhesLotePage; 