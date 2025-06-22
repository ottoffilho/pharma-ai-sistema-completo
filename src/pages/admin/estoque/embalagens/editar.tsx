import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  ArrowLeft, 
  AlertCircle, 
  AlertTriangle,
  Package2,
  Edit3,
  Sparkles,
  CheckCircle,
  Layers,
  Box,
  Palette,
  Ruler,
  Shield,
  Recycle,
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import EmbalagemForm from '@/components/estoque/EmbalagemForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const EditarEmbalagemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: embalagem, isLoading, error } = useQuery({
    queryKey: ['embalagem', id],
    queryFn: async () => {
      if (!id) throw new Error("ID da embalagem não fornecido");
      
      const { data, error } = await supabase
        .from('embalagens')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Package2 className="h-16 w-16 text-amber-400/20" />
              </div>
              <Package2 className="h-16 w-16 text-amber-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Carregando dados da embalagem...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                Erro ao carregar dados da embalagem: {(error as Error).message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => navigate("/admin/estoque/embalagens")}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Embalagens
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!embalagem) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 mb-6">
              <AlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Embalagem não encontrada
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              A embalagem que você está tentando editar não existe ou foi removida do sistema.
            </p>
            <Button
              onClick={() => navigate("/admin/estoque/embalagens")}
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

  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-8">
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-orange-400/20 dark:from-amber-600/10 dark:to-orange-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-400/20 to-yellow-400/20 dark:from-orange-600/10 dark:to-yellow-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/estoque/embalagens")}
                className="gap-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                Modo de Edição
              </Badge>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl">
                <Edit3 className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Editar Embalagem
                </h1>
                <p className="text-lg text-muted-foreground">
                  Atualize as informações de <span className="font-semibold text-amber-600 dark:text-amber-400">{embalagem.nome}</span>
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
                  <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Versatilidade</p>
                  <p className="text-xs text-muted-foreground">Múltiplos tipos de embalagem</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Recycle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sustentabilidade</p>
                  <p className="text-xs text-muted-foreground">Materiais eco-friendly</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Proteção</p>
                  <p className="text-xs text-muted-foreground">Conservação ideal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wrapper Customizado para o Formulário */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-yellow-500/5 dark:from-amber-900/10 dark:via-orange-900/10 dark:to-yellow-900/10 rounded-2xl blur-xl" />
          
          <div className="relative">
            {/* Formulário com estilo customizado */}
            <div className="[&>div]:border-0 [&>div]:shadow-xl [&>div]:bg-white/80 [&>div]:dark:bg-gray-900/80 [&>div]:backdrop-blur-sm">
              <EmbalagemForm 
                defaultValues={embalagem}
                isEditing={true}
                embalagemId={id}
              />
            </div>
          </div>
        </div>

        {/* Footer com informações adicionais */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            <span>ID: {embalagem.id}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Última atualização: {new Date(embalagem.updated_at).toLocaleDateString('pt-BR')}</span>
          </div>
          {embalagem.tipo && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-amber-500" />
                <span>Tipo: {embalagem.tipo}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditarEmbalagemPage;
