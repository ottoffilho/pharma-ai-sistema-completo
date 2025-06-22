// =====================================================
// PÁGINA DE GESTÃO DE LOTES - PHARMA.AI
// Módulo M04 - Gestão de Estoque
// =====================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Calendar,
  Package,
  Building2,
  Eye,
  Edit,
  Trash2,
  Layers,
  BarChart3,
  Clock,
  CheckCircle,
  TrendingUp,
  Boxes
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { loteService } from '@/services/loteService';
import type { FiltrosLote, PaginacaoLote } from '@/services/loteService';
import AdminLayout from '@/components/layouts/AdminLayout';

// Definindo interface para lote
interface LoteExtended {
  numero_lote: string;
  data_validade: string | null;
  produto?: {
    nome: string;
  };
  fornecedor?: {
    nome: string;
  };
  quantidade: number;
  id: string;
  [key: string]: unknown;
}

const LotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosLote>({});
  const [busca, setBusca] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [paginacao, setPaginacao] = useState<PaginacaoLote>({
    pagina: 1,
    itensPorPagina: 20
  });

  // Estados para dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loteToEdit, setLoteToEdit] = useState<LoteExtended | null>(null);
  const [loteToDelete, setLoteToDelete] = useState<LoteExtended | null>(null);

  // Buscar lotes com filtros
  const { data: lotesData, isLoading, refetch } = useQuery({
    queryKey: ['lotes', filtros, paginacao],
    queryFn: () => loteService.listarLotes(filtros, paginacao),
    onError: (error: Error) => {
      console.error('Erro ao carregar lotes:', error);
      toast({
        title: "Erro ao carregar",
        description: "Ocorreu um erro ao carregar os lotes. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  });

  // Buscar lotes próximos do vencimento
  const { data: lotesVencimentoProximo } = useQuery({
    queryKey: ['lotes-vencimento-proximo'],
    queryFn: () => loteService.buscarLotesProximosVencimento(30),
  });

  // Buscar lotes vencidos
  const { data: lotesVencidos } = useQuery({
    queryKey: ['lotes-vencidos'],
    queryFn: () => loteService.buscarLotesVencidos(),
  });

  const lotes = lotesData?.dados || [];
  const totalLotes = lotesData?.total || 0;
  const totalPaginas = lotesData?.totalPaginas || 0;

  // Função para verificar se um lote está próximo do vencimento
  const isExpiring = (dataValidade: string) => {
    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diasParaVencer = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diasParaVencer <= 30 && diasParaVencer > 0;
  };

  // Função para determinar status do lote
  const getStatusLote = (lote: LoteExtended) => {
    if (!lote.data_validade) return { status: 'sem-validade', label: 'Sem validade', variant: 'secondary' as const };
    
    const hoje = new Date();
    const dataValidade = new Date(lote.data_validade);
    const diasParaVencer = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasParaVencer < 0) {
      return { status: 'vencido', label: 'Vencido', variant: 'destructive' as const };
    } else if (diasParaVencer <= 30) {
      return { status: 'vencimento-proximo', label: 'Vence em breve', variant: 'outline' as const };
    } else {
      return { status: 'valido', label: 'Válido', variant: 'default' as const };
    }
  };

  // Aplicar filtro de busca
  const aplicarFiltros = () => {
    const novosFiltros: FiltrosLote = {};
    
    if (busca) {
      novosFiltros.numero_lote = busca;
    }
    
    setFiltros(novosFiltros);
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  };

  // Limpar filtros
  const limparFiltros = () => {
    setBusca('');
    setFilterStatus('all');
    setFiltros({});
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  };

  // Filtrar lotes baseado na busca
  const filteredLotes = lotes?.filter((lote: LoteExtended) => {
    const matchesSearch = lote.numero_lote?.toLowerCase().includes(busca.toLowerCase()) ||
                         lote.produto?.nome?.toLowerCase().includes(busca.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'valid' && lote.data_validade && new Date(lote.data_validade) > new Date()) ||
                         (filterStatus === 'expired' && lote.data_validade && new Date(lote.data_validade) <= new Date()) ||
                         (filterStatus === 'expiring' && lote.data_validade && isExpiring(lote.data_validade));
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Função para editar lote
  const handleEditLote = (lote: LoteExtended) => {
    setLoteToEdit(lote);
    setEditDialogOpen(true);
  };

  // Função para excluir lote
  const handleDeleteLote = (lote: LoteExtended) => {
    setLoteToDelete(lote);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="w-full">
        {/* Hero Section */}
        <div className="relative w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                    <Boxes className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      Gestão de Lotes
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Controle completo de rastreabilidade e validade
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 blur-3xl opacity-20" />
                  <Layers className="h-32 w-32 text-orange-600/20" />
                </div>
              </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total de Lotes</p>
                      <p className="text-2xl font-bold dark:text-white">{totalLotes}</p>
                    </div>
                    <Package className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Vencimento Próximo</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{lotesVencimentoProximo?.length || 0}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Lotes Vencidos</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-500">{lotesVencidos?.length || 0}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Taxa de Conformidade</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                        {totalLotes > 0 ? Math.round(((totalLotes - (lotesVencidos?.length || 0)) / totalLotes) * 100) : 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Ação Principal */}
        <div className="px-6 w-full -mt-6">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Adicionar Novo Lote</h3>
                  <p className="text-orange-100">
                    Registre um novo lote com rastreabilidade completa e controle de validade
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/admin/estoque/lotes/novo')}
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-orange-50 shadow-md"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Novo Lote
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="px-6 w-full">
          <Card className="border-0 shadow-sm w-full dark:bg-slate-900/70">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20">
                  <Filter className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Filtros de Pesquisa</CardTitle>
                  <CardDescription>
                    Encontre lotes específicos usando os filtros abaixo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Buscar por número do lote ou produto</label>
                  <Input
                    placeholder="Digite o número do lote ou nome do produto..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
                    className="mt-1"
                  />
                </div>
                <div className="min-w-[180px]">
                  <label className="text-sm font-medium">Status do Lote</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="valid">Válidos</SelectItem>
                      <SelectItem value="expiring">Vencimento Próximo</SelectItem>
                      <SelectItem value="expired">Vencidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={aplicarFiltros} className="bg-orange-600 hover:bg-orange-700">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={limparFiltros}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Lotes */}
        <div className="px-6 w-full">
          <Card className="border-0 shadow-sm w-full dark:bg-slate-900/70">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Lotes Cadastrados</CardTitle>
                  <CardDescription>
                    Lista completa de todos os lotes de insumos e produtos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                  <p className="text-muted-foreground">Carregando lotes...</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-orange-50 dark:bg-orange-950/20">
                      <TableRow>
                        <TableHead className="font-semibold">Número do Lote</TableHead>
                        <TableHead className="font-semibold">Produto/Insumo</TableHead>
                        <TableHead className="font-semibold">Fornecedor</TableHead>
                        <TableHead className="font-semibold">
                          <div className="flex flex-col">
                            <span>Quantidade</span>
                            <span className="text-xs font-normal text-muted-foreground">Disponível</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">Data de Validade</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLotes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center gap-4">
                              <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
                                <Package className="h-12 w-12 text-orange-600" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-lg font-medium text-muted-foreground">Nenhum lote encontrado</p>
                                <p className="text-sm text-muted-foreground">
                                  {filtros.numero_lote || filterStatus !== 'all' 
                                    ? 'Tente ajustar os filtros de pesquisa'
                                    : 'Comece cadastrando o primeiro lote'
                                  }
                                </p>
                              </div>
                              <Button 
                                onClick={() => navigate('/admin/estoque/lotes/novo')}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Cadastrar primeiro lote
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLotes.map((lote) => {
                          const status = getStatusLote(lote as LoteExtended);
                          return (
                            <TableRow key={lote.id} className="hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                              <TableCell className="font-medium">
                                {lote.numero_lote}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {(lote as LoteExtended & { produtos?: { nome: string; codigo_interno?: string } }).produtos?.nome || 'Produto não encontrado'}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {(lote as LoteExtended & { produtos?: { nome: string; codigo_interno?: string } }).produtos?.codigo_interno}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  {(lote as LoteExtended & { fornecedor?: { nome: string } }).fornecedor?.nome || 'Não informado'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl font-bold text-blue-600">
                                        {Number(lote.quantidade_atual).toLocaleString('pt-BR', {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 3
                                        })}
                                      </span>
                                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                        {(lote as LoteExtended & { produtos?: { unidade_medida?: string } }).produtos?.unidade_medida || 'UN'}
                                      </span>
                                    </div>
                                    {/* Indicador simples de status */}
                                    {lote.quantidade_inicial > 0 && (
                                      <div className="flex items-center gap-1 mt-2">
                                        <div 
                                          className={`w-2 h-2 rounded-full ${
                                            (lote.quantidade_atual / lote.quantidade_inicial) > 0.5 
                                              ? 'bg-green-500' 
                                              : (lote.quantidade_atual / lote.quantidade_inicial) > 0.2 
                                                ? 'bg-yellow-500' 
                                                : 'bg-red-500'
                                          }`}
                                        />
                                        <span className="text-xs font-medium text-gray-600">
                                          {(lote.quantidade_atual / lote.quantidade_inicial) > 0.5 
                                            ? 'Estoque OK' 
                                            : (lote.quantidade_atual / lote.quantidade_inicial) > 0.2 
                                              ? 'Estoque baixo' 
                                              : 'Estoque crítico'
                                          }
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {lote.data_validade ? (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(lote.data_validade), 'dd/MM/yyyy', { locale: ptBR })}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Não informada</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status.variant}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/estoque/lotes/${lote.id}`)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/estoque/lotes/editar/${lote.id}`)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((paginacao.pagina - 1) * paginacao.itensPorPagina) + 1} a{' '}
                    {Math.min(paginacao.pagina * paginacao.itensPorPagina, totalLotes)} de{' '}
                    {totalLotes} lotes
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paginacao.pagina === 1}
                      onClick={() => setPaginacao(prev => ({ ...prev, pagina: prev.pagina! - 1 }))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paginacao.pagina === totalPaginas}
                      onClick={() => setPaginacao(prev => ({ ...prev, pagina: prev.pagina! + 1 }))}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Card Explicativo */}
        <div className="px-6 w-full mb-6">
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-blue-900 dark:text-blue-100 text-lg">Como Ler a Quantidade</CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    A coluna "Quantidade" mostra o estoque atual disponível de cada lote
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">150</div>
                  <div className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">UN</div>
                  <div className="text-sm text-gray-600">= 150 unidades disponíveis</div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">2.5</div>
                  <div className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">KG</div>
                  <div className="text-sm text-gray-600">= 2,5 quilogramas disponíveis</div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">1.000</div>
                  <div className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">ML</div>
                  <div className="text-sm text-gray-600">= 1.000 mililitros disponíveis</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Importantes */}
        <div className="px-6 w-full mb-10">
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <CheckCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-orange-900 dark:text-orange-100">Controle de Qualidade</CardTitle>
                  <CardDescription className="text-orange-700 dark:text-orange-300">
                    Monitoramento automático de lotes e alertas de vencimento
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Rastreabilidade
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 ml-6">
                    <li>• Controle FIFO automático</li>
                    <li>• Histórico completo de movimentações</li>
                    <li>• Integração com produção</li>
                    <li>• Relatórios de conformidade</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Alertas Automáticos
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 ml-6">
                    <li>• Vencimento em 30 dias</li>
                    <li>• Estoque baixo</li>
                    <li>• Lotes sem movimentação</li>
                    <li>• Validação de dados</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Controle de Estoque
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 ml-6">
                    <li>• <strong>Quantidade:</strong> Estoque disponível no lote</li>
                    <li>• <strong>🟢 Estoque OK:</strong> Lote bem abastecido</li>
                    <li>• <strong>🟡 Estoque baixo:</strong> Considere reposição</li>
                    <li>• <strong>🔴 Estoque crítico:</strong> Reposição urgente</li>
                    <li>• <strong>Unidade:</strong> Medida do produto (UN, ML, etc.)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LotesPage; 