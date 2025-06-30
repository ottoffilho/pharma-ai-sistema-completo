import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { FormaFarmaceuticaForm } from '@/components/cadastros/FormaFarmaceuticaForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  FlaskConical, 
  Edit3,
  Save,
  AlertCircle,
  Loader2,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { supabase, getSupabaseFunctionUrl } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EditarFormaFarmaceuticaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formaData, setFormaData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchFormaData();
    }
  }, [id]);

  const fetchFormaData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(
        getSupabaseFunctionUrl(`gerenciar-formas-farmaceuticas/buscar/${id}`),
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Forma farmacêutica não encontrada');
      }

      const result = await response.json();
      setFormaData(result.data);
    } catch (error) {
      console.error('Erro ao buscar forma farmacêutica:', error);
      setError(error.message || 'Erro ao carregar dados');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da forma farmacêutica.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8 w-full">
          {/* Hero Section Skeleton */}
          <div className="relative overflow-hidden w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
            <div className="relative px-6 py-12 w-full">
              <Skeleton className="h-10 w-64 mb-4" />
              <Skeleton className="h-12 w-96 mb-2" />
              <Skeleton className="h-6 w-80" />
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="px-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-8 w-full">
          <div className="px-6 py-12">
          <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
            <AlertDescription>
                {error}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
              onClick={() => navigate('/admin/cadastros/formas-farmaceuticas')}
              className="mt-4"
          >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista
          </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

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
                  onClick={() => navigate('/admin/cadastros/formas-farmaceuticas')}
                  className="mb-4 -ml-4 text-muted-foreground hover:text-amber-600"
        >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Formas Farmacêuticas
        </Button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <Edit3 className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      Editar Forma Farmacêutica
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Atualize os dados de {formaData?.nome || 'carregando...'}
                    </p>
                  </div>
                </div>
                
                {formaData && (
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 px-3 py-1">
                      <FlaskConical className="h-3 w-3 mr-1" />
                      {formaData.abreviatura || 'Sem abreviatura'}
                    </Badge>
                    {formaData.tipo_uso && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50 px-3 py-1">
                        {formaData.tipo_uso.charAt(0).toUpperCase() + formaData.tipo_uso.slice(1)}
                      </Badge>
                    )}
                    <Badge variant={formaData.ativo ? "default" : "secondary"} className={formaData.ativo ? "bg-green-100 text-green-700" : ""}>
                      {formaData.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 blur-3xl opacity-20" />
                  <Edit3 className="h-32 w-32 text-amber-600/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações de Auditoria */}
        {formaData && (
          <div className="px-6">
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50 border-slate-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    {formaData.created_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Criado em: {new Date(formaData.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {formaData.updated_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Última atualização: {new Date(formaData.updated_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-200">
                    ID: {id}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulário */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/10 border-amber-200/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <Save className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Dados da Forma Farmacêutica</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Atualize as informações conforme necessário
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <FormaFarmaceuticaForm formaId={id} initialData={formaData} />
            </CardContent>
          </Card>
        </div>

        {/* Card de Aviso */}
        <div className="px-6">
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Atenção:</strong> Alterações na forma farmacêutica podem afetar produtos e processos de produção associados. 
              Certifique-se de revisar os impactos antes de salvar as mudanças.
            </AlertDescription>
          </Alert>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg mx-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Edição de formas farmacêuticas | Pharma.AI</span>
            <span>Mantenha os dados sempre atualizados</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditarFormaFarmaceuticaPage; 