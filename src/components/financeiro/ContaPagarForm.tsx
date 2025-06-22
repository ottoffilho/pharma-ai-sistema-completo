
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  descricao: z.string().min(3, { message: 'A descrição deve ter pelo menos 3 caracteres' }),
  fornecedor_id: z.string().uuid().optional().nullable(),
  categoria_id: z.string().uuid().optional().nullable(),
  valor_previsto: z.coerce.number().positive({ message: 'O valor deve ser maior que zero' }),
  data_emissao: z.date().optional().nullable(),
  data_vencimento: z.date({ required_error: 'A data de vencimento é obrigatória' }),
  observacoes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ContaPagarFormProps {
  contaId?: string;
  onSuccess?: () => void;
}

export function ContaPagarForm({ contaId, onSuccess }: ContaPagarFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!contaId;

  // Get current user
  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Fetch suppliers
  const { data: fornecedores, isLoading: isFornecedoresLoading } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch expense categories
  const { data: categorias, isLoading: isCategoriasLoading } = useQuery({
    queryKey: ['categorias_financeiras_despesas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('tipo', 'despesa')
        .eq('is_deleted', false)
        .order('nome');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch existing account data if editing
  const { data: contaExistente, isLoading: isContaLoading } = useQuery({
    queryKey: ['conta_a_pagar', contaId],
    queryFn: async () => {
      if (!contaId) return null;
      
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .select('*')
        .eq('id', contaId)
        .eq('is_deleted', false)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!contaId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: '',
      fornecedor_id: null,
      categoria_id: null,
      valor_previsto: 0,
      data_emissao: new Date(),
      data_vencimento: new Date(),
      observacoes: '',
    },
  });

  // Update form values when existing account data is loaded
  useEffect(() => {
    if (contaExistente) {
      form.reset({
        descricao: contaExistente.descricao,
        fornecedor_id: contaExistente.fornecedor_id,
        categoria_id: contaExistente.categoria_id,
        valor_previsto: Number(contaExistente.valor_previsto),
        data_emissao: contaExistente.data_emissao ? new Date(contaExistente.data_emissao) : null,
        data_vencimento: new Date(contaExistente.data_vencimento),
        observacoes: contaExistente.observacoes || '',
      });
    }
  }, [contaExistente, form]);

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Format dates as ISO strings for Supabase and ensure required fields are present
      const formattedValues = {
        descricao: values.descricao, // Ensuring descricao is passed explicitly
        valor_previsto: values.valor_previsto, // Ensuring valor_previsto is passed explicitly
        data_emissao: values.data_emissao ? values.data_emissao.toISOString().split('T')[0] : null,
        data_vencimento: values.data_vencimento.toISOString().split('T')[0],
        categoria_id: values.categoria_id,
        fornecedor_id: values.fornecedor_id,
        observacoes: values.observacoes,
        usuario_id_registro: userData?.id
      };

      const { data, error } = await supabase
        .from('contas_a_pagar')
        .insert(formattedValues)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_a_pagar'] });
      toast({
        title: "Conta a pagar criada",
        description: "A conta a pagar foi criada com sucesso.",
        variant: "success",
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Erro ao criar conta a pagar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conta a pagar. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Format dates as ISO strings for Supabase and ensure required fields are present
      const formattedValues = {
        descricao: values.descricao, // Ensuring descricao is passed explicitly
        valor_previsto: values.valor_previsto, // Ensuring valor_previsto is passed explicitly
        data_emissao: values.data_emissao ? values.data_emissao.toISOString().split('T')[0] : null,
        data_vencimento: values.data_vencimento.toISOString().split('T')[0],
        categoria_id: values.categoria_id,
        fornecedor_id: values.fornecedor_id,
        observacoes: values.observacoes
      };

      const { data, error } = await supabase
        .from('contas_a_pagar')
        .update(formattedValues)
        .eq('id', contaId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_a_pagar'] });
      queryClient.invalidateQueries({ queryKey: ['conta_a_pagar', contaId] });
      toast({
        title: "Conta a pagar atualizada",
        description: "A conta a pagar foi atualizada com sucesso.",
        variant: "success",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Erro ao atualizar conta a pagar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta a pagar. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const isLoading = isFornecedoresLoading || isCategoriasLoading || (isEditing && isContaLoading);
  const isMutating = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Informe a descrição da conta" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fornecedor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fornecedores?.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
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
            name="categoria_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias?.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="valor_previsto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Previsto (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  placeholder="0,00" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_emissao"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Emissão</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="data_vencimento"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Vencimento *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações adicionais" 
                  className="resize-none" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button 
            type="submit" 
            disabled={isMutating}
          >
            {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
