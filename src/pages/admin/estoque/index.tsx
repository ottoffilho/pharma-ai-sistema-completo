import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Package, 
  FileInput, 
  BarChart3,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  PackageSearch,
  PackagePlus,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useEstoque } from '@/hooks/useEstoque';
import { useEstoqueCards } from '@/hooks/useEstoqueCards';

interface StockFeatureCard {
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

export default function EstoqueOverview() {
  // Utilizamos os hooks personalizados para obter os dados do estoque
  const { 
    estatisticas, 
    giroEstoque, 
    isLoading: isLoadingEstoque, 
    valorTotalFormatado, 
    giroEstoqueFormatado,
    formatarDinheiro
  } = useEstoque();

  // Hook para dados dos cards
  const {
    data: cardsData,
    isLoading: isLoadingCards,
    formatarDinheiro: formatarDinheiroCards,
    formatarTempo
  } = useEstoqueCards();

  const isLoading = isLoadingEstoque || isLoadingCards;

  // Definição dos cards de funcionalidades com dados reais
  const stockFeatures: StockFeatureCard[] = [
    {
      title: 'Gestão de Insumos',
      description: 'Controle completo de matérias-primas, princípios ativos e excipientes com rastreabilidade total.',
      icon: <PackageSearch className="h-6 w-6" />,
      href: '/admin/estoque/insumos',
      stats: [
        { 
          label: 'Insumos cadastrados', 
          value: isLoadingCards ? '...' : cardsData?.insumos.total.toString() || '0', 
          trend: 'up' 
        },
        { 
          label: 'Em estoque mínimo', 
          value: isLoadingCards ? '...' : cardsData?.insumos.estoqueMinimo.toString() || '0', 
          trend: 'down' 
        }
      ],
      status: 'ativo',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'Gestão de Embalagens',
      description: 'Gerenciamento de frascos, potes, rótulos e materiais de embalagem com alertas de reposição.',
      icon: <Package className="h-6 w-6" />,
      href: '/admin/estoque/embalagens',
      stats: [
        { 
          label: 'Tipos de embalagem', 
          value: isLoadingCards ? '...' : cardsData?.embalagens.total.toString() || '0', 
          trend: 'stable' 
        },
        { 
          label: 'Valor em estoque', 
          value: isLoadingCards ? '...' : formatarDinheiroCards(cardsData?.embalagens.valorTotal || 0), 
          trend: 'up' 
        }
      ],
      status: 'ativo',
      gradient: 'from-green-500 to-teal-500'
    },
    {
      title: 'Gestão de Lotes',
      description: 'Registro de novos lotes com validação de documentos, prazos de validade e certificados.',
      icon: <PackagePlus className="h-6 w-6" />,
      href: '/admin/estoque/lotes',
      stats: [
        { 
          label: 'Lotes este mês', 
          value: isLoadingCards ? '...' : cardsData?.lotes.totalMes.toString() || '0', 
          trend: 'up' 
        },
        { 
          label: 'Taxa de aprovação', 
          value: isLoadingCards ? '...' : `${cardsData?.lotes.taxaAprovacao || 0}%`, 
          trend: 'up' 
        }
      ],
      status: 'ativo',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Importação de NF-e',
      description: 'Importação automática de notas fiscais eletrônicas com extração inteligente de dados.',
      icon: <FileSpreadsheet className="h-6 w-6" />,
      href: '/admin/estoque/importacao-nf',
      stats: [
        { 
          label: 'NFs importadas', 
          value: isLoadingCards ? '...' : cardsData?.nfe.totalImportadas.toString() || '0', 
          trend: 'up' 
        },
        { 
          label: 'Tempo médio', 
          value: isLoadingCards ? '...' : formatarTempo(cardsData?.nfe.tempoMedio || 0), 
          trend: 'down' 
        }
      ],
      status: 'ativo',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  // Métricas do estoque com dados reais
  const stockMetrics = [
    {
      label: 'Valor Total em Estoque',
      value: isLoading ? '-' : valorTotalFormatado,
      change: '',
      trend: 'stable' as const,
      icon: BarChart3,
      color: 'text-green-600',
      isLoading
    },
    {
      label: 'Itens em Falta',
      value: isLoading ? '-' : estatisticas?.produtos_estoque_baixo?.toString() || '0',
      change: '',
      trend: 'stable' as const,
      icon: AlertTriangle,
      color: 'text-red-600',
      isLoading
    },
    {
      label: 'Vencendo em 30 dias',
      value: isLoading ? '-' : estatisticas?.produtos_vencimento_proximo?.toString() || '0',
      change: '',
      trend: 'stable' as const,
      icon: Calendar,
      color: 'text-yellow-600',
      isLoading
    },
    {
      label: 'Giro de Estoque',
      value: isLoading ? '-' : giroEstoqueFormatado,
      change: '',
      trend: 'stable' as const,
      icon: TrendingDown,
      color: 'text-blue-600',
      isLoading
    }
  ];

  return (
    <AdminLayout>
      <div>
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20" />
          <div className="relative px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <Box className="h-10 w-10 text-orange-600" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Central de Estoque
                    </h1>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    Gerencie seu inventário com precisão. Controle insumos, embalagens, lotes e validades 
                    em um único lugar, com rastreabilidade completa e alertas inteligentes.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 blur-3xl opacity-20" />
                    <Box className="h-48 w-48 text-orange-600/20" />
                  </div>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {stockMetrics.map((metric, index) => {
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
                            metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
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
              {stockFeatures.map((feature, index) => {
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

            {/* Alertas e Insights */}
            <div className="mt-12 space-y-6">
              {/* Alerta de Validade */}
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Atenção aos Prazos de Validade</CardTitle>
                      <CardDescription>
                        {isLoading ? (
                          <Skeleton className="h-4 w-3/4 inline-block" />
                        ) : (
                          `${estatisticas?.produtos_vencimento_proximo || 0} produtos estão próximos do vencimento (próximos 30 dias)`
                        )}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin/estoque/lotes">
                        Ver produtos
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Insights de Estoque */}
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Insights de Estoque</CardTitle>
                      <CardDescription>
                        Baseado nos últimos 30 dias de movimentação
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Taxa de Ocupação do Estoque</span>
                        <span className="text-sm text-muted-foreground">
                          {isLoading ? (
                            <Skeleton className="h-4 w-10 inline-block" />
                          ) : (
                            '78%'
                          )}
                        </span>
                      </div>
                      <Progress value={isLoading ? 0 : 78} className="h-2" indicatorColor="bg-emerald-500" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Acuracidade do Inventário</span>
                        <span className="text-sm text-muted-foreground">
                          {isLoading ? (
                            <Skeleton className="h-4 w-10 inline-block" />
                          ) : (
                            '96.5%'
                          )}
                        </span>
                      </div>
                      <Progress value={isLoading ? 0 : 96.5} className="h-2" indicatorColor="bg-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Produtos com Giro Lento</span>
                        <span className="text-sm text-muted-foreground">
                          {isLoading ? (
                            <Skeleton className="h-4 w-10 inline-block" />
                          ) : (
                            `${cardsData?.insumos.estoqueMinimo || 0} itens`
                          )}
                        </span>
                      </div>
                      <Progress value={isLoading ? 0 : (cardsData?.insumos.estoqueMinimo || 0)} max={100} className="h-2" indicatorColor="bg-purple-500" />
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