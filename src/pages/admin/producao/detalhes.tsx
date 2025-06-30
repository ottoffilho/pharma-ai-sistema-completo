import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Package,
  Users,
  Calendar,
  DollarSign,
  FileText,
  TestTube,
  Timer,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
// Definir interface local para OrdemProducao
interface OrdemProducao {
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

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  em_preparacao: { label: 'Em Preparação', color: 'bg-blue-100 text-blue-800', icon: Clock },
  em_manipulacao: { label: 'Em Manipulação', color: 'bg-purple-100 text-purple-800', icon: Clock },
  controle_qualidade: { label: 'Controle de Qualidade', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  finalizada: { label: 'Finalizada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

const etapaStatusConfig = {
  pendente: { label: 'Pendente', color: 'bg-gray-100 text-gray-800', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800', icon: Play },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  pausada: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function DetalhesOrdemProducaoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para iniciar etapa
  const iniciarEtapaMutation = useMutation({
    mutationFn: async (etapaId: string) => {
      const { error } = await supabase
        .from('ordem_producao_etapas')
        .update({ 
          status: 'em_andamento',
          data_inicio: new Date().toISOString()
        })
        .eq('id', etapaId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Etapa iniciada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['ordem-producao', id] });
    },
    onError: (error) => {
      console.error('Erro ao iniciar etapa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao iniciar etapa.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para finalizar etapa
  const finalizarEtapaMutation = useMutation({
    mutationFn: async (etapaId: string) => {
      const { error } = await supabase
        .from('ordem_producao_etapas')
        .update({ 
          status: 'concluida',
          data_finalizacao: new Date().toISOString()
        })
        .eq('id', etapaId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Etapa finalizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['ordem-producao', id] });
    },
    onError: (error) => {
      console.error('Erro ao finalizar etapa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao finalizar etapa.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar status da ordem
  const atualizarStatusOrdemMutation = useMutation({
    mutationFn: async (novoStatus: string) => {
      const { error } = await supabase
        .from('ordens_producao')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Status da ordem atualizado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['ordem-producao', id] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da ordem.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar status das etapas
  const updateEtapaStatusMutation = useMutation({
    mutationFn: async ({ etapaId, status }: { etapaId: string; status: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'em_andamento') {
        updateData.data_inicio = new Date().toISOString();
      } else if (status === 'concluida') {
        updateData.data_fim = new Date().toISOString();
        
        // Calcular tempo real se tiver data de início
        const { data: etapa } = await supabase
          .from('ordem_producao_etapas')
          .select('data_inicio')
          .eq('id', etapaId)
          .single();
          
        if (etapa?.data_inicio) {
          const inicio = new Date(etapa.data_inicio);
          const fim = new Date();
          const tempoRealMinutos = Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60));
          updateData.tempo_real_minutos = tempoRealMinutos;
        }
      }

      const { error } = await supabase
        .from('ordem_producao_etapas')
        .update(updateData)
        .eq('id', etapaId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Status da etapa atualizado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['ordem-producao', id] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar etapa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da etapa.',
        variant: 'destructive',
      });
    },
  });

  const { data: ordem, isLoading, error } = useQuery({
    queryKey: ['ordem-producao', id],
    queryFn: async () => {
      if (!id) throw new Error('ID da ordem não fornecido');

      const { data, error } = await supabase
        .from('ordens_producao')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });



  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const calculateProgress = () => {
    if (!ordem?.ordem_producao_etapas) return 0;
    const totalEtapas = ordem.ordem_producao_etapas.length;
    const etapasConcluidas = ordem.ordem_producao_etapas.filter(e => e.status === 'concluida').length;
    return totalEtapas > 0 ? (etapasConcluidas / totalEtapas) * 100 : 0;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">Carregando detalhes da ordem...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !ordem) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                Erro ao carregar detalhes da ordem. Tente novamente.
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const statusInfo = statusConfig[ordem.status as keyof typeof statusConfig];
  const prioridadeInfo = prioridadeConfig[ordem.prioridade as keyof typeof prioridadeConfig];
  const StatusIcon = statusInfo?.icon || Clock;
  const progress = calculateProgress();

  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/producao')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Ordem {ordem.numero_ordem}</h1>
              <p className="text-muted-foreground">
                Detalhes da ordem de produção
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {ordem.status === 'pendente' && (
              <Button
                onClick={() => atualizarStatusOrdemMutation.mutate('em_preparacao')}
                disabled={atualizarStatusOrdemMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar Preparação
              </Button>
            )}
            {ordem.status === 'em_preparacao' && (
              <Button
                onClick={() => atualizarStatusOrdemMutation.mutate('em_manipulacao')}
                disabled={atualizarStatusOrdemMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar Manipulação
              </Button>
            )}
            {ordem.status === 'em_manipulacao' && (
              <Button
                onClick={() => atualizarStatusOrdemMutation.mutate('controle_qualidade')}
                disabled={atualizarStatusOrdemMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <TestTube className="mr-2 h-4 w-4" />
                Enviar para CQ
              </Button>
            )}
            {ordem.status === 'controle_qualidade' && (
              <Link to={`/admin/producao/${ordem.id}/controle-qualidade`}>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <TestTube className="mr-2 h-4 w-4" />
                  Controle de Qualidade
                </Button>
              </Link>
            )}
            <Link to={`/admin/producao/${ordem.id}/editar`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
          </div>
        </div>

        {/* Status e Progresso */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={statusInfo?.color}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusInfo?.label}
                  </Badge>
                </div>
                <StatusIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prioridade</p>
                  <Badge className={prioridadeInfo?.color}>
                    {prioridadeInfo?.label}
                  </Badge>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progresso</p>
                  <p className="text-2xl font-bold">{Math.round(progress)}%</p>
                  <Progress value={progress} className="mt-2" />
                </div>
                <Timer className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Custo Estimado</p>
                  <p className="text-2xl font-bold">{formatCurrency(ordem.custo_total_estimado)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com conteúdo detalhado */}
        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList>
            <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
            <TabsTrigger value="insumos">Insumos</TabsTrigger>
            <TabsTrigger value="embalagens">Embalagens</TabsTrigger>
            <TabsTrigger value="etapas">Etapas</TabsTrigger>
            <TabsTrigger value="qualidade">Controle de Qualidade</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Número da Ordem</label>
                    <p className="font-medium">{ordem.numero_ordem}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Paciente</label>
                    <p className="font-medium">{ordem.receitas_processadas?.patient_name || ordem.pedidos?.receitas_processadas?.patient_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Forma Farmacêutica</label>
                    <p className="font-medium">{ordem.forma_farmaceutica || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantidade Total</label>
                    <p className="font-medium">{ordem.quantidade_total} {ordem.unidade_medida}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tempo Estimado</label>
                    <p className="font-medium">{formatDuration(ordem.tempo_estimado_minutos)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Responsáveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Responsável</label>
                    <p className="font-medium">{ordem.usuarios_internos?.nome_completo || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{ordem.usuarios_internos?.cargo_perfil}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Farmacêutico Responsável</label>
                    <p className="font-medium">{ordem.farmaceutico?.nome_completo || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{ordem.farmaceutico?.cargo_perfil}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Datas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
                    <p className="font-medium">{formatDate(ordem.data_criacao)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Início da Produção</label>
                    <p className="font-medium">{formatDate(ordem.data_inicio_producao)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fim da Produção</label>
                    <p className="font-medium">{formatDate(ordem.data_fim_producao)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Entrega Prevista</label>
                    <p className="font-medium">{formatDate(ordem.data_prevista_entrega)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Custos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Custo Estimado</label>
                    <p className="font-medium">{formatCurrency(ordem.custo_total_estimado)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Custo Real</label>
                    <p className="font-medium">{formatCurrency(ordem.custo_total_real)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {(ordem.observacoes_gerais || ordem.instrucoes_especiais) && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Observações e Instruções</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ordem.observacoes_gerais && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Observações Gerais</label>
                      <p className="mt-1 text-sm">{ordem.observacoes_gerais}</p>
                    </div>
                  )}
                  {ordem.instrucoes_especiais && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Instruções Especiais</label>
                      <p className="mt-1 text-sm">{ordem.instrucoes_especiais}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insumos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Insumos Utilizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordem.ordem_producao_insumos && ordem.ordem_producao_insumos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead>Qtd. Necessária</TableHead>
                        <TableHead>Qtd. Utilizada</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Custo Unit.</TableHead>
                        <TableHead>Custo Total</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordem.ordem_producao_insumos.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.insumos?.nome || 'N/A'}
                          </TableCell>
                          <TableCell>{item.quantidade_necessaria}</TableCell>
                          <TableCell>{item.quantidade_utilizada || '-'}</TableCell>
                          <TableCell>{item.unidade_medida}</TableCell>
                          <TableCell>{formatCurrency(item.custo_unitario)}</TableCell>
                          <TableCell>{formatCurrency(item.custo_total)}</TableCell>
                          <TableCell>{item.observacoes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum insumo cadastrado para esta ordem.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embalagens">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Embalagens Utilizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordem.ordem_producao_embalagens && ordem.ordem_producao_embalagens.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Embalagem</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Qtd. Necessária</TableHead>
                        <TableHead>Qtd. Utilizada</TableHead>
                        <TableHead>Custo Unit.</TableHead>
                        <TableHead>Custo Total</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordem.ordem_producao_embalagens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.embalagens?.nome || 'N/A'}
                          </TableCell>
                          <TableCell>{item.embalagens?.tipo || 'N/A'}</TableCell>
                          <TableCell>{item.quantidade_necessaria}</TableCell>
                          <TableCell>{item.quantidade_utilizada || '-'}</TableCell>
                          <TableCell>{formatCurrency(item.custo_unitario)}</TableCell>
                          <TableCell>{formatCurrency(item.custo_total)}</TableCell>
                          <TableCell>{item.observacoes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma embalagem cadastrada para esta ordem.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="etapas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Etapas do Processo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordem.ordem_producao_etapas && ordem.ordem_producao_etapas.length > 0 ? (
                  <div className="space-y-4">
                    {ordem.ordem_producao_etapas
                      .sort((a, b) => a.numero_etapa - b.numero_etapa)
                      .map((etapa) => {
                        const etapaStatusInfo = etapaStatusConfig[etapa.status as keyof typeof etapaStatusConfig];
                        const EtapaIcon = etapaStatusInfo?.icon || Clock;
                        
                        return (
                          <Card key={etapa.id} className="border-l-4 border-l-primary">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                      {etapa.numero_etapa}
                                    </span>
                                    <h3 className="text-lg font-semibold">{etapa.nome_etapa}</h3>
                                    <Badge className={etapaStatusInfo?.color}>
                                      <EtapaIcon className="mr-1 h-3 w-3" />
                                      {etapaStatusInfo?.label}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-muted-foreground mb-4">{etapa.descricao_etapa}</p>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <label className="font-medium text-muted-foreground">Tempo Estimado</label>
                                      <p>{formatDuration(etapa.tempo_estimado_minutos)}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium text-muted-foreground">Tempo Real</label>
                                      <p>{formatDuration(etapa.tempo_real_minutos)}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium text-muted-foreground">Início</label>
                                      <p>{formatDate(etapa.data_inicio)}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium text-muted-foreground">Fim</label>
                                      <p>{formatDate(etapa.data_fim)}</p>
                                    </div>
                                  </div>
                                  
                                  {etapa.usuario_executor_id && (
                                    <div className="mt-2">
                                      <label className="font-medium text-muted-foreground text-sm">Executor</label>
                                      <p className="text-sm">{etapa.usuarios_internos?.nome_completo}</p>
                                    </div>
                                  )}
                                  
                                  {etapa.observacoes && (
                                    <div className="mt-2">
                                      <label className="font-medium text-muted-foreground text-sm">Observações</label>
                                      <p className="text-sm">{etapa.observacoes}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex gap-2 ml-4">
                                  {etapa.status === 'pendente' && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateEtapaStatusMutation.mutate({
                                        etapaId: etapa.id,
                                        status: 'em_andamento'
                                      })}
                                      disabled={updateEtapaStatusMutation.isPending}
                                    >
                                      <Play className="h-4 w-4 mr-1" />
                                      Iniciar
                                    </Button>
                                  )}
                                  {etapa.status === 'em_andamento' && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateEtapaStatusMutation.mutate({
                                        etapaId: etapa.id,
                                        status: 'concluida'
                                      })}
                                      disabled={updateEtapaStatusMutation.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Finalizar
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma etapa cadastrada para esta ordem.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qualidade">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Controle de Qualidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordem.ordem_producao_qualidade && ordem.ordem_producao_qualidade.length > 0 ? (
                  <div className="space-y-4">
                    {ordem.ordem_producao_qualidade.map((teste) => (
                      <Card key={teste.id} className="border">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{teste.tipo_teste}</h3>
                                <Badge className={
                                  teste.resultado === 'aprovado' ? 'bg-green-100 text-green-800' :
                                  teste.resultado === 'reprovado' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {teste.resultado.charAt(0).toUpperCase() + teste.resultado.slice(1)}
                                </Badge>
                              </div>
                              
                              <p className="text-muted-foreground mb-4">{teste.descricao_teste}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <label className="font-medium text-muted-foreground">Valor Obtido</label>
                                  <p>{teste.valor_obtido || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="font-medium text-muted-foreground">Valor Esperado</label>
                                  <p>{teste.valor_esperado || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="font-medium text-muted-foreground">Data do Teste</label>
                                  <p>{formatDate(teste.data_teste)}</p>
                                </div>
                                <div>
                                  <label className="font-medium text-muted-foreground">Farmacêutico</label>
                                  <p>{teste.farmaceutico?.nome_completo}</p>
                                </div>
                              </div>
                              
                              {teste.observacoes && (
                                <div className="mt-2">
                                  <label className="font-medium text-muted-foreground text-sm">Observações</label>
                                  <p className="text-sm">{teste.observacoes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum teste de qualidade registrado para esta ordem.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Status</CardTitle>
              </CardHeader>
              <CardContent>
                {ordem.historico_status_ordens && ordem.historico_status_ordens.length > 0 ? (
                  <div className="space-y-4">
                    {ordem.historico_status_ordens
                      .sort((a, b) => new Date(b.data_alteracao).getTime() - new Date(a.data_alteracao).getTime())
                      .map((historico) => (
                        <div key={historico.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {historico.status_anterior ? `${historico.status_anterior} → ` : ''}
                                {historico.status_novo}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(historico.data_alteracao)}
                              </span>
                            </div>
                            {historico.usuarios_internos && (
                              <p className="text-sm text-muted-foreground">
                                Por: {historico.usuarios_internos.nome_completo}
                              </p>
                            )}
                            {historico.observacao && (
                              <p className="text-sm mt-1">{historico.observacao}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum histórico disponível.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 