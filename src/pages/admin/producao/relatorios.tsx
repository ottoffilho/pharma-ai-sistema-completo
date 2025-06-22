import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Target, 
  Calendar,
  Download,
  Filter,
  Users,
  Package,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';

interface RelatorioFiltros {
  dataInicio: string;
  dataFim: string;
  status: string;
  prioridade: string;
  responsavel: string;
}

interface MetricasProducao {
  totalOrdens: number;
  ordensFinalizadas: number;
  ordensEmAndamento: number;
  ordensCanceladas: number;
  tempoMedioProducao: number;
  custoMedioProducao: number;
  eficienciaGeral: number;
  ordensNoPrazo: number;
}

interface OrdemRelatorio {
  id: string;
  numero_ordem: string;
  status: string;
  prioridade: string;
  data_criacao: string;
  data_inicio_producao: string | null;
  data_finalizacao: string | null;
  data_prevista_entrega: string | null;
  tempo_total_minutos: number | null;
  custo_total_real: number | null;
  custo_total_estimado: number | null;
  usuario_responsavel: {
    nome_completo: string;
  } | null;
  receitas_processadas: {
    patient_name: string;
  } | null;
}

// Classe unificada para inputs e selects em light/dark
const inputCls = "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-purple-600/40 dark:bg-slate-800/60 dark:border-slate-700 dark:text-white";

