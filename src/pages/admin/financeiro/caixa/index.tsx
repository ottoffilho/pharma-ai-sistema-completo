import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { MovimentacaoCaixaForm } from '@/components/financeiro/MovimentacaoCaixaForm';
import { 
  CalendarIcon, 
  Plus, 
  ArrowDown, 
  ArrowUp, 
  Edit, 
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Wallet,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function FluxoCaixaPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isNovaMovimentacaoOpen, setIsNovaMovimentacaoOpen] = useState(false);
  const [isEditMovimentacaoOpen, setIsEditMovimentacaoOpen] = useState(false);
  const [selectedMovimentacao, setSelectedMovimentacao] = useState<{
    id: string;
    data_movimentacao: Date;
    tipo_movimentacao: string;
    descricao: string;
    valor: number;
    categoria_id?: string;
    observacoes?: string;
  } | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState<Date>(startOfMonth(new Date()));
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  // Consultar movimentações de caixa
  const { data: movimentacoes, isLoading, isError, error } = useQuery({
    queryKey: ['movimentacoes-caixa', tipoFiltro, dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from('movimentacoes_caixa')
        .select('*, categorias_financeiras(nome, tipo)')
        .eq('is_deleted', false)
        .gte('data_movimentacao', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_movimentacao', format(dataFim, 'yyyy-MM-dd'))
        .order('data_movimentacao', { ascending: false });
      
      if (tipoFiltro !== 'todos') {
        query = query.eq('tipo_movimentacao', tipoFiltro);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });

  // Mutação para excluir movimentação (soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movimentacoes_caixa')
        .update({ is_deleted: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Movimentação excluída",
        description: "A movimentação foi excluída com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-caixa'] });
    },
    onError: (error: unknown) => {
      console.error('Erro ao excluir movimentação:', error);
      toast({
        title: "Erro ao excluir",
        description: (error instanceof Error ? error.message : 'Erro desconhecido') || "Ocorreu um erro ao excluir a movimentação.",
        variant: "destructive",
      });
    },
  });

  // Filtrar movimentações baseado na busca
  const filteredMovimentacoes = movimentacoes?.filter(movimentacao => {
    const matchesSearch = movimentacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (movimentacao.observacoes && movimentacao.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  }) || [];

  // Calcular totais
  const calcularTotais = () => {
    if (!filteredMovimentacoes || filteredMovimentacoes.length === 0) {
      return { totalEntradas: 0, totalSaidas: 0, saldo: 0 };
    }
    
    const totalEntradas = filteredMovimentacoes
      .filter((mov: { tipo_movimentacao: string }) => mov.tipo_movimentacao === 'entrada')
      .reduce((total: number, mov: { valor: string | number }) => total + parseFloat(String(mov.valor)), 0);
      
    const totalSaidas = filteredMovimentacoes
      .filter((mov: { tipo_movimentacao: string }) => mov.tipo_movimentacao === 'saida')
      .reduce((total: number, mov: { valor: string | number }) => total + parseFloat(String(mov.valor)), 0);
      
    return {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
    };
  };

  const { totalEntradas, totalSaidas, saldo } = calcularTotais();

  // Formatar valor em BRL
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const handleExcluir = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleEditar = (movimentacao: Record<string, unknown>) => {
    // Converter a string de data para um objeto Date para o formulário
    const dataMovimentacao = new Date(movimentacao.data_movimentacao);
    
    setSelectedMovimentacao({
      ...movimentacao,
      data_movimentacao: dataMovimentacao,
    });
    
    setIsEditMovimentacaoOpen(true);
  };

  const handleNovaMovimentacaoSuccess = () => {
    setIsNovaMovimentacaoOpen(false);
    toast({
      title: "Movimentação registrada",
      description: "A movimentação foi adicionada com sucesso.",
      variant: "default",
    });
  };

  const handleEditMovimentacaoSuccess = () => {
    setIsEditMovimentacaoOpen(false);
    setSelectedMovimentacao(null);
    toast({
      title: "Movimentação atualizada",
      description: "A movimentação foi atualizada com sucesso.",
      variant: "default",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20" />
          <div className="relative px-6 py-12">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    <Wallet className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Fluxo de Caixa
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Controle completo das movimentações financeiras
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 blur-3xl opacity-20" />
                  <DollarSign className="h-32 w-32 text-green-600/20" />
                </div>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Entradas</p>
                      <p className="text-2xl font-bold text-green-600">{formatarValor(totalEntradas)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Saídas</p>
                      <p className="text-2xl font-bold text-red-600">{formatarValor(totalSaidas)}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Saldo do Período</p>
                      <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatarValor(saldo)}
                      </p>
                    </div>
                    <BarChart3 className={`h-8 w-8 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Movimentações</p>
                      <p className="text-2xl font-bold">{filteredMovimentacoes.length}</p>
                    </div>
                    <Wallet className="h-8 w-8 text-blue-600" />
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
                      placeholder="Buscar movimentações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="saida">Saídas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataInicio && dataFim ? (
                          <>
                            {format(dataInicio, "dd/MM/yyyy")} - {format(dataFim, "dd/MM/yyyy")}
                          </>
                        ) : (
                          <span>Selecionar período</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="text-sm font-medium">Data Início</label>
                          <CalendarComponent
                            mode="single"
                            selected={dataInicio}
                            onSelect={(date) => date && setDataInicio(date)}
                            initialFocus
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Data Fim</label>
                          <CalendarComponent
                            mode="single"
                            selected={dataFim}
                            onSelect={(date) => date && setDataFim(date)}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Dialog open={isNovaMovimentacaoOpen} onOpenChange={setIsNovaMovimentacaoOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Movimentação
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Nova Movimentação</DialogTitle>
                        <DialogDescription>
                          Registre uma nova movimentação no fluxo de caixa
                        </DialogDescription>
                      </DialogHeader>
                      <MovimentacaoCaixaForm onSuccess={handleNovaMovimentacaoSuccess} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Movimentações */}
        <div className="px-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    Movimentações do Caixa
                  </CardTitle>
                  <CardDescription>
                    {filteredMovimentacoes.length} movimentação(ões) encontrada(s)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {filteredMovimentacoes.length} itens
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
                  <h3 className="text-lg font-semibold mb-2">Erro ao carregar movimentações</h3>
                  <p className="text-muted-foreground mb-4">
                    {(error as Error)?.message || 'Tente novamente mais tarde'}
                  </p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : filteredMovimentacoes.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma movimentação encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || tipoFiltro !== 'todos' 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece registrando sua primeira movimentação'
                    }
                  </p>
                  <Button onClick={() => setIsNovaMovimentacaoOpen(true)} className="bg-gradient-to-r from-green-500 to-emerald-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Movimentação
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovimentacoes.map((movimentacao) => (
                        <TableRow key={movimentacao.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(movimentacao.data_movimentacao), 'dd/MM/yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                movimentacao.tipo_movimentacao === 'entrada' 
                                  ? 'bg-gradient-to-br from-green-100 to-emerald-100' 
                                  : 'bg-gradient-to-br from-red-100 to-rose-100'
                              }`}>
                                {movimentacao.tipo_movimentacao === 'entrada' ? (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{movimentacao.descricao}</p>
                                <p className="text-sm text-muted-foreground">
                                  {movimentacao.observacoes || 'Sem observações'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {movimentacao.categorias_financeiras?.nome || 'Sem categoria'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={
                                movimentacao.tipo_movimentacao === 'entrada'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }
                            >
                              {movimentacao.tipo_movimentacao === 'entrada' ? (
                                <>
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  Entrada
                                </>
                              ) : (
                                <>
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                  Saída
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            <span className={movimentacao.tipo_movimentacao === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                              {formatarValor(parseFloat(String(movimentacao.valor)))}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditar(movimentacao)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleExcluir(movimentacao.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog de Edição */}
        <Dialog open={isEditMovimentacaoOpen} onOpenChange={setIsEditMovimentacaoOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Movimentação</DialogTitle>
              <DialogDescription>
                Atualize os dados da movimentação selecionada
              </DialogDescription>
            </DialogHeader>
            {selectedMovimentacao && (
              <MovimentacaoCaixaForm 
                movimentacao={selectedMovimentacao} 
                onSuccess={handleEditMovimentacaoSuccess} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
