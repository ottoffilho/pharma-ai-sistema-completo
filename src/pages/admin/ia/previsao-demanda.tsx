import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, Target, Calendar, Package, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PrevisaoDemandaPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-homeo-blue" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Previsão de Demanda</h1>
              <Badge variant="secondary" className="bg-homeo-blue/10 text-homeo-blue">
                IA Analytics
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Análise preditiva para otimização de estoque e compras
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-homeo-blue" />
                Análise de Tendências
              </CardTitle>
              <CardDescription>
                Identificação de padrões de consumo e sazonalidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-homeo-blue mb-4" />
                <p className="text-sm text-blue-700 font-medium">
                  🔄 Em Desenvolvimento
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Algoritmos de machine learning para análise de demanda histórica
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                Recomendações Inteligentes
              </CardTitle>
              <CardDescription>
                Sugestões automáticas de compras baseadas em IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                <p className="text-sm text-emerald-700 font-medium">
                  🔄 Em Desenvolvimento
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Sistema de recomendações baseado em padrões de consumo
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Sazonalidade
              </CardTitle>
              <CardDescription>
                Análise de variações sazonais na demanda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                <p className="text-sm text-purple-700 font-medium">
                  🔄 Em Desenvolvimento
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Identificação de picos e quedas sazonais de demanda
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-homeo-blue" />
                Previsões por Produto
              </CardTitle>
              <CardDescription>
                Análise detalhada por categoria de medicamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Medicamentos Manipulados</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Insumos Farmacêuticos</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Embalagens</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Produtos Sazonais</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Alertas de Demanda
              </CardTitle>
              <CardDescription>
                Notificações automáticas sobre mudanças na demanda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Picos de Demanda</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quedas Significativas</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Novos Padrões</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Anomalias</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Previsão</CardTitle>
            <CardDescription>
              Indicadores de precisão e performance dos modelos preditivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-homeo-blue">--</div>
                <div className="text-sm text-muted-foreground">Precisão do Modelo</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">--</div>
                <div className="text-sm text-muted-foreground">Economia Gerada</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">--</div>
                <div className="text-sm text-muted-foreground">Produtos Analisados</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">--</div>
                <div className="text-sm text-muted-foreground">Alertas Gerados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roadmap de Desenvolvimento</CardTitle>
            <CardDescription>
              Cronograma de implementação das funcionalidades preditivas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fase 1: Coleta e Análise de Dados</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Q2 2024</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fase 2: Modelos de Machine Learning</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Q3 2024</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fase 3: Integração e Automação</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Q4 2024</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 