import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  FileSearch, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Activity,
  Sparkles,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/layouts/AdminLayout';

interface AIFeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  benefits: string[];
  status: 'ativo' | 'em-breve' | 'beta';
  gradient: string;
}

const aiFeatures: AIFeatureCard[] = [
  {
    title: 'Assistente IA (Chatbot)',
    description: 'Converse em linguagem natural sobre estoque, vendas, receitas e muito mais.',
    icon: <MessageSquare className="h-6 w-6" />,
    href: '/admin/ia/chatbot',
    benefits: [
      'Responde em tempo real a qualquer dúvida dos gestores',
      'Acessa dados de estoque, vendas e produção',
      'Sugere ações e otimizações automaticamente'
    ],
    status: 'ativo',
    gradient: 'from-yellow-500 to-indigo-500'
  },
  {
    title: 'Processamento de Receitas',
    description: 'Análise automática de receitas médicas com extração inteligente de dados e validação de manipulações.',
    icon: <FileSearch className="h-6 w-6" />,
    href: '/admin/ia/processamento-receitas',
    benefits: [
      'Redução de 80% no tempo de processamento',
      'Detecção automática de incompatibilidades',
      'Sugestões de dosagens otimizadas'
    ],
    status: 'ativo',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Previsão de Demanda',
    description: 'Algoritmos de machine learning para prever demandas futuras e otimizar estoque de insumos.',
    icon: <TrendingUp className="h-6 w-6" />,
    href: '/admin/ia/previsao-demanda',
    benefits: [
      'Redução de 30% em perdas de estoque',
      'Previsões com 95% de precisão',
      'Alertas automáticos de reposição'
    ],
    status: 'ativo',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Otimização de Compras',
    description: 'Sistema inteligente que analisa fornecedores e sugere as melhores opções de compra.',
    icon: <ShoppingCart className="h-6 w-6" />,
    href: '/admin/ia/otimizacao-compras',
    benefits: [
      'Economia média de 15% em compras',
      'Análise comparativa de fornecedores',
      'Negociações automatizadas'
    ],
    status: 'beta',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Análise de Clientes',
    description: 'Insights profundos sobre comportamento e preferências dos clientes para personalização.',
    icon: <Users className="h-6 w-6" />,
    href: '/admin/ia/analise-clientes',
    benefits: [
      'Aumento de 25% na retenção',
      'Recomendações personalizadas',
      'Segmentação automática'
    ],
    status: 'ativo',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    title: 'Monitoramento IA',
    description: 'Dashboard completo para acompanhar o desempenho e métricas de todos os modelos de IA.',
    icon: <Activity className="h-6 w-6" />,
    href: '/admin/ia/monitoramento',
    benefits: [
      'Métricas em tempo real',
      'Alertas de anomalias',
      'Relatórios de performance'
    ],
    status: 'ativo',
    gradient: 'from-indigo-500 to-purple-500'
  }
];

export default function IAOverview() {
  return (
    <AdminLayout>
      <div>
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20" />
          <div className="relative px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-10 w-10 text-purple-600" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Central de Inteligência Artificial
                    </h1>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    Potencialize sua farmácia com IA de última geração. Automatize processos, 
                    tome decisões mais inteligentes e ofereça experiências excepcionais aos seus clientes.
                  </p>
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-medium">6 módulos ativos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium">+45% eficiência</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium">98% precisão</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 blur-3xl opacity-20" />
                    <Brain className="h-48 w-48 text-purple-600/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-6 pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {aiFeatures.map((feature, index) => {
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
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">Benefícios principais:</h4>
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                              <span className="text-sm">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {feature.status === 'em-breve' && (
                        <p className="text-center text-xs text-muted-foreground mt-6">Em breve</p>
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

            {/* Info Section */}
            <div className="mt-12 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Novidades em IA</h3>
                  <p className="text-muted-foreground mb-4">
                    Estamos constantemente aprimorando nossos modelos de IA para oferecer ainda mais valor ao seu negócio. 
                    Em breve, novos recursos como análise preditiva de sazonalidade e otimização automática de preços.
                  </p>
                  <Button variant="outline" size="sm">
                    Ver roadmap completo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 