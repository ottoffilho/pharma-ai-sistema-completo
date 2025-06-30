import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, getSupabaseFunctionUrl } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  Pill,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Clock,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
  Beaker,
  MoreHorizontal,
  Eye,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Package,
  Droplets
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormasFarmaceuticas } from '@/hooks/useFormasFarmaceuticas';
import AdminLayout from '@/components/layouts/AdminLayout';

interface FormaFarmaceutica {
  id: string;
  nome: string;
  abreviatura?: string;
  tipo_uso?: string;
  descricao?: string;
  desconto_maximo: number;
  valor_minimo: number;
  rotulo_config: Record<string, any>;
  ativo: boolean;
  created_at: string;
  forma_processos?: FormaProcesso[];
}

interface FormaProcesso {
  id: string;
  ordem: number;
  nome_processo: string;
  tipo_processo: 'PRODUCAO' | 'QUALIDADE' | 'LOGISTICA';
  ponto_controle: boolean;
  tempo_estimado_min?: number;
}

const ITEMS_PER_PAGE = 10;

const FormasFarmaceuticasPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State para gerenciar o diálogo de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formaToDelete, setFormaToDelete] = useState<any | null>(null);
  
  // State para busca
  const [searchTerm, setSearchTerm] = useState('');

  // Usar o hook customizado
  const { data: formas, isLoading, error } = useFormasFarmaceuticas();

  // Mutation para realizar a exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(
        getSupabaseFunctionUrl(`gerenciar-formas-farmaceuticas/excluir/${id}`),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir forma farmacêutica');
      }

      return id;
    },
    onSuccess: () => {
      // Invalida a query para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ['formas-farmaceuticas'] });
      
      // Mostra toast de sucesso
      toast({
        title: "Forma farmacêutica excluída",
        description: "A forma farmacêutica foi excluída com sucesso.",
        variant: "default",
      });
      
      // Fecha o diálogo de confirmação
      setDeleteDialogOpen(false);
      setFormaToDelete(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir forma farmacêutica:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir a forma farmacêutica. Verifique se ela não está sendo usada em outros cadastros.",
        variant: "destructive",
      });
    }
  });

  // Filtrar formas com base no termo de busca
  const filteredFormas = formas?.filter((forma) =>
    forma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    forma.abreviatura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    forma.tipo_uso?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calcular métricas
  const totalFormas = formas?.length || 0;
  const formasAtivas = formas?.filter(f => f.ativo).length || 0;
  const formasInativas = totalFormas - formasAtivas;
  const formasOrais = formas?.filter(f => f.tipo_uso === 'oral').length || 0;
  const formasTopicas = formas?.filter(f => f.tipo_uso === 'topico').length || 0;

  // Função para navegar para a página de criação
  const handleNewForma = () => {
    navigate('/admin/cadastros/formas-farmaceuticas/nova');
  };

  // Função para navegar para a página de edição
  const handleEditForma = (id: string) => {
    navigate(`/admin/cadastros/formas-farmaceuticas/${id}/editar`);
  };

  // Função para visualizar detalhes
  const handleViewForma = (id: string) => {
    navigate(`/admin/cadastros/formas-farmaceuticas/${id}`);
  };

  // Função para iniciar o processo de exclusão
  const handleDeleteForma = (forma: any) => {
    setFormaToDelete(forma);
    setDeleteDialogOpen(true);
  };

  // Função para confirmar a exclusão
  const confirmDelete = () => {
    if (formaToDelete) {
      deleteMutation.mutate(formaToDelete.id);
    }
  };

  // Função para obter ícone baseado no tipo
  const getFormaIcon = (tipoUso?: string) => {
    switch (tipoUso) {
      case 'oral':
        return <Pill className="h-4 w-4" />;
      case 'topico':
        return <Droplets className="h-4 w-4" />;
      case 'injetavel':
        return <Beaker className="h-4 w-4" />;
      default:
        return <FlaskConical className="h-4 w-4" />;
    }
  };

  // Função para obter cor do badge baseado no tipo
  const getTipoUsoBadgeColor = (tipoUso?: string) => {
    switch (tipoUso) {
      case 'oral':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'topico':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'injetavel':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'nasal':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'oftalmico':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
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
                      <FlaskConical className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Formas Farmacêuticas
                      </h1>
                      <p className="text-xl text-muted-foreground mt-2">
                        Gerencie as formas farmacêuticas e processos de produção
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur-3xl opacity-20" />
                    <FlaskConical className="h-32 w-32 text-blue-600/20" />
                  </div>
                </div>
              </div>

              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total de Formas</p>
                        <p className="text-2xl font-bold dark:text-white">{totalFormas}</p>
                      </div>
                      <FlaskConical className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Formas Ativas</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-500">{formasAtivas}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Uso Oral</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{formasOrais}</p>
                      </div>
                      <Pill className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Uso Tópico</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-500">{formasTopicas}</p>
                      </div>
                      <Droplets className="h-8 w-8 text-purple-600" />
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
                        placeholder="Buscar formas farmacêuticas..."
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
                    <Button onClick={handleNewForma} className="bg-gradient-to-r from-blue-500 to-indigo-500">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Forma
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Formas Farmacêuticas */}
          <div className="px-6">
            <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-blue-600" />
                      Lista de Formas Farmacêuticas
                    </CardTitle>
                    <CardDescription>
                      {filteredFormas.length} forma(s) farmacêutica(s) encontrada(s)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    {filteredFormas.length} itens
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
                    <h3 className="text-lg font-semibold mb-2">Erro ao carregar formas farmacêuticas</h3>
                    <p className="text-muted-foreground mb-4">
                      {(error as Error)?.message || 'Tente novamente mais tarde'}
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : filteredFormas.length === 0 ? (
                  <div className="text-center py-12">
                    <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma forma farmacêutica encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? 'Tente ajustar os filtros de busca'
                        : 'Comece criando sua primeira forma farmacêutica'
                      }
                    </p>
                    <Button onClick={handleNewForma} className="bg-gradient-to-r from-blue-500 to-indigo-500">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Forma
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Forma Farmacêutica</TableHead>
                          <TableHead>Tipo de Uso</TableHead>
                          <TableHead>Configurações</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cadastrado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFormas.map((forma) => (
                          <TableRow key={forma.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                                  {getFormaIcon(forma.tipo_uso)}
                                </div>
                                <div>
                                  <p className="font-medium">{forma.nome}</p>
                                  {forma.abreviatura && (
                                    <p className="text-sm text-muted-foreground">
                                      {forma.abreviatura}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {forma.tipo_uso && (
                                <Badge className={getTipoUsoBadgeColor(forma.tipo_uso)}>
                                  {forma.tipo_uso.charAt(0).toUpperCase() + forma.tipo_uso.slice(1)}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {forma.desconto_maximo > 0 && (
                                  <p className="text-sm">
                                    Desconto máx: {forma.desconto_maximo}%
                                  </p>
                                )}
                                {forma.valor_minimo > 0 && (
                                  <p className="text-sm">
                                    Valor mín: R$ {forma.valor_minimo.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={forma.ativo ? "default" : "secondary"}
                                className={forma.ativo ? "bg-green-100 text-green-800" : ""}
                              >
                                {forma.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(forma.created_at).toLocaleDateString('pt-BR')}
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
                                  <DropdownMenuItem onClick={() => handleViewForma(forma.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditForma(forma.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteForma(forma)}
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
              Tem certeza que deseja excluir a forma farmacêutica "{formaToDelete?.nome}"?
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

export default FormasFarmaceuticasPage; 