export default function RelatoriosProducaoPage() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<RelatorioFiltros>({
    dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    dataFim: new Date().toISOString().split('T')[0], // hoje
    status: 'todos',
    prioridade: 'todas',
    responsavel: 'todos',
  });

  // Buscar dados das ordens para relatório
  const { data: ordensRelatorio, isLoading } = useQuery({
    queryKey: ['relatorio-producao', filtros],
    queryFn: async () => {
      let query = supabase
        .from('ordens_producao')
        .select('id,numero_ordem,status,prioridade,data_criacao,data_finalizacao')
        .eq('is_deleted', false)
        .gte('data_criacao', filtros.dataInicio + 'T00:00:00Z')
        .lte('data_criacao', filtros.dataFim + 'T23:59:59Z');

      if (filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
      }

      if (filtros.prioridade !== 'todas') {
        query = query.eq('prioridade', filtros.prioridade);
      }

      if (filtros.responsavel !== 'todos') {
        query = query.eq('usuario_responsavel_id', filtros.responsavel);
      }

      const { data, error } = await query.order('data_criacao', { ascending: false });

      if (error) throw error;
      return data as OrdemRelatorio[];
    },
  });

  // Buscar usuários para filtro
  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-relatorio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios_internos')
        .select('id, nome_completo')
        .eq('ativo', true)
        .order('nome_completo');

      if (error) throw error;
      return data;
    },
  });

  const calcularMetricas = (): MetricasProducao => {
    if (!ordensRelatorio) {
      return {
        totalOrdens: 0,
        ordensFinalizadas: 0,
        ordensEmAndamento: 0,
        ordensCanceladas: 0,
        tempoMedioProducao: 0,
        custoMedioProducao: 0,
        eficienciaGeral: 0,
        ordensNoPrazo: 0,
      };
    }

    const totalOrdens = ordensRelatorio.length;
    const ordensFinalizadas = ordensRelatorio.filter(o => o.status === 'finalizada').length;
    const ordensEmAndamento = ordensRelatorio.filter(o => 
      ['em_preparacao', 'em_manipulacao', 'controle_qualidade'].includes(o.status)
    ).length;
    const ordensCanceladas = ordensRelatorio.filter(o => o.status === 'cancelada').length;

    // Calcular tempo médio de produção (apenas ordens finalizadas)
    const ordensComTempo = ordensRelatorio.filter(o => 
      o.status === 'finalizada' && o.tempo_total_minutos
    );
    const tempoMedioProducao = ordensComTempo.length > 0 
      ? ordensComTempo.reduce((acc, o) => acc + (o.tempo_total_minutos || 0), 0) / ordensComTempo.length
      : 0;

    // Calcular custo médio de produção
    const ordensComCusto = ordensRelatorio.filter(o => o.custo_total_real);
    const custoMedioProducao = ordensComCusto.length > 0
      ? ordensComCusto.reduce((acc, o) => acc + (o.custo_total_real || 0), 0) / ordensComCusto.length
      : 0;

    // Calcular eficiência geral (ordens finalizadas / total)
    const eficienciaGeral = totalOrdens > 0 ? (ordensFinalizadas / totalOrdens) * 100 : 0;

    // Calcular ordens entregues no prazo
    const ordensNoPrazo = ordensRelatorio.filter(o => {
      if (o.status !== 'finalizada' || !o.data_finalizacao || !o.data_prevista_entrega) {
        return false;
      }
      return new Date(o.data_finalizacao) <= new Date(o.data_prevista_entrega);
    }).length;

    return {
      totalOrdens,
      ordensFinalizadas,
      ordensEmAndamento,
      ordensCanceladas,
      tempoMedioProducao,
      custoMedioProducao,
      eficienciaGeral,
      ordensNoPrazo,
    };
  };

  const formatarTempo = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return `${horas}h ${mins}m`;
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const exportarRelatorio = () => {
    if (!ordensRelatorio) return;

    const csv = [
      ['Número da Ordem', 'Status', 'Prioridade', 'Data Criação', 'Data Finalização', 'Tempo Total', 'Custo Real', 'Responsável', 'Paciente'].join(','),
      ...ordensRelatorio.map(ordem => [
        ordem.numero_ordem,
        ordem.status,
        ordem.prioridade,
        formatarData(ordem.data_criacao),
        ordem.data_finalizacao ? formatarData(ordem.data_finalizacao) : 'N/A',
        ordem.tempo_total_minutos ? formatarTempo(ordem.tempo_total_minutos) : 'N/A',
        ordem.custo_total_real ? formatarMoeda(ordem.custo_total_real) : 'N/A',
        ordem.usuario_responsavel?.nome_completo || 'N/A',
        ordem.receitas_processadas?.patient_name || 'N/A',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-producao-${filtros.dataInicio}-${filtros.dataFim}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metricas = calcularMetricas();

  const statusConfig = {
    pendente: { label: 'Pendente', color: 'bg-gray-100 text-gray-800' },
    em_preparacao: { label: 'Em Preparação', color: 'bg-blue-100 text-blue-800' },
    em_manipulacao: { label: 'Em Manipulação', color: 'bg-yellow-100 text-yellow-800' },
    controle_qualidade: { label: 'Controle de Qualidade', color: 'bg-purple-100 text-purple-800' },
    finalizada: { label: 'Finalizada', color: 'bg-green-100 text-green-800' },
    cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  };

  const prioridadeConfig = {
    baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
    normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
    urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
  };

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
              <h1 className="text-3xl font-bold">Relatórios de Produção</h1>
              <p className="text-muted-foreground">
                Estatísticas e análises da produção
              </p>
            </div>
          </div>
          <Button onClick={exportarRelatorio} disabled={!ordensRelatorio || ordensRelatorio.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filtros.status} onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_preparacao">Em Preparação</SelectItem>
                    <SelectItem value="em_manipulacao">Em Manipulação</SelectItem>
                    <SelectItem value="controle_qualidade">Controle de Qualidade</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Prioridade</label>
                <Select value={filtros.prioridade} onValueChange={(value) => setFiltros(prev => ({ ...prev, prioridade: value }))}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Responsável</label>
                <Select value={filtros.responsavel} onValueChange={(value) => setFiltros(prev => ({ ...prev, responsavel: value }))}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {usuarios?.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        {usuario.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total de Ordens</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{metricas.totalOrdens}</div>
              <p className="text-xs text-muted-foreground">
                {metricas.ordensFinalizadas} finalizadas, {metricas.ordensEmAndamento} em andamento
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{formatarTempo(metricas.tempoMedioProducao)}</div>
              <p className="text-xs text-muted-foreground">
                Por ordem finalizada
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Custo Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{formatarMoeda(metricas.custoMedioProducao)}</div>
              <p className="text-xs text-muted-foreground">
                Por ordem produzida
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Eficiência</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{metricas.eficienciaGeral.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metricas.ordensNoPrazo} ordens no prazo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com diferentes visualizações */}
        <Tabs defaultValue="lista" className="space-y-4">
          <TabsList className="dark:bg-slate-900/70">
            <TabsTrigger value="lista">Lista Detalhada</TabsTrigger>
            <TabsTrigger value="status">Por Status</TabsTrigger>
            <TabsTrigger value="prioridade">Por Prioridade</TabsTrigger>
            <TabsTrigger value="responsavel">Por Responsável</TabsTrigger>
          </TabsList>

          <TabsContent value="lista">
            <Card>
              <CardHeader>
                <CardTitle>Ordens de Produção</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Carregando dados...</div>
                ) : ordensRelatorio && ordensRelatorio.length > 0 ? (
                  <div className="space-y-4">
                    {ordensRelatorio.map((ordem) => (
                      <Card key={ordem.id} className="border">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">{ordem.numero_ordem}</h3>
                              <Badge className={statusConfig[ordem.status as keyof typeof statusConfig]?.color}>
                                {statusConfig[ordem.status as keyof typeof statusConfig]?.label}
                              </Badge>
                              <Badge className={prioridadeConfig[ordem.prioridade as keyof typeof prioridadeConfig]?.color}>
                                {prioridadeConfig[ordem.prioridade as keyof typeof prioridadeConfig]?.label}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/producao/${ordem.id}`)}
                            >
                              Ver Detalhes
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <label className="font-medium text-muted-foreground">Paciente</label>
                              <p>{ordem.receitas_processadas?.patient_name || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="font-medium text-muted-foreground">Responsável</label>
                              <p>{ordem.usuario_responsavel?.nome_completo || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="font-medium text-muted-foreground">Data Criação</label>
                              <p>{formatarData(ordem.data_criacao)}</p>
                            </div>
                            <div>
                              <label className="font-medium text-muted-foreground">Tempo Total</label>
                              <p>{ordem.tempo_total_minutos ? formatarTempo(ordem.tempo_total_minutos) : 'N/A'}</p>
                            </div>
                            <div>
                              <label className="font-medium text-muted-foreground">Custo Real</label>
                              <p>{ordem.custo_total_real ? formatarMoeda(ordem.custo_total_real) : 'N/A'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma ordem encontrada para os filtros selecionados.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const count = ordensRelatorio?.filter(o => o.status === status).length || 0;
                    const percentage = metricas.totalOrdens > 0 ? (count / metricas.totalOrdens) * 100 : 0;
                    
                    return (
                      <div key={status} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={config.color}>{config.label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} ordem{count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prioridade">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(prioridadeConfig).map(([prioridade, config]) => {
                    const count = ordensRelatorio?.filter(o => o.prioridade === prioridade).length || 0;
                    const percentage = metricas.totalOrdens > 0 ? (count / metricas.totalOrdens) * 100 : 0;
                    
                    return (
                      <div key={prioridade} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={config.color}>{config.label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} ordem{count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responsavel">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Responsável</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usuarios?.map((usuario) => {
                    const ordensUsuario = ordensRelatorio?.filter(o => o.usuario_responsavel?.nome_completo === usuario.nome_completo) || [];
                    const ordensFinalizadas = ordensUsuario.filter(o => o.status === 'finalizada').length;
                    const tempoMedio = ordensUsuario.filter(o => o.tempo_total_minutos).length > 0
                      ? ordensUsuario.filter(o => o.tempo_total_minutos).reduce((acc, o) => acc + (o.tempo_total_minutos || 0), 0) / ordensUsuario.filter(o => o.tempo_total_minutos).length
                      : 0;
                    
                    if (ordensUsuario.length === 0) return null;
                    
                    return (
                      <div key={usuario.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{usuario.nome_completo}</h3>
                          <Badge variant="secondary">{ordensUsuario.length} ordem{ordensUsuario.length !== 1 ? 's' : ''}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-muted-foreground">Finalizadas</label>
                            <p>{ordensFinalizadas}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Tempo Médio</label>
                            <p>{tempoMedio > 0 ? formatarTempo(tempoMedio) : 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Taxa de Conclusão</label>
                            <p>{ordensUsuario.length > 0 ? ((ordensFinalizadas / ordensUsuario.length) * 100).toFixed(1) : 0}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 