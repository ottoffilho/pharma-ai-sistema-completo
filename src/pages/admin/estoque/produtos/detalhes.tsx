import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Edit, 
  ArrowLeft, 
  Package, 
  FlaskConical, 
  Package2, 
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Truck
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DetalhesProdutoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Buscar produto
  const { data: produto, isLoading, error } = useQuery({
    queryKey: ['produto', id],
    queryFn: async () => {
      if (!id) throw new Error('ID do produto não fornecido');
      
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          fornecedores(nome),
          lote(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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
        return <Package2 className="h-5 w-5" />;
      case 'MEDICAMENTO':
        return <Sparkles className="h-5 w-5" />;
      default:
        return <FlaskConical className="h-5 w-5" />;
    }
  };

  // Função para obter cor por tipo
  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'EMBALAGEM':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDICAMENTO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PRINCIPIO_ATIVO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EXCIPIENTE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleVoltar = () => {
    navigate('/admin/estoque/produtos');
  };

  const handleEditar = () => {
    navigate(`/admin/estoque/produtos/editar/${id}`);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6 w-full p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !produto) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Erro ao carregar produto
            </h3>
            <p className="text-muted-foreground mb-4">
              {error?.message || 'Produto não encontrado'}
            </p>
            <Button onClick={handleVoltar}>
              Voltar para Lista
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const stockStatus = getStockStatus(produto.estoque_atual, produto.estoque_minimo);

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
                    <Eye className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {produto.nome}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge 
                        variant="outline" 
                        className={cn("flex items-center gap-1", getTypeColor(produto.tipo))}
                      >
                        {getTypeIcon(produto.tipo)}
                        {produto.tipo}
                      </Badge>
                      {produto.subtipo && (
                        <Badge variant="secondary">
                          {produto.subtipo}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleVoltar}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleEditar}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Informações Rápidas */}
        <div className="px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estoque Atual</p>
                    <p className="text-2xl font-bold">{produto.estoque_atual} {produto.unidade_medida}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Custo Unitário</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(produto.preco_custo)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Preço de Venda</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {produto.preco_venda ? formatCurrency(produto.preco_venda) : '-'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status Estoque</p>
                    <Badge 
                      variant={stockStatus === 'critical' ? 'destructive' : 
                              stockStatus === 'warning' ? 'secondary' : 'default'}
                      className="flex items-center gap-1 w-fit mt-1"
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detalhes Completos */}
        <div className="px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p className="text-sm">{produto.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                    <p className="text-sm">{produto.tipo}</p>
                  </div>
                  {produto.subtipo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subtipo</p>
                      <p className="text-sm">{produto.subtipo}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unidade</p>
                    <p className="text-sm">{produto.unidade_medida}</p>
                  </div>
                  {produto.volume_capacidade && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Volume/Capacidade</p>
                      <p className="text-sm">{produto.volume_capacidade}</p>
                    </div>
                  )}
                </div>
                {produto.descricao && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Descrição</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{produto.descricao}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Precificação */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Precificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Custo Unitário</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(produto.preco_custo)}
                    </p>
                  </div>
                  {produto.frete_unitario && produto.frete_unitario > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Frete Unitário</p>
                      <p className="text-lg font-semibold text-orange-600">
                        {formatCurrency(produto.frete_unitario)}
                      </p>
                    </div>
                  )}
                  {produto.custo_efetivo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Custo Total</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatCurrency(produto.custo_efetivo)}
                      </p>
                    </div>
                  )}
                  {produto.markup && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Markup</p>
                      <p className="text-lg font-semibold">{produto.markup}x</p>
                    </div>
                  )}
                  {produto.preco_venda && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Preço de Venda</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {formatCurrency(produto.preco_venda)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estoque */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  Controle de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Atual</p>
                    <p className="text-lg font-semibold">{produto.estoque_atual}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mínimo</p>
                    <p className="text-lg font-semibold text-red-600">{produto.estoque_minimo}</p>
                  </div>
                  {produto.estoque_maximo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Máximo</p>
                      <p className="text-lg font-semibold text-blue-600">{produto.estoque_maximo}</p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Status do Estoque</p>
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
                    {stockStatus === 'critical' ? 'Estoque Crítico - Reposição Urgente' : 
                     stockStatus === 'warning' ? 'Estoque Baixo - Atenção' : 'Estoque Normal'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Fornecedor */}
            {produto.fornecedores && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-indigo-600" />
                    Fornecedor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p className="text-lg font-semibold">{produto.fornecedores.nome}</p>
                  </div>
                  {produto.fornecedores.documento && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Documento</p>
                      <p className="text-sm">{produto.fornecedores.documento}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {produto.fornecedores.telefone && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                        <p className="text-sm">{produto.fornecedores.telefone}</p>
                      </div>
                    )}
                    {produto.fornecedores.email && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-sm">{produto.fornecedores.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Informações de Sistema */}
        <div className="px-6 pb-6 w-full">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">ID do Produto</p>
                  <p className="font-mono text-xs bg-gray-100 p-1 rounded">{produto.id}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Criado em</p>
                  <p>{new Date(produto.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Atualizado em</p>
                  <p>{new Date(produto.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>
                {produto.observacoes_custo && (
                  <div>
                    <p className="font-medium text-muted-foreground">Obs. de Custo</p>
                    <p className="text-xs">{produto.observacoes_custo}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DetalhesProdutoPage; 