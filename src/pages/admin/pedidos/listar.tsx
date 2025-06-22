import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Calendar,
  User,
  FileText,
  DollarSign,
  Truck,
  Plus,
  ArrowLeft,
  FileSearch,
  ListFilter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parse, format } from 'date-fns';

interface Pedido {
  id: string;               // ID da tabela pedidos
  recipe_id: string;        // ID da receita processada
  status: string;
  total_amount: number;
  estimated_delivery_date: string | null;
  channel: string;
  notes: string;
  created_at: string;
  patient_name: string;
  prescriber_name: string;
  medications: Array<{
    name: string;
    quantity: string;
    instructions: string;
  }>;
}

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300', icon: FileText },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  validated: { label: 'Validado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  in_production: { label: 'Em Produção', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
  ready: { label: 'Pronto', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
  delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: Truck },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle }
};

const ListarPedidosPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      setLoading(true);

      // Buscar diretamente da tabela de pedidos, trazendo dados relacionados da receita processada
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          processed_recipe_id,
          status,
          total_amount,
          estimated_delivery_date,
          channel,
          notes,
          created_at,
          receitas_processadas (
            patient_name,
            prescriber_name,
            medications
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        toast.error('Erro ao carregar pedidos');
        return;
      }

      const pedidosFormatados = (data || []).map((pedido: any) => ({
        id: pedido.id,
        recipe_id: pedido.processed_recipe_id,
        status: pedido.status || 'draft',
        total_amount: pedido.total_amount || 0,
        estimated_delivery_date: pedido.estimated_delivery_date,
        channel: pedido.channel || 'IA',
        notes: pedido.notes || '',
        created_at: pedido.created_at,
        patient_name: pedido.receitas_processadas?.patient_name || 'N/A',
        prescriber_name: pedido.receitas_processadas?.prescriber_name || 'N/A',
        medications: pedido.receitas_processadas?.medications || []
      }));

      setPedidos(pedidosFormatados);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = 
      (pedido.patient_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.prescriber_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (pedido.recipe_id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pedido.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      const parsed = parse(dateString, 'yyyy-MM-dd', new Date());
      return format(parsed, 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMGI5ODEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40 dark:opacity-20" />
          
          <div className="relative px-6 py-16">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <Link to="/admin/pedidos" className="bg-blue-50/80 dark:bg-blue-900/30 p-2 rounded-full shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </Link>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-xl opacity-20" />
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                      <ListFilter className="h-8 w-8" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      Listagem de Pedidos
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                      Visualize, filtre e gerencie todos os pedidos de medicamentos manipulados
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 px-3 py-1">
                    <Package className="h-3 w-3 mr-1" />
                    Gestão Completa
                  </Badge>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 px-3 py-1">
                    <Clock className="h-3 w-3 mr-1" />
                    Acompanhamento
                  </Badge>
                  <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50 px-3 py-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Controle de Status
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles e Filtros */}
        <div className="px-6 w-full">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm w-full">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
                    <Search className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Filtros e Busca</CardTitle>
                    <CardDescription className="mt-1">
                      Encontre pedidos específicos rapidamente
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to="/admin/pedidos">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar ao Dashboard
                    </Link>
                  </Button>
                  <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    <Link to="/admin/pedidos/nova-receita">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Receita
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por paciente, médico ou ID do pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="validated">Validado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                      <SelectItem value="in_production">Em Produção</SelectItem>
                      <SelectItem value="ready">Pronto</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pedidos List */}
        <div className="px-6 w-full">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm w-full">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Lista de Pedidos</CardTitle>
                  <CardDescription className="mt-1">
                    {filteredPedidos.length} pedido(s) encontrado(s)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Carregando pedidos...</p>
                </div>
              ) : filteredPedidos.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</p>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando seu primeiro pedido'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredPedidos.map((pedido) => (
                    <div key={pedido.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-500">ID:</span>
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {pedido.id.slice(0, 8)}...
                              </code>
                            </div>
                            {getStatusBadge(pedido.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{pedido.patient_name}</p>
                                <p className="text-xs text-gray-500">Paciente</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{pedido.prescriber_name}</p>
                                <p className="text-xs text-gray-500">Prescritor</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{formatCurrency(pedido.total_amount)}</p>
                                <p className="text-xs text-gray-500">Valor Total</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{formatDate(pedido.estimated_delivery_date)}</p>
                                <p className="text-xs text-gray-500">Entrega Prevista</p>
                              </div>
                            </div>
                          </div>
                          
                          {pedido.medications && pedido.medications.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-2">Medicamentos:</p>
                              <div className="flex flex-wrap gap-2">
                                {pedido.medications.slice(0, 3).map((med, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {med.name} - {med.quantity}
                                  </Badge>
                                ))}
                                {pedido.medications.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{pedido.medications.length - 3} mais
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {pedido.notes && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 italic">"{pedido.notes}"</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/pedidos/${pedido.recipe_id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/pedidos/${pedido.recipe_id}/editar`}>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ListarPedidosPage; 