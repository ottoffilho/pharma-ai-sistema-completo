// =====================================================
// PÁGINA PRINCIPAL - GESTÃO DE CLIENTES
// =====================================================

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
  User,
  Users,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Star,
  CheckCircle,
  AlertCircle,
  UserPlus,
  ChevronLeft,
  ChevronRight
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

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const GestaoClientes: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State para gerenciar o diálogo de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
  
  // State para busca e paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 100;

  // Buscar dados de clientes do Supabase
  const {
    data: clientes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['clientes', page, searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome')
        .range(page * pageSize, page * pageSize + pageSize - 1) // paginação server-side
        .ilike('nome', `%${searchTerm}%`);

      if (error) throw new Error(error.message);
      return data as Cliente[];
    },
  });

  // -----------------------------------------------------
  // Query separada para estatísticas (total, ativos, inativos)
  // Utiliza head=true para não retornar linhas, apenas o count real
  // -----------------------------------------------------
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['clientes', 'stats'],
    queryFn: async () => {
      const [{ count: total, error: errTotal }, { count: ativos, error: errAtivos }] = await Promise.all([
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('ativo', true),
      ]);

      if (errTotal) throw errTotal;
      if (errAtivos) throw errAtivos;

      return {
        total: total || 0,
        ativos: ativos || 0,
        inativos: (total || 0) - (ativos || 0),
      };
    },
  });

  // Calcular métricas (usando stats se disponível)
  const totalClientes = stats?.total ?? 0;
  const clientesAtivos = stats?.ativos ?? 0;
  const clientesInativos = stats?.inativos ?? 0;

  // Total de páginas com base nas estatísticas carregadas
  const totalPages = Math.max(1, Math.ceil((stats?.total ?? 0) / pageSize));

  // Mutation para realizar a exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      // Invalida a query para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ['clientes'] });

      // Mostra toast de sucesso
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
        variant: "default",
      });
      
      // Fecha o diálogo de confirmação
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o cliente. Verifique se ele não possui pedidos ou vendas associadas.",
        variant: "destructive",
      });
    }
  });

  // Filtrar clientes com base no termo de busca
  const filteredClientes = clientes || [];

  // Função para navegar para página de novo cliente
  const handleCriarCliente = () => {
    navigate('/admin/clientes/novo');
  };

  // Função para navegar para a página de edição de clientes
  const handleEditarCliente = (id: string) => {
    navigate(`/admin/clientes/${id}/editar`);
  };

  // Função para visualizar detalhes
  const handleVisualizarCliente = (id: string) => {
    navigate(`/admin/clientes/${id}`);
  };

  // Função para iniciar o processo de exclusão
  const handleDeleteCliente = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  // Função para confirmar a exclusão
  const confirmDelete = () => {
    if (clienteToDelete) {
      deleteMutation.mutate(clienteToDelete.id);
    }
  };

  // Ao alterar a busca, sempre voltar para a primeira página
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(0);
  };

  return (
    <>
      <AdminLayout>
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
            <div className="relative px-6 py-12">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Gestão de Clientes
                      </h1>
                      <p className="text-xl text-muted-foreground mt-2">
                        Gerencie todos os clientes da farmácia
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur-3xl opacity-20" />
                    <UserPlus className="h-32 w-32 text-blue-600/20" />
                  </div>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total de Clientes</p>
                        <p className="text-2xl font-bold dark:text-white">{totalClientes}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Clientes Ativos</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-500">{clientesAtivos}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Clientes Inativos</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-500">{clientesInativos}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Satisfação Média</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">4.6</p>
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
                        placeholder="Buscar clientes..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
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
                    <Button onClick={handleCriarCliente} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Clientes */}
          <div className="px-6">
            <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Lista de Clientes
                    </CardTitle>
                    <CardDescription>
                      {stats ? stats.total : filteredClientes.length} cliente(s) encontrado(s)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    {filteredClientes.length} itens | Página {page + 1} de {totalPages}
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
                    <h3 className="text-lg font-semibold mb-2">Erro ao carregar clientes</h3>
                    <p className="text-muted-foreground mb-4">
                      {(error as Error)?.message || 'Tente novamente mais tarde'}
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : filteredClientes.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? 'Tente ajustar os filtros de busca'
                        : 'Comece criando seu primeiro cliente'
                      }
                    </p>
                    <Button onClick={handleCriarCliente} className="bg-gradient-to-r from-blue-500 to-indigo-500">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Cliente
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Documento</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cadastrado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClientes.map((cliente) => (
                          <TableRow key={cliente.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{cliente.nome}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {cliente.cidade || 'Cidade não informada'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {cliente.cpf && (
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">CPF:</span> {cliente.cpf}
                                  </p>
                                )}
                                {cliente.cnpj && (
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">CNPJ:</span> {cliente.cnpj}
                                  </p>
                                )}
                                {!cliente.cpf && !cliente.cnpj && (
                                  <p className="text-sm text-muted-foreground">Não informado</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {cliente.email && (
                                  <p className="text-sm flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {cliente.email}
                                  </p>
                                )}
                                {cliente.telefone && (
                                  <p className="text-sm flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {cliente.telefone}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={cliente.ativo ? "default" : "secondary"}
                                className={cliente.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                              >
                                {cliente.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleVisualizarCliente(cliente.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditarCliente(cliente.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteCliente(cliente)}
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

                {/* Controles de Paginação */}
                <div className="flex justify-end items-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Próxima <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clienteToDelete?.nome}"?
              Esta ação não pode ser desfeita.
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

export default GestaoClientes; 