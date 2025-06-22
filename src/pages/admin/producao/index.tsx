import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  BarChart3, 
  DatabaseIcon, 
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
  MoreHorizontal,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Target
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';

// Definindo interface para OrdemProducao
interface OrdemProducao {
  id: string;
  numero_ordem: string;
  status: string;
  prioridade: string;
  receita_id?: string;
  usuario_responsavel_id?: string;
  farmaceutico_responsavel_id?: string;
  data_criacao: string;
  is_deleted: boolean;
  observacoes_gerais?: string;
  receitas_processadas?: {
    id: string;
    patient_name?: string;
    prescriber_name?: string;
  };
  usuarios_internos?: {
    id: string;
    nome: string;
    email: string;
  };
  farmaceutico?: {
    id: string;
    nome: string;
    crm?: string;
  };
}

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  em_preparacao: { label: 'Em Preparação', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  em_manipulacao: { label: 'Em Manipulação', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Activity },
  controle_qualidade: { label: 'Controle de Qualidade', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle },
  finalizada: { label: 'Finalizada', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800 border-red-200' },
};

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

// ===== MÉTRICAS DINÂMICAS =====
interface ProductionMetrics {
  ordersToday: number;
  ordersInProgress: number;
  ordersCompletedToday: number;
  totalOrders: number;
}

const useProductionMetrics = () => {
  return useQuery<ProductionMetrics>({
    queryKey: ['production-metrics'],
    queryFn: async () => {
      // Fall-back para zero caso tabela ainda não exista
      try {
        const today = new Date().toISOString().slice(0, 10); // yyyy-MM-dd

        // Pedidos criados hoje
        const { count: ordersToday } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00+00`) // desde início do dia UTC
          .lte('created_at', `${today}T23:59:59+00`);

        // Ordens de produção em andamento
        const { count: ordersInProgress } = await supabase
          .from('ordens_producao')
          .select('*', { count: 'exact', head: true })
          .in('status', ['em_preparacao', 'em_manipulacao', 'controle_qualidade']);

        // Ordens finalizadas hoje
        const { count: ordersCompletedToday } = await supabase
          .from('ordens_producao')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'finalizada')
          .gte('updated_at', `${today}T00:00:00+00`)
          .lte('updated_at', `${today}T23:59:59+00`);

        // Total de ordens de produção
        const { count: totalOrders } = await supabase
          .from('ordens_producao')
          .select('*', { count: 'exact', head: true });

        return {
          ordersToday: ordersToday ?? 0,
          ordersInProgress: ordersInProgress ?? 0,
          ordersCompletedToday: ordersCompletedToday ?? 0,
          totalOrders: totalOrders ?? 0
        };
      } catch (err) {
        console.error('Erro ao buscar métricas de produção', err);
        return { ordersToday: 0, ordersInProgress: 0, ordersCompletedToday: 0, totalOrders: 0 };
      }
    }
  });
};

// Recente produção – pode ser expandido futuramente
const useRecentProduction = () => {
  return useQuery<any[]>({
    queryKey: ['production-recent'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('ordens_producao')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Erro ao buscar produção recente', err);
        return [];
      }
    }
  });
};

export default function OrdensProducaoPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('todas');
  const { toast } = useToast();

  // Métricas gerais de produção
  const { data: metrics, isLoading: metricsLoading } = useProductionMetrics();
  const { data: recentProduction } = useRecentProduction();

  const { data: ordens, isLoading, error, refetch } = useQuery<OrdemProducao[]>({
    queryKey: ['ordens-producao', searchTerm, statusFilter, prioridadeFilter],
    queryFn: async () => {
      try {
        // @ts-expect-error - Tabela não definida nos tipos do Supabase
        let query = supabase
          .from('ordens_producao' as const)
          .select(`
            *,
            receita_id,
            usuario_responsavel_id,
            farmaceutico_responsavel_id
          `)
          .eq('is_deleted', false)
          .order('data_criacao', { ascending: false });

        if (searchTerm) {
          query = query.or(`numero_ordem.ilike.%${searchTerm}%,observacoes_gerais.ilike.%${searchTerm}%`);
        }

        if (statusFilter && statusFilter !== 'todos') {
          query = query.eq('status', statusFilter);
        }

        if (prioridadeFilter && prioridadeFilter !== 'todas') {
          query = query.eq('prioridade', prioridadeFilter);
        }

        const { data: ordensData, error: ordensError } = await query;

        if (ordensError) {
          if (ordensError.code === '42P01') {
            return [];
          }
          throw ordensError;
        }

        return ordensData || [];
      } catch (error: unknown) {
        if ((error as { code?: string })?.code === '42P01') {
          console.log('Tabela ordens_producao não existe ainda');
          return [];
        }
        throw error;
      }
    },
    retry: 1,
  });

  // Calcular métricas
  const totalOrdens = ordens?.length || 0;
  const ordensPendentes = ordens?.filter(o => o.status === 'pendente').length || 0;
  const ordensEmAndamento = ordens?.filter(o => ['em_preparacao', 'em_manipulacao'].includes(o.status)).length || 0;
  const ordensFinalizadas = ordens?.filter(o => o.status === 'finalizada').length || 0;
  const ordensUrgentes = ordens?.filter(o => o.prioridade === 'urgente').length || 0;

  const handleDeleteOrdem = async (id: string) => {
    try {
      // @ts-expect-error - Tabela não definida nos tipos do Supabase
      const { error } = await supabase
        .from('ordens_producao' as const)
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Ordem excluída",
        description: "A ordem de produção foi excluída com sucesso.",
        variant: "default",
      });

      refetch();
    } catch (error: unknown) {
      console.error('Erro ao excluir ordem:', error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao excluir a ordem.";
      toast({
        title: "Erro ao excluir",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleNewOrdem = () => {
    navigate('/admin/producao/nova');
  };

  const handleViewOrdem = (id: string) => {
    navigate(`/admin/producao/detalhes/${id}`);
  };

  const handleEditOrdem = (id: string) => {
    navigate(`/admin/producao/editar/${id}`);
  };

  // Checar se o erro é específico sobre tabela não existir
  const isTableNotExistError = error && (error as { code?: string })?.code === '42P01';

  if (isTableNotExistError) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <CardTitle>Tabela não encontrada</CardTitle>
              <CardDescription>
                A tabela de ordens de produção ainda não foi criada no banco de dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-blue-950/20" />
          <div className="relative px-6 py-12">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                    <FlaskConical className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Central de Produção
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Gerencie todo o ciclo de manipulação com controle total
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 blur-3xl opacity-20" />
                  <Beaker className="h-32 w-32 text-purple-600/20" />
                </div>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm dark:bg-slate-800/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total de Ordens</p>
                      <p className="text-2xl font-bold">{totalOrdens}</p>
                    </div>
                    <ClipboardCheck className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm dark:bg-slate-800/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Em Andamento</p>
                      <p className="text-2xl font-bold text-blue-600">{ordensEmAndamento}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm dark:bg-slate-800/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-600">{ordensPendentes}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm dark:bg-slate-800/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Urgentes</p>
                      <p className="text-2xl font-bold text-red-600">{ordensUrgentes}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Controles e Filtros */}
        <div className="px-6">
          <Card className="border-0 shadow-sm dark:bg-slate-800/60">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar ordens..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white dark:bg-slate-800/60 dark:text-white border-gray-300 dark:border-slate-700 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_preparacao">Em Preparação</SelectItem>
                      <SelectItem value="em_manipulacao">Em Manipulação</SelectItem>
                      <SelectItem value="controle_qualidade">Controle de Qualidade</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as prioridades</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button onClick={handleNewOrdem} className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Ordem
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Ordens */}
        <div className="px-6">
          <Card className="border-0 shadow-sm dark:bg-slate-800/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-purple-600" />
                    Ordens de Produção
                  </CardTitle>
                  <CardDescription>
                    {ordens?.length || 0} ordem(ns) encontrada(s)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  {ordens?.length || 0} itens
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(5).fill(null).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error && !isTableNotExistError ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar ordens</h3>
                  <p className="text-muted-foreground mb-4">{(error as Error)?.message || 'Tente novamente mais tarde'}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : !ordens || ordens.length === 0 ? (
                <div className="text-center py-12">
                  <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma ordem encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter || prioridadeFilter 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando sua primeira ordem de produção'
                    }
                  </p>
                  <Button onClick={handleNewOrdem} className="bg-gradient-to-r from-purple-500 to-indigo-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Ordem
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ordem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordens.map((ordem) => {
                        const statusInfo = statusConfig[ordem.status as keyof typeof statusConfig];
                        const prioridadeInfo = prioridadeConfig[ordem.prioridade as keyof typeof prioridadeConfig];
                        const StatusIcon = statusInfo?.icon || Clock;

                        return (
                          <TableRow key={ordem.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100">
                                  <FlaskConical className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-medium">#{ordem.numero_ordem}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {ordem.observacoes_gerais ? 'Com observações' : 'Ordem padrão'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={statusInfo?.color || 'bg-gray-100 text-gray-800 border-gray-200'}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo?.label || ordem.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={prioridadeInfo?.color || 'bg-gray-100 text-gray-800 border-gray-200'}
                              >
                                {prioridadeInfo?.label || ordem.prioridade}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(ordem.data_criacao)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {ordem.usuarios_internos?.nome || 'Não atribuído'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewOrdem(ordem.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditOrdem(ordem.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteOrdem(ordem.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cards de Funcionalidades */}
        <div className="px-6">
          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-purple-900 dark:text-purple-100">Funcionalidades Avançadas</CardTitle>
                  <CardDescription className="text-purple-700 dark:text-purple-300">
                    Explore todas as ferramentas de produção disponíveis
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link to="/admin/producao/controle-qualidade" className="block">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-red-100">
                          <Microscope className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Controle de Qualidade</h4>
                          <p className="text-sm text-muted-foreground">Validações e testes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/admin/producao/relatorios" className="block">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Relatórios</h4>
                          <p className="text-sm text-muted-foreground">Análises e métricas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/admin/producao/overview" className="block">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-teal-100">
                          <Activity className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Visão Geral</h4>
                          <p className="text-sm text-muted-foreground">Dashboard completo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
} 