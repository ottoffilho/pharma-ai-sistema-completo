import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Package, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Truck,
  Receipt,
  ClipboardList,
  FileSearch,
  ArrowRight,
  Calendar,
  BarChart3,
  TrendingUp,
  CreditCard,
  User,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PedidoFeatureCard {
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

const pedidoFeatures: PedidoFeatureCard[] = [
  {
    title: 'Listagem de Pedidos',
    description: 'Visualize todos os pedidos da farmácia, com filtros avançados e acompanhamento de status atual.',
    icon: <ClipboardList className="h-6 w-6" />,
    href: '/admin/pedidos/listar',
    stats: [],
    status: 'ativo',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Nova Receita',
    description: 'Cadastre novas receitas com processamento inteligente via IA para extração automática de dados.',
    icon: <FileSearch className="h-6 w-6" />,
    href: '/admin/pedidos/nova-receita',
    stats: [
      { label: 'Sistema IA', value: 'Ativo', trend: 'stable' },
      { label: 'Status', value: 'Disponível', trend: 'stable' }
    ],
    status: 'ativo',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    title: 'Acompanhamento de Produção',
    description: 'Acompanhe o status de produção dos pedidos em tempo real e gerencie o fluxo de trabalho.',
    icon: <Package className="h-6 w-6" />,
    href: '/admin/producao/overview',
    stats: [],
    status: 'ativo',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Atendimento WhatsApp',
    description: 'Central de atendimento integrada com WhatsApp. Gerencie conversas, templates e automação com IA.',
    icon: <MessageCircle className="h-6 w-6" />,
    href: '/admin/whatsapp',
    stats: [
      { label: 'Conversas ativas', value: '12', trend: 'up' },
      { label: 'IA integrada', value: 'Ativo', trend: 'stable' }
    ],
    status: 'ativo',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Entrega e Rastreamento',
    description: 'Gerencie entregas, imprima etiquetas e acompanhe o status de envio dos pedidos.',
    icon: <Truck className="h-6 w-6" />,
    href: '/admin/pedidos/entregas',
    stats: [
      { label: 'Funcionalidade', value: 'Em breve', trend: 'stable' },
      { label: 'Status', value: 'Desenvolvimento', trend: 'stable' }
    ],
    status: 'em-breve',
    gradient: 'from-orange-500 to-red-500'
  }
];

export default function PedidosOverview() {
  // Query para buscar dados reais de pedidos
  const { data: pedidosCount, isLoading: pedidosLoading } = useQuery({
    queryKey: ['pedidosCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw new Error(error.message);
      return count || 0;
    }
  });

  // Query para buscar dados reais de receitas processadas
  const { data: receitasCount, isLoading: receitasLoading } = useQuery({
    queryKey: ['receitasProcessadasCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('receitas_processadas')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw new Error(error.message);
      return count || 0;
    }
  });

  // Query para buscar principais clientes
  const { data: principaisClientes, isLoading: clientesLoading } = useQuery({
    queryKey: ['principaisClientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          cliente_nome,
          count(*) as total_pedidos
        `)
        .not('cliente_nome', 'is', null)
        .group('cliente_nome')
        .order('count', { ascending: false })
        .limit(3);
      
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  // Query para buscar manipulações populares
  const { data: manipulacoesPopulares, isLoading: manipulacoesLoading } = useQuery({
    queryKey: ['manipulacoesPopulares'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receitas_processadas')
        .select(`
          tipo_manipulacao,
          count(*) as total
        `)
        .not('tipo_manipulacao', 'is', null)
        .group('tipo_manipulacao')
        .order('count', { ascending: false })
        .limit(3);
      
      if (error) throw new Error(error.message);
      
      // Calcular percentuais
      const total = data?.reduce((sum, item) => sum + item.total, 0) || 1;
      return data?.map(item => ({
        name: item.tipo_manipulacao,
        percent: Math.round((item.total / total) * 100)
      })) || [];
    }
  });

  // Query para buscar status dos pedidos
  const { data: statusPedidos, isLoading: statusLoading } = useQuery({
    queryKey: ['statusPedidos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          status,
          count(*) as total
        `)
        .group('status')
        .order('count', { ascending: false });
      
      if (error) throw new Error(error.message);
      
      // Mapear status para nomes mais amigáveis
      const statusMap: Record<string, { label: string, color: string }> = {
        'em_producao': { label: 'Em Produção', color: 'text-blue-500 bg-blue-100' },
        'pronto_entrega': { label: 'Pronto para Entrega', color: 'text-green-500 bg-green-100' },
        'aguardando_aprovacao': { label: 'Aguardando Aprovação', color: 'text-amber-500 bg-amber-100' },
        'cancelado': { label: 'Cancelados', color: 'text-red-500 bg-red-100' },
        'pendente': { label: 'Pendente', color: 'text-orange-500 bg-orange-100' },
        'finalizado': { label: 'Finalizado', color: 'text-green-600 bg-green-100' }
      };
      
      return data?.map(item => ({
        status: statusMap[item.status]?.label || item.status,
        count: item.total,
        color: statusMap[item.status]?.color || 'text-gray-500 bg-gray-100'
      })) || [];
    }
  });

  // Métricas de pedidos com dados reais
  const pedidoMetrics = [
    {
      label: 'Total de Pedidos',
      value: pedidosLoading ? 'Carregando...' : pedidosCount?.toString() || '0',
      change: '',
      trend: 'stable' as const,
      icon: AlertCircle,
      color: 'text-blue-600'
    },
    {
      label: 'Receitas Processadas',
      value: receitasLoading ? 'Carregando...' : receitasCount?.toString() || '0',
      change: '',
      trend: 'stable' as const,
      icon: Receipt,
      color: 'text-green-600'
    },
    {
      label: 'Sistema IA',
      value: 'Operacional',
      change: 'Disponível',
      trend: 'stable' as const,
      icon: FileSearch,
      color: 'text-purple-600'
    },
    {
      label: 'Status Sistema',
      value: 'Online',
      change: 'Ativo',
      trend: 'stable' as const,
      icon: Calendar,
      color: 'text-emerald-600'
    }
  ];

  // Atualizar stats dos features com dados reais quando disponíveis
  const updatedPedidoFeatures = pedidoFeatures.map(feature => {
    if (feature.title === 'Listagem de Pedidos') {
      return {
        ...feature,
        stats: [
          { label: 'Total de pedidos', value: pedidosLoading ? '...' : pedidosCount?.toString() || '0', trend: 'stable' },
          { label: 'Status', value: 'Ativo', trend: 'stable' }
        ]
      };
    }
    if (feature.title === 'Acompanhamento de Produção') {
      return {
        ...feature,
        stats: [
          { label: 'Módulo', value: 'Disponível', trend: 'stable' },
          { label: 'Funcionalidades', value: 'Ativas', trend: 'stable' }
        ]
      };
    }
    return feature;
  });

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
                    <FileText className="h-10 w-10 text-emerald-600" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Central de Pedidos
                    </h1>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    Gerencie todos os pedidos e receitas em um único lugar. Desde o processamento da receita 
                    até a entrega, com rastreabilidade completa e insights detalhados.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 blur-3xl opacity-20" />
                    <FileText className="h-48 w-48 text-emerald-600/20" />
                  </div>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {pedidoMetrics.map((metric, index) => {
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
                          <span className="text-2xl font-bold">{metric.value}</span>
                          <span className={`text-sm font-medium ${
                            metric.trend === 'up' && metric.label === 'Pedidos Pendentes' ? 'text-amber-600' :
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {updatedPedidoFeatures.map((feature, index) => {
                const CardContentWrapper = (
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
                                    stat.trend === 'down' ? 'text-blue-500' : 
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

                // Se feature está ativa, tornar todo card clicável
                if (feature.status !== 'em-breve') {
                  return (
                    <Link to={feature.href} className="block" key={index}>
                      {CardContentWrapper}
                    </Link>
                  );
                }

                return CardContentWrapper;
              })}
            </div>

            {/* Seção Adicional - Estatísticas */}
            <div className="mt-12">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Insights de Pedidos</h2>
                    <p className="text-muted-foreground">Estatísticas e tendências do seu fluxo de pedidos</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Principais Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {clientesLoading ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-emerald-500" />
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                              </div>
                              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          ))
                        ) : principaisClientes && principaisClientes.length > 0 ? (
                          principaisClientes.map((cliente, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-medium">{cliente.cliente_nome}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {cliente.total_pedidos} pedidos
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Manipulações Populares</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {manipulacoesLoading ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                              </div>
                              <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          ))
                        ) : manipulacoesPopulares && manipulacoesPopulares.length > 0 ? (
                          manipulacoesPopulares.map((item, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{item.name}</span>
                                <span className="text-xs font-medium">{item.percent}%</span>
                              </div>
                              <Progress value={item.percent} className="h-1.5" />
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Status dos Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {statusLoading ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          ))
                        ) : statusPedidos && statusPedidos.length > 0 ? (
                          statusPedidos.map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm">{item.status}</span>
                              <Badge className={`${item.color} border-0`}>
                                {item.count}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
