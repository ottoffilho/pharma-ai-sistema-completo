import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/components/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import {
  FlaskConical,
  Package,
  ClipboardCheck,
  Microscope,
  Calendar,
  BarChart,
  ArrowUpRight,
  Timer,
  Hourglass,
  PackageCheck,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Beaker,
  Plus,
  ArrowRight
} from 'lucide-react';

// Interface para tipagem dos cards de feature
interface ProductionFeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  stats?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
    color?: string;
  }[];
  status: 'ativo' | 'em-breve' | 'beta';
  gradient: string;
}

// Hook para buscar estatísticas reais de produção
const useProductionFeatures = () => {
  return useQuery({
    queryKey: ['producao-features'],
    queryFn: async () => {
      // Buscar dados reais de ordens de produção
      const { data: ordens, error: ordensError } = await supabase
        .from('ordens_producao')
        .select('status, created_at, data_finalizacao')
        .eq('is_deleted', false);

      if (ordensError) throw ordensError;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Calcular estatísticas reais
      const ordensEmAndamento = ordens.filter(o => 
        o.status === 'em_producao' || o.status === 'pendente'
      ).length;

      const ordensConcluidasHoje = ordens.filter(o => {
        if (o.status !== 'finalizada' || !o.data_finalizacao) return false;
        const dataFinalizacao = new Date(o.data_finalizacao);
        return dataFinalizacao >= hoje;
      }).length;

             // Buscar receitas para estatísticas de controle de qualidade
       const { data: receitas, error: receitasError } = await supabase
         .from('receitas_processadas')
         .select('validation_status, processed_at');

       if (receitasError) throw receitasError;

       const receitasPendentes = receitas.filter(r => r.validation_status === 'pendente').length;
       const receitasAprovadas = receitas.filter(r => r.validation_status === 'aprovada').length;
      const totalReceitas = receitas.length;
      const taxaAprovacao = totalReceitas > 0 ? ((receitasAprovadas / totalReceitas) * 100).toFixed(1) : '0';

      // TODO: Implementar busca de fórmulas padrão quando módulo estiver completo
      const formulasCadastradas = 0;
      const usoMensalFormulas = 0;

      // TODO: Implementar métricas de planejamento
      const produtividade = totalReceitas > 0 ? Math.min(((ordensConcluidasHoje / totalReceitas) * 100), 100).toFixed(0) : '0';
      const proximasOrdens = ordensEmAndamento;

      return {
        ordensEmAndamento,
        ordensConcluidasHoje,
        taxaAprovacao,
        receitasPendentes,
        formulasCadastradas,
        usoMensalFormulas,
        produtividade,
        proximasOrdens
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
};

// Função utilitária para calcular métricas do dia
const useProductionMetrics = () => {
  return useQuery({
    queryKey: ['producao-metricas'],
    queryFn: async () => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('ordens_producao')
        .select('status, data_criacao, data_finalizacao')
        .eq('is_deleted', false)
        .gte('created_at', startOfToday.toISOString());

      if (error) throw error;

      const pendingStatuses = ['pendente'];
      const inProgressStatuses = ['em_producao'];

      const pending = data.filter((o) => pendingStatuses.includes(o.status)).length;
      const inProgress = data.filter((o) => inProgressStatuses.includes(o.status)).length;
      const completed = data.filter((o) => o.status === 'finalizada').length;
      const total = data.length;

      // Eficiência simples: % concluído no dia
      const efficiency = total === 0 ? 0 : Math.round((completed / total) * 100);

      // Tempo médio para concluir em horas
      const completedOrders = data.filter(
        (o) => o.status === 'finalizada' && o.data_finalizacao
      );
      let avgTimeHours = '0.0h';
      if (completedOrders.length) {
        const totalMinutes = completedOrders.reduce((acc, cur) => {
          const inicio = new Date(cur.data_criacao).getTime();
          const fim = new Date(cur.data_finalizacao).getTime();
          return acc + (fim - inicio) / 60000;
        }, 0);
        const avgMinutes = totalMinutes / completedOrders.length;
        avgTimeHours = `${(avgMinutes / 60).toFixed(1)}h`;
      }

      return {
        today: { pending, inProgress, completed, total },
        efficiency,
        timeToCompletion: { avg: avgTimeHours, change: '' },
        alerts: [] as { type: 'warning' | 'info'; message: string; action: string }[],
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
};

export default function ProducaoOverview() {
  const { data: productionStatus, isPending: isLoading } = useProductionMetrics();
  const { data: featuresData, isPending: isFeaturesLoading } = useProductionFeatures();

  // Definir features com dados reais (sem dados mockados)
  const productionFeatures: ProductionFeatureCard[] = [
    {
      title: 'Ordens de Produção',
      description: 'Gerencie todo o ciclo de manipulação com rastreabilidade e controle de qualidade.',
      icon: <ClipboardCheck className="h-6 w-6" />,
      href: '/admin/producao',
      stats: [
        { 
          label: 'Em andamento', 
          value: isFeaturesLoading ? '—' : String(featuresData?.ordensEmAndamento || 0), 
          color: 'text-amber-500' 
        },
        { 
          label: 'Concluídas hoje', 
          value: isFeaturesLoading ? '—' : String(featuresData?.ordensConcluidasHoje || 0), 
          color: 'text-green-500' 
        }
      ],
      status: 'ativo',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'Controle de Qualidade',
      description: 'Validações, testes e aprovações com documentação completa de cada etapa do processo.',
      icon: <Microscope className="h-6 w-6" />,
      href: '/admin/producao', // Controle de qualidade é acessado através de cada ordem
      stats: [
        { 
          label: 'Aprovação', 
          value: isFeaturesLoading ? '—' : `${featuresData?.taxaAprovacao || 0}%`, 
          color: 'text-green-500' 
        },
        { 
          label: 'Pendentes', 
          value: isFeaturesLoading ? '—' : String(featuresData?.receitasPendentes || 0), 
          color: 'text-amber-500' 
        }
      ],
      status: 'ativo',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Fórmulas Padrão',
      description: 'Biblioteca de fórmulas padronizadas com composição, instruções e controles.',
      icon: <FlaskConical className="h-6 w-6" />,
      href: '/admin/producao/formulas',
      stats: [
        { 
          label: 'Cadastradas', 
          value: isFeaturesLoading ? '—' : String(featuresData?.formulasCadastradas || 0), 
          color: 'text-blue-500' 
        },
        { 
          label: 'Uso mensal', 
          value: isFeaturesLoading ? '—' : String(featuresData?.usoMensalFormulas || 0), 
          color: 'text-green-500' 
        }
      ],
      status: 'em-breve',
      gradient: 'from-amber-500 to-red-500'
    },
    {
      title: 'Planejamento',
      description: 'Calendário de produção com análise de capacidade e otimização de processos.',
      icon: <Calendar className="h-6 w-6" />,
      href: '/admin/producao/planejamento',
      stats: [
        { 
          label: 'Produtividade', 
          value: isFeaturesLoading ? '—' : `${featuresData?.produtividade || 0}%`, 
          color: 'text-green-500' 
        },
        { 
          label: 'Próximas ordens', 
          value: isFeaturesLoading ? '—' : `${featuresData?.proximasOrdens || 0} ordens`, 
          color: 'text-blue-500' 
        }
      ],
      status: 'em-breve',
      gradient: 'from-green-500 to-teal-500'
    }
  ];

  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-violet-950/20" />
          <div className="relative px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-10 w-10 text-blue-600" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Central de Produção
                    </h1>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    Visão executiva completa dos processos de manipulação com métricas em tempo real, 
                    indicadores de performance e acesso rápido às funcionalidades operacionais.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur-3xl opacity-20" />
                    <Package className="h-48 w-48 text-blue-600/20" />
                  </div>
                </div>
              </div>

              {/* Status Cards - CONECTADOS AO BANCO REAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ordens Hoje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <span className="text-3xl font-bold">{isLoading ? '—' : productionStatus?.today.total || 0}</span>
                        <div className="flex gap-2 text-xs">
                          <span className="flex items-center text-amber-500">
                            <Hourglass className="h-3 w-3 mr-1" />
                            Pendentes: {isLoading ? '—' : productionStatus?.today.pending || 0}
                          </span>
                          <span className="flex items-center text-blue-500">
                            <Timer className="h-3 w-3 mr-1" />
                            Em produção: {isLoading ? '—' : productionStatus?.today.inProgress || 0}
                          </span>
                          <span className="flex items-center text-green-500">
                            <PackageCheck className="h-3 w-3 mr-1" />
                            Concluídas: {isLoading ? '—' : productionStatus?.today.completed || 0}
                          </span>
                        </div>
                      </div>
                      <BarChart className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Eficiência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold">{isLoading ? '—' : `${productionStatus?.efficiency || 0}%`}</span>
                        <ArrowUpRight className="h-6 w-6 text-green-500" />
                      </div>
                      <Progress value={productionStatus?.efficiency ?? 0} className="h-2" />
                      <p className="text-xs text-muted-foreground">Meta: 90%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <span className="text-3xl font-bold">{isLoading ? '—' : productionStatus?.timeToCompletion.avg || '0.0h'}</span>
                        {!isLoading && productionStatus?.timeToCompletion.change && (
                          <p className="text-xs text-green-500">{productionStatus.timeToCompletion.change} desde ontem</p>
                        )}
                      </div>
                      <Timer className="h-8 w-8 text-indigo-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Alertas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(productionStatus?.alerts || []).length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        Nenhum alerta ativo
                      </div>
                    ) : (
                      (productionStatus?.alerts || []).map((alert, index) => (
                        <div key={index} className="flex items-start gap-2">
                          {alert.type === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 text-blue-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{alert.message}</p>
                            <Link 
                              to={alert.action} 
                              className="text-xs text-blue-500 hover:underline flex items-center"
                            >
                              Ver detalhes
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid - CONECTADO AO BANCO REAL */}
        <div className="px-6 pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {productionFeatures.map((feature, index) => {
                const card = (
                  <Card 
                    key={index} 
                    className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.gradient} text-white`}>
                          {feature.icon}
                        </div>
                        <Badge 
                          variant={feature.status === 'ativo' ? 'default' : feature.status === 'beta' ? 'secondary' : 'outline'}
                          className="capitalize"
                        >
                          {feature.status}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      {feature.stats && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          {feature.stats.map((stat, idx) => (
                            <div key={idx} className="space-y-1">
                              <p className="text-sm text-muted-foreground">{stat.label}</p>
                              <p className={`text-lg font-semibold ${stat.color || ''}`}>{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {feature.status === 'em-breve' && (
                        <p className="text-center text-xs text-muted-foreground">Funcionalidade em desenvolvimento</p>
                      )}
                    </CardContent>
                  </Card>
                );

                return feature.status === 'em-breve' ? (
                  <div key={index}>{card}</div>
                ) : (
                  <Link key={index} to={feature.href} className="block">
                    {card}
                  </Link>
                );
              })}
            </div>

            {/* Informações do Sistema */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Sistema de Produção</h2>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/producao">
                      Central Operacional
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/admin/producao/nova">
                      Nova Ordem
                      <Plus className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Visão Executiva</h3>
                        <p className="text-muted-foreground">
                          Esta página oferece uma visão geral das métricas e indicadores 
                          de produção para tomada de decisões estratégicas.
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ✅ Métricas em Tempo Real
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          📊 Dashboard Executivo
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <ClipboardCheck className="h-8 w-8 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Central Operacional</h3>
                        <p className="text-muted-foreground">
                          Acesse a interface completa para gerenciar ordens de produção, 
                          controlar status e acompanhar o progresso detalhado.
                        </p>
                      </div>
                      <Button asChild className="w-full">
                        <Link to="/admin/producao">
                          Acessar Central Operacional
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fluxo de Navegação */}
              <Card className="mt-6 border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ArrowRight className="h-5 w-5 mr-2 text-blue-600" />
                    Fluxo de Trabalho Recomendado
                  </h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-blue-600 font-bold">1</span>
                      </div>
                      <h4 className="font-medium">Visão Geral</h4>
                      <p className="text-sm text-muted-foreground">Analise métricas e indicadores</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-purple-600 font-bold">2</span>
                      </div>
                      <h4 className="font-medium">Operação</h4>
                      <p className="text-sm text-muted-foreground">Gerencie ordens e processos</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-green-600 font-bold">3</span>
                      </div>
                      <h4 className="font-medium">Controle</h4>
                      <p className="text-sm text-muted-foreground">Qualidade e finalização</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}