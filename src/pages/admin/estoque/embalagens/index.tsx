import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Loader2, 
  Edit, 
  Trash2, 
  Package, 
  Search,
  Filter,
  Download,
  Upload,
  BarChart3,
  AlertTriangle,
  DollarSign,
  Box,
  Layers,
  MoreHorizontal,
  AlertCircle,
  TrendingUp,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

// Define the type for embalagem data
type Embalagem = {
  id: string;
  nome: string;
  tipo: string;
  volume_capacidade: string | null;
  custo_unitario: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  fornecedor_id: string | null;
  descricao: string | null;
  fornecedores: {
    nome: string | null;
  } | null;
  is_deleted: boolean;
};

const EmbalagensListPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [embalagensToDelete, setEmbalagemToDelete] = useState<Embalagem | null>(null);

  // Fetch embalagens data with fornecedor info - filter out deleted items
  const { data: embalagens, isLoading, isError, error } = useQuery({
    queryKey: ['embalagens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embalagens')
        .select('*, fornecedores(nome)')
        .eq('is_deleted', false)
        .order('nome');
      
      if (error) throw error;
      return data as Embalagem[];
    },
  });

  // Mutation for soft delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('embalagens')
        .update({ is_deleted: true })
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embalagens'] });
      
      toast({
        title: "Embalagem excluída",
        description: "A embalagem foi excluída com sucesso.",
        variant: "default",
      });
      
      setDeleteDialogOpen(false);
      setEmbalagemToDelete(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir embalagem:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir a embalagem. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  });

  // Filtrar embalagens baseado na busca e filtros
  const filteredEmbalagens = embalagens?.filter(embalagem => {
    const matchesSearch = embalagem.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         embalagem.tipo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || embalagem.tipo === filterType;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'low_stock' && embalagem.estoque_atual <= embalagem.estoque_minimo) ||
                         (filterStatus === 'normal' && embalagem.estoque_atual > embalagem.estoque_minimo);
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  // Calcular métricas
  const totalEmbalagens = embalagens?.length || 0;
  const lowStockCount = embalagens?.filter(e => e.estoque_atual <= e.estoque_minimo).length || 0;
  const totalValue = embalagens?.reduce((sum, e) => sum + (e.custo_unitario * e.estoque_atual), 0) || 0;
  const avgCost = totalEmbalagens > 0 ? totalValue / totalEmbalagens : 0;

  const handleEdit = (id: string) => {
    navigate(`/admin/estoque/embalagens/editar/${id}`);
  };

  const handleDelete = (embalagem: Embalagem) => {
    setEmbalagemToDelete(embalagem);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (embalagensToDelete) {
      deleteMutation.mutate(embalagensToDelete.id);
    }
  };

  const handleAddNew = () => {
    navigate('/admin/estoque/embalagens/novo');
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para determinar status do estoque
  const getStockStatus = (atual: number, minimo: number) => {
    if (atual <= minimo) return 'critical';
    if (atual <= minimo * 1.5) return 'warning';
    return 'good';
  };

  return (
    <AdminLayout>
      <div className="space-y-8 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    <Package className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Gestão de Embalagens
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Controle completo de frascos, potes e materiais de embalagem
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 blur-3xl opacity-20" />
                  <Archive className="h-32 w-32 text-green-600/20" />
                </div>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total de Embalagens</p>
                      <p className="text-2xl font-bold dark:text-white">{totalEmbalagens}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Estoque Baixo</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-500">{lowStockCount}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Valor Total</p>
                      <p className="text-2xl font-bold dark:text-white">{formatCurrency(totalValue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Custo Médio</p>
                      <p className="text-2xl font-bold dark:text-white">{formatCurrency(avgCost)}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Controles e Filtros */}
        <div className="px-6 w-full">
          <Card className="border-0 shadow-sm w-full">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar embalagens..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="frasco">Frasco</SelectItem>
                      <SelectItem value="pote">Pote</SelectItem>
                      <SelectItem value="bisnaga">Bisnaga</SelectItem>
                      <SelectItem value="ampola">Ampola</SelectItem>
                      <SelectItem value="capsula">Cápsula</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="normal">Estoque Normal</SelectItem>
                      <SelectItem value="low_stock">Estoque Baixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                  <Button onClick={handleAddNew} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Embalagem
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Embalagens */}
        <div className="px-6 w-full">
          <Card className="border-0 shadow-sm w-full">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    Lista de Embalagens
                  </CardTitle>
                  <CardDescription>
                    {filteredEmbalagens.length} embalagem(ns) encontrada(s)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {filteredEmbalagens.length} itens
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(5).fill(null).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
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
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar embalagens</h3>
                  <p className="text-muted-foreground mb-4">{(error as Error)?.message || 'Tente novamente mais tarde'}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : filteredEmbalagens.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma embalagem encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando sua primeira embalagem'
                    }
                  </p>
                  <Button onClick={handleAddNew} className="bg-gradient-to-r from-green-500 to-emerald-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Embalagem
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Embalagem</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Custo Unit.</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmbalagens.map((embalagem) => {
                        const stockStatus = getStockStatus(embalagem.estoque_atual, embalagem.estoque_minimo);
                        const totalValue = embalagem.custo_unitario * embalagem.estoque_atual;
                        
                        return (
                          <TableRow key={embalagem.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100">
                                  <Package className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{embalagem.nome}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {embalagem.descricao || 'Sem descrição'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {embalagem.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">
                                {embalagem.volume_capacidade || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{embalagem.estoque_atual}</p>
                                <p className="text-muted-foreground">Mín: {embalagem.estoque_minimo}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(embalagem.custo_unitario)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(totalValue)}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {embalagem.fornecedores?.nome || 'Não especificado'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={stockStatus === 'critical' ? 'destructive' : 
                                        stockStatus === 'warning' ? 'secondary' : 'default'}
                                className={
                                  stockStatus === 'critical' ? 'bg-red-100 text-red-800' :
                                  stockStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }
                              >
                                {stockStatus === 'critical' ? 'Crítico' :
                                 stockStatus === 'warning' ? 'Baixo' : 'Normal'}
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
                                  <DropdownMenuItem onClick={() => handleEdit(embalagem.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(embalagem)}
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

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a embalagem "{embalagensToDelete?.nome}"?
                Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default EmbalagensListPage;
