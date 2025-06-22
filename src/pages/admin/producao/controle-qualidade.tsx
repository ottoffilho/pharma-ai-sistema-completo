import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, TestTube, CheckCircle, XCircle, AlertCircle, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';

const testeSchema = z.object({
  tipo_teste: z.string().min(1, 'Tipo de teste é obrigatório'),
  descricao_teste: z.string().min(1, 'Descrição é obrigatória'),
  resultado: z.enum(['aprovado', 'reprovado', 'pendente']),
  valor_obtido: z.string().optional(),
  valor_esperado: z.string().optional(),
  observacoes: z.string().optional(),
  farmaceutico_responsavel_id: z.string().min(1, 'Farmacêutico responsável é obrigatório'),
});

type TesteFormData = z.infer<typeof testeSchema>;

const resultadoConfig = {
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  reprovado: { label: 'Reprovado', color: 'bg-red-100 text-red-800', icon: XCircle },
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
};

const tiposTesteComuns = [
  'Teste de pH',
  'Teste de viscosidade',
  'Teste de densidade',
  'Teste de pureza',
  'Teste microbiológico',
  'Teste de dissolução',
  'Teste de uniformidade',
  'Teste de estabilidade',
  'Análise quantitativa',
  'Análise qualitativa',
];

// Helper para validar UUID
const isUUID = (value?: string): boolean => {
  return !!value && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
};

