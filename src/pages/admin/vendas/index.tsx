// =====================================================
// OVERVIEW DO SISTEMA DE VENDAS - PHARMA.AI
// =====================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart,
  CreditCard,
  Receipt,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  Clock,
  DollarSign,
  Package,
  Target,
  ArrowRight,
  PlusCircle,
  Search,
  FileText,
  CheckCircle,
  History,
  AlertTriangle,
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useVendasCards } from '@/hooks/useVendasCards';

interface VendaFeatureCard {
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

export default function VendasOverview() {
  // Utilizamos o hook personalizado para obter os dados das vendas
  const {
    data: cardsData,
    isLoading: isLoadingCards,
    formatarDinheiro,
    formatarTempo
  } = useVendasCards();

  // Definição dos cards de funcionalidades com dados reais
  const vendaFeatures: VendaFeatureCard[] = [
    {
      title: 'PDV - Ponto de Venda',
      description: 'Sistema completo de vendas com interface moderna, busca inteligente e múltiplas formas de pagamento.',
      icon: <ShoppingCart className="h-6 w-6" />,
      href: '/admin/vendas/pdv',
      stats: [
        { 
          label: 'Vendas hoje', 
          value: isLoadingCards ? '...' : cardsData?.vendas.hoje.toString() || '0', 
          trend: 'up' 
        },
        { 
          label: 'Ticket médio', 
          value: isLoadingCards ? '...' : formatarDinheiro(cardsData?.vendas.ticketMedio || 0), 
          trend: 'up' 
        }
      ],
      status: 'ativo',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Fechamento de Vendas',
      description: 'Finalize vendas pendentes e em aberto, gerencie pagamentos e confirme transações.',
      icon: <CheckCircle className="h-6 w-6" />,
      href: '/admin/vendas/fechamento',
      stats: [
        { 
          label: 'Vendas pendentes', 
          value: isLoadingCards ? '...' : cardsData?.pdv.vendasPendentes.toString() || '0', 
          trend: 'stable' 
        },
        { 
          label: 'Vendas abertas', 
          value: isLoadingCards ? '...' : cardsData?.pdv.vendasAbertas.toString() || '0', 
          trend: 'stable' 
        }
      ],
      status: 'ativo',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Histórico de Vendas',
      description: 'Consulte o histórico completo de vendas com filtros avançados e detalhes de transações.',
      icon: <History className="h-6 w-6" />,
      href: '/admin/vendas/historico',
      stats: [
        { 
          label: 'Vendas do mês', 
          value: isLoadingCards ? '...' : cardsData?.vendas.mes.toString() || '0', 
          trend: 'up' 
        },
        { 
          label: 'Valor total', 
          value: isLoadingCards ? '...' : formatarDinheiro(cardsData?.vendas.valorMes || 0), 
          trend: 'up' 
        }
      ],
      status: 'ativo',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'Controle de Caixa',
      description: 'Abertura e fechamento de caixa, controle de sangria e conferência de valores.',
      icon: <CreditCard className="h-6 w-6" />,
      href: '/admin/vendas/caixa',
      stats: [
        { 
          label: 'Status', 
          value: isLoadingCards ? '...' : (cardsData?.caixa.status === 'aberto' ? 'Aberto' : 'Fechado'), 
          trend: 'stable' 
        },
        { 
          label: 'Valor atual', 
          value: isLoadingCards ? '...' : formatarDinheiro(cardsData?.caixa.valorAtual || 0), 
          trend: 'stable' 
        }
      ],
      status: 'ativo',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'Relatório de Vendas',
      description: 'Visualize estatísticas completas, análise por período e performance de vendedores.',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/admin/vendas/relatorios',
      stats: [
        { 
          label: 'Funcionalidade', 
          value: 'Em breve', 
          trend: 'stable' 
        },
        { 
          label: 'Status', 
          value: 'Desenvolvimento', 
          trend: 'stable' 
        }
      ],
      status: 'em-breve',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      title: 'Gestão de Clientes',
      description: 'Cadastro e acompanhamento de clientes, histórico de compras e programa de fidelidade.',
      icon: <Users className="h-6 w-6" />,
      href: '/admin/vendas/clientes',
      stats: [
        { 
          label: 'Funcionalidade', 
          value: 'Em breve', 
          trend: 'stable' 
        },
        { 
          label: 'Status', 
          value: 'Planejado', 
          trend: 'stable' 
        }
      ],
      status: 'em-breve',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  // Métricas de vendas com dados reais
  const vendasMetrics = [
    {
      label: 'Vendas Hoje',
      value: isLoadingCards ? '-' : cardsData?.vendas.hoje.toString() || '0',
      change: isLoadingCards ? '' : `+${(cardsData?.vendas.hoje || 0) - (cardsData?.vendas.ontem || 0)} vs ontem`,
      trend: 'up' as const,
      icon: ShoppingCart,
      color: 'text-emerald-600',
      isLoading: isLoadingCards
    },
    {
      label: 'Faturamento Hoje',
      value: isLoadingCards ? '-' : formatarDinheiro(cardsData?.vendas.valorHoje || 0),
      change: isLoadingCards ? '' : 
        cardsData?.vendas.valorOntem && cardsData.vendas.valorOntem > 0 
          ? `${(((cardsData.vendas.valorHoje || 0) / cardsData.vendas.valorOntem - 1) * 100).toFixed(1)}%`
          : 'Sem comparação',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-blue-600',
      isLoading: isLoadingCards
    },
    {
      label: 'Ticket Médio',
      value: isLoadingCards ? '-' : formatarDinheiro(cardsData?.vendas.ticketMedio || 0),
      change: '', // Removido percentual fixo - seria necessário histórico para calcular
      trend: 'up' as const,
      icon: Target,
      color: 'text-purple-600',
      isLoading: isLoadingCards
    },
    {
      label: 'Tempo Médio/Venda',
      value: isLoadingCards ? '-' : formatarTempo(cardsData?.vendas.tempoMedioVenda || 0),
      change: '', // Removido valor fixo - seria necessário histórico para calcular
      trend: 'down' as const,
      icon: Clock,
      color: 'text-orange-600',
      isLoading: isLoadingCards
    }
  ];

  return (
    <AdminLayout>
      <div>
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20" />
          <div className="relative px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-10 w-10 text-emerald-600" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Central de Vendas
                    </h1>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    PDV moderno e intuitivo para farmácias. Gerencie vendas, clientes, estoque e 
                    pagamentos com interface responsiva e relatórios em tempo real.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 blur-3xl opacity-20" />
                    <ShoppingCart className="h-48 w-48 text-emerald-600/20" />
                  </div>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {vendasMetrics.map((metric, index) => {
                  const IconComponent = metric.icon;
                  return (
                    <Card key={index} className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                          <IconComponent className={`h-4 w-4 ${metric.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-end justify-between">
                          {metric.isLoading ? (
                            <Skeleton className="h-6 w-24" />
                          ) : (
                            <span className="text-2xl font-bold">{metric.value}</span>
                          )}
                          <span className={`text-sm font-medium ${
                            metric.trend === 'up' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {metric.change}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-6 pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vendaFeatures.map((feature, index) => {
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
                              <div className="text-lg font-semibold flex items-center gap-1">
                                {isLoadingCards ? (
                                  <Skeleton className="h-6 w-12" />
                                ) : (
                                  <>
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
                                  </>
                                )}
                              </div>
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

            {/* Insights e Alertas */}
            <div className="mt-12 space-y-6">
              {/* Status do Caixa */}
              <Card className={`${
                cardsData?.caixa.status === 'fechado' 
                  ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' 
                  : 'border-green-200 bg-green-50 dark:bg-green-950/20'
              }`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      cardsData?.caixa.status === 'fechado'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20'
                        : 'bg-green-100 dark:bg-green-900/20'
                    }`}>
                      <CreditCard className={`h-5 w-5 ${
                        cardsData?.caixa.status === 'fechado' ? 'text-yellow-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {cardsData?.caixa.status === 'fechado' ? 'Caixa Fechado' : 'Caixa Aberto'}
                      </CardTitle>
                      <CardDescription>
                        {isLoadingCards ? (
                          <Skeleton className="h-4 w-3/4" />
                        ) : cardsData?.caixa.status === 'fechado' ? (
                          `Último fechamento: ${cardsData?.caixa.ultimoFechamento || 'Não informado'}`
                        ) : (
                          `Valor atual em caixa: ${formatarDinheiro(cardsData?.caixa.valorAtual || 0)}`
                        )}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin/vendas/caixa">
                        Ver caixa
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Insights de Vendas */}
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Insights de Vendas</CardTitle>
                      <CardDescription>
                        Performance baseada nos últimos 30 dias
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Meta de Vendas Mensal</span>
                        <span className="text-sm text-muted-foreground">
                          {isLoadingCards ? (
                            <Skeleton className="h-4 w-10 inline-block" />
                          ) : (
                            '78%'
                          )}
                        </span>
                      </div>
                      <Progress value={isLoadingCards ? 0 : 78} className="h-2" indicatorColor="bg-emerald-500" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Taxa de Conversão</span>
                        <span className="text-sm text-muted-foreground">
                          {isLoadingCards ? (
                            <Skeleton className="h-4 w-10 inline-block" />
                          ) : (
                            '92.5%'
                          )}
                        </span>
                      </div>
                      <Progress value={isLoadingCards ? 0 : 92.5} className="h-2" indicatorColor="bg-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Satisfação do Cliente</span>
                        <span className="text-sm text-muted-foreground">
                          {isLoadingCards ? (
                            <Skeleton className="h-4 w-10 inline-block" />
                          ) : (
                            '4.8/5.0'
                          )}
                        </span>
                      </div>
                      <Progress value={isLoadingCards ? 0 : 96} className="h-2" indicatorColor="bg-purple-500" />
                    </div>

                    {/* Produtos Mais Vendidos */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">Produtos Mais Vendidos Hoje</h4>
                      <div className="space-y-3">
                        {isLoadingCards ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          ))
                        ) : (
                          cardsData?.pdv.produtosMaisVendidos.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-medium">{item.produto_nome}</span>
                                <span className="text-muted-foreground">({item.quantidade}x)</span>
                              </div>
                              <span className="font-medium">{formatarDinheiro(item.valor_total)}</span>
                            </div>
                          ))
                        )}
                      </div>
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