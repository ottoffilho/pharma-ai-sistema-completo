import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  AlertCircle, 
  AlertTriangle,
  DollarSign,
  Edit3,
  Sparkles,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Tag,
  Shield,
  Zap,
  Heart,
  Loader2,
  Wallet,
  Receipt,
  PiggyBank,
  Calculator,
  FileText,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import { CategoriaFinanceiraForm } from '@/components/financeiro/CategoriaFinanceiraForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Define the shape of our categoria object
interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  descricao: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export default function EditarCategoriaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Buscar dados da categoria
  const { data: categoria, isLoading, isError, error } = useQuery({
    queryKey: ['categoria-financeira', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Ensure tipo is properly typed as 'receita' | 'despesa'
      if (data && (data.tipo === 'receita' || data.tipo === 'despesa')) {
        return data as CategoriaFinanceira;
      }
      
      throw new Error('Tipo de categoria inválido');
    },
    enabled: !!id,
  });

    if (isLoading) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <DollarSign className="h-16 w-16 text-green-400/20" />
              </div>
              <DollarSign className="h-16 w-16 text-green-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Carregando dados da categoria...</p>
          </div>
        </div>
      </AdminLayout>
    );
    }
    
    if (isError) {
      return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                Erro ao carregar dados da categoria: {(error as Error).message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => navigate("/admin/financeiro/categorias")}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Categorias
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
      );
    }
    
    if (!categoria) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 mb-6">
              <AlertCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Categoria não encontrada
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              A categoria que você está tentando editar não existe ou foi removida do sistema.
            </p>
            <Button
              onClick={() => navigate("/admin/financeiro/categorias")}
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para lista
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
    }
    
    // Convert the database object to the form's expected format
    const formDefaultValues = {
      nome: categoria.nome,
      tipo: categoria.tipo,
      descricao: categoria.descricao || '',
  };

  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-8">
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-400/20 to-emerald-400/20 dark:from-green-600/10 dark:to-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/10 dark:to-teal-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/financeiro/categorias")}
                className="gap-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                Modo de Edição
              </Badge>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-xl">
                <Edit3 className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Editar Categoria
                </h1>
                <p className="text-lg text-muted-foreground mb-3">
                  Atualize as informações de <span className="font-semibold text-green-600 dark:text-green-400">{categoria.nome}</span>
                </p>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={categoria.tipo === 'receita' ? 'default' : 'destructive'}
                    className="gap-1"
                  >
                    {categoria.tipo === 'receita' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {categoria.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Tag className="h-3 w-3" />
                    Categoria Financeira
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Ajuda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Organização</p>
                  <p className="text-xs text-muted-foreground">Controle financeiro eficiente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Flexibilidade</p>
                  <p className="text-xs text-muted-foreground">Categorias personalizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Relatórios</p>
                  <p className="text-xs text-muted-foreground">Análises detalhadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="text-2xl font-bold capitalize text-green-700 dark:text-green-400">
                    {categoria.tipo}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                  {categoria.tipo === 'receita' ? (
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {categoria.is_deleted ? 'Inativa' : 'Ativa'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Criada em</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                    {new Date(categoria.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ícone</p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                    {categoria.tipo === 'receita' ? 'Entrada' : 'Saída'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  {categoria.tipo === 'receita' ? (
                    <Wallet className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <Receipt className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wrapper Customizado para o Formulário */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5 dark:from-green-900/10 dark:via-emerald-900/10 dark:to-teal-900/10 rounded-2xl blur-xl" />
          
          <div className="relative">
            {/* Formulário com estilo customizado */}
            <div className="[&>div]:border-0 [&>div]:shadow-xl [&>div]:bg-white/80 [&>div]:dark:bg-gray-900/80 [&>div]:backdrop-blur-sm">
              <CategoriaFinanceiraForm id={id} defaultValues={formDefaultValues} />
            </div>
          </div>
        </div>

        {/* Cards de Informação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <PiggyBank className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Dicas para Categorias</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Use nomes descritivos e claros para facilitar a identificação</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Organize as categorias de forma hierárquica quando possível</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Evite criar categorias muito específicas ou muito genéricas</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Impacto das Categorias</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Facilita a análise de receitas e despesas por segmento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Permite identificar padrões de gastos e oportunidades</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Melhora o controle orçamentário da farmácia</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer com informações adicionais */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>ID: {categoria.id}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Última atualização: {new Date(categoria.updated_at).toLocaleDateString('pt-BR')}</span>
          </div>
          {categoria.descricao && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span>Com descrição</span>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
