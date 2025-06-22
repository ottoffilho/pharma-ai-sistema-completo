import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { CategoriaFinanceiraForm } from '@/components/financeiro/CategoriaFinanceiraForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, PlusCircle, Tags, DollarSign, TrendingUp, AlertCircle, BadgeHelp, Lightbulb } from 'lucide-react';

export default function NovaCategoriaPage() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-8 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin/financeiro/categorias')}
                  className="mb-4 -ml-4 text-muted-foreground hover:text-emerald-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Categorias
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white">
                    <PlusCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      Nova Categoria Financeira
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Crie uma nova categoria para organizar suas finanças
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 px-3 py-1">
                    <Tags className="h-3 w-3 mr-1" />
                    Organização Financeira
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 px-3 py-1">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Controle de Gastos
                  </Badge>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 px-3 py-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Relatórios Precisos
                  </Badge>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 blur-3xl opacity-20" />
                  <Tags className="h-32 w-32 text-emerald-600/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Ajuda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Dica de Organização</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Crie categorias específicas como "Fornecedores", "Equipamentos", "Marketing" e "Operacional" 
                para ter maior controle sobre seus gastos e facilitar a geração de relatórios.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Importante</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Após criar a categoria, ela estará disponível para todas as contas a pagar e receitas. 
                Certifique-se de escolher um nome claro e descritivo.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Formulário */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/10 border-emerald-200/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-b border-emerald-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white">
                  <Tags className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Dados da Categoria</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preencha as informações da nova categoria financeira
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <CategoriaFinanceiraForm />
            </CardContent>
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
                  <h3 className="text-lg font-semibold mb-2">Exemplos de Categorias Comuns</h3>
                  <p className="text-muted-foreground mb-4">
                    Aqui estão algumas sugestões de categorias que outras farmácias costumam usar:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Badge variant="outline" className="text-xs justify-center">Fornecedores</Badge>
                    <Badge variant="outline" className="text-xs justify-center">Equipamentos</Badge>
                    <Badge variant="outline" className="text-xs justify-center">Marketing</Badge>
                    <Badge variant="outline" className="text-xs justify-center">Operacional</Badge>
                    <Badge variant="outline" className="text-xs justify-center">Impostos</Badge>
                    <Badge variant="outline" className="text-xs justify-center">Aluguel</Badge>
                    <Badge variant="outline" className="text-xs justify-center">Utilities</Badge>
                    <Badge variant="outline" className="text-xs justify-center">Pessoal</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-lg mx-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Gestão de categorias financeiras | Pharma.AI</span>
            <span>Organize suas finanças de forma inteligente</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
