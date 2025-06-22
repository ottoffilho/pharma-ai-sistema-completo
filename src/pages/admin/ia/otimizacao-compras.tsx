import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, ShoppingCart, TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OtimizacaoComprasPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Target className="h-8 w-8 text-emerald-600" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Otimização de Compras</h1>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                IA Optimization
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Algoritmos de IA para otimizar estratégias de compras e fornecedores
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Análise de Demanda
              </CardTitle>
              <CardDescription>
                Previsão inteligente de necessidades de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                <p className="text-sm text-emerald-700 font-medium">
                  🔄 Em Desenvolvimento
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Análise de padrões de consumo e sazonalidade para otimizar compras
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Otimização de Custos
              </CardTitle>
              <CardDescription>
                Algoritmos para redução de custos de aquisição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                <p className="text-sm text-emerald-700 font-medium">
                  🔄 Em Desenvolvimento
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Comparação automática de preços e sugestões de fornecedores
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                Gestão de Estoque
              </CardTitle>
              <CardDescription>
                Otimização de níveis de estoque e reposição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                <p className="text-sm text-emerald-700 font-medium">
                  🔄 Em Desenvolvimento
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Cálculo automático de pontos de reposição e quantidades ótimas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                Sistema de Compras Inteligente
              </CardTitle>
              <CardDescription>
                Automação do processo de compras com IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Análise de Fornecedores</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Previsão de Demanda</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Otimização de Pedidos</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Alertas Inteligentes</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Analytics e Relatórios
              </CardTitle>
              <CardDescription>
                Dashboards e insights sobre performance de compras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ROI de Compras</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Economia Gerada</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Performance de Fornecedores</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tendências de Mercado</span>
                  <Badge variant="secondary">Planejado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Roadmap de Desenvolvimento</CardTitle>
            <CardDescription>
              Cronograma de implementação das funcionalidades de otimização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fase 1: Análise de Demanda</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Q2 2024</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fase 2: Otimização de Custos</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Q3 2024</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fase 3: Automação Completa</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Q4 2024</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 