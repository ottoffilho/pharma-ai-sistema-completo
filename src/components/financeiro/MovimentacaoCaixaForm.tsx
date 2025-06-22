
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Schema de validação
const movimentacaoSchema = z.object({
  data_movimentacao: z.date({ required_error: 'A data é obrigatória' }),
  tipo_movimentacao: z.enum(['entrada', 'saida'], {
    required_error: 'O tipo de movimentação é obrigatório',
  }),
  descricao: z.string().min(1, 'A descrição é obrigatória'),
  valor: z.coerce
    .number()
    .positive('O valor deve ser maior que zero')
    .min(0.01, 'O valor deve ser maior que zero'),
  categoria_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type MovimentacaoFormValues = z.infer<typeof movimentacaoSchema>;

interface MovimentacaoCaixaFormProps {
  onSuccess?: () => void;
  initialData?: MovimentacaoFormValues;
  mode?: 'create' | 'edit';
  id?: string;
}

export const MovimentacaoCaixaForm: React.FC<MovimentacaoCaixaFormProps> = ({
  onSuccess,
  initialData,
  mode = 'create',
  id,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Processar os dados iniciais para lidar corretamente com categoria_id nulo
  const processedInitialData = initialData 
    ? {
        ...initialData,
        categoria_id: initialData.categoria_id || 'none',  // Converte null para "none" em vez de string vazia
      } 
    : {
        data_movimentacao: new Date(),
        tipo_movimentacao: 'entrada' as const,
        descricao: '',
        valor: undefined,
        categoria_id: 'none',
        observacoes: '',
      };

  const form = useForm<MovimentacaoFormValues>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: processedInitialData,
  });

  // Consultar categorias financeiras
  const { data: categorias, isLoading: categoriasLoading } = useQuery({
    queryKey: ['categorias-financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('is_deleted', false)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Mutação para salvar movimentação
  const mutation = useMutation({
    mutationFn: async (values: MovimentacaoFormValues) => {
      // Formatar a data para ISO string
      const formattedDate = format(values.data_movimentacao, 'yyyy-MM-dd');

      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Preparar o payload, convertendo "none" para null em categoria_id
      const movimentacao = {
        data_movimentacao: formattedDate,
        tipo_movimentacao: values.tipo_movimentacao,
        descricao: values.descricao,
        valor: values.valor,
        categoria_id: values.categoria_id === 'none' ? null : values.categoria_id,
        observacoes: values.observacoes || null,
        usuario_id: userId,
      };

      if (mode === 'create') {
        // Criar nova movimentação
        const { data, error } = await supabase
          .from('movimentacoes_caixa')
          .insert([movimentacao])
          .select();

        if (error) throw error;
        return data;
      } else {
        // Editar movimentação existente
        const { data, error } = await supabase
          .from('movimentacoes_caixa')
          .update(movimentacao)
          .eq('id', id)
          .select();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: mode === 'create' ? 'Movimentação registrada' : 'Movimentação atualizada',
        description: mode === 'create' 
          ? 'A movimentação foi registrada com sucesso.'
          : 'A movimentação foi atualizada com sucesso.',
        variant: 'success',
      });
      
      // Resetar o formulário se for modo criar
      if (mode === 'create') {
        form.reset({
          data_movimentacao: new Date(),
          tipo_movimentacao: 'entrada',
          descricao: '',
          valor: undefined,
          categoria_id: 'none',
          observacoes: '',
        });
      }
      
      // Invalidar a consulta para atualizar a listagem
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-caixa'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: unknown) => {
      console.error('Erro ao salvar movimentação:', error);
      toast({
        title: 'Erro ao salvar',
        description: (error instanceof Error ? error.message : 'Erro desconhecido') || 'Ocorreu um erro ao salvar a movimentação.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: MovimentacaoFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Data da Movimentação */}
          <FormField
            control={form.control}
            name="data_movimentacao"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo de Movimentação */}
          <FormField
            control={form.control}
            name="tipo_movimentacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descrição */}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Descrição da movimentação" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Valor */}
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.01" 
                    placeholder="0.00" 
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        field.onChange(undefined);
                      } else {
                        field.onChange(parseFloat(e.target.value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoria */}
          <FormField
            control={form.control}
            name="categoria_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria (opcional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma categoria</SelectItem>
                    {categoriasLoading ? (
                      <SelectItem value="loading" disabled>
                        Carregando...
                      </SelectItem>
                    ) : categorias && categorias.length > 0 ? (
                      categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome} ({categoria.tipo === 'receita' ? 'Receita' : 'Despesa'})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="empty" disabled>
                        Nenhuma categoria disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecione uma categoria para organizar suas movimentações
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Observações */}
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações adicionais" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? (
            mode === 'create' ? 'Registrando...' : 'Atualizando...'
          ) : (
            mode === 'create' ? 'Registrar Movimentação' : 'Atualizar Movimentação'
          )}
        </Button>
      </form>
    </Form>
  );
};
