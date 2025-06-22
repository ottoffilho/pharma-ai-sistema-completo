import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Database, 
  Building2, 
  UserRound, 
  Building, 
  Truck,
  SquareStack,
  FileText,
  PlusSquare,
  Search,
  ArrowRight,
  Blocks,
  Layers,
  Users,
  ShieldCheck,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CadastroFeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  count: {
    label: string;
    value: number;
  };
  status: 'ativo' | 'em-breve' | 'beta';
  gradient: string;
}

export default function CadastrosOverview() {
  // Contagens dinâmicas --------------------------------------------------
  const { data: fornecedoresCount } = useQuery({
    queryKey: ['fornecedoresCount'],
    queryFn: async () => {
      const { count } = await supabase
        .from('fornecedores')
        .select('*', { head: true, count: 'exact' });
      return count || 0;
    }
  });

  const { data: clientesCount } = useQuery({
    queryKey: ['clientesCount'],
    queryFn: async () => {
      const { count } = await supabase
        .from('clientes')
        .select('*', { head: true, count: 'exact' });
      return count || 0;
    }
  });

  const { data: produtosCount } = useQuery({
    queryKey: ['produtosCount'],
    queryFn: async () => {
      // produtos unificados
      const { count } = await supabase
        .from('produtos')
        .select('*', { head: true, count: 'exact' })
        .eq('is_deleted', false);
      return count || 0;
    }
  });

  const { data: embalagensCount } = useQuery({
    queryKey: ['embalagensCount'],
    queryFn: async () => {
      const { count } = await supabase
        .from('embalagens')
        .select('*', { head: true, count: 'exact' })
        .eq('is_deleted', false);
      return count || 0;
    }
  });

  const cadastroFeatures: CadastroFeatureCard[] = [
    {
      title: 'Fornecedores',
      description: 'Gerencie informações completas de fornecedores, contatos e histórico de compras.',
      icon: <Building2 className="h-6 w-6" />,
      href: '/admin/cadastros/fornecedores',
      count: {
        label: 'Fornecedores cadastrados',
        value: fornecedoresCount ?? 0,
      },
      status: 'ativo',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'Clientes',
      description: 'Clientes e histórico de compras.',
      icon: <UserRound className="h-6 w-6" />,
      href: '/admin/clientes',
      count: {
        label: 'Clientes ativos',
        value: clientesCount ?? 0,
      },
      status: 'ativo',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Produtos & Insumos',
      description: 'Cadastro unificado de produtos, insumos e matérias-primas.',
      icon: <SquareStack className="h-6 w-6" />,
      href: '/admin/estoque/produtos',
      count: {
        label: 'Itens ativos',
        value: produtosCount ?? 0,
      },
      status: 'ativo',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      title: 'Embalagens',
      description: 'Gerencie frascos, potes, caixas e demais embalagens.',
      icon: <Package className="h-6 w-6" />,
      href: '/admin/estoque/embalagens',
      count: {
        label: 'Embalagens cadastradas',
        value: embalagensCount ?? 0,
      },
      status: 'ativo',
      gradient: 'from-teal-500 to-cyan-500'
    },
    {
      title: 'Médicos',
      description: 'Base de prescritores (coming soon).',
      icon: <Users className="h-6 w-6" />,
      href: '/admin/cadastros/medicos',
      count: { label: 'Médicos cadastrados', value: 0 },
      status: 'em-breve',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'Transportadoras',
      description: 'Cadastro de transportadoras (coming soon).',
      icon: <Truck className="h-6 w-6" />,
      href: '/admin/cadastros/transportadoras',
      count: { label: 'Transportadoras ativas', value: 0 },
      status: 'em-breve',
      gradient: 'from-green-500 to-teal-500'
    },
  ];

  // Estatísticas dos cadastros
  const cadastroStats = [
    { 
      label: 'Total de Registros', 
      value: '2.847', 
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      change: 'Registros no sistema'
    },
    { 
      label: 'Funcionalidades Ativas', 
      value: '100%', 
      icon: <PlusSquare className="h-5 w-5 text-green-500" />,
      change: 'Sistema operacional' 
    },
    { 
      label: 'Integridade de Dados', 
      value: 'Garantida', 
      icon: <ShieldCheck className="h-5 w-5 text-purple-500" />,
      change: 'Validação automática'
    }
  ];

  return (
    <AdminLayout>
      <div>
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 dark:from-indigo-950/20 dark:via-blue-950/20 dark:to-sky-950/20" />
          <div className="relative px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <Database className="h-10 w-10 text-indigo-600" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      Central de Cadastros
                    </h1>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    Gerencie todos os dados cadastrais da sua farmácia em um só lugar, 
                    com interfaces intuitivas e integração completa com todos os módulos do sistema.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                    {cadastroStats.map((stat, index) => (
                      <div key={index} className="flex flex-col p-4 bg-white dark:bg-slate-900/60 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          {stat.icon}
                          <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                        </div>
                        <span className="text-2xl font-bold">{stat.value}</span>
                        <span className="text-xs text-muted-foreground mt-1">{stat.change}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-blue-400 blur-3xl opacity-20" />
                    <Database className="h-48 w-48 text-indigo-600/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-6 pb-16">
          <div className="mx-auto max-w-7xl">
            <Tabs defaultValue="active" className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Cadastros do Sistema</h2>
                <TabsList>
                  <TabsTrigger value="active">Ativos</TabsTrigger>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="active" className="mt-0">
                <div className="grid gap-6 md:grid-cols-2">
                  {cadastroFeatures.filter(f => f.status === 'ativo').map((feature, index) => (
                    <CadastroCard key={index} feature={feature} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="all" className="mt-0">
                <div className="grid gap-6 md:grid-cols-2">
                  {cadastroFeatures.map((feature, index) => (
                    <CadastroCard key={index} feature={feature} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Importação em Lote */}
            <div className="mt-12 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Importação em Lote</h3>
                  <p className="text-muted-foreground mb-4">
                    Importe dados em massa através de planilhas Excel ou CSV. O sistema valida 
                    automaticamente os dados, evitando duplicidades e garantindo a integridade 
                    das informações.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button variant="outline" size="sm">
                      Template de Fornecedores
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      Template de Clientes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      Template de Médicos
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Arquitetura de Dados */}
            <div className="mt-8 bg-white dark:bg-slate-900/60 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Blocks className="h-6 w-6 text-indigo-600" />
                <h3 className="text-lg font-semibold">Arquitetura de Dados</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Nosso sistema utiliza uma arquitetura de dados relacional robusta que garante:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-medium">Normalização</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dados normalizados em 3NF para eliminar redundâncias e garantir consistência.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-medium">Segurança</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acesso controlado por perfil de usuário e criptografia em dados sensíveis.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-medium">Pesquisa Avançada</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Índices otimizados para consultas rápidas mesmo com grandes volumes de dados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Componente Card para features de cadastro
function CadastroCard({ feature }: { feature: CadastroFeatureCard }) {
  const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
    feature.status === 'em-breve' ? <>{children}</> : <Link to={feature.href} className="block">{children}</Link>
  );

  return (
    <Wrapper>
      <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
          <div className="mb-6">
            <span className="text-sm text-muted-foreground">{feature.count.label}</span>
            <div className="flex items-center mt-1">
              <span className="text-2xl font-bold mr-2">{feature.count.value.toLocaleString()}</span>
            </div>
          </div>
          {feature.status === 'em-breve' && (
            <Button disabled variant="outline" className="w-full">Em breve</Button>
          )}
        </CardContent>
      </Card>
    </Wrapper>
  );
} 