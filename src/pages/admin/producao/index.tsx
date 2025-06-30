import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  PlayCircle,
  CheckCircle,
  Package,
  XCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

interface OrdemProducao {
  id: string;
  numero_ordem: string;
  status: string;
  observacoes_gerais?: string;
  data_criacao: string;
  data_finalizacao?: string;
  prioridade: string;
  receita_id?: string;
  usuario_responsavel_id?: string;
  farmaceutico_responsavel_id?: string;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  'pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'em_preparacao': 'bg-blue-100 text-blue-800 border-blue-200',
  'em_manipulacao': 'bg-purple-100 text-purple-800 border-purple-200',
  'controle_qualidade': 'bg-orange-100 text-orange-800 border-orange-200',
  'finalizada': 'bg-green-100 text-green-800 border-green-200',
  'cancelada': 'bg-red-100 text-red-800 border-red-200'
};

const statusIcons = {
  'pendente': Clock,
  'em_preparacao': PlayCircle,
  'em_manipulacao': PlayCircle,
  'controle_qualidade': CheckCircle,
  'finalizada': Package,
  'cancelada': XCircle
};

const ProducaoPage: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [termoBusca, setTermoBusca] = useState('');
  const [stats, setStats] = useState({
    pendentes: 0,
    em_producao: 0,
    prontas: 0,
    entregues_hoje: 0
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrdens();
    loadStats();
  }, [filtroStatus]);

  const loadOrdens = async () => {
    try {
      setLoading(true);
      
      // Usar cliente Supabase diretamente
      let query = supabase
        .from('ordens_producao')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtroStatus) {
        query = query.eq('status', filtroStatus);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      setOrdens(data || []);

    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      toast({
        title: "Erro ao carregar ordens",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('ordens_producao')
        .select('*');

      if (error) {
        console.warn('Erro ao carregar estatísticas:', error);
        return;
      }

      const hoje = new Date().toISOString().split('T')[0];

      setStats({
        pendentes: orders?.filter((o: any) => o.status === 'pendente').length || 0,
        em_producao: orders?.filter((o: any) => o.status === 'em_manipulacao').length || 0,
        prontas: orders?.filter((o: any) => o.status === 'controle_qualidade').length || 0,
        entregues_hoje: orders?.filter((o: any) => 
          o.status === 'finalizada' && 
          o.data_finalizacao?.startsWith(hoje)
        ).length || 0
      });

    } catch (error) {
      console.warn('Erro ao carregar estatísticas:', error);
    }
  };

  const handleUpdateStatus = async (ordemId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('ordens_producao')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString(),
          ...(novoStatus === 'finalizada' ? { data_finalizacao: new Date().toISOString() } : {})
        })
        .eq('id', ordemId);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Status atualizado",
        description: `Ordem alterada para ${novoStatus}`,
      });
      
      // Recarregar dados
      loadOrdens();
      loadStats();

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const ordensFiltered = ordens.filter(ordem => {
    const matchesBusca = !termoBusca || 
      ordem.numero_ordem.toLowerCase().includes(termoBusca.toLowerCase()) ||
      ordem.observacoes_gerais?.toLowerCase().includes(termoBusca.toLowerCase());
    
    return matchesBusca;
  });

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Gestão de Produção
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie ordens de produção de medicamentos manipulados
            </p>
          </div>
          
          <Button asChild className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
            <Link to="/admin/producao/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Ordem
            </Link>
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
              <p className="text-xs text-muted-foreground">Aguardando produção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Produção</CardTitle>
              <PlayCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.em_producao}</div>
              <p className="text-xs text-muted-foreground">Sendo manipuladas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prontas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.prontas}</div>
              <p className="text-xs text-muted-foreground">Aguardando retirada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregues Hoje</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.entregues_hoje}</div>
              <p className="text-xs text-muted-foreground">Finalizadas hoje</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardHeader>
            <CardTitle>Ordens de Produção</CardTitle>
            <CardDescription>
              Lista de todas as ordens de produção do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por número da ordem ou observações..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value === 'todos' ? '' : value)}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
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
            </div>

            {/* Tabela de Ordens */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Receita/Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Data Conclusão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando ordens...
                      </TableCell>
                    </TableRow>
                  ) : ordensFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Nenhuma ordem encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    ordensFiltered.map((ordem) => (
                      <TableRow key={ordem.id}>
                        <TableCell className="font-medium">
                          {ordem.numero_ordem}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ordem.receita_id ? `Receita ${ordem.receita_id.slice(0, 8)}` : 'Não informado'}</div>
                            {ordem.usuario_responsavel_id && (
                              <div className="text-sm text-gray-500">Responsável: {ordem.usuario_responsavel_id.slice(0, 8)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={statusColors[ordem.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(ordem.status)}
                              {ordem.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ordem.prioridade}</div>
                            {ordem.observacoes_gerais && (
                              <div className="text-sm text-gray-500 truncate max-w-[150px]">{ordem.observacoes_gerais}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(ordem.data_criacao)}
                        </TableCell>
                        <TableCell>
                          {formatDate(ordem.data_finalizacao)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/producao/${ordem.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              
                              {ordem.status === 'pendente' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(ordem.id, 'em_preparacao')}>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Iniciar Preparação
                                </DropdownMenuItem>
                              )}
                              
                              {ordem.status === 'em_preparacao' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(ordem.id, 'em_manipulacao')}>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Iniciar Manipulação
                                </DropdownMenuItem>
                              )}
                              
                              {ordem.status === 'em_manipulacao' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(ordem.id, 'controle_qualidade')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Enviar para Controle
                                </DropdownMenuItem>
                              )}
                              
                              {ordem.status === 'controle_qualidade' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(ordem.id, 'finalizada')}>
                                  <Package className="h-4 w-4 mr-2" />
                                  Finalizar Ordem
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                onClick={() => navigate(`/admin/producao/${ordem.id}/editar`)}
                                disabled={ordem.status === 'finalizada' || ordem.status === 'cancelada'}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              
                              {(ordem.status === 'pendente' || ordem.status === 'em_preparacao' || ordem.status === 'em_manipulacao') && (
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateStatus(ordem.id, 'cancelada')}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ProducaoPage; 