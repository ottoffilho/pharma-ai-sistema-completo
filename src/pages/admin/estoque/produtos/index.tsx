import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Filter,
  Download,
  Upload,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Boxes,
  FlaskConical,
  ArrowUpRight,
  Eye,
  MoreHorizontal,
  Package2,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
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
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Tipo para os dados de produtos vindos do Supabase
interface Produto {
  id: string;
  nome: string;
  tipo: string;
  categoria?: string;
  unidade_medida?: string;
  volume_capacidade?: string;
  custo_unitario: number;
  preco_custo: number;
  preco_venda?: number;
  frete_unitario?: number;
  custo_efetivo?: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number;
  fornecedor_id?: string;
  descricao?: string;
  is_deleted: boolean;
  ativo: boolean;
  controlado: boolean;
  fornecedores?: {
    nome: string | null;
  } | null;
  fornecedor_nome?: string;
  
  // Dados reais da nota fiscal
  valor_compra_nf?: number | null;
  valor_total_item_nf?: number | null;
  quantidade_nf?: number | null;
  numero_nf?: number | null;
  data_emissao_nf?: string | null;
  valor_total_nota?: number | null;
}

const ProdutosPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null);
  const [currentTab, setCurrentTab] = useState('all');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar produtos (antiga tabela insumos unificada)
  const { data: produtos, error, isLoading } = useQuery<Produto[]>({
    queryKey: ['produtos-estoque'],
    queryFn: async (): Promise<Produto[]> => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/produtos-com-nf`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar produtos');
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
      }
    },
  });

  // Mutation para deletar produto
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/produtos-com-nf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          query: `UPDATE produtos SET is_deleted = true WHERE id = '${id}'`
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar produto');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-estoque'] });
      toast({
        title: "Produto removido",
        description: "O produto foi removido com sucesso.",
      });
      setDeleteDialogOpen(false);
      setProdutoToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrar produtos baseado na busca, filtros e aba ativa
  const filteredProdutos = produtos?.filter((produto: Produto) => {
    const matchesSearch = produto.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || produto.tipo === filterType;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'low_stock' && produto.estoque_atual <= produto.estoque_minimo) ||
                         (filterStatus === 'normal' && produto.estoque_atual > produto.estoque_minimo);
    
    const matchesCategory = filterCategory === 'all' || produto.categoria === filterCategory;
    
    // Filtro por aba - usando as 4 novas categorias
    const matchesTab = currentTab === 'all' || 
                      (currentTab === 'alopaticos' && ['INSUMO', 'MATERIA_PRIMA', 'PRINCIPIO_ATIVO', 'EXCIPIENTE', 'COSMÉTICO'].includes(produto.tipo)) ||
                      (currentTab === 'embalagens' && produto.tipo === 'EMBALAGEM') ||
                      (currentTab === 'homeopaticos' && produto.tipo === 'HOMEOPATICO') ||
                      (currentTab === 'revenda' && produto.tipo === 'MEDICAMENTO');
    
    return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesTab;
  }) || [];

  // Calcular métricas - usando as 4 novas categorias
  const totalProdutos = produtos?.length || 0;
  const totalAlopaticos = produtos?.filter((p: Produto) => ['INSUMO', 'MATERIA_PRIMA', 'PRINCIPIO_ATIVO', 'EXCIPIENTE', 'COSMÉTICO'].includes(p.tipo)).length || 0;
  const totalEmbalagens = produtos?.filter((p: Produto) => p.tipo === 'EMBALAGEM').length || 0;
  const totalHomeopaticos = produtos?.filter((p: Produto) => p.tipo === 'HOMEOPATICO').length || 0;
  const totalRevenda = produtos?.filter((p: Produto) => p.tipo === 'MEDICAMENTO').length || 0;
  const lowStockCount = produtos?.filter((p: Produto) => p.estoque_atual <= p.estoque_minimo).length || 0;
  const totalValue = produtos?.reduce((sum: number, p: Produto) => {
    // Usar custo efetivo (custo + frete) da nota fiscal, ou custo unitário como fallback
    const custoReal = p.custo_efetivo || p.valor_compra_nf || p.custo_unitario || 0;
    return sum + (custoReal * p.estoque_atual);
  }, 0) || 0;

  const handleEdit = (id: string, tipo: string) => {
    if (tipo === 'EMBALAGEM') {
      navigate(`/admin/estoque/produtos/editar/${id}?tipo=embalagem`);
    } else {
      navigate(`/admin/estoque/produtos/editar/${id}?tipo=insumo`);
    }
  };

  const handleDelete = (produto: Produto) => {
    setProdutoToDelete(produto);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (produtoToDelete) {
      deleteMutation.mutate(produtoToDelete.id);
    }
  };

  const handleAddNew = () => {
    navigate('/admin/estoque/produtos/novo');
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

  // Função para obter ícone por tipo
  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'EMBALAGEM':
        return <Package2 className="h-4 w-4" />;
      case 'MEDICAMENTO':
        return <Package className="h-4 w-4" />;
      case 'COSMÉTICO':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <FlaskConical className="h-4 w-4" />;
    }
  };

  // Função para obter cor por tipo
  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'EMBALAGEM':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDICAMENTO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'HOMEOPATICO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PRINCIPIO_ATIVO':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'EXCIPIENTE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Função para renderizar a célula de estoque formatada
  const renderStockCell = (produto: Produto) => {
    if (produto.volume_capacidade) {
      const [capacityQtyStr, capacityUnit] = produto.volume_capacidade.split(' ');
      const capacityQty = parseInt(capacityQtyStr, 10);
      const totalUnits = produto.estoque_atual * capacityQty;
      return (
        <div className="flex flex-col">
          <span>
            {produto.estoque_atual} x {capacityQty} {capacityUnit} = {totalUnits.toLocaleString('pt-BR')} {capacityUnit}
          </span>
          <span className="text-xs text-muted-foreground">
            Mín: {produto.estoque_minimo} x {capacityQty} {capacityUnit}
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col">
        <span>{produto.estoque_atual} {produto.unidade_medida}</span>
        <span className="text-xs text-muted-foreground">
          Mín: {produto.estoque_minimo}
        </span>
      </div>
    );
  };

  // Função para renderizar quantidade disponível (total de unidades ou volume)
  const renderDisponivelCell = (produto: Produto) => {
    // tenta usar volume_capacidade ou unidade_medida como capacidade
    const capStr = produto.volume_capacidade || produto.unidade_medida || '';
    const match = capStr.match(/(\d+(?:[.,]?\d*))\s*([A-Za-z]+)/);
    if (match) {
      const qty = parseFloat(match[1].replace(',', '.'));
      const unit = match[2].toUpperCase();
      let total = produto.estoque_atual * qty;
      let displayUnit = unit;
      // se a unidade for MIL, converte para UN (mil = 1000 unidades)
      if (unit === 'MIL') {
        total = produto.estoque_atual * qty * 1000;
        displayUnit = 'UN';
      }
      return `${total.toLocaleString('pt-BR')} ${displayUnit}`;
    }
    // fallback para caso não haja padrão numérico
    return `${produto.estoque_atual.toLocaleString('pt-BR')} ${produto.unidade_medida}`;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4 w-full p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    <Boxes className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Gestão de Produtos
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Controle unificado de insumos, embalagens e medicamentos
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur-3xl opacity-20" />
                  <Package className="h-32 w-32 text-blue-600/20" />
                </div>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
              <Card className="border-0 shadow-sm bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Total de Produtos</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{totalProdutos}</p>
                    </div>
                    <Boxes className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Alopáticos</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">{totalAlopaticos}</p>
                    </div>
                    <FlaskConical className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Embalagens</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-500">{totalEmbalagens}</p>
                    </div>
                    <Package2 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Homeopáticos</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-500">{totalHomeopaticos}</p>
                    </div>
                    <FlaskConical className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Revenda</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{totalRevenda}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">Estoque Baixo</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-500">{lowStockCount}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Filtros e Ações */}
        <div className="px-6 w-full">
          <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm w-full">
            <CardHeader>
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar produtos..."
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
                      <SelectItem value="MEDICAMENTO">Medicamento</SelectItem>
                      <SelectItem value="COSMÉTICO">Cosmético</SelectItem>
                      <SelectItem value="INSUMO">Insumo</SelectItem>
                      <SelectItem value="EMBALAGEM">Embalagem</SelectItem>
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

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas categorias</SelectItem>
                      <SelectItem value="alopaticos">Alopáticos</SelectItem>
                      <SelectItem value="cosmeticos">Cosméticos</SelectItem>
                      <SelectItem value="homeopaticos">Homeopáticos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Importar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                  <Button onClick={handleAddNew} className="bg-gradient-to-r from-blue-500 to-indigo-500">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Produto
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Lista de Produtos com Abas */}
        <div className="px-6 w-full">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todos ({totalProdutos})</TabsTrigger>
              <TabsTrigger value="alopaticos">Alopáticos ({totalAlopaticos})</TabsTrigger>
              <TabsTrigger value="embalagens">Embalagens ({totalEmbalagens})</TabsTrigger>
              <TabsTrigger value="homeopaticos">Homeopáticos ({totalHomeopaticos})</TabsTrigger>
              <TabsTrigger value="revenda">Revenda ({totalRevenda})</TabsTrigger>
            </TabsList>

            <TabsContent value={currentTab} className="mt-6">
              <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm w-full">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Boxes className="h-5 w-5 text-blue-600" />
                        Lista de Produtos
                      </CardTitle>
                      <CardDescription>
                        {filteredProdutos.length} produto(s) encontrado(s)
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      {filteredProdutos.length} itens
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar produtos</h3>
                      <p className="text-muted-foreground mb-4">{(error as Error)?.message || 'Tente novamente mais tarde'}</p>
                      <Button variant="outline" onClick={() => window.location.reload()}>
                        Tentar novamente
                      </Button>
                    </div>
                  ) : filteredProdutos.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                          ? 'Tente ajustar os filtros de busca'
                          : 'Comece criando seu primeiro produto'
                        }
                      </p>
                      <Button onClick={handleAddNew} className="bg-gradient-to-r from-blue-500 to-indigo-500">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Produto
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border w-full overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Total Unidades</TableHead>
                            <TableHead>Valor Compra NF</TableHead>
                            <TableHead>Total do Item</TableHead>
                            <TableHead>Valor Total NF</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProdutos.map((produto: Produto) => {
                            const stockStatus = getStockStatus(produto.estoque_atual, produto.estoque_minimo);
                            
                            return (
                              <TableRow key={produto.id}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{produto.nome}</span>
                                    {produto.volume_capacidade && (
                                      <span className="text-sm text-muted-foreground">
                                        {produto.volume_capacidade}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={cn("flex items-center gap-1 w-fit", getTypeColor(produto.tipo))}
                                  >
                                    {getTypeIcon(produto.tipo)}
                                    {produto.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={cn("w-fit", 
                                      produto.categoria === 'alopaticos' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                      produto.categoria === 'cosmeticos' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                                      produto.categoria === 'homeopaticos' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                      'bg-gray-50 text-gray-700 border-gray-200'
                                    )}
                                  >
                                    {produto.categoria === 'alopaticos' ? 'Alopáticos' :
                                     produto.categoria === 'cosmeticos' ? 'Cosméticos' :
                                     produto.categoria === 'homeopaticos' ? 'Homeopáticos' :
                                     produto.categoria || 'Não categorizado'
                                    }
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {renderDisponivelCell(produto)}
                                </TableCell>
                                <TableCell>
                                  {produto.valor_compra_nf ? 
                                    formatCurrency(produto.valor_compra_nf) : 
                                    'Não informado'
                                  }
                                </TableCell>
                                <TableCell>
                                  {produto.valor_total_item_nf != null ?
                                    formatCurrency(produto.valor_total_item_nf) :
                                    '-'
                                  }
                                </TableCell>
                                <TableCell>
                                  {produto.valor_total_nota ? 
                                    formatCurrency(produto.valor_total_nota) : 
                                    'Não informado'
                                  }
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={stockStatus === 'critical' ? 'destructive' : 
                                            stockStatus === 'warning' ? 'secondary' : 'default'}
                                    className="flex items-center gap-1 w-fit"
                                  >
                                    {stockStatus === 'critical' ? (
                                      <AlertTriangle className="h-3 w-3" />
                                    ) : stockStatus === 'warning' ? (
                                      <Clock className="h-3 w-3" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3" />
                                    )}
                                    {stockStatus === 'critical' ? 'Crítico' : 
                                     stockStatus === 'warning' ? 'Baixo' : 'Normal'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => navigate(`/admin/estoque/produtos/${produto.id}`)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Visualizar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEdit(produto.id, produto.tipo)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(produto)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remover
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o produto "{produtoToDelete?.nome}"? 
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
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default ProdutosPage; 