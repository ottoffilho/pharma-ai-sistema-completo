import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  AlertTriangle,
  DollarSign,
  Edit3,
  Sparkles,
  CheckCircle,
  Calendar,
  CreditCard,
  Receipt,
  TrendingDown,
  Shield,
  Zap,
  Heart,
  Clock,
  Building2,
  FileText,
  Calculator,
  Banknote,
  AlertOctagon
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContaPagarForm } from '@/components/financeiro/ContaPagarForm';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function EditarContaPagarPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: conta, isLoading, error } = useQuery({
    queryKey: ['conta_a_pagar', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .select(`
          *,
          fornecedores (
            id,
            nome,
            documento
          ),
          categorias_financeiras (
            id,
            nome,
            tipo
          )
        `)
        .eq('id', id)
        .eq('is_deleted', false)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Show error toast if the account couldn't be found
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da conta a pagar.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <DollarSign className="h-16 w-16 text-red-400/20" />
              </div>
              <DollarSign className="h-16 w-16 text-red-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Carregando dados da conta...</p>
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
                Erro ao carregar dados da conta: {(error as Error).message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => navigate('/admin/financeiro/contas-a-pagar')}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Contas a Pagar
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!conta) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 mb-6">
              <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Conta não encontrada
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              A conta que você está tentando editar não existe ou foi removida do sistema.
            </p>
            <Button
              onClick={() => navigate('/admin/financeiro/contas-a-pagar')}
              className="gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para lista
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Calcular dias para vencimento
  const getDiasParaVencimento = () => {
    if (!conta.data_vencimento) return null;
    const hoje = new Date();
    const vencimento = new Date(conta.data_vencimento);
    return Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  const diasParaVencimento = getDiasParaVencimento();
  const isVencida = diasParaVencimento !== null && diasParaVencimento < 0;
  const isProximaVencer = diasParaVencimento !== null && diasParaVencimento >= 0 && diasParaVencimento <= 7;

  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-8">
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-pink-500/10 to-rose-500/10 dark:from-red-900/20 dark:via-pink-900/20 dark:to-rose-900/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-400/20 to-pink-400/20 dark:from-red-600/10 dark:to-pink-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-rose-400/20 dark:from-pink-600/10 dark:to-rose-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/financeiro/contas-a-pagar')}
                className="gap-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
              >
            <ArrowLeft className="h-4 w-4" />
                Voltar
          </Button>
              
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                Modo de Edição
              </Badge>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-xl">
                <Edit3 className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Editar Conta a Pagar
                </h1>
                <p className="text-lg text-muted-foreground mb-3">
                  {conta.descricao || 'Conta sem descrição'}
                </p>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={conta.status === 'pago' ? 'default' : isVencida ? 'destructive' : 'outline'}
                    className="gap-1"
                  >
                    {conta.status === 'pago' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : isVencida ? (
                      <AlertOctagon className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {conta.status === 'pago' ? 'Pago' : isVencida ? 'Vencida' : 'Pendente'}
                  </Badge>
                  {isProximaVencer && conta.status !== 'pago' && (
                    <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
                      <AlertTriangle className="h-3 w-3" />
                      Vence em {diasParaVencimento} dias
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                    R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {conta.data_vencimento 
                      ? format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Não definido'
                    }
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="text-base font-bold text-purple-700 dark:text-purple-400 line-clamp-1">
                    {conta.fornecedores?.nome || 'Não informado'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="text-base font-bold text-orange-700 dark:text-orange-400 line-clamp-1">
                    {conta.categorias_financeiras?.nome || 'Sem categoria'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Receipt className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Ajuda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Controle Total</p>
                  <p className="text-xs text-muted-foreground">Gerencie suas obrigações</p>
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
                  <p className="text-sm font-medium">Alertas Inteligentes</p>
                  <p className="text-xs text-muted-foreground">Nunca perca um vencimento</p>
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
                  <p className="text-sm font-medium">Histórico Completo</p>
                  <p className="text-xs text-muted-foreground">Rastreie todos os pagamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wrapper Customizado para o Formulário */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-pink-500/5 to-rose-500/5 dark:from-red-900/10 dark:via-pink-900/10 dark:to-rose-900/10 rounded-2xl blur-xl" />
          
          <Card className="relative border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30">
                  <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle>Formulário de Edição</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Altere as informações da conta conforme necessário
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ContaPagarForm 
                contaId={id} 
                onSuccess={() => navigate('/admin/financeiro/contas-a-pagar')} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Cards de Informação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-500 to-pink-500" />
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold">Dicas de Gestão</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Mantenha as datas de vencimento sempre atualizadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Categorize corretamente para análises financeiras precisas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Adicione observações para facilitar o controle</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Status da Conta</h3>
              </div>
              <div className="space-y-3">
                {conta.status === 'pago' ? (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Esta conta já foi paga</span>
                    </div>
                    {conta.data_pagamento && (
                      <p className="text-sm mt-1 ml-6">
                        Paga em {format(new Date(conta.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                ) : isVencida ? (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4" />
                      <span className="font-medium">Conta vencida há {Math.abs(diasParaVencimento!)} dias</span>
                    </div>
                  </div>
                ) : isProximaVencer ? (
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Atenção: vence em {diasParaVencimento} dias</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Conta pendente de pagamento</span>
                    </div>
                  </div>
                )}
              </div>
          </CardContent>
        </Card>
        </div>

        {/* Footer com informações adicionais */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>ID: {conta.id}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Última atualização: {new Date(conta.updated_at).toLocaleDateString('pt-BR')}</span>
          </div>
          {conta.numero_documento && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span>Doc: {conta.numero_documento}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
