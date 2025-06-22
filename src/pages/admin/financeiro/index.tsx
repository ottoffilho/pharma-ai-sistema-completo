import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  PieChart, 
  Receipt, 
  CreditCard, 
  TrendingUp,
  BarChart3,
  Landmark,
  Wallet,
  LineChart,
  ArrowRight,
  AlertTriangle,
  ChevronUp,
  BadgeDollarSign,
  CalendarRange,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/components/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface FinanceFeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  stats?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  }[];
  status: 'ativo' | 'em-breve' | 'beta';
  gradient: string;
}

// Hook para buscar dados financeiros reais
const useFinanceData = () => {
  const currentDate = new Date();
  const startMonth = startOfMonth(currentDate);
  const endMonth = endOfMonth(currentDate);
  const startYear = startOfYear(currentDate);
  const endYear = endOfYear(currentDate);

  // Buscar movimentações do mês atual
  const { data: movimentacoesMes } = useQuery({
    queryKey: ['movimentacoes-mes', format(startMonth, 'yyyy-MM'), format(endMonth, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacoes_caixa')
        .select('*')
        .eq('is_deleted', false)
        .gte('data_movimentacao', format(startMonth, 'yyyy-MM-dd'))
        .lte('data_movimentacao', format(endMonth, 'yyyy-MM-dd'));
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar movimentações do ano atual
  const { data: movimentacoesAno } = useQuery({
    queryKey: ['movimentacoes-ano', format(startYear, 'yyyy'), format(endYear, 'yyyy')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacoes_caixa')
        .select('*')
        .eq('is_deleted', false)
        .gte('data_movimentacao', format(startYear, 'yyyy-MM-dd'))
        .lte('data_movimentacao', format(endYear, 'yyyy-MM-dd'));
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar categorias financeiras
  const { data: categorias } = useQuery({
    queryKey: ['categorias-financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('is_deleted', false);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar contas a pagar
  const { data: contasPagar } = useQuery({
    queryKey: ['contas-pagar-pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .select('*')
        .eq('is_deleted', false)
        .eq('status_conta', 'pendente');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calcular métricas
  const calcularMetricas = () => {
    if (!movimentacoesMes || !movimentacoesAno) {
      return {
        receitaMensal: 0,
        despesasMensais: 0,
        saldoAtual: 0,
        previsaoTrimestral: 0,
        margemLucro: 0,
        categoriasAtivas: 0,
        contasPendentes: 0,
        valorVencendo: 0
      };
    }

    const receitaMensal = movimentacoesMes
      .filter(mov => mov.tipo_movimentacao === 'entrada')
      .reduce((total, mov) => total + parseFloat(mov.valor), 0);

    const despesasMensais = movimentacoesMes
      .filter(mov => mov.tipo_movimentacao === 'saida')
      .reduce((total, mov) => total + parseFloat(mov.valor), 0);

    const saldoAtual = receitaMensal - despesasMensais;

    const receitaAnual = movimentacoesAno
      .filter(mov => mov.tipo_movimentacao === 'entrada')
      .reduce((total, mov) => total + parseFloat(mov.valor), 0);

    const despesasAnuais = movimentacoesAno
      .filter(mov => mov.tipo_movimentacao === 'saida')
      .reduce((total, mov) => total + parseFloat(mov.valor), 0);

    const margemLucro = receitaMensal > 0 ? ((receitaMensal - despesasMensais) / receitaMensal) * 100 : 0;
    const previsaoTrimestral = receitaMensal * 3; // Projeção baseada no mês atual

    const categoriasAtivas = categorias?.length || 0;
    const contasPendentes = contasPagar?.length || 0;

    // Contas vencendo em 7 dias
    const seteDiasAFrente = new Date();
    seteDiasAFrente.setDate(seteDiasAFrente.getDate() + 7);
    
    const valorVencendo = contasPagar
      ?.filter(conta => {
        const dataVencimento = new Date(conta.data_vencimento);
        return dataVencimento <= seteDiasAFrente;
      })
      .reduce((total, conta) => total + parseFloat(conta.valor_previsto), 0) || 0;

    return {
      receitaMensal,
      despesasMensais,
      saldoAtual,
      previsaoTrimestral,
      margemLucro,
      categoriasAtivas,
      contasPendentes,
      valorVencendo
    };
  };

  return calcularMetricas();
};

export default function FinanceiroOverview() {
  const metricas = useFinanceData();

  // Função para formatar valores em Real brasileiro
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Features com dados atualizados
  const financeFeatures: FinanceFeatureCard[] = [
    {
      title: 'Categorias Financeiras',
      description: 'Organize suas finanças com categorias personalizáveis para receitas e despesas.',
      icon: <PieChart className="h-6 w-6" />,
      href: '/admin/financeiro/categorias',
      stats: [
        { label: 'Categorias criadas', value: metricas.categoriasAtivas.toString(), trend: 'stable' },
        { label: 'Categorias em uso', value: metricas.categoriasAtivas > 0 ? '100%' : '0%', trend: 'stable' }
      ],
      status: 'ativo',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'Fluxo de Caixa',
      description: 'Visualize entradas e saídas com análises detalhadas e projeções para o futuro.',
      icon: <LineChart className="h-6 w-6" />,
      href: '/admin/financeiro/caixa',
      stats: [
        { label: 'Saldo atual', value: formatCurrency(metricas.saldoAtual), trend: metricas.saldoAtual >= 0 ? 'up' : 'down' },
        { label: 'Movimentações mensais', value: '—', trend: 'stable' }
      ],
      status: 'ativo',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Contas a Pagar',
      description: 'Gerencie compromissos financeiros com lembretes e programação automática.',
      icon: <Receipt className="h-6 w-6" />,
      href: '/admin/financeiro/contas-a-pagar',
      stats: [
        { label: 'Contas pendentes', value: metricas.contasPendentes.toString(), trend: metricas.contasPendentes > 0 ? 'up' : 'stable' },
        { label: 'Vencendo em 7 dias', value: formatCurrency(metricas.valorVencendo), trend: metricas.valorVencendo > 0 ? 'up' : 'stable' }
      ],
      status: 'ativo',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Relatórios Financeiros',
      description: 'Relatórios detalhados e personalizáveis com gráficos interativos e exportação.',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/admin/financeiro/relatorios',
      stats: [
        { label: 'Relatórios gerados', value: '—', trend: 'stable' },
        { label: 'Economia identificada', value: '—', trend: 'stable' }
      ],
      status: 'em-breve',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  // Métricas financeiras atualizadas com dados reais
  const financeMetrics = [
    {
      label: 'Receita Mensal',
      value: formatCurrency(metricas.receitaMensal),
      change: '—', // TODO: Calcular baseado no mês anterior
      trend: 'stable' as const,
      color: 'text-green-600'
    },
    {
      label: 'Despesas Mensais',
      value: formatCurrency(metricas.despesasMensais),
      change: '—', // TODO: Calcular baseado no mês anterior
      trend: 'stable' as const,
      color: 'text-red-600'
    },
    {
      label: 'Margem de Lucro',
      value: formatPercentage(metricas.margemLucro),
      change: '—', // TODO: Calcular baseado no mês anterior
      trend: metricas.margemLucro >= 20 ? 'up' : metricas.margemLucro >= 10 ? 'stable' : 'down' as const,
      color: metricas.margemLucro >= 20 ? 'text-green-600' : metricas.margemLucro >= 10 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      label: 'Projeção Trimestral',
      value: formatCurrency(metricas.previsaoTrimestral),
      change: '—', // TODO: Calcular baseado no trimestre anterior
      trend: 'stable' as const,
      color: 'text-blue-600'
    }
  ];

  return (
    <AdminLayout>
      <div>
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20" />
          <div className="relative px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign className="h-10 w-10 text-emerald-600" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      Central Financeira
                    </h1>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    Administre com eficiência todas as suas operações financeiras, desde controle de caixa 
                    até análises detalhadas, com visualizações claras e acessíveis.
                  </p>
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium">
                        {metricas.saldoAtual >= 0 ? 'Fluxo positivo' : 'Fluxo negativo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium">
                        {metricas.margemLucro >= 20 ? 'Previsão otimista' : metricas.margemLucro >= 10 ? 'Previsão moderada' : 'Previsão cautelosa'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-purple-500" />
                      <span className="text-sm font-medium">Gestão inteligente</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 blur-3xl opacity-20" />
                    <DollarSign className="h-48 w-48 text-emerald-600/20" />
                  </div>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {financeMetrics.map((metric, index) => (
                  <Card key={index} className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                        <span className={`flex items-center ${metric.color}`}>
                          {metric.trend === 'up' ? <ChevronUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                          <span className="text-xs ml-1">{metric.change}</span>
                        </span>
                      </div>
                      <div className="text-2xl font-bold">{metric.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-6 pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-2">
              {financeFeatures.map((feature, index) => {
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
                              <p className="text-lg font-semibold flex items-center gap-1">
                                {stat.value}
                                {stat.trend && (
                                  <span className={`text-xs ${
                                    stat.trend === 'up' ? 'text-green-500' : 
                                    stat.trend === 'down' ? 'text-red-500' : 
                                    'text-gray-500'
                                  }`}>
                                    {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}
                                  </span>
                                )}
                              </p>
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

            {/* Alerta de DRE */}
            <div className="mt-12 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                  <Landmark className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Demonstrativos Financeiros</h3>
                  <p className="text-muted-foreground mb-4">
                    Acompanhe o desempenho financeiro da sua farmácia com demonstrativos 
                    detalhados e fáceis de entender. Compare períodos, analise tendências e tome 
                    decisões informadas.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Receita vs Meta</span>
                        <span className="text-sm text-green-600">—</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Despesas vs Orçamento</span>
                        <span className="text-sm text-amber-600">—</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Lucro Líquido (Meta anual)</span>
                        <span className="text-sm text-blue-600">—</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
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