import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Settings, TrendingUp, Bell, Shield, Database, Globe, DollarSign, Cog, Wrench, Zap, BadgeHelp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ConfiguracoesPage() {
  return (
    <AdminLayout>
      <div className="space-y-8 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-indigo-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                    <Settings className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      Configurações do Sistema
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Personalize e configure todas as funcionalidades da sua farmácia
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50 px-3 py-1">
                    <Cog className="h-3 w-3 mr-1" />
                    Personalização Total
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 px-3 py-1">
                    <Zap className="h-3 w-3 mr-1" />
                    Configuração Rápida
                  </Badge>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 px-3 py-1">
                    <Shield className="h-3 w-3 mr-1" />
                    Controle Avançado
                  </Badge>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-400 blur-3xl opacity-20" />
                  <Wrench className="h-32 w-32 text-violet-600/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Configurações</p>
                  <p className="text-2xl font-bold text-green-600">3 / 6</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Cog className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Módulos Ativos</p>
                  <p className="text-2xl font-bold text-blue-600">8 / 9</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Atualização</p>
                  <p className="text-2xl font-bold text-amber-600">2h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categorias de configuração */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
          {/* Card de Markup */}
          <Card className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10 border-green-200/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Markup e Precificação</CardTitle>
                  <CardDescription>
                    Configure margens de lucro por categoria
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Markup padrão global
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Margens específicas por categoria
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Regras de precificação automática
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-0">
              <Button asChild className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0">
                <Link to="/admin/configuracoes/markup">
                  <Cog className="h-4 w-4 mr-2" />
                  Configurar Markup
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Card Financeiro */}
          <Card className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10 border-blue-200/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Financeiro</CardTitle>
                  <CardDescription>
                    Configurações financeiras e fiscais
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Impostos e alíquotas
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Formas de pagamento
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Centros de custo
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-0">
              <Button asChild variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/20" disabled>
                <Link to="/admin/configuracoes/financeiro">
                  <Clock className="h-4 w-4 mr-2" />
                  Em Desenvolvimento
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Card Sistema */}
          <Card className="bg-gradient-to-br from-purple-50/50 to-violet-50/50 dark:from-purple-950/10 dark:to-violet-950/10 border-purple-200/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 text-white shadow-lg">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Sistema</CardTitle>
                  <CardDescription>
                    Configurações gerais do sistema
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Backup e sincronização
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Permissões de usuários
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Parâmetros do sistema
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-0">
              <Button asChild variant="outline" className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/20" disabled>
                <Link to="/admin/configuracoes/sistema">
                  <Clock className="h-4 w-4 mr-2" />
                  Em Desenvolvimento
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Card de Ajuda */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50 border-slate-200/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-slate-500 to-gray-500 text-white">
                  <BadgeHelp className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Precisa de Ajuda com as Configurações?</h3>
                  <p className="text-muted-foreground mb-4">
                    Nossa equipe de suporte está disponível para ajudar você a configurar o sistema da melhor forma para sua farmácia.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">Documentação completa</Badge>
                    <Badge variant="outline" className="text-xs">Suporte especializado</Badge>
                    <Badge variant="outline" className="text-xs">Configuração guiada</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-lg mx-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Sistema de configurações | Pharma.AI v2.1.0</span>
            <span>Última verificação: há 5 minutos</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 