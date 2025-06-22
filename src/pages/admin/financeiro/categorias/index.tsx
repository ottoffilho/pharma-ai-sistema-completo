import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  Plus, 
  PieChart, 
  Search,
  Filter,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  MoreHorizontal,
  AlertCircle,
  Loader2,
  Tags,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
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

export default function CategoriasFinanceirasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<string | null>(null);

  // Consultar categorias
  const { data: categorias, isLoading, isError, error } = useQuery({
    queryKey: ['categorias-financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('is_deleted', false)
        .order('tipo', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Mutação para excluir categoria (soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorias_financeiras')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast({
        title: 'Categoria excluída',
        description: 'A categoria foi excluída com sucesso.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] });
    },
    onError: (error: unknown) => {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: 'Erro ao excluir',
        description: (error instanceof Error ? error.message : 'Erro desconhecido') || 'Ocorreu um erro ao excluir a categoria.',
        variant: 'destructive',
      });
    },
  });

  // Filtrar categorias baseado na busca e filtros
  const filteredCategorias = categorias?.filter(categoria => {
    const matchesSearch = categoria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (categoria.descricao && categoria.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || categoria.tipo === filterType;
    
    return matchesSearch && matchesType;
  }) || [];

  // Calcular métricas
  const totalCategorias = categorias?.length || 0;
  const receitasCount = categorias?.filter(c => c.tipo === 'receita').length || 0;
  const despesasCount = categorias?.filter(c => c.tipo === 'despesa').length || 0;

  const handleExcluir = (id: string) => {
    setCategoriaParaExcluir(id);
  };

  const confirmarExclusao = () => {
    if (categoriaParaExcluir) {
      deleteMutation.mutate(categoriaParaExcluir);
      setCategoriaParaExcluir(null);
    }
  };

  const handleAddNew = () => {
    navigate('/admin/financeiro/categorias/novo');
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20" />
          <div className="relative px-6 py-12">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white">
                    <PieChart className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      Categorias Financeiras
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Organize suas finanças com categorias personalizáveis
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 blur-3xl opacity-20" />
                  <Tags className="h-32 w-32 text-emerald-600/20" />
                </div>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Categorias</p>
                      <p className="text-2xl font-bold">{totalCategorias}</p>
                    </div>
                    <PieChart className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Receitas</p>
                      <p className="text-2xl font-bold text-green-600">{receitasCount}</p>
                    </div>
                    <div className="flex items-center">
                      <ArrowUpRight className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Despesas</p>
                      <p className="text-2xl font-bold text-red-600">{despesasCount}</p>
                    </div>
                    <div className="flex items-center">
                      <ArrowDownRight className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Taxa de Organização</p>
                      <p className="text-2xl font-bold">100%</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
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
                      placeholder="Buscar categorias..."
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
                      <SelectItem value="receita">Receitas</SelectItem>
                      <SelectItem value="despesa">Despesas</SelectItem>
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
                  <Button onClick={handleAddNew} className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Categorias */}
        <div className="px-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-emerald-600" />
                    Lista de Categorias
                  </CardTitle>
                  <CardDescription>
                    {filteredCategorias.length} categoria(s) encontrada(s)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                  {filteredCategorias.length} itens
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
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar categorias</h3>
                  <p className="text-muted-foreground mb-4">{(error as Error)?.message || 'Tente novamente mais tarde'}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : filteredCategorias.length === 0 ? (
                <div className="text-center py-12">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma categoria encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterType !== 'all' 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando sua primeira categoria financeira'
                    }
                  </p>
                  <Button onClick={handleAddNew} className="bg-gradient-to-r from-emerald-500 to-green-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Categoria
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategorias.map((categoria: Record<string, unknown>) => (
                        <TableRow key={categoria.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                categoria.tipo === 'receita' 
                                  ? 'bg-gradient-to-br from-green-100 to-emerald-100' 
                                  : 'bg-gradient-to-br from-red-100 to-rose-100'
                              }`}>
                                {categoria.tipo === 'receita' ? (
                                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{categoria.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  {categoria.tipo === 'receita' ? 'Entrada de recursos' : 'Saída de recursos'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                categoria.tipo === 'receita'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }
                            >
                              {categoria.tipo === 'receita' ? 'Receita' : 'Despesa'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {categoria.descricao || '-'}
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
                                <DropdownMenuItem onClick={() => navigate(`/admin/financeiro/categorias/editar/${categoria.id}`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleExcluir(categoria.id)}
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

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={!!categoriaParaExcluir} onOpenChange={() => setCategoriaParaExcluir(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta categoria?
                Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmarExclusao}
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
}
