import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  FlaskConical, 
  Eye,
  Edit,
  AlertCircle,
  Clock,
  Calendar,
  Package,
  CheckCircle,
  Pill,
  Droplets,
  Beaker,
  DollarSign,
  Percent,
  FileText,
  Settings,
  GripVertical
} from 'lucide-react';
import { supabase, getSupabaseFunctionUrl } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const VisualizarFormaFarmaceuticaPage: React.FC = () => {
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

  const getFormaIcon = (tipoUso?: string) => {
    switch (tipoUso) {
      case 'oral':
        return <Pill className="h-5 w-5" />;
      case 'topico':
        return <Droplets className="h-5 w-5" />;
      case 'injetavel':
        return <Beaker className="h-5 w-5" />;
      default:
        return <FlaskConical className="h-5 w-5" />;
    }
  };

  const getProcessTypeBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'PRODUCAO':
        return 'default';
      case 'QUALIDADE':
        return 'secondary';
      case 'LOGISTICA':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8 w-full">
          {/* Hero Section Skeleton */}
          <div className="relative overflow-hidden w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20" />
            <div className="relative px-6 py-12 w-full">
              <Skeleton className="h-10 w-64 mb-4" />
              <Skeleton className="h-12 w-96 mb-2" />
              <Skeleton className="h-6 w-80" />
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="px-6 space-y-6">
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
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin/cadastros/formas-farmaceuticas')}
                  className="mb-4 -ml-4 text-muted-foreground hover:text-green-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Formas Farmacêuticas
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    {getFormaIcon(formaData?.tipo_uso)}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {formaData?.nome || 'Carregando...'}
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Visualização detalhada da forma farmacêutica
                    </p>
                  </div>
                </div>
                
                {formaData && (
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 px-3 py-1">
                      <FlaskConical className="h-3 w-3 mr-1" />
                      {formaData.abreviatura || 'Sem abreviatura'}
                    </Badge>
                    {formaData.tipo_uso && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 px-3 py-1">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 blur-3xl opacity-20" />
                  <Eye className="h-32 w-32 text-green-600/20" />
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={() => navigate(`/admin/cadastros/formas-farmaceuticas/${id}/editar`)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>

        {/* Informações Gerais */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-white to-green-50/30 dark:from-slate-900 dark:to-green-950/10 border-green-200/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Informações Gerais</CardTitle>
                  <CardDescription>Dados básicos da forma farmacêutica</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-lg font-semibold">{formaData?.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Abreviatura</label>
                  <p className="text-lg font-semibold">{formaData?.abreviatura || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Uso</label>
                  <p className="text-lg font-semibold capitalize">{formaData?.tipo_uso || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant={formaData?.ativo ? "default" : "secondary"} className="mt-2">
                    {formaData?.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              {formaData?.descricao && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="text-base mt-2 text-muted-foreground">{formaData.descricao}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configurações Financeiras */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/10 border-amber-200/50">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Configurações Financeiras</CardTitle>
                  <CardDescription>Parâmetros de preço e desconto</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Desconto Máximo</label>
                  <div className="flex items-center gap-2 mt-2">
                    <Percent className="h-5 w-5 text-amber-600" />
                    <p className="text-lg font-semibold">{formaData?.desconto_maximo || 0}%</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Mínimo</label>
                  <div className="flex items-center gap-2 mt-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    <p className="text-lg font-semibold">R$ {formaData?.valor_minimo?.toFixed(2) || '0,00'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processos de Produção */}
        {formaData?.forma_processos && formaData.forma_processos.length > 0 && (
          <div className="px-6">
            <Card className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/10 border-blue-200/50">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Processos de Produção</CardTitle>
                    <CardDescription>{formaData.forma_processos.length} processo(s) cadastrado(s)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {formaData.forma_processos.sort((a: any, b: any) => a.ordem - b.ordem).map((processo: any) => (
                    <div key={processo.id} className="flex items-center gap-3 p-4 bg-background border rounded-lg">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{processo.ordem}.</span>
                          <span className="font-medium">{processo.nome_processo}</span>
                          <Badge variant={getProcessTypeBadgeVariant(processo.tipo_processo)}>
                            {processo.tipo_processo}
                          </Badge>
                          {processo.ponto_controle && (
                            <Badge variant="destructive">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ponto de Controle
                            </Badge>
                          )}
                        </div>
                        {processo.instrucoes && (
                          <p className="text-sm text-muted-foreground mt-2">{processo.instrucoes}</p>
                        )}
                      </div>
                      {processo.tempo_estimado_min && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {processo.tempo_estimado_min} min
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuração de Rótulo */}
        {formaData?.rotulo_config && (
          <div className="px-6">
            <Card className="bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-950/10 border-purple-200/50">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Configuração de Rótulo</CardTitle>
                    <CardDescription>Informações que aparecem no rótulo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(formaData.rotulo_config).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${value ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="text-sm capitalize">
                        {key.replace(/_/g, ' ').replace('mostrar ', '')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Informações de Auditoria */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50 border-slate-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {formaData?.created_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Criado em: {new Date(formaData.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {formaData?.updated_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Última atualização: {new Date(formaData.updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  ID: {id}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg mx-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Detalhes da forma farmacêutica | Pharma.AI</span>
            <span>Visualização completa dos dados</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default VisualizarFormaFarmaceuticaPage; 