export default function ControleQualidadePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<TesteFormData>({
    resolver: zodResolver(testeSchema),
    defaultValues: {
      resultado: 'pendente',
      tipo_teste: '',
      descricao_teste: '',
      valor_obtido: '',
      valor_esperado: '',
      observacoes: '',
      farmaceutico_responsavel_id: '',
    },
  });

  // Buscar dados da ordem
  const { data: ordem, isLoading: isLoadingOrdem } = useQuery({
    queryKey: ['ordem-producao', id],
    enabled: isUUID(id),
    queryFn: async () => {
      if (!id || !isUUID(id)) throw new Error('ID da ordem inválido');

      const { data, error } = await supabase
        .from('ordens_producao')
        .select(`
          *,
          receitas_processadas (
            patient_name
          ),
          ordem_producao_qualidade (
            *,
            farmaceutico:usuarios_internos (
              nome_completo
            )
          )
        `)
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar farmacêuticos
  const { data: farmaceuticos } = useQuery({
    queryKey: ['farmaceuticos-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios_internos')
        .select('id, nome_completo, cargo_perfil')
        .eq('ativo', true)
        .ilike('cargo_perfil', '%farmaceutico%')
        .order('nome_completo');

      if (error) throw error;
      return data;
    },
  });

  const adicionarTesteMutation = useMutation({
    mutationFn: async (data: TesteFormData) => {
      if (!id) throw new Error('ID da ordem não fornecido');

      const { error } = await supabase
        .from('ordem_producao_qualidade')
        .insert({
          ordem_producao_id: id,
          tipo_teste: data.tipo_teste,
          descricao_teste: data.descricao_teste,
          resultado: data.resultado,
          valor_obtido: data.valor_obtido || null,
          valor_esperado: data.valor_esperado || null,
          observacoes: data.observacoes || null,
          farmaceutico_responsavel_id: data.farmaceutico_responsavel_id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Teste de qualidade adicionado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['ordem-producao', id] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Erro ao adicionar teste:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar teste de qualidade.',
        variant: 'destructive',
      });
    },
  });

  const atualizarResultadoMutation = useMutation({
    mutationFn: async ({ testeId, resultado }: { testeId: string; resultado: string }) => {
      const { error } = await supabase
        .from('ordem_producao_qualidade')
        .update({ resultado })
        .eq('id', testeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Resultado do teste atualizado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['ordem-producao', id] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar resultado:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar resultado do teste.',
        variant: 'destructive',
      });
    },
  });

  const aprovarOrdemMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('ID da ordem não fornecido');

      const { error } = await supabase
        .from('ordens_producao')
        .update({ status: 'finalizada' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Ordem de produção aprovada e finalizada.',
      });
      queryClient.invalidateQueries({ queryKey: ['ordem-producao', id] });
      navigate(`/admin/producao/${id}`);
    },
    onError: (error) => {
      console.error('Erro ao aprovar ordem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar ordem de produção.',
        variant: 'destructive',
      });
    },
  });

  const reprovarOrdemMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('ID da ordem não fornecido');

      const { error } = await supabase
        .from('ordens_producao')
        .update({ status: 'cancelada' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Ordem Reprovada',
        description: 'Ordem de produção reprovada e cancelada.',
      });
      queryClient.invalidateQueries({ queryKey: ['ordem-producao', id] });
      navigate(`/admin/producao/${id}`);
    },
    onError: (error) => {
      console.error('Erro ao reprovar ordem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao reprovar ordem de produção.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TesteFormData) => {
    adicionarTesteMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const calcularStatusGeral = () => {
    if (!ordem?.ordem_producao_qualidade || ordem.ordem_producao_qualidade.length === 0) {
      return { status: 'sem_testes', label: 'Sem Testes', color: 'bg-gray-100 text-gray-800' };
    }

    const testes = ordem.ordem_producao_qualidade;
    const testesReprovados = testes.filter(t => t.resultado === 'reprovado');
    const testesPendentes = testes.filter(t => t.resultado === 'pendente');
    const testesAprovados = testes.filter(t => t.resultado === 'aprovado');

    if (testesReprovados.length > 0) {
      return { status: 'reprovado', label: 'Reprovado', color: 'bg-red-100 text-red-800' };
    }

    if (testesPendentes.length > 0) {
      return { status: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
    }

    if (testesAprovados.length === testes.length && testes.length > 0) {
      return { status: 'aprovado', label: 'Aprovado', color: 'bg-green-100 text-green-800' };
    }

    return { status: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
  };

  if (isLoadingOrdem) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">Carregando dados da ordem...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!ordem) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                Ordem não encontrada.
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const statusGeral = calcularStatusGeral();

  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(`/admin/producao/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Controle de Qualidade</h1>
              <p className="text-muted-foreground">
                Ordem: {ordem?.numero_ordem || id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Teste
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Teste de Qualidade</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tipo_teste"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Teste</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tiposTesteComuns.map((tipo) => (
                                  <SelectItem key={tipo} value={tipo}>
                                    {tipo}
                                  </SelectItem>
                                ))}
                                <SelectItem value="outro">Outro (especificar na descrição)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="resultado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resultado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="aprovado">Aprovado</SelectItem>
                                <SelectItem value="reprovado">Reprovado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="valor_esperado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Esperado</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: pH 7.0, 100mg/ml..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="valor_obtido"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Obtido</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: pH 6.8, 98mg/ml..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="farmaceutico_responsavel_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Farmacêutico Responsável</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o farmacêutico" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {farmaceuticos?.map((farmaceutico) => (
                                <SelectItem key={farmaceutico.id} value={farmaceutico.id}>
                                  {farmaceutico.nome_completo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="descricao_teste"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição do Teste</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o procedimento e metodologia do teste..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observações adicionais sobre o teste..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={adicionarTesteMutation.isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {adicionarTesteMutation.isPending ? 'Salvando...' : 'Salvar Teste'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Status Geral do Controle de Qualidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge className={statusGeral.color} variant="secondary">
                  {statusGeral.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {ordem.ordem_producao_qualidade?.length || 0} teste(s) realizado(s)
                </span>
              </div>
              
              {statusGeral.status === 'aprovado' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => aprovarOrdemMutation.mutate()}
                    disabled={aprovarOrdemMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar Ordem
                  </Button>
                </div>
              )}
              
              {statusGeral.status === 'reprovado' && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => reprovarOrdemMutation.mutate()}
                    disabled={reprovarOrdemMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reprovar Ordem
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Testes */}
        <Card>
          <CardHeader>
            <CardTitle>Testes Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            {ordem.ordem_producao_qualidade && ordem.ordem_producao_qualidade.length > 0 ? (
              <div className="space-y-4">
                {ordem.ordem_producao_qualidade
                  .sort((a, b) => new Date(b.data_teste).getTime() - new Date(a.data_teste).getTime())
                  .map((teste) => {
                    const resultadoInfo = resultadoConfig[teste.resultado as keyof typeof resultadoConfig];
                    const ResultadoIcon = resultadoInfo?.icon || AlertCircle;
                    
                    return (
                      <Card key={teste.id} className="border">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{teste.tipo_teste}</h3>
                                <Badge className={resultadoInfo?.color}>
                                  <ResultadoIcon className="mr-1 h-3 w-3" />
                                  {resultadoInfo?.label}
                                </Badge>
                              </div>
                              
                              <p className="text-muted-foreground mb-4">{teste.descricao_teste}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <label className="font-medium text-muted-foreground">Valor Esperado</label>
                                  <p>{teste.valor_esperado || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="font-medium text-muted-foreground">Valor Obtido</label>
                                  <p>{teste.valor_obtido || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="font-medium text-muted-foreground">Data do Teste</label>
                                  <p>{formatDate(teste.data_teste)}</p>
                                </div>
                                <div>
                                  <label className="font-medium text-muted-foreground">Farmacêutico</label>
                                  <p>{teste.farmaceutico?.nome_completo}</p>
                                </div>
                              </div>
                              
                              {teste.observacoes && (
                                <div className="mt-4">
                                  <label className="font-medium text-muted-foreground text-sm">Observações</label>
                                  <p className="text-sm mt-1">{teste.observacoes}</p>
                                </div>
                              )}
                            </div>
                            
                            {teste.resultado === 'pendente' && (
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  onClick={() => atualizarResultadoMutation.mutate({
                                    testeId: teste.id,
                                    resultado: 'aprovado'
                                  })}
                                  disabled={atualizarResultadoMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => atualizarResultadoMutation.mutate({
                                    testeId: teste.id,
                                    resultado: 'reprovado'
                                  })}
                                  disabled={atualizarResultadoMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reprovar
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <TestTube className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhum teste de qualidade foi realizado ainda.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Teste
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 