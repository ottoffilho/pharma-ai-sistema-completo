import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  AlertTriangle, 
  ArrowLeft, 
  AlertCircle,
  Package,
  Edit3,
  Sparkles,
  CheckCircle,
  Info,
  Save,
  Beaker,
  FlaskConical,
  Pill,
  Heart,
  Shield,
  Activity
} from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import InsumoForm from "@/components/estoque/InsumoForm";
import LotesInsumoTable from "@/components/estoque/LotesInsumoTable";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';

export default function EditarInsumoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados do insumo
  const {
    data: insumo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["insumo", id],
    queryFn: async () => {
      if (!id) throw new Error("ID do insumo não fornecido");

      const { data, error } = await supabase
        .from("insumos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Insumo não encontrado");
      
      return data;
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
                <Beaker className="h-16 w-16 text-emerald-400/20" />
              </div>
              <Beaker className="h-16 w-16 text-emerald-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Carregando dados do insumo...</p>
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
                Erro ao carregar dados do insumo: {(error as Error).message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => navigate("/admin/estoque/insumos")}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Insumos
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!insumo) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 mb-6">
              <AlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Insumo não encontrado
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              O insumo que você está tentando editar não existe ou foi removido do sistema.
            </p>
            <Button
              onClick={() => navigate("/admin/estoque/insumos")}
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-green-500/10 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-green-900/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/10 dark:to-teal-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-400/20 to-green-400/20 dark:from-teal-600/10 dark:to-green-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/estoque/insumos")}
                className="gap-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                Modo de Edição
              </Badge>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl">
                <Edit3 className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Editar Insumo
                </h1>
                <p className="text-lg text-muted-foreground">
                  Atualize as informações de <span className="font-semibold text-emerald-600 dark:text-emerald-400">{insumo.nome}</span>
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
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Qualidade</p>
                  <p className="text-xs text-muted-foreground">Controle rigoroso de lotes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Rastreabilidade</p>
                  <p className="text-xs text-muted-foreground">Histórico completo</p>
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
                  <p className="text-sm font-medium">Cuidado</p>
                  <p className="text-xs text-muted-foreground">Matéria-prima de qualidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com Estilo Moderno */}
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-1 rounded-xl">
            <TabsTrigger 
              value="dados" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <FlaskConical className="h-4 w-4" />
              Dados do Insumo
            </TabsTrigger>
            <TabsTrigger 
              value="lotes" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <Package className="h-4 w-4" />
              Lotes do Insumo
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dados" className="mt-6">
            {/* Wrapper Customizado para o Formulário */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-green-500/5 dark:from-emerald-900/10 dark:via-teal-900/10 dark:to-green-900/10 rounded-2xl blur-xl" />
              
              <div className="relative">
                {/* Formulário com estilo customizado */}
                <div className="[&>div]:border-0 [&>div]:shadow-xl [&>div]:bg-white/80 [&>div]:dark:bg-gray-900/80 [&>div]:backdrop-blur-sm">
                  <InsumoForm 
                    initialData={insumo} 
                    isEditing={true} 
                    insumoId={id} 
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="lotes" className="mt-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                {id && <LotesInsumoTable insumoId={id} insumoNome={insumo?.nome} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer com informações adicionais */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            <span>ID: {insumo.id}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Última atualização: {new Date(insumo.updated_at).toLocaleDateString('pt-BR')}</span>
          </div>
          {insumo.estoque_atual && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span>{insumo.estoque_atual} {insumo.unidade_medida} em estoque</span>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
