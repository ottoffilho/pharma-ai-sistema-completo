import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import EmbalagemForm from '@/components/estoque/EmbalagemForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, PlusCircle, Package, Box, Archive, Shield, Lightbulb, AlertCircle, BadgeHelp, Zap } from 'lucide-react';

const NovaEmbalagemPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-8 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin/estoque/embalagens')}
                  className="mb-4 -ml-4 text-muted-foreground hover:text-amber-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Embalagens
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <PlusCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      Nova Embalagem
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Cadastre uma nova embalagem para seus produtos
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 px-3 py-1">
                    <Package className="h-3 w-3 mr-1" />
                    Controle de Estoque
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50 px-3 py-1">
                    <Box className="h-3 w-3 mr-1" />
                    Gestão de Embalagens
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 px-3 py-1">
                    <Shield className="h-3 w-3 mr-1" />
                    Qualidade Garantida
                  </Badge>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 blur-3xl opacity-20" />
                  <Archive className="h-32 w-32 text-amber-600/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Informação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Tipos de Embalagem</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Cadastre diferentes tipos como frascos, potes, bisnagas, cápsulas e sachês.
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Frascos</Badge>
                <Badge variant="outline" className="text-xs">Potes</Badge>
                <Badge variant="outline" className="text-xs">Bisnagas</Badge>
                <Badge variant="outline" className="text-xs">Cápsulas</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Controle de Qualidade</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Mantenha registro das especificações técnicas, fornecedores e 
                certificações de qualidade de cada embalagem.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Embalagens</p>
                  <p className="text-2xl font-bold text-emerald-600">47</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Em Estoque</p>
                  <p className="text-2xl font-bold text-blue-600">32</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedores</p>
                  <p className="text-2xl font-bold text-amber-600">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/10 border-amber-200/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Dados da Embalagem</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preencha as informações da nova embalagem
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <EmbalagemForm />
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
                  <h3 className="text-lg font-semibold mb-2">Informações Importantes sobre Embalagens</h3>
                  <p className="text-muted-foreground mb-4">
                    Certifique-se de incluir todas as especificações técnicas necessárias para o controle de qualidade e rastreabilidade.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Badge variant="outline" className="text-xs justify-center">Material</Badge>
                    <Badge variant="outline" className="text-xs justify-center">Capacidade</Badge>
                    <Badge variant="outline" className="text-xs justify-center">Fornecedor</Badge>
                    <Badge variant="outline" className="text-xs justify-center">Certificação</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg mx-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Gestão de embalagens | Pharma.AI</span>
            <span>Qualidade e rastreabilidade garantidas</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NovaEmbalagemPage;
