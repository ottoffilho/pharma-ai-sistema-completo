import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import LoteInsumoForm from '@/components/estoque/LoteInsumoForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Plus, 
  Calendar, 
  Truck, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Layers
} from 'lucide-react';

const NovoLoteInsumoPage = () => {
  const [searchParams] = useSearchParams();
  const insumoId = searchParams.get('insumoId');

  return (
    <AdminLayout>
      <div className="w-full">
        {/* Hero Section */}
        <div className="relative w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-teal-950/20 dark:via-cyan-950/20 dark:to-blue-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      Novo Lote de Insumo
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Registre um novo lote com rastreabilidade completa
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 blur-3xl opacity-20" />
                  <Layers className="h-32 w-32 text-teal-600/20" />
                </div>
              </div>
            </div>

            {/* Informações Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Rastreabilidade</p>
                      <p className="text-2xl font-bold dark:text-white">100%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-teal-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Controle de Validade</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-500">Ativo</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Origem</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">Fornecedor</p>
                    </div>
                    <Truck className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Status</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-500">Novo</p>
                    </div>
                    <Plus className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="px-6 w-full mt-8 mb-12">
          <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100">
                  <Package className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle>Informações do Lote</CardTitle>
                  <CardDescription>
                    Preencha os dados do novo lote de insumo para garantir rastreabilidade completa
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LoteInsumoForm insumoId={insumoId || undefined} />
            </CardContent>
          </Card>
        </div>

        {/* Informações Importantes */}
        <div className="px-6 w-full mb-10">
          <Card className="border-teal-200 bg-teal-50 dark:bg-teal-950/20 w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/20">
                  <AlertTriangle className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-teal-900 dark:text-teal-100">Informações Importantes</CardTitle>
                  <CardDescription className="text-teal-700 dark:text-teal-300">
                    Diretrizes para cadastro de lotes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-teal-900 dark:text-teal-100 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Campos Obrigatórios
                  </h4>
                  <ul className="text-sm text-teal-700 dark:text-teal-300 space-y-1 ml-6">
                    <li>• Número do lote (único)</li>
                    <li>• Data de fabricação</li>
                    <li>• Data de validade</li>
                    <li>• Quantidade recebida</li>
                    <li>• Fornecedor</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-teal-900 dark:text-teal-100 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Controles Automáticos
                  </h4>
                  <ul className="text-sm text-teal-700 dark:text-teal-300 space-y-1 ml-6">
                    <li>• Alertas de vencimento</li>
                    <li>• Rastreabilidade FIFO</li>
                    <li>• Histórico de movimentações</li>
                    <li>• Integração com produção</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NovoLoteInsumoPage;
