import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { FormaFarmaceuticaForm } from '@/components/cadastros/FormaFarmaceuticaForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  FlaskConical, 
  Pill, 
  Droplets, 
  AlertCircle, 
  BadgeHelp, 
  Beaker,
  Package,
  Clock,
  CheckCircle
} from 'lucide-react';

const NovaFormaFarmaceuticaPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-8 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin/cadastros/formas-farmaceuticas')}
                  className="mb-4 -ml-4 text-muted-foreground hover:text-blue-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Formas Farmacêuticas
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    <FlaskConical className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Nova Forma Farmacêutica
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Cadastre uma nova forma farmacêutica para manipulação
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 px-3 py-1">
                    <Pill className="h-3 w-3 mr-1" />
                    Formas Orais
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 px-3 py-1">
                    <Droplets className="h-3 w-3 mr-1" />
                    Formas Tópicas
                  </Badge>
                  <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 px-3 py-1">
                    <Beaker className="h-3 w-3 mr-1" />
                    Formas Injetáveis
                  </Badge>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur-3xl opacity-20" />
                  <FlaskConical className="h-32 w-32 text-blue-600/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Ajuda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <Package className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Processos de Produção</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Você pode adicionar processos de produção específicos para cada forma farmacêutica, 
                definindo etapas, tempo estimado e pontos de controle.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Configurações de Rótulo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Personalize quais informações devem aparecer no rótulo para cada forma farmacêutica,
                como concentração, posologia, volume e via de administração.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Formulário */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/10 border-blue-200/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <FlaskConical className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Dados da Forma Farmacêutica</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preencha as informações da nova forma farmacêutica
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <FormaFarmaceuticaForm />
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
                  <h3 className="text-lg font-semibold mb-2">Tipos de Uso Disponíveis</h3>
                  <p className="text-muted-foreground mb-4">
                    Entenda as diferentes vias de administração para formas farmacêuticas:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">Oral</Badge>
                        <span className="text-sm text-muted-foreground">Cápsulas, comprimidos, soluções</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">Tópico</Badge>
                        <span className="text-sm text-muted-foreground">Cremes, pomadas, géis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">Injetável</Badge>
                        <span className="text-sm text-muted-foreground">Ampolas, frascos-ampola</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">Nasal</Badge>
                        <span className="text-sm text-muted-foreground">Sprays, gotas nasais</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-cyan-100 text-cyan-700 border-cyan-300">Oftálmico</Badge>
                        <span className="text-sm text-muted-foreground">Colírios, pomadas oftálmicas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-pink-100 text-pink-700 border-pink-300">Outros</Badge>
                        <span className="text-sm text-muted-foreground">Vaginal, retal, auricular</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card de Dicas */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Dicas para Cadastro</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 text-blue-600" />
                      <span>Defina o tempo estimado de produção para melhor planejamento</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
                      <span>Configure os descontos máximos e valores mínimos para controle financeiro</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Package className="h-4 w-4 mt-0.5 text-green-600" />
                      <span>Adicione processos de produção detalhados para padronização</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg mx-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Cadastro de formas farmacêuticas | Pharma.AI</span>
            <span>Padronização e controle de qualidade</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NovaFormaFarmaceuticaPage; 