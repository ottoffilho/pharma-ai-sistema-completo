import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Save, Clock, User, Package, AlertTriangle, CheckCircle2, FlaskConical, ShoppingCart } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import { OrdemProducaoInsert } from '@/integrations/supabase/types';

const ordemSchema = z.object({
  pedido_id: z.string().optional(),
  receita_processada_id: z.string().optional(),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']),
  data_prevista_entrega: z.string().optional(),
  usuario_responsavel_id: z.string().optional(),
  farmaceutico_responsavel_id: z.string().optional(),
  observacoes_gerais: z.string().optional(),
  instrucoes_especiais: z.string().optional(),
  forma_farmaceutica: z.string().optional(),
  quantidade_total: z.number().min(0.001, 'Quantidade deve ser maior que 0'),
  unidade_medida: z.string().min(1, 'Unidade de medida é obrigatória'),
  tempo_estimado_minutos: z.number().optional(),
  custo_total_estimado: z.number().optional(),
  insumos: z.array(z.object({
    insumo_id: z.string().min(1, 'Insumo é obrigatório'),
    quantidade_necessaria: z.number().min(0.001, 'Quantidade deve ser maior que 0'),
    unidade_medida: z.string().min(1, 'Unidade é obrigatória'),
    observacoes: z.string().optional(),
  })),
  embalagens: z.array(z.object({
    embalagem_id: z.string().min(1, 'Embalagem é obrigatória'),
    quantidade_necessaria: z.number().min(1, 'Quantidade deve ser maior que 0'),
    observacoes: z.string().optional(),
  })),
  etapas: z.array(z.object({
    numero_etapa: z.number().min(1),
    nome_etapa: z.string().min(1, 'Nome da etapa é obrigatório'),
    descricao_etapa: z.string().min(1, 'Descrição é obrigatória'),
    tempo_estimado_minutos: z.number().optional(),
  })),
});

type OrdemFormData = z.infer<typeof ordemSchema>;

// Classe de input unificada para light/dark
const inputCls = "h-11 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-600/40 dark:bg-slate-700/60 dark:border-slate-700 dark:text-white";

