// =====================================================
// PÁGINA - EDITAR CLIENTE (REDESENHADA)
// =====================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  ArrowLeft, 
  AlertCircle, 
  AlertTriangle,
  User,
  Edit3,
  Sparkles,
  CheckCircle,
  Info,
  Save,
  Shield,
  Heart,
  Zap
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ClienteForm from '@/components/clientes/ClienteForm';
import { useCliente } from '@/hooks/useClientes';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function EditarClientePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar dados do cliente
  const { data: cliente, isLoading, error } = useCliente(id!);

  // Mutation para atualizar cliente
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('clientes')
        .update({
          nome: data.nome,
          email: data.email || null,
          telefone: data.telefone || null,
          cpf: data.cpf || null,
          cnpj: data.cnpj || null,
          tipo_pessoa: data.tipo_pessoa,
          nome_fantasia: data.nome_fantasia || null,
          rg: data.rg || null,
          endereco: data.endereco || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
          cep: data.cep || null,
          data_nascimento: data.data_nascimento || null,
          observacoes: data.observacoes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente', id] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      
      toast({
        title: "Cliente atualizado!",
        description: "As alterações foram salvas com sucesso.",
        variant: "default",
      });
      
      navigate(`/admin/clientes/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Edit3 className="h-16 w-16 text-blue-400/20" />
              </div>
              <Edit3 className="h-16 w-16 text-blue-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Carregando dados do cliente...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                Erro ao carregar dados do cliente: {(error as Error).message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => navigate('/admin/clientes')}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Clientes
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!cliente) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 mb-6">
              <AlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Cliente não encontrado
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              O cliente que você está tentando editar não existe ou foi removido do sistema.
            </p>
            <Button
              onClick={() => navigate('/admin/clientes')}
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 dark:from-blue-600/10 dark:to-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/10 dark:to-purple-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/admin/clientes/${id}`)}
                className="gap-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                Modo de Edição
              </Badge>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-xl">
                <Edit3 className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Editar Cliente
                </h1>
                <p className="text-lg text-muted-foreground">
                  Atualize as informações de <span className="font-semibold text-blue-600 dark:text-blue-400">{cliente.nome}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Ajuda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Segurança</p>
                  <p className="text-xs text-muted-foreground">Dados protegidos e criptografados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Validação</p>
                  <p className="text-xs text-muted-foreground">Campos validados automaticamente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Agilidade</p>
                  <p className="text-xs text-muted-foreground">Salvamento instantâneo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wrapper Customizado para o Formulário */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 rounded-2xl blur-xl" />
          
          <div className="relative">
            {/* Formulário com estilo customizado */}
            <div className="[&>div]:border-0 [&>div]:shadow-xl [&>div]:bg-white/80 [&>div]:dark:bg-gray-900/80 [&>div]:backdrop-blur-sm">
              <ClienteForm 
                initialData={cliente}
                isEditing={true}
                clienteId={id}
                onSuccess={() => navigate(`/admin/clientes/${id}`)}
                onCancel={() => navigate(`/admin/clientes/${id}`)}
              />
            </div>
          </div>
        </div>

        {/* Footer com informações adicionais */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>ID: {cliente.id}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Cliente desde: {new Date(cliente.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
          {cliente.pontos_fidelidade > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span>{cliente.pontos_fidelidade} pontos de fidelidade</span>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 