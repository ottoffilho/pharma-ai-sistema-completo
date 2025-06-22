import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Activity, CheckCircle, AlertTriangle, Zap, Database, Cpu, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MonitoramentoPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Monitor className="h-8 w-8 text-blue-600" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Monitoramento IA</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                System Health
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Monitoramento e status dos sistemas de Inteligência Artificial
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4 text-blue-600" />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">--</div>
                <div className="text-xs text-muted-foreground">Processamento IA</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4 text-green-600" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">--</div>
                <div className="text-xs text-muted-foreground">Uso de Memória</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-600" />
                Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">--</div>
                <div className="text-xs text-muted-foreground">Requisições/min</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-purple-600" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">--</div>
                <div className="text-xs text-muted-foreground">Disponibilidade</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Status dos Serviços
              </CardTitle>
              <CardDescription>
                Monitoramento em tempo real dos módulos de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">OCR Service</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">NLP Engine</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">ML Analytics</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recommendation Engine</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Logs e Métricas
              </CardTitle>
              <CardDescription>
                Logs de execução e métricas de performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Logs de Erro</span>
                  <Badge variant="outline" className="text-green-700">0 hoje</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tempo de Resposta</span>
                  <Badge variant="outline">-- ms</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taxa de Sucesso</span>
                  <Badge variant="outline">--%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Throughput</span>
                  <Badge variant="outline">-- req/s</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Alertas e Notificações
              </CardTitle>
              <CardDescription>
                Sistema de alertas para problemas críticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alertas Críticos</span>
                  <Badge variant="outline" className="text-green-700">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avisos</span>
                  <Badge variant="outline" className="text-green-700">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificações</span>
                  <Badge variant="outline">--</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SLA Status</span>
                  <Badge variant="outline" className="text-green-700">OK</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Performance Histórica
              </CardTitle>
              <CardDescription>
                Métricas de performance ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Gráficos de performance serão implementados com os módulos de IA
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                Dashboard de Saúde
              </CardTitle>
              <CardDescription>
                Visão geral da saúde dos sistemas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sistema Geral</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Saudável</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Banco de Dados</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Operacional</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">APIs Externas</span>
                  <Badge variant="secondary">Não Configurado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cache</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Monitoramento</CardTitle>
            <CardDescription>
              Configurações e thresholds para alertas automáticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">CPU Threshold</label>
                <div className="text-sm text-muted-foreground">Alerta quando &gt; 80%</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Memory Threshold</label>
                <div className="text-sm text-muted-foreground">Alerta quando &gt; 85%</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Response Time</label>
                <div className="text-sm text-muted-foreground">Alerta quando &gt; 5s</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Error Rate</label>
                <div className="text-sm text-muted-foreground">Alerta quando &gt; 5%</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Uptime SLA</label>
                <div className="text-sm text-muted-foreground">Mínimo 99.9%</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Backup Status</label>
                <div className="text-sm text-muted-foreground">Diário às 02:00</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 