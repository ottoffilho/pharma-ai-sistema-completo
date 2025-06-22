import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  User,
  Building2,
  Filter,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  Users,
  Package,
  MoreHorizontal,
  Eye,
  Star,
  Calendar,
  DollarSign,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
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
import type { Fornecedor } from '@/integrations/supabase/types';

const FornecedoresPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State para gerenciar o diálogo de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<Fornecedor | null>(null);
  
  // State para busca
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar dados de fornecedores do Supabase
  const {
    data: fornecedores,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');

      if (error) throw new Error(error.message);
      return data as Fornecedor[];
    },
  });

  // Mutation para realizar a exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      // Invalida a query para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      
      // Mostra toast de sucesso
      toast({
        title: "Fornecedor excluído",
        description: "O fornecedor foi excluído com sucesso.",
        variant: "default",
      });
      
      // Fecha o diálogo de confirmação
      setDeleteDialogOpen(false);
      setFornecedorToDelete(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir fornecedor:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o fornecedor. Verifique se ele não está sendo usado em outros cadastros.",
        variant: "destructive",
      });
    }
  });

  // Filtrar fornecedores com base no termo de busca
  const filteredFornecedores = fornecedores?.filter((fornecedor) =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.telefone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calcular métricas
  const totalFornecedores = fornecedores?.length || 0;
  // Como não há campo 'ativo' na tabela, considerar todos como ativos
  const fornecedoresAtivos = totalFornecedores;
  const fornecedoresInativos = 0;

  // Função para navegar para a página de criação de fornecedores
  const handleNewFornecedor = () => {
    navigate('/admin/cadastros/fornecedores/novo');
  };

  // Função para navegar para a página de edição de fornecedores
  const handleEditFornecedor = (id: string) => {
    navigate(`/admin/cadastros/fornecedores/editar/${id}`);
  };

  // Função para visualizar detalhes
  const handleViewFornecedor = (id: string) => {
    navigate(`/admin/cadastros/fornecedores/${id}`);
  };

  // Função para iniciar o processo de exclusão
  const handleDeleteFornecedor = (fornecedor: Fornecedor) => {
    setFornecedorToDelete(fornecedor);
    setDeleteDialogOpen(true);
  };

  // Função para confirmar a exclusão
  const confirmDelete = () => {
    if (fornecedorToDelete) {
      deleteMutation.mutate(fornecedorToDelete.id);
    }
  };

  return (
    <>
      <AdminLayout>
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20" />
            <div className="relative px-6 py-12">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Gestão de Fornecedores
                      </h1>
                      <p className="text-xl text-muted-foreground mt-2">
                        Controle completo da sua rede de fornecedores e parceiros
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 blur-3xl opacity-20" />
                    <Truck className="h-32 w-32 text-emerald-600/20" />
                  </div>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total de Fornecedores</p>
                        <p className="text-2xl font-bold dark:text-white">{totalFornecedores}</p>
                      </div>
                      <Building2 className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Fornecedores Ativos</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-500">{fornecedoresAtivos}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Fornecedores Inativos</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-500">{fornecedoresInativos}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Avaliação Média</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">4.8</p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Controles e Filtros */}
          <div className="px-6">
            <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar fornecedores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
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
                    <Button onClick={handleNewFornecedor} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Fornecedor
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Fornecedores */}
          <div className="px-6">
            <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                      Lista de Fornecedores
                    </CardTitle>
                    <CardDescription>
                      {filteredFornecedores.length} fornecedor(es) encontrado(s)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                    {filteredFornecedores.length} itens
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
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Erro ao carregar fornecedores</h3>
                    <p className="text-muted-foreground mb-4">
                      {(error as Error)?.message || 'Tente novamente mais tarde'}
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : filteredFornecedores.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? 'Tente ajustar os filtros de busca'
                        : 'Comece criando seu primeiro fornecedor'
                      }
                    </p>
                    <Button onClick={handleNewFornecedor} className="bg-gradient-to-r from-emerald-500 to-teal-500">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Fornecedor
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Localização</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cadastrado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFornecedores.map((fornecedor) => (
                          <TableRow key={fornecedor.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                                  <Building2 className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{fornecedor.nome}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {fornecedor.documento || 'CNPJ não informado'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {fornecedor.email && (
                                  <p className="text-sm flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {fornecedor.email}
                                  </p>
                                )}
                                {fornecedor.telefone && (
                                  <p className="text-sm flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {fornecedor.telefone}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {fornecedor.endereco && (
                                  <p className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {fornecedor.cidade}, {fornecedor.estado}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="default"
                                className="bg-green-100 text-green-800"
                              >
                                Ativo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(fornecedor.created_at).toLocaleDateString('pt-BR')}
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
                                  <DropdownMenuItem onClick={() => handleViewFornecedor(fornecedor.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditFornecedor(fornecedor.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteFornecedor(fornecedor)}
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
        </div>
      </AdminLayout>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{fornecedorToDelete?.nome}"?
              Esta ação não poderá ser desfeita e pode afetar outros registros relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
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
};

export default FornecedoresPage; 