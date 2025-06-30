import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  PlayCircle,
  CheckCircle,
  Package,
  XCircle,
  Edit,
  FileText,
  User,
  Calendar,
  DollarSign,
  Pill,
  AlertCircle,
  History,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

interface OrdemProducaoDetalhes {
  id: string;
  numero_ordem: string;
  status: string;
  prioridade: string;
  receita_id?: string;
  usuario_responsavel_id?: string;
  farmaceutico_responsavel_id?: string;
  observacoes_gerais?: string;
  data_criacao: string;
  data_finalizacao?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  'pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'em_preparacao': 'bg-blue-100 text-blue-800 border-blue-200',
  'em_manipulacao': 'bg-purple-100 text-purple-800 border-purple-200',
  'controle_qualidade': 'bg-orange-100 text-orange-800 border-orange-200',
  'finalizada': 'bg-green-100 text-green-800 border-green-200',
  'cancelada': 'bg-red-100 text-red-800 border-red-200'
};

const statusIcons = {
  'pendente': Clock,
  'em_preparacao': PlayCircle,
  'em_manipulacao': PlayCircle,
  'controle_qualidade': CheckCircle,
  'finalizada': Package,
  'cancelada': XCircle
};

const DetalhesOrdemProducaoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [ordem, setOrdem] = useState<OrdemProducaoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrdem();
    }
  }, [id]);

  const loadOrdem = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ordens_producao')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setOrdem(data);

    } catch (error) {
      console.error('Erro ao carregar ordem:', error);
      toast({
        title: "Erro ao carregar ordem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      navigate('/admin/producao');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (novoStatus: string) => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase.functions.invoke(`gerenciar-ordens-producao/${id}/status`, {
        body: { status: novoStatus }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Status atualizado",
          description: `Ordem alterada para ${novoStatus}`,
        });
        
        // Recarregar dados
        loadOrdem();
      } else {
        throw new Error(data.error || 'Erro ao atualizar status');
      }

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return <Icon className="h-5 w-5" />;
  };

  const getNextActions = (currentStatus: string) => {
    const actions = [];
    
    switch (currentStatus) {
      case 'PENDENTE':
        actions.push({
          label: 'Iniciar Produção',
          status: 'EM_PRODUCAO',
          icon: PlayCircle,
          color: 'bg-blue-600 hover:bg-blue-700'
        });
        break;
        
      case 'EM_PRODUCAO':
        actions.push({
          label: 'Marcar como Pronta',
          status: 'PRONTA',
          icon: CheckCircle,
          color: 'bg-green-600 hover:bg-green-700'
        });
        break;
        
      case 'PRONTA':
        actions.push({
          label: 'Marcar como Entregue',
          status: 'ENTREGUE',
          icon: Package,
          color: 'bg-purple-600 hover:bg-purple-700'
        });
        break;
    }
    
    return actions;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando ordem...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!ordem) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Ordem não encontrada</h3>
            <p className="text-gray-600 mb-4">A ordem solicitada não foi encontrada.</p>
            <Button onClick={() => navigate('/admin/producao')}>
              Voltar para Produção
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const nextActions = getNextActions(ordem.status);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/producao')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Link to="/admin/producao" className="hover:text-violet-600">
                  Produção
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span>Detalhes da Ordem</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Ordem #{ordem.numero_ordem}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {nextActions.map((action) => (
              <Button
                key={action.status}
                onClick={() => handleUpdateStatus(action.status)}
                className={`${action.color} text-white`}
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Número da Ordem</label>
                    <p className="text-lg font-semibold">{ordem.numero_ordem}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status Atual</label>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className={`${statusColors[ordem.status as keyof typeof statusColors]} text-base px-3 py-1`}
                      >
                        <span className="flex items-center gap-2">
                          {getStatusIcon(ordem.status)}
                          {ordem.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cliente</label>
                    <p className="text-lg">{ordem.cliente_nome || 'Não informado'}</p>
                    {ordem.cliente_documento && (
                      <p className="text-sm text-gray-500">{ordem.cliente_documento}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Valor Total</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(ordem.valor_total)}
                    </p>
                  </div>
                </div>

                {ordem.observacoes_gerais && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Observações</label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md text-gray-700">
                      {ordem.observacoes_gerais}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medicamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medicamentos ({ordem.ordem_producao_itens?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordem.ordem_producao_itens && ordem.ordem_producao_itens.length > 0 ? (
                  <div className="space-y-4">
                    {ordem.ordem_producao_itens.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">
                              {index + 1}. {item.medicamento_nome}
                            </h4>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Forma:</span>
                                <p>{item.forma_farmaceutica || 'Não especificada'}</p>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-600">Quantidade:</span>
                                <p>{item.quantidade} {item.unidade || 'unidades'}</p>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-600">Valor Unit.:</span>
                                <p>{formatCurrency(item.valor_unitario)}</p>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-600">Valor Total:</span>
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(item.valor_total)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum medicamento cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Ordem Criada</p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(ordem.data_criacao)}
                      </p>
                    </div>
                  </div>

                  {ordem.data_inicio_producao && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <PlayCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">Produção Iniciada</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(ordem.data_inicio_producao)}
                        </p>
                      </div>
                    </div>
                  )}

                  {ordem.data_conclusao && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">Produção Concluída</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(ordem.data_conclusao)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">ID da Ordem:</span>
                  <p className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
                    {ordem.id}
                  </p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600">Criado em:</span>
                  <p>{formatDateTime(ordem.created_at)}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600">Última atualização:</span>
                  <p>{formatDateTime(ordem.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DetalhesOrdemProducaoPage; 