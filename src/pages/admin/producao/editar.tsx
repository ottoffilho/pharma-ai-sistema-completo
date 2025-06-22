import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import { OrdemProducaoUpdate } from '@/integrations/supabase/types';

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
    id: z.string().optional(),
    insumo_id: z.string().min(1, 'Insumo é obrigatório'),
    quantidade_necessaria: z.number().min(0.001, 'Quantidade deve ser maior que 0'),
    unidade_medida: z.string().min(1, 'Unidade é obrigatória'),
    observacoes: z.string().optional(),
  })),
  embalagens: z.array(z.object({
    id: z.string().optional(),
    embalagem_id: z.string().min(1, 'Embalagem é obrigatória'),
    quantidade_necessaria: z.number().min(1, 'Quantidade deve ser maior que 0'),
    observacoes: z.string().optional(),
  })),
  etapas: z.array(z.object({
    id: z.string().optional(),
    numero_etapa: z.number().min(1),
    nome_etapa: z.string().min(1, 'Nome da etapa é obrigatório'),
    descricao_etapa: z.string().min(1, 'Descrição é obrigatória'),
    tempo_estimado_minutos: z.number().optional(),
  })),
});

type OrdemFormData = z.infer<typeof ordemSchema>;

export default function EditarOrdemProducaoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados da ordem existente
  const { data: ordem, isLoading: isLoadingOrdem } = useQuery({
    queryKey: ['ordem-producao', id],
    queryFn: async () => {
      if (!id) throw new Error('ID da ordem não fornecido');

      const { data, error } = await supabase
        .from('ordens_producao')
        .select(`
          *,
          ordem_producao_insumos (*),
          ordem_producao_embalagens (*),
          ordem_producao_etapas (*)
        `)
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const form = useForm<OrdemFormData>({
    resolver: zodResolver(ordemSchema),
    defaultValues: {
      prioridade: 'normal',
      quantidade_total: 1,
      unidade_medida: 'unidade',
      insumos: [],
      embalagens: [],
      etapas: [],
    },
  });

  // Atualizar form quando os dados da ordem carregarem
  React.useEffect(() => {
    if (ordem) {
      form.reset({
        pedido_id: ordem.pedido_id || '',
        receita_processada_id: ordem.receita_processada_id || '',
        prioridade: ordem.prioridade as 'baixa' | 'media' | 'alta' | 'urgente',
        data_prevista_entrega: ordem.data_prevista_entrega ? 
          new Date(ordem.data_prevista_entrega).toISOString().slice(0, 16) : '',
        usuario_responsavel_id: ordem.usuario_responsavel_id || '',
        farmaceutico_responsavel_id: ordem.farmaceutico_responsavel_id || '',
        observacoes_gerais: ordem.observacoes_gerais || '',
        instrucoes_especiais: ordem.instrucoes_especiais || '',
        forma_farmaceutica: ordem.forma_farmaceutica || '',
        quantidade_total: ordem.quantidade_total,
        unidade_medida: ordem.unidade_medida,
        tempo_estimado_minutos: ordem.tempo_estimado_minutos || undefined,
        custo_total_estimado: ordem.custo_total_estimado || undefined,
        insumos: ordem.ordem_producao_insumos?.map(item => ({
          id: item.id,
          insumo_id: item.insumo_id,
          quantidade_necessaria: item.quantidade_necessaria,
          unidade_medida: item.unidade_medida,
          observacoes: item.observacoes || '',
        })) || [],
        embalagens: ordem.ordem_producao_embalagens?.map(item => ({
          id: item.id,
          embalagem_id: item.embalagem_id,
          quantidade_necessaria: item.quantidade_necessaria,
          observacoes: item.observacoes || '',
        })) || [],
        etapas: ordem.ordem_producao_etapas?.map(item => ({
          id: item.id,
          numero_etapa: item.numero_etapa,
          nome_etapa: item.nome_etapa,
          descricao_etapa: item.descricao_etapa,
          tempo_estimado_minutos: item.tempo_estimado_minutos || undefined,
        })) || [],
      });
    }
  }, [ordem, form]);

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
        .select('id, nome, unidade_medida, estoque_atual')
        .eq('is_deleted', false)
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
        .eq('is_deleted', false)
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  const updateOrdemMutation = useMutation({
    mutationFn: async (data: OrdemFormData) => {
      if (!id) throw new Error('ID da ordem não fornecido');

      // Atualizar a ordem de produção
      const ordemData: OrdemProducaoUpdate = {
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
      };

      const { error: ordemError } = await supabase
        .from('ordens_producao')
        .update(ordemData)
        .eq('id', id);

      if (ordemError) throw ordemError;

      // Atualizar insumos
      // Primeiro, deletar insumos removidos
      const insumosExistentes = ordem?.ordem_producao_insumos || [];
      const insumosNovos = data.insumos;
      const insumosParaDeletar = insumosExistentes.filter(
        existente => !insumosNovos.find(novo => novo.id === existente.id)
      );

      for (const insumo of insumosParaDeletar) {
        const { error } = await supabase
          .from('ordem_producao_insumos')
          .delete()
          .eq('id', insumo.id);
        if (error) throw error;
      }

      // Atualizar/inserir insumos
      for (const insumo of insumosNovos) {
        if (insumo.id) {
          // Atualizar existente
          const { error } = await supabase
            .from('ordem_producao_insumos')
            .update({
              insumo_id: insumo.insumo_id,
              quantidade_necessaria: insumo.quantidade_necessaria,
              unidade_medida: insumo.unidade_medida,
              observacoes: insumo.observacoes || null,
            })
            .eq('id', insumo.id);
          if (error) throw error;
        } else {
          // Inserir novo
          const { error } = await supabase
            .from('ordem_producao_insumos')
            .insert({
              ordem_producao_id: id,
              insumo_id: insumo.insumo_id,
              quantidade_necessaria: insumo.quantidade_necessaria,
              unidade_medida: insumo.unidade_medida,
              observacoes: insumo.observacoes || null,
            });
          if (error) throw error;
        }
      }

      // Atualizar embalagens (mesmo processo)
      const embalagensExistentes = ordem?.ordem_producao_embalagens || [];
      const embalagensNovas = data.embalagens;
      const embalagensParaDeletar = embalagensExistentes.filter(
        existente => !embalagensNovas.find(nova => nova.id === existente.id)
      );

      for (const embalagem of embalagensParaDeletar) {
        const { error } = await supabase
          .from('ordem_producao_embalagens')
          .delete()
          .eq('id', embalagem.id);
        if (error) throw error;
      }

      for (const embalagem of embalagensNovas) {
        if (embalagem.id) {
          const { error } = await supabase
            .from('ordem_producao_embalagens')
            .update({
              embalagem_id: embalagem.embalagem_id,
              quantidade_necessaria: embalagem.quantidade_necessaria,
              observacoes: embalagem.observacoes || null,
            })
            .eq('id', embalagem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('ordem_producao_embalagens')
            .insert({
              ordem_producao_id: id,
              embalagem_id: embalagem.embalagem_id,
              quantidade_necessaria: embalagem.quantidade_necessaria,
              observacoes: embalagem.observacoes || null,
            });
          if (error) throw error;
        }
      }

      // Atualizar etapas (mesmo processo)
      const etapasExistentes = ordem?.ordem_producao_etapas || [];
      const etapasNovas = data.etapas;
      const etapasParaDeletar = etapasExistentes.filter(
        existente => !etapasNovas.find(nova => nova.id === existente.id)
      );

      for (const etapa of etapasParaDeletar) {
        const { error } = await supabase
          .from('ordem_producao_etapas')
          .delete()
          .eq('id', etapa.id);
        if (error) throw error;
      }

      for (const etapa of etapasNovas) {
        if (etapa.id) {
          const { error } = await supabase
            .from('ordem_producao_etapas')
            .update({
              numero_etapa: etapa.numero_etapa,
              nome_etapa: etapa.nome_etapa,
              descricao_etapa: etapa.descricao_etapa,
              tempo_estimado_minutos: etapa.tempo_estimado_minutos || null,
            })
            .eq('id', etapa.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('ordem_producao_etapas')
            .insert({
              ordem_producao_id: id,
              numero_etapa: etapa.numero_etapa,
              nome_etapa: etapa.nome_etapa,
              descricao_etapa: etapa.descricao_etapa,
              tempo_estimado_minutos: etapa.tempo_estimado_minutos || null,
            });
          if (error) throw error;
        }
      }

      return { id };
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Ordem de produção atualizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['ordem-producao', id] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      navigate(`/admin/producao/${id}`);
    },
    onError: (error) => {
      console.error('Erro ao atualizar ordem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar ordem de produção.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: OrdemFormData) => {
    updateOrdemMutation.mutate(data);
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

  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/admin/producao/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Ordem {ordem.numero_ordem}</h1>
            <p className="text-muted-foreground">
              Edite as informações da ordem de produção
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pedido_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pedido (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um pedido" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {pedidos?.map((pedido) => (
                              <SelectItem key={pedido.id} value={pedido.id}>
                                {pedido.id.slice(0, 8)} - {pedido.receitas_processadas?.patient_name || 'N/A'}
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
                        <FormLabel>Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="usuario_responsavel_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {usuarios?.map((usuario) => (
                              <SelectItem key={usuario.id} value={usuario.id}>
                                {usuario.nome_completo} - {usuario.cargo_perfil}
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
                        <FormLabel>Farmacêutico Responsável</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                    name="data_prevista_entrega"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Prevista de Entrega</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="forma_farmaceutica"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma Farmacêutica</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cápsula, Pomada, Solução..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidade_total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Total</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
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
                        <FormLabel>Unidade de Medida</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: unidade, ml, g, kg..." {...field} />
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
                        <FormLabel>Tempo Estimado (minutos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
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
                        <FormLabel>Custo Total Estimado (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="observacoes_gerais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Gerais</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Observações sobre a ordem de produção..." {...field} />
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
                        <FormLabel>Instruções Especiais</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Instruções especiais para a manipulação..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Insumos */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Insumos</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendInsumo({
                      insumo_id: '',
                      quantidade_necessaria: 1,
                      unidade_medida: '',
                      observacoes: '',
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Insumo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {insumosFields.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum insumo adicionado. Clique em "Adicionar Insumo" para começar.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {insumosFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                        <FormField
                          control={form.control}
                          name={`insumos.${index}.insumo_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Insumo</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {insumos?.map((insumo) => (
                                    <SelectItem key={insumo.id} value={insumo.id}>
                                      {insumo.nome} (Estoque: {insumo.estoque_atual} {insumo.unidade_medida})
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
                          name={`insumos.${index}.quantidade_necessaria`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.001"
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
                          name={`insumos.${index}.unidade_medida`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unidade</FormLabel>
                              <FormControl>
                                <Input placeholder="g, ml, kg..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`insumos.${index}.observacoes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações</FormLabel>
                              <FormControl>
                                <Input placeholder="Observações..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInsumo(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Embalagens */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Embalagens</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendEmbalagem({
                      embalagem_id: '',
                      quantidade_necessaria: 1,
                      observacoes: '',
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Embalagem
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {embalagensFields.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma embalagem adicionada. Clique em "Adicionar Embalagem" para começar.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {embalagensFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                        <FormField
                          control={form.control}
                          name={`embalagens.${index}.embalagem_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Embalagem</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {embalagens?.map((embalagem) => (
                                    <SelectItem key={embalagem.id} value={embalagem.id}>
                                      {embalagem.nome} - {embalagem.tipo} (Estoque: {embalagem.estoque_atual})
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
                          name={`embalagens.${index}.quantidade_necessaria`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`embalagens.${index}.observacoes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações</FormLabel>
                              <FormControl>
                                <Input placeholder="Observações..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmbalagem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Etapas */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Etapas do Processo</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendEtapa({
                      numero_etapa: etapasFields.length + 1,
                      nome_etapa: '',
                      descricao_etapa: '',
                      tempo_estimado_minutos: undefined,
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Etapa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {etapasFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name={`etapas.${index}.numero_etapa`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número da Etapa</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`etapas.${index}.nome_etapa`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Etapa</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Pesagem, Mistura..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`etapas.${index}.tempo_estimado_minutos`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempo Estimado (min)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEtapa(index)}
                            className="text-red-600 hover:text-red-700"
                            disabled={etapasFields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name={`etapas.${index}.descricao_etapa`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição da Etapa</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Descreva detalhadamente esta etapa..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/producao/${id}`)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateOrdemMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateOrdemMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
} 