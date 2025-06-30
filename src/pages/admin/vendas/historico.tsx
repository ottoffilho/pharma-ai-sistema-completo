import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Calendar, 
  Filter, 
  Eye, 
  Printer, 
  Download, 
  History,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { vendasService } from '@/services/vendasService';
import { Venda } from '@/types/vendas';
import { useToast } from '@/hooks/use-toast';
import { useVendas } from '@/hooks/useVendas';
import AdminLayout from '@/components/layouts/AdminLayout';

export default function HistoricoVendas() {
  const [filteredVendas, setFilteredVendas] = useState<Venda[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const { 
    vendas, 
    isLoading, 
    formatarDinheiro, 
    carregarVendas 
  } = useVendas();
  
  const { toast } = useToast();

  useEffect(() => {
    filterVendas();
  }, [vendas, searchTerm, statusFilter, paymentFilter, dateRange]);

  const filterVendas = () => {
    let filtered = vendas;

    // Filtro por data
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(venda => {
        const vendaDate = new Date(venda.data_venda);
        return vendaDate >= dateRange.from && vendaDate <= dateRange.to;
      });
    }

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(venda =>
        venda.numero_venda.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venda.cliente_documento?.includes(searchTerm)
      );
    }

    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(venda => venda.status === statusFilter);
    }

    // Filtro por status de pagamento
    if (paymentFilter !== 'todos') {
      filtered = filtered.filter(venda => venda.status_pagamento === paymentFilter);
    }

    setFilteredVendas(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalizada': return 'default';
      case 'cancelada': return 'destructive';
      case 'aberta': return 'secondary';
      default: return 'outline';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'default';
      case 'pendente': return 'secondary';
      case 'parcial': return 'outline';
      case 'cancelado': return 'destructive';
      default: return 'outline';
    }
  };

  const showDetails = async (venda: Venda) => {
    try {
      const vendaCompleta = await vendasService.obterVenda(venda.id);
      setSelectedVenda(vendaCompleta);
      setDetailsOpen(true);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar detalhes da venda',
        variant: 'destructive'
      });
    }
  };

  const handlePrint = (venda: Venda) => {
    toast({
      title: 'Impressão',
      description: 'Preparando venda para impressão...'
    });
  };

  const handleExport = () => {
    toast({
      title: 'Exportação',
      description: 'Preparando exportação...'
    });
  };

  const totalVendas = filteredVendas.length;
  const totalValor = filteredVendas.reduce((sum, venda) => sum + Number(venda.total), 0);
  const vendasFinalizadas = filteredVendas.filter(v => v.status === 'finalizada').length;
  const ticketMedio = totalVendas > 0 ? totalValor / totalVendas : 0;

  return (
    <AdminLayout>
      <div>
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
          <div className="relative px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <History className="h-10 w-10 text-blue-600" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Histórico de Vendas
                    </h1>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    Consulte e analise todas as vendas realizadas com filtros avançados, 
                    relatórios detalhados e insights de performance.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur-3xl opacity-20" />
                    <History className="h-48 w-48 text-blue-600/20" />
                  </div>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Total de Vendas</span>
                      <Search className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      {isLoading ? (
                        <Skeleton className="h-6 w-24" />
                      ) : (
                        <span className="text-2xl font-bold">{totalVendas}</span>
                      )}
                      <span className="text-sm font-medium text-green-600">
                        no período
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Vendas Finalizadas</span>
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      {isLoading ? (
                        <Skeleton className="h-6 w-24" />
                      ) : (
                        <span className="text-2xl font-bold">{vendasFinalizadas}</span>
                      )}
                      <span className="text-sm font-medium text-green-600">
                        {totalVendas > 0 ? Math.round((vendasFinalizadas / totalVendas) * 100) : 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Valor Total</span>
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      {isLoading ? (
                        <Skeleton className="h-6 w-24" />
                      ) : (
                        <span className="text-2xl font-bold">{formatarDinheiro(totalValor)}</span>
                      )}
                      <span className="text-sm font-medium text-green-600">
                        +12.5%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Ticket Médio</span>
                      <Filter className="h-4 w-4 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      {isLoading ? (
                        <Skeleton className="h-6 w-24" />
                      ) : (
                        <span className="text-2xl font-bold">{formatarDinheiro(ticketMedio)}</span>
                      )}
                      <span className="text-sm font-medium text-green-600">
                        +5.8%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="px-6 pb-16">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Filtros de Busca</CardTitle>
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar</label>
                    <Input
                      placeholder="Número, cliente ou documento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status da Venda</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="finalizada">Finalizada</SelectItem>
                        <SelectItem value="aberta">Aberta</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status Pagamento</label>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="parcial">Parcial</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Período</label>
                    <DatePickerWithRange
                      from={dateRange.from}
                      to={dateRange.to}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setDateRange({ from: range.from, to: range.to });
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Vendas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vendas Encontradas</CardTitle>
                    <CardDescription>
                      {isLoading ? (
                        <Skeleton className="h-4 w-64" />
                      ) : (
                        `${filteredVendas.length} vendas encontradas no período selecionado`
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVendas.map((venda) => (
                          <TableRow key={venda.id}>
                            <TableCell className="font-mono">
                              {venda.numero_venda}
                            </TableCell>
                            <TableCell>
                              {format(new Date(venda.data_venda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{venda.cliente_nome || 'Cliente não informado'}</div>
                                {venda.cliente_documento && (
                                  <div className="text-sm text-muted-foreground">{venda.cliente_documento}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatarDinheiro(Number(venda.total))}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(venda.status)}>
                                {venda.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getPaymentStatusColor(venda.status_pagamento)}>
                                {venda.status_pagamento}
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
                                  <DropdownMenuItem onClick={() => showDetails(venda)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePrint(venda)}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimir
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

        {/* Dialog de Detalhes */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Detalhes da Venda {selectedVenda?.numero_venda}
              </DialogTitle>
            </DialogHeader>
            {selectedVenda && (
              <div className="space-y-6">
                {/* Conteúdo do dialog mantido igual */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Informações Gerais</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Data:</span>
                        <span>{format(new Date(selectedVenda.data_venda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={getStatusColor(selectedVenda.status)}>
                          {selectedVenda.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Pagamento:</span>
                        <Badge variant={getPaymentStatusColor(selectedVenda.status_pagamento)}>
                          {selectedVenda.status_pagamento}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Cliente</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Nome:</span>
                        <span>{selectedVenda.cliente_nome || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Documento:</span>
                        <span>{selectedVenda.cliente_documento || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Resumo Financeiro</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold">{formatarDinheiro(Number(selectedVenda.subtotal))}</div>
                      <div className="text-muted-foreground">Subtotal</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-semibold">{formatarDinheiro(Number(selectedVenda.desconto_valor))}</div>
                      <div className="text-muted-foreground">Desconto</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-800/20 rounded-lg">
                      <div className="font-semibold text-green-600">{formatarDinheiro(Number(selectedVenda.total))}</div>
                      <div className="text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 