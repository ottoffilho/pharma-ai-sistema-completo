import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import ProdutoForm from '@/components/estoque/ProdutoForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Plus, 
  Boxes,
  FlaskConical,
  Package2,
  Sparkles
} from 'lucide-react';

const NovoProdutoPage = () => {
  const [searchParams] = useSearchParams();
  const tipoInicial = searchParams.get('tipo') || 'insumo';

  return (
    <AdminLayout>
      <div className="w-full">
        {/* Hero Section */}
        <div className="relative w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Novo Produto
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Cadastre insumos, embalagens ou medicamentos
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur-3xl opacity-20" />
                  <Boxes className="h-32 w-32 text-blue-600/20" />
                </div>
              </div>
            </div>

            {/* Cards de Tipos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Card className="border-0 shadow-sm bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Insumos</p>
                      <p className="text-lg font-semibold text-orange-600">Matérias-Primas</p>
                    </div>
                    <FlaskConical className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Embalagens</p>
                      <p className="text-lg font-semibold text-green-600">Frascos e Potes</p>
                    </div>
                    <Package2 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Medicamentos</p>
                      <p className="text-lg font-semibold text-purple-600">Produtos Finais</p>
                    </div>
                    <Sparkles className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="px-6 pb-6 w-full">
          <Card className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 backdrop-blur-sm w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Cadastro de Produto
              </CardTitle>
              <CardDescription>
                Preencha as informações do produto abaixo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProdutoForm tipoInicial={tipoInicial} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NovoProdutoPage; 