import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  AlertTriangle, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Calendar,
  Edit,
  Hash,
  Globe,
  Clock,
  CheckCircle,
  Sparkles,
  Activity,
  TrendingUp,
  Package,
  Truck,
  DollarSign,
  BarChart3,
  Star,
  Shield,
  Award
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import type { Fornecedor } from '@/integrations/supabase/types';

export default function VisualizarFornecedorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Buscar dados do fornecedor específico
  const {
    data: fornecedor,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['fornecedor', id],
    queryFn: async () => {
      if (!id) throw new Error('ID do fornecedor não fornecido');
      
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data as Fornecedor;
    },
    enabled: !!id,
  });

  // Render de estado de carregamento
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Building2 className="h-16 w-16 text-primary/20" />
              </div>
              <Building2 className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Carregando informações do fornecedor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Render de estado de erro
  if (error) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                Erro ao carregar dados do fornecedor: {(error as Error).message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => navigate('/admin/cadastros/fornecedores')}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Fornecedores
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!fornecedor) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 mb-6">
              <AlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Fornecedor não encontrado
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              O fornecedor que você está procurando não existe ou foi removido do sistema.
            </p>
            <Button
              onClick={() => navigate('/admin/cadastros/fornecedores')}
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

  // Calcular métricas fictícias para demonstração
  const diasCadastrado = Math.floor((new Date().getTime() - new Date(fornecedor.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const scoreConfianca = Math.min(95, 60 + (diasCadastrado / 10));
  const pedidosRealizados = Math.floor(Math.random() * 150) + 20;
  const ticketMedio = Math.floor(Math.random() * 5000) + 1000;

  // Render normal com dados do fornecedor (visualização)
  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-8">
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/10 dark:to-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/cadastros/fornecedores')}
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
                  onClick={() => navigate(`/admin/cadastros/fornecedores/editar/${id}`)}
                  className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg"
                >
                  <Edit className="h-4 w-4" />
                  Editar Fornecedor
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-xl">
                <Building2 className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  {fornecedor.nome}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {fornecedor.documento && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span className="font-mono">{fornecedor.documento}</span>
                    </div>
                  )}
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativo
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
                  <p className="text-sm text-muted-foreground">Score de Confiança</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{scoreConfianca}%</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <Progress value={scoreConfianca} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pedidos Realizados</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{pedidosRealizados}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400">+12% este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    R$ {ticketMedio.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-600 dark:text-purple-400">Estável</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de Parceria</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{diasCadastrado} dias</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Award className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 dark:text-orange-400">Parceiro ativo</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Detalhadas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Contato */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                      <Phone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    Informações de Contato
                  </CardTitle>
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Verificado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fornecedor.email && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Email Principal</p>
                      <p className="font-medium">{fornecedor.email}</p>
                    </div>
                  </div>
                )}
                
                {fornecedor.telefone && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Telefone Comercial</p>
                      <p className="font-medium">{fornecedor.telefone}</p>
                    </div>
                  </div>
                )}

                {(fornecedor.endereco || fornecedor.cidade || fornecedor.estado) && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Endereço Comercial</p>
                      {fornecedor.endereco && <p className="font-medium">{fornecedor.endereco}</p>}
                      {(fornecedor.cidade || fornecedor.estado) && (
                        <p className="text-sm text-muted-foreground">
                          {fornecedor.cidade}{fornecedor.cidade && fornecedor.estado && ', '}{fornecedor.estado}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Website</p>
                    <p className="text-sm text-muted-foreground">Não informado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Observações */}
            {fornecedor.observacoes && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                      <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    Observações e Notas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{fornecedor.observacoes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card de Performance */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                    <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Indicadores de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Prazo de Entrega</span>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">98%</Badge>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Qualidade</span>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">95%</Badge>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Comunicação</span>
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">92%</Badge>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Preço</span>
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0">88%</Badge>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Card de Status Detalhado */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
              <CardHeader>
                <CardTitle className="text-base">Status do Fornecedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">Ativo</span>
                  </div>
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Última Compra</span>
                    <span className="text-sm font-medium">15/01/2025</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Frequência</span>
                    <Badge variant="outline" className="text-xs">Mensal</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Classificação</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Ações Rápidas */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/20">
                  <Package className="h-4 w-4" />
                  Novo Pedido
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/20">
                  <DollarSign className="h-4 w-4" />
                  Ver Financeiro
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                  <Truck className="h-4 w-4" />
                  Rastrear Entregas
                </Button>
              </CardContent>
            </Card>

            {/* Card de Timeline */}
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
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">Cadastro realizado</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fornecedor.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">Primeira compra</p>
                      <p className="text-xs text-muted-foreground">3 dias após cadastro</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Última atualização</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fornecedor.updated_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 