export default function NovaOrdemProducaoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(1);

  const form = useForm<OrdemFormData>({
    resolver: zodResolver(ordemSchema),
    defaultValues: {
      prioridade: 'normal',
      quantidade_total: 1,
      unidade_medida: 'unidade',
      insumos: [],
      embalagens: [],
      etapas: [
        {
          numero_etapa: 1,
          nome_etapa: 'Preparação',
          descricao_etapa: 'Preparação dos insumos e equipamentos',
          tempo_estimado_minutos: 30,
        },
      ],
    },
  });

  const {
    fields: insumosFields,
    append: appendInsumo,
    remove: removeInsumo,
  } = useFieldArray({
    control: form.control,
    name: 'insumos',
  });

  const {
    fields: embalagensFields,
    append: appendEmbalagem,
    remove: removeEmbalagem,
  } = useFieldArray({
    control: form.control,
    name: 'embalagens',
  });

  const {
    fields: etapasFields,
    append: appendEtapa,
    remove: removeEtapa,
  } = useFieldArray({
    control: form.control,
    name: 'etapas',
  });

  // Buscar dados para os selects
  const { data: pedidos } = useQuery({
    queryKey: ['pedidos-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, status, receitas_processadas(patient_name)')
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios_internos')
        .select('id, nome_completo, cargo_perfil')
        .eq('ativo', true)
        .order('nome_completo');

      if (error) throw error;
      return data;
    },
  });

  const { data: insumos } = useQuery({
    queryKey: ['insumos-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insumos')
        .select('id, nome, unidade, estoque_atual')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  const { data: embalagens } = useQuery({
    queryKey: ['embalagens-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embalagens')
        .select('id, nome, tipo, estoque_atual')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  const createOrdemMutation = useMutation({
    mutationFn: async (data: OrdemFormData) => {
      // Criar a ordem de produção
      const ordemData: OrdemProducaoInsert = {
        pedido_id: data.pedido_id || null,
        receita_processada_id: data.receita_processada_id || null,
        prioridade: data.prioridade,
        data_prevista_entrega: data.data_prevista_entrega || null,
        usuario_responsavel_id: data.usuario_responsavel_id || null,
        farmaceutico_responsavel_id: data.farmaceutico_responsavel_id || null,
        observacoes_gerais: data.observacoes_gerais || null,
        instrucoes_especiais: data.instrucoes_especiais || null,
        forma_farmaceutica: data.forma_farmaceutica || null,
        quantidade_total: data.quantidade_total,
        unidade_medida: data.unidade_medida,
        tempo_estimado_minutos: data.tempo_estimado_minutos || null,
        custo_total_estimado: data.custo_total_estimado || null,
        numero_ordem: '', // Será gerado automaticamente pelo trigger
      };

      const { data: ordem, error: ordemError } = await supabase
        .from('ordens_producao')
        .insert(ordemData)
        .select()
        .single();

      if (ordemError) throw ordemError;

      // Inserir insumos
      if (data.insumos.length > 0) {
        const insumosData = data.insumos.map(insumo => ({
          ordem_producao_id: ordem.id,
          insumo_id: insumo.insumo_id,
          quantidade_necessaria: insumo.quantidade_necessaria,
          unidade_medida: insumo.unidade_medida,
          observacoes: insumo.observacoes || null,
        }));

        const { error: insumosError } = await supabase
          .from('ordem_producao_insumos')
          .insert(insumosData);

        if (insumosError) throw insumosError;
      }

      // Inserir embalagens
      if (data.embalagens.length > 0) {
        const embalagensData = data.embalagens.map(embalagem => ({
          ordem_producao_id: ordem.id,
          embalagem_id: embalagem.embalagem_id,
          quantidade_necessaria: embalagem.quantidade_necessaria,
          observacoes: embalagem.observacoes || null,
        }));

        const { error: embalagensError } = await supabase
          .from('ordem_producao_embalagens')
          .insert(embalagensData);

        if (embalagensError) throw embalagensError;
      }

      // Inserir etapas
      if (data.etapas.length > 0) {
        const etapasData = data.etapas.map(etapa => ({
          ordem_producao_id: ordem.id,
          numero_etapa: etapa.numero_etapa,
          nome_etapa: etapa.nome_etapa,
          descricao_etapa: etapa.descricao_etapa,
          tempo_estimado_minutos: etapa.tempo_estimado_minutos || null,
        }));

        const { error: etapasError } = await supabase
          .from('ordem_producao_etapas')
          .insert(etapasData);

        if (etapasError) throw etapasError;
      }

      return ordem;
    },
    onSuccess: (ordem) => {
      toast({
        title: 'Sucesso',
        description: `Ordem de produção ${ordem.numero_ordem} criada com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      navigate('/admin/producao');
    },
    onError: (error) => {
      console.error('Erro ao criar ordem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar ordem de produção.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: OrdemFormData) => {
    createOrdemMutation.mutate(data);
  };

  const steps = [
    { number: 1, title: 'Informações Básicas', icon: Package },
    { number: 2, title: 'Insumos', icon: FlaskConical },
    { number: 3, title: 'Embalagens', icon: ShoppingCart },
    { number: 4, title: 'Etapas de Produção', icon: CheckCircle2 },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/10 dark:to-indigo-950/10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/admin/producao')}
                className="hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nova Ordem de Produção</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Crie uma nova ordem de produção para manipulação</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 cursor-pointer transition-all ${
                      activeStep === step.number
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : activeStep > step.number
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 text-gray-400'
                    }`}
                    onClick={() => setActiveStep(step.number)}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${
                      activeStep >= step.number ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block w-24 h-0.5 mx-4 ${
                      activeStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Step 1: Informações Básicas */}
              {activeStep === 1 && (
                <Card className="shadow-lg border-0 dark:bg-slate-800/60 dark:border-slate-700/60">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white dark:from-blue-700/80 dark:to-indigo-700/80 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Informações Básicas da Ordem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="pedido_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4" />
                              Pedido Relacionado
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputCls}>
                                  <SelectValue placeholder="Selecione um pedido" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {pedidos?.map((pedido) => (
                                  <SelectItem key={pedido.id} value={pedido.id}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{pedido.id.slice(0, 8)}</span>
                                      <span className="text-sm text-gray-500">
                                        {pedido.receitas_processadas?.patient_name || 'N/A'}
                                      </span>
                                    </div>
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
                        name="prioridade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Prioridade</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputCls}>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="baixa">
                                  <Badge variant="secondary">Baixa</Badge>
                                </SelectItem>
                                <SelectItem value="normal">
                                  <Badge variant="outline">Normal</Badge>
                                </SelectItem>
                                <SelectItem value="alta">
                                  <Badge variant="default">Alta</Badge>
                                </SelectItem>
                                <SelectItem value="urgente">
                                  <Badge variant="destructive">Urgente</Badge>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_prevista_entrega"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Data Prevista de Entrega
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                className={inputCls}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="usuario_responsavel_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Responsável
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputCls}>
                                  <SelectValue placeholder="Selecione o responsável" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {usuarios?.map((usuario) => (
                                  <SelectItem key={usuario.id} value={usuario.id}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{usuario.nome_completo}</span>
                                      <span className="text-sm text-gray-500">{usuario.cargo_perfil}</span>
                                    </div>
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
                        name="farmaceutico_responsavel_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Farmacêutico Responsável</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputCls}>
                                  <SelectValue placeholder="Selecione o farmacêutico" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {usuarios?.filter(u => u.cargo_perfil.toLowerCase().includes('farmaceutico')).map((usuario) => (
                                  <SelectItem key={usuario.id} value={usuario.id}>
                                    {usuario.nome_completo}
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
                        name="forma_farmaceutica"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Forma Farmacêutica</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: Cápsula, Pomada, Solução..." 
                                className={inputCls}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="quantidade_total"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Quantidade Total</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.001"
                                className={inputCls}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="unidade_medida"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Unidade de Medida</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: unidade, ml, g, kg..." 
                                className={inputCls}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tempo_estimado_minutos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Tempo Estimado (min)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className={inputCls}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="custo_total_estimado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Custo Estimado (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                className={inputCls}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="observacoes_gerais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Observações Gerais</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Observações sobre a ordem de produção..." 
                                className="min-h-[100px] bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-600/40 dark:bg-slate-700/60 dark:border-slate-700 dark:text-white"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instrucoes_especiais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Instruções Especiais</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Instruções especiais de manipulação..." 
                                className="min-h-[100px] bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-600/40 dark:bg-slate-700/60 dark:border-slate-700 dark:text-white"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                  disabled={activeStep === 1}
                >
                  Anterior
                </Button>

                <div className="flex gap-3">
                  {activeStep < 4 ? (
                    <Button
                      type="button"
                      onClick={() => setActiveStep(Math.min(4, activeStep + 1))}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Próximo
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={createOrdemMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {createOrdemMutation.isPending ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Criar Ordem
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
} 