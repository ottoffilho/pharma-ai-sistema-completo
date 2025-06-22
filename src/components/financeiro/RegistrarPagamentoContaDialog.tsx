
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const pagamentoSchema = z.object({
  valor_pago: z.coerce.number().positive({ message: 'O valor deve ser maior que zero' }),
  data_pagamento: z.date({ required_error: 'A data de pagamento é obrigatória' }),
  observacoes: z.string().optional().nullable(),
});

type PagamentoFormValues = z.infer<typeof pagamentoSchema>;

interface RegistrarPagamentoContaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: {
    id: string;
    descricao: string;
    valor_previsto?: number;
    categoria_id?: string;
    fornecedor_nome?: string;
  };
  onSuccess?: () => void;
}

export function RegistrarPagamentoContaDialog({ 
  open, 
  onOpenChange, 
  conta,
  onSuccess 
}: RegistrarPagamentoContaDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const form = useForm<PagamentoFormValues>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      valor_pago: conta?.valor_previsto ? Number(conta.valor_previsto) : 0,
      data_pagamento: new Date(),
      observacoes: '',
    },
  });

  const registrarPagamentoMutation = useMutation({
    mutationFn: async (values: PagamentoFormValues) => {
      // Create a movimentacao_caixa record first
      const movimentacaoDesc = `Pagamento: ${conta.descricao}`;
      
      const { data: movimentacao, error: movError } = await supabase
        .from('movimentacoes_caixa')
        .insert({
          tipo_movimentacao: 'saida',
          descricao: movimentacaoDesc,
          valor: values.valor_pago,
          data_movimentacao: values.data_pagamento.toISOString(),
          categoria_id: conta.categoria_id,
          observacoes: values.observacoes,
          usuario_id: userData?.id,
        })
        .select()
        .single();

      if (movError) throw movError;
      
      // Then update the conta_a_pagar with the payment information
      const { data: updatedConta, error: contaError } = await supabase
        .from('contas_a_pagar')
        .update({
          status_conta: 'pago',
          data_pagamento: values.data_pagamento.toISOString(),
          valor_pago: values.valor_pago,
          usuario_id_pagamento: userData?.id,
          movimentacao_caixa_id: movimentacao.id
        })
        .eq('id', conta.id)
        .select();

      if (contaError) throw contaError;

      return { movimentacao, conta: updatedConta };
    },
    onSuccess: () => {
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['contas_a_pagar'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes_caixa'] });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Erro ao registrar pagamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: PagamentoFormValues) => {
    registrarPagamentoMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Preencha os dados para registrar o pagamento da conta.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <p className="text-sm font-medium text-foreground">Descrição da conta</p>
              <p className="text-sm">{conta?.descricao}</p>
            </div>
            
            {conta?.fornecedor_nome && (
              <div className="grid gap-2">
                <p className="text-sm font-medium text-foreground">Fornecedor</p>
                <p className="text-sm">{conta.fornecedor_nome}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="valor_pago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Pago (R$)</FormLabel>
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

            <FormField
              control={form.control}
              name="data_pagamento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Pagamento</FormLabel>
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
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
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
                      placeholder="Observações adicionais sobre o pagamento" 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => onOpenChange(false)}
                disabled={registrarPagamentoMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={registrarPagamentoMutation.isPending}
              >
                {registrarPagamentoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Pagamento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
