import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Microscope, 
  ClipboardCheck, 
  FlaskConical, 
  Calendar,
  Timer,
  Hourglass,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  BarChart,
  Beaker,
  PackageCheck,
  ShieldCheck,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

const productionFeatures: ProductionFeatureCard[] = [
  {
    title: 'Ordens de Produção',
    description: 'Gerencie todo o ciclo de manipulação com rastreabilidade e controle de qualidade.',
    icon: <ClipboardCheck className="h-6 w-6" />,
    href: '/admin/producao',
    stats: [
      { label: 'Em andamento', value: '14', color: 'text-amber-500' },
      { label: 'Concluídas hoje', value: '28', color: 'text-green-500' }
    ],
    status: 'ativo',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    title: 'Controle de Qualidade',
    description: 'Validações, testes e aprovações com documentação completa de cada etapa do processo.',
    icon: <Microscope className="h-6 w-6" />,
    href: '/admin/producao/qualidade',
    stats: [
      { label: 'Aprovação', value: '98.2%', color: 'text-green-500' },
      { label: 'Pendentes', value: '4', color: 'text-amber-500' }
    ],
    status: 'em-breve',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Fórmulas Padrão',
    description: 'Biblioteca de fórmulas padronizadas com composição, instruções e controles.',
    icon: <FlaskConical className="h-6 w-6" />,
    href: '/admin/producao/formulas',
    stats: [
      { label: 'Cadastradas', value: '372', color: 'text-blue-500' },
      { label: 'Uso mensal', value: '158', color: 'text-green-500' }
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
      { label: 'Produtividade', value: '82%', color: 'text-green-500' },
      { label: 'Próximos 7 dias', value: '56 ordens', color: 'text-blue-500' }
    ],
    status: 'em-breve',
    gradient: 'from-green-500 to-teal-500'
  }
];

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
        .gte('data_criacao', startOfToday.toISOString());

      if (error) throw error;

      const pendingStatuses = ['pendente'];
      const inProgressStatuses = ['em_preparacao', 'em_manipulacao', 'controle_qualidade'];

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
      let avgTimeHours = '0h';
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
  });
};

// Dados simulados de produção recente (será substituído por dados reais)
// TODO: Implementar consulta real ao banco de dados quando módulo de produção estiver ativo
const recentProduction = [
  // Dados removidos - aguardando implementação completa do módulo de produção
];

export default function ProducaoOverview() {
  const { data: productionStatus, isPending: isLoading } = useProductionMetrics();

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
                    Gerencie todos os processos de manipulação farmacêutica com controle preciso, 
                    rastreabilidade completa e integração com todos os setores da sua farmácia.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur-3xl opacity-20" />
                    <Package className="h-48 w-48 text-blue-600/20" />
                  </div>
                </div>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ordens Hoje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <span className="text-3xl font-bold">{isLoading ? '—' : productionStatus?.today.total}</span>
                        <div className="flex gap-2 text-xs">
                          <span className="flex items-center text-amber-500">
                            <Hourglass className="h-3 w-3 mr-1" />
                            Pendentes: {isLoading ? '—' : productionStatus?.today.pending}
                          </span>
                          <span className="flex items-center text-blue-500">
                            <Timer className="h-3 w-3 mr-1" />
                            Em produção: {isLoading ? '—' : productionStatus?.today.inProgress}
                          </span>
                          <span className="flex items-center text-green-500">
                            <PackageCheck className="h-3 w-3 mr-1" />
                            Concluídas: {isLoading ? '—' : productionStatus?.today.completed}
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
                        <span className="text-3xl font-bold">{isLoading ? '—' : `${productionStatus?.efficiency}%`}</span>
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
                        <span className="text-3xl font-bold">{isLoading ? '—' : productionStatus?.timeToCompletion.avg}</span>
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
                    {(productionStatus?.alerts || []).map((alert, index) => (
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
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
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
                        <p className="text-center text-xs text-muted-foreground">Em breve</p>
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

            {/* Produção Recente */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Produção Recente</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/producao">
                    Ver todas
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="space-y-4">
                {recentProduction.map((item, index) => (
                  <Card key={index} className="border-0 shadow-sm overflow-hidden">
                    <div className={`h-1 w-full ${
                      item.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-2 md:col-span-1">
                          <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-2 flex items-center justify-center">
                            <Beaker className="h-6 w-6 text-blue-500" />
                          </div>
                        </div>
                        <div className="col-span-10 md:col-span-3">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.id}</p>
                            <Badge variant={item.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                              {item.status === 'completed' ? 'Concluído' : 'Em produção'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{item.customer}</p>
                        </div>
                        <div className="col-span-12 md:col-span-6">
                          <p className="text-sm truncate">{item.formula}</p>
                        </div>
                        <div className="col-span-12 md:col-span-2 text-right">
                          {item.status === 'completed' ? (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Concluído às</span>{' '}
                              <span className="font-medium">{item.completedAt}</span>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Previsão</span>{' '}
                              <span className="font-medium">{item.estimatedCompletion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Alerta de QA */}
            <div className="mt-12 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Controle de Qualidade</h3>
                  <p className="text-muted-foreground mb-4">
                    O sistema de produção é integrado com procedimentos de controle de qualidade em todas as etapas, 
                    garantindo a rastreabilidade e conformidade com as normas da ANVISA.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin/producao/qa/procedimentos">
                        Procedimentos Operacionais
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin/producao/qa/relatorios">
                        Relatórios de Qualidade
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 