import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BarChart3, Target, TrendingUp, Heart, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AnaliseClientesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-purple-500" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Análise de Clientes</h1>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                IA Analytics
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Insights inteligentes sobre comportamento e perfil dos clientes
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Segmentação Inteligente
              </CardTitle>
              <CardDescription>
                Classificação automática de clientes por perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                <p className="text-sm text-purple-700 font-medium">
                  🔄 Em Desenvolvimento
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Agrupamento por padrões de compra, frequência e valor
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Análise Comportamental
              </CardTitle>
              <CardDescription>
                Padrões de comportamento e preferências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                <p className="text-sm text-purple-700 font-medium">
                  🔄 Em Desenvolvimento
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Análise de jornada do cliente e pontos de contato
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-500" />
                Score de Fidelidade
              </CardTitle>
              <CardDescription>
                Cálculo automático de engajamento e lealdade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                <p className="text-sm text-purple-700 font-medium">
                  🔄 Em Desenvolvimento
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Identificação de clientes em risco de churn
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Analytics Avançados
              </CardTitle>
              <CardDescription>
                Dashboards e métricas de performance de clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lifetime Value (LTV)</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taxa de Retenção</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Frequência de Compra</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ticket Médio</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-purple-500" />
                Recomendações Personalizadas
              </CardTitle>
              <CardDescription>
                Sistema de recomendação baseado em IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Produtos Relacionados</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cross-selling</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Up-selling</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Campanhas Direcionadas</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Clientes</CardTitle>
            <CardDescription>
              Principais indicadores para análise de performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">--</div>
                <div className="text-sm text-muted-foreground">Clientes Ativos</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">--</div>
                <div className="text-sm text-muted-foreground">Taxa de Retenção</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">--</div>
                <div className="text-sm text-muted-foreground">LTV Médio</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">--</div>
                <div className="text-sm text-muted-foreground">Satisfação</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roadmap de Implementação</CardTitle>
            <CardDescription>
              Cronograma de desenvolvimento das funcionalidades de análise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fase 1: Segmentação Básica</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Q2 2024</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fase 2: Analytics Avançados</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Q3 2024</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fase 3: IA Preditiva</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Q4 2024</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 