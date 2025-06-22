
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
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

// Schema de validação
const categoriaSchema = z.object({
  nome: z.string().min(1, 'Nome da categoria é obrigatório'),
  tipo: z.enum(['receita', 'despesa'], {
    required_error: 'Tipo de categoria é obrigatório',
  }),
  descricao: z.string().optional(),
});

type CategoriaFormValues = z.infer<typeof categoriaSchema>;

// Tipo para a inserção no banco de dados
type CategoriaInsertValues = {
  nome: string;
  tipo: 'receita' | 'despesa';
  descricao?: string | null;
};

interface CategoriaFinanceiraFormProps {
  id?: string;
  defaultValues?: Partial<CategoriaFormValues>;
  onSuccess?: () => void;
}

export const CategoriaFinanceiraForm: React.FC<CategoriaFinanceiraFormProps> = ({
  id,
  defaultValues = {
    nome: '',
    tipo: 'receita',
    descricao: '',
  },
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const form = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues,
  });

  // Mutação para criar/atualizar categoria
  const mutation = useMutation({
    mutationFn: async (values: CategoriaFormValues) => {
      // Transforma os valores do formulário para o formato esperado pelo banco
      const dbValues: CategoriaInsertValues = {
        nome: values.nome,
        tipo: values.tipo,
        descricao: values.descricao || null,
      };

      if (isEditing) {
        // Atualizando categoria existente
        const { data, error } = await supabase
          .from('categorias_financeiras')
          .update(dbValues)
          .eq('id', id);

        if (error) throw error;
        return data;
      } else {
        // Criando nova categoria
        const { data, error } = await supabase
          .from('categorias_financeiras')
          .insert(dbValues)
          .select();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? 'Categoria atualizada' : 'Categoria criada',
        description: isEditing
          ? 'A categoria foi atualizada com sucesso.'
          : 'A categoria foi criada com sucesso.',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin/financeiro/categorias');
      }
    },
    onError: (error: unknown) => {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: 'Erro ao salvar',
        description: (error instanceof Error ? error.message : 'Erro desconhecido') || 'Ocorreu um erro ao salvar a categoria.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: CategoriaFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fornecedores" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Indica se esta categoria é de receita ou despesa.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descrição da categoria (opcional)" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="submit" disabled={mutation.isPending}>
            {isEditing ? 'Salvar Alterações' : 'Criar Categoria'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/admin/financeiro/categorias')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
};
