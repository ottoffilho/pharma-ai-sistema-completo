import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  AlertTriangle, 
  Building2,
  Edit3,
  Sparkles,
  CheckCircle,
  Info,
  Save,
  X
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import FornecedorForm from '@/components/cadastros/FornecedorForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Fornecedor } from '@/integrations/supabase/types';

export default function EditarFornecedorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados do fornecedor específico
  const {
    data: fornecedor,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['fornecedor', id],
    queryFn: async () => {
      if (!id) throw new Error('ID do fornecedor não fornecido');
      
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data as Fornecedor;
    },
    enabled: !!id,
  });

  // Mutation para atualizar fornecedor
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('fornecedores')
        .update({
          nome: data.nome,
          documento: data.tipo === 'juridica' ? data.cnpj : data.cpf,
          tipo: data.tipo,
          email: data.email || null,
          telefone: data.telefone,
          endereco: data.endereco || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
          cep: data.cep || null,
          observacoes: data.observacoes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedor', id] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      
      toast({
        title: "Fornecedor atualizado!",
        description: "As alterações foram salvas com sucesso.",
        variant: "default",
      });
      
      navigate('/admin/cadastros/fornecedores');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o fornecedor.",
        variant: "destructive",
      });
    }
  });

  // Função para lidar com o submit do formulário
  const handleSubmit = async (data: any) => {
    await updateMutation.mutateAsync(data);
  };

  // Render de estado de carregamento
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Edit3 className="h-16 w-16 text-purple-400/20" />
              </div>
              <Edit3 className="h-16 w-16 text-purple-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Carregando dados do fornecedor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Render de estado de erro
  if (error) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                Erro ao carregar dados do fornecedor: {(error as Error).message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => navigate('/admin/cadastros/fornecedores')}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Fornecedores
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!fornecedor) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 mb-6">
              <AlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Fornecedor não encontrado
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              O fornecedor que você está tentando editar não existe ou foi removido do sistema.
            </p>
            <Button
              onClick={() => navigate('/admin/cadastros/fornecedores')}
              className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para lista
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Preparar dados do fornecedor para o formulário
  const fornecedorData = {
    ...fornecedor,
    cnpj: fornecedor.tipo === 'juridica' ? fornecedor.documento : '',
    cpf: fornecedor.tipo === 'fisica' ? fornecedor.documento : '',
  };

  // Render normal com dados do fornecedor
  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-8">
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 dark:from-pink-600/10 dark:to-orange-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/cadastros/fornecedores')}
                className="gap-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                Modo de Edição
              </Badge>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl">
                <Edit3 className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Editar Fornecedor
                </h1>
                <p className="text-lg text-muted-foreground">
                  Atualize as informações de <span className="font-semibold text-purple-600 dark:text-purple-400">{fornecedor.nome}</span>
                </p>
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
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Dica</p>
                  <p className="text-xs text-muted-foreground">Mantenha os dados sempre atualizados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Validação</p>
                  <p className="text-xs text-muted-foreground">Todos os campos são validados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Save className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Salvamento</p>
                  <p className="text-xs text-muted-foreground">Alterações salvas automaticamente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wrapper Customizado para o Formulário */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-orange-500/5 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-orange-900/10 rounded-2xl blur-xl" />
          
          <div className="relative">
            {/* Formulário com estilo customizado */}
            <div className="[&>div]:border-0 [&>div]:shadow-xl [&>div]:bg-white/80 [&>div]:dark:bg-gray-900/80 [&>div]:backdrop-blur-sm">
              <FornecedorForm
                fornecedor={fornecedorData}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/admin/cadastros/fornecedores')}
                isLoading={updateMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Footer com informações adicionais */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>ID: {fornecedor.id}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Última atualização: {new Date(fornecedor.updated_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 