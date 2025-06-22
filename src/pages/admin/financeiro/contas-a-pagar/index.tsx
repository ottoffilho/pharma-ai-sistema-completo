import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isAfter, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  FilterX,
  Receipt,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  Eye,
  Calendar,
  Building2,
  Banknote,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RegistrarPagamentoContaDialog } from '@/components/financeiro/RegistrarPagamentoContaDialog';
import { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Status badge variant mapping
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pendente': return 'outline';
    case 'pago': return 'success';
    case 'vencido': return 'destructive';
    case 'cancelada': return 'secondary';
    default: return 'outline';
  }
};

// Status configuration
const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  pago: { label: 'Pago', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  vencido: { label: 'Vencido', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
};

// Format currency values
const formatCurrency = (value: number | null) => {
  if (value === null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function ContasAPagarPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: addDays(new Date(), 30)
  });
  const [fornecedorFilter, setFornecedorFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for account to delete
  const [contaToDelete, setContaToDelete] = useState<{
    id: string;
    descricao: string;
  } | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  // State for the payment registration dialog
  const [selectedConta, setSelectedConta] = useState<{
    id: string;
    descricao: string;
    valor_previsto?: number;
    categoria_id?: string;
    fornecedor_nome?: string;
  } | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  // Fetch data from Supabase
  const { data: contas, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['contas_a_pagar', statusFilter, dateRange, fornecedorFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('contas_a_pagar')
        .select(`
          *,
          fornecedores:fornecedor_id (nome),
          categorias:categoria_id (nome, tipo)
        `)
        .eq('is_deleted', false);
      
      // Apply filters if they exist
      if (statusFilter && statusFilter !== 'todos') {
        query = query.eq('status_conta', statusFilter);
      }
      
      if (dateRange?.from) {
        query = query.gte('data_vencimento', format(dateRange.from, 'yyyy-MM-dd'));
      }
      
      if (dateRange?.to) {
        query = query.lte('data_vencimento', format(dateRange.to, 'yyyy-MM-dd'));
      }
      
      if (fornecedorFilter && fornecedorFilter !== 'todos') {
        query = query.eq('fornecedor_id', fornecedorFilter);
      }
      
      if (searchTerm) {
        query = query.ilike('descricao', `%${searchTerm}%`);
      }
      
      // Order by data_vencimento
      query = query.order('data_vencimento');
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Update status for overdue accounts
      const today = new Date();
      const processedData = data.map(conta => {
        if (conta.status_conta === 'pendente' && 
            isAfter(today, new Date(conta.data_vencimento))) {
          return { ...conta, status_conta: 'vencido' };
        }
        return conta;
      });
      
      return processedData;
    },
  });
  
  // Fetch suppliers for filter
  const { data: fornecedores } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contas_a_pagar')
        .update({ is_deleted: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_a_pagar'] });
      toast({
        title: "Conta removida",
        description: "A conta a pagar foi removida com sucesso.",
        variant: "default",
      });
      setIsDeleteAlertOpen(false);
      setContaToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível remover a conta: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });
  
  // Calculate summary values
  const totalPendente = contas
    ?.filter(conta => conta.status_conta === 'pendente' || conta.status_conta === 'vencido')
    .reduce((acc, conta) => acc + Number(conta.valor_previsto), 0) || 0;
  
  const totalPago = contas
    ?.filter(conta => conta.status_conta === 'pago')
    .reduce((acc, conta) => acc + Number(conta.valor_pago || 0), 0) || 0;
  
  const totalVencido = contas
    ?.filter(conta => conta.status_conta === 'vencido')
    .reduce((acc, conta) => acc + Number(conta.valor_previsto), 0) || 0;

  const totalContas = contas?.length || 0;
  const contasPendentes = contas?.filter(conta => conta.status_conta === 'pendente').length || 0;
  const contasPagas = contas?.filter(conta => conta.status_conta === 'pago').length || 0;
  
  // Handle navigation to new account page
  const handleNewConta = () => {
    navigate('/admin/financeiro/contas-a-pagar/novo');
  };

  // Handle edit
  const handleEdit = (id: string) => {
    navigate(`/admin/financeiro/contas-a-pagar/editar/${id}`);
  };

  // Handle delete
  const handleDelete = (conta: Record<string, unknown>) => {
    setContaToDelete({
      id: conta.id as string,
      descricao: conta.descricao as string,
    });
    setIsDeleteAlertOpen(true);
  };

  // Handle register payment
  const handleRegisterPayment = (conta: Record<string, unknown>) => {
    setSelectedConta({
      id: conta.id as string,
      descricao: conta.descricao as string,
      valor_previsto: conta.valor_previsto as number,
      categoria_id: conta.categoria_id as string,
      fornecedor_nome: (conta.fornecedores as { nome: string } | null)?.nome,
    });
    setIsPaymentDialogOpen(true);
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('todos');
    setDateRange({
      from: subDays(new Date(), 30),
      to: addDays(new Date(), 30)
    });
    setFornecedorFilter('todos');
    setSearchTerm('');
  };

  // Update overdue status on component mount
  useEffect(() => {
    const updateOverdueStatus = async () => {
      const today = new Date();
      const { data: overdueAccounts } = await supabase
        .from('contas_a_pagar')
        .select('id')
        .eq('status_conta', 'pendente')
        .lt('data_vencimento', format(today, 'yyyy-MM-dd'));

      if (overdueAccounts && overdueAccounts.length > 0) {
        await supabase
          .from('contas_a_pagar')
          .update({ status_conta: 'vencido' })
          .in('id', overdueAccounts.map(acc => acc.id));
        
        refetch();
      }
    };

    updateOverdueStatus();
  }, [refetch]);

  return (
    <>
      <AdminLayout>
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-yellow-950/20" />
            <div className="relative px-6 py-12">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-white">
                      <Receipt className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                        Contas a Pagar
                      </h1>
                      <p className="text-xl text-muted-foreground mt-2">
                        Controle completo das suas obrigações financeiras
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 blur-3xl opacity-20" />
                    <CreditCard className="h-32 w-32 text-red-600/20" />
                  </div>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Contas</p>
                        <p className="text-2xl font-bold">{totalContas}</p>
                      </div>
                      <Receipt className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                        <p className="text-2xl font-bold text-yellow-600">{contasPendentes}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(totalPendente)}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Vencidas</p>
                        <p className="text-2xl font-bold text-red-600">{contas?.filter(c => c.status_conta === 'vencido').length || 0}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(totalVencido)}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pagas</p>
                        <p className="text-2xl font-bold text-green-600">{contasPagas}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(totalPago)}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Controles e Filtros */}
          <div className="px-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar contas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={fornecedorFilter} onValueChange={setFornecedorFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os fornecedores</SelectItem>
                        {fornecedores?.map((fornecedor) => (
                          <SelectItem key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                                {format(dateRange.to, "dd/MM/yyyy")}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            <span>Período</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>

                    <Button variant="outline" onClick={resetFilters}>
                      <FilterX className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                    <Button onClick={handleNewConta} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Contas */}
          <div className="px-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-red-600" />
                      Lista de Contas a Pagar
                    </CardTitle>
                    <CardDescription>
                      {contas?.length || 0} conta(s) encontrada(s)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    {contas?.length || 0} itens
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
                ) : isError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Erro ao carregar contas</h3>
                    <p className="text-muted-foreground mb-4">
                      {(error as Error)?.message || 'Tente novamente mais tarde'}
                    </p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : !contas || contas.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma conta encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || statusFilter || fornecedorFilter
                        ? 'Tente ajustar os filtros de busca'
                        : 'Comece criando sua primeira conta a pagar'
                      }
                    </p>
                    <Button onClick={handleNewConta} className="bg-gradient-to-r from-red-500 to-orange-500">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Conta
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contas.map((conta) => {
                          const StatusIcon = statusConfig[conta.status_conta as keyof typeof statusConfig]?.icon || Clock;
                          return (
                            <TableRow key={conta.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-orange-100">
                                    <Receipt className="h-4 w-4 text-red-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{conta.descricao}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {conta.categorias?.nome || 'Sem categoria'}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {conta.fornecedores?.nome || 'Não informado'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(conta.data_vencimento), 'dd/MM/yyyy')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {formatCurrency(conta.valor_previsto)}
                                  {conta.valor_pago && conta.status_conta === 'pago' && (
                                    <div className="text-xs text-green-600">
                                      Pago: {formatCurrency(conta.valor_pago)}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={statusConfig[conta.status_conta as keyof typeof statusConfig]?.color}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[conta.status_conta as keyof typeof statusConfig]?.label || conta.status_conta}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(conta.id)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    {(conta.status_conta === 'pendente' || conta.status_conta === 'vencido') && (
                                      <DropdownMenuItem onClick={() => handleRegisterPayment(conta)}>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Registrar Pagamento
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(conta)}
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
        </div>
      </AdminLayout>

      {/* Dialog de Registro de Pagamento */}
      {selectedConta && (
        <RegistrarPagamentoContaDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => {
            setIsPaymentDialogOpen(false);
            setSelectedConta(null);
          }}
          conta={selectedConta}
          onSuccess={() => {
            refetch();
            setIsPaymentDialogOpen(false);
            setSelectedConta(null);
          }}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{contaToDelete?.descricao}"?
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => contaToDelete && deleteMutation.mutate(contaToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
