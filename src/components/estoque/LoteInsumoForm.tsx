import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const inputCls = "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-cyan-600/40 dark:bg-slate-800/80 dark:border-slate-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-cyan-600/50 rounded-md";

// Zod schema for form validation
const loteInsumoSchema = z.object({
  produto_id: z.string().min(1, "Insumo é obrigatório"),
  numero_lote: z.string().min(1, "Número do lote é obrigatório"),
  quantidade_inicial: z.number().min(0, "Quantidade inicial deve ser positiva"),
  quantidade_atual: z.number().min(0, "Quantidade atual deve ser positiva"),
  data_validade: z.date().nullable(),
  fornecedor_id: z.string().nullable(),
  custo_unitario_lote: z.number().nullable(),
  notas: z.string().nullable(),
  unidade_medida: z.string()
});

type LoteFormValues = z.infer<typeof loteInsumoSchema>;

interface LoteInsumoFormProps {
  initialData?: Record<string, unknown>;
  isEditing?: boolean;
  loteId?: string;
  insumoId?: string;
  xmlData?: {
    produto_id?: string;
    numero_lote?: string;
    data_fabricacao?: string;
    data_validade?: string;
    quantidade?: number;
    fornecedor_id?: string;
    preco_unitario?: number;
  };
}

// ADICIONADO: Helper function para identificar se um produto é insumo
const isLikelyInsumo = (nomeProduto: string): boolean => {
  const insumoKeywords = [
    // Matérias-primas químicas
    'cloreto', 'sulfato', 'carbonato', 'óxido', 'ácido', 'álcool', 'glicerina', 
    'vaselina', 'lanolina', 'parafina', 'cera', 'óleo mineral', 'silicone',
    
    // Ativos farmacêuticos
    'vitamina', 'colágeno', 'proteína', 'extrato', 'essência', 'óleo essencial',
    'hidrolisado', 'peptídeo', 'aminoácido', 'enzima', 'probiótico',
    
    // Conservantes e estabilizantes
    'parabeno', 'fenoxietanol', 'benzoato', 'sorbato', 'tocoferol', 'bht', 'bha',
    'edta', 'citrato', 'lactato', 'gluconato',
    
    // Bases e veículos
    'base', 'veículo', 'excipiente', 'diluente', 'solvente', 'gel base',
    'creme base', 'pomada base', 'loção base',
    
    // Materiais de embalagem primária
    'papel indicador', 'teste', 'reagente', 'substrato'
  ];
  
  const nomeNormalized = nomeProduto.toLowerCase();
  return insumoKeywords.some(keyword => nomeNormalized.includes(keyword));
};

const LoteInsumoForm = ({ initialData, isEditing = false, loteId, insumoId, xmlData }: LoteInsumoFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInsumoId, setSelectedInsumoId] = useState<string | null>(insumoId || null);

  // State for real-time validation
  const [loteValidation, setLoteValidation] = useState<{
    isChecking: boolean;
    isDuplicate: boolean;
    message: string;
  }>({
    isChecking: false,
    isDuplicate: false,
    message: ''
  });

  // Form initialization
  const form = useForm<LoteFormValues>({
    resolver: zodResolver(loteInsumoSchema),
    defaultValues: {
      produto_id: insumoId || "",
      numero_lote: "",
      quantidade_inicial: 0,
      quantidade_atual: 0,
      data_validade: null,
      fornecedor_id: null,
      custo_unitario_lote: null,
      notas: null,
      unidade_medida: ""
    }
  });

  // Fetch insumos data for select - ALTERADO: buscar produtos do tipo INSUMO
  const { data: insumos, isLoading: isLoadingInsumos } = useQuery({
    queryKey: ['produtos-insumos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, unidade_medida, tipo')
        .eq('tipo', 'INSUMO')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch fornecedores data for select
  const { data: fornecedores, isLoading: isLoadingFornecedores } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch specific insumo details when selected to get the unit of measure - ALTERADO
  const { data: selectedInsumo, isLoading: isLoadingInsumoDetails } = useQuery({
    queryKey: ['produto-insumo', selectedInsumoId],
    queryFn: async () => {
      if (!selectedInsumoId) return null;
      
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, unidade_medida, tipo')
        .eq('id', selectedInsumoId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedInsumoId,
  });

  // Fetch lote data in edit mode - ALTERADO: usar tabela lote
  const { data: loteData, isLoading: isLoadingLote } = useQuery({
    queryKey: ['lote-insumo', loteId],
    queryFn: async () => {
      if (!loteId) return null;
      
      const { data, error } = await supabase
        .from('lote')
        .select(`
          id,
          produto_id,
          numero_lote,
          data_validade,
          quantidade_inicial,
          quantidade_atual,
          fornecedor_id,
          preco_custo_unitario,
          observacoes
        `)
        .eq('id', loteId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!loteId && isEditing,
  });

  // Update form when lote data is loaded in edit mode - ALTERADO
  useEffect(() => {
    if (loteData) {
      setSelectedInsumoId(loteData.produto_id);
      form.reset({
        produto_id: loteData.produto_id,
        numero_lote: loteData.numero_lote,
        quantidade_inicial: loteData.quantidade_inicial,
        quantidade_atual: loteData.quantidade_atual,
        data_validade: loteData.data_validade ? new Date(loteData.data_validade) : null,
        fornecedor_id: loteData.fornecedor_id,
        custo_unitario_lote: loteData.preco_custo_unitario,
        notas: loteData.observacoes,
        unidade_medida: ""
      });
    }
  }, [loteData, form]);

  // Effect to update form when insumo changes
  useEffect(() => {
    if (selectedInsumo) {
      form.setValue('unidade_medida', selectedInsumo.unidade_medida);
    }
  }, [selectedInsumo, form]);

  // ADICIONADO: Effect para pre-popular com dados do XML
  useEffect(() => {
    if (xmlData && !isEditing) {
      if (xmlData.produto_id) {
        setSelectedInsumoId(xmlData.produto_id);
        form.setValue('produto_id', xmlData.produto_id);
      }
      if (xmlData.numero_lote) {
        form.setValue('numero_lote', xmlData.numero_lote);
      }
      if (xmlData.data_validade) {
        form.setValue('data_validade', new Date(xmlData.data_validade));
      }
      if (xmlData.quantidade) {
        form.setValue('quantidade_inicial', xmlData.quantidade);
        form.setValue('quantidade_atual', xmlData.quantidade);
      }
      if (xmlData.fornecedor_id) {
        form.setValue('fornecedor_id', xmlData.fornecedor_id);
      }
      if (xmlData.preco_unitario) {
        form.setValue('custo_unitario_lote', xmlData.preco_unitario);
      }
    }
  }, [xmlData, form, isEditing]);

  // ADICIONADO: Effect para sugerir insumos automaticamente do XML
  useEffect(() => {
    if (xmlData && !xmlData.produto_id && !isEditing && insumos && xmlData.numero_lote) {
      // Se não veio produto_id no XML, tentar encontrar insumos similares
      const insumosSugeridos = insumos.filter(insumo => 
        isLikelyInsumo(insumo.nome)
      ).slice(0, 3); // Limitar a 3 sugestões
      
      if (insumosSugeridos.length > 0) {
        toast({
          title: "Sugestão automática",
          description: `Detectamos ${insumosSugeridos.length} possível(is) insumo(s) na base de dados. Verifique o campo "Insumo".`,
          variant: "default",
        });
      }
    }
  }, [xmlData, insumos, isEditing, toast]);

  // Handling insumo selection
  const handleInsumoChange = (insumoId: string) => {
    setSelectedInsumoId(insumoId);
    form.setValue('produto_id', insumoId);
  };

  // Custom validation for unique lote number - MOVED BEFORE validateLoteNumber
  const checkLoteUniqueness = useCallback(async (numeroLote: string, produtoId: string) => {
    if (!numeroLote || !produtoId) return true;
    
    const { data, error } = await supabase
      .from('lote')
      .select('id')
      .eq('produto_id', produtoId)
      .eq('numero_lote', numeroLote)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao verificar unicidade do lote:', error);
      return true; // Allow validation to pass in case of error
    }
    
    // If editing, check if the found lote is not the current one
    if (isEditing && loteId && data) {
      return data.id === loteId;
    }
    
    // For new lotes, no existing lote should be found
    return !data;
  }, [isEditing, loteId]);

  // Real-time validation function - NOW DEFINED AFTER checkLoteUniqueness
  const validateLoteNumber = useCallback(
    async (numeroLote: string, produtoId: string) => {
      if (!numeroLote || !produtoId) {
        setLoteValidation({ isChecking: false, isDuplicate: false, message: '' });
        return;
      }

      setLoteValidation(prev => ({ ...prev, isChecking: true }));

      try {
        const isUnique = await checkLoteUniqueness(numeroLote, produtoId);
        
        setLoteValidation({
          isChecking: false,
          isDuplicate: !isUnique,
          message: !isUnique ? 'Este número de lote já existe para este produto' : ''
        });
      } catch (error) {
        console.error('Erro na validação:', error);
        setLoteValidation({ isChecking: false, isDuplicate: false, message: '' });
      }
    },
    [checkLoteUniqueness]
  );

  // Watch form values for real-time validation
  const watchedValues = form.watch(['numero_lote', 'produto_id']);
  
  useEffect(() => {
    const [numeroLote, produtoId] = watchedValues;
    
    if (!numeroLote || !produtoId) {
      setLoteValidation({ isChecking: false, isDuplicate: false, message: '' });
      return;
    }

    const timeoutId = setTimeout(() => {
      validateLoteNumber(numeroLote, produtoId);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, validateLoteNumber]);

  // Create/update mutation - ALTERADO: usar tabela lote
  const mutation = useMutation({
    mutationFn: async (values: LoteFormValues) => {
      // Check for duplicate lote number
      const isUnique = await checkLoteUniqueness(values.numero_lote, values.produto_id);
      if (!isUnique) {
        throw new Error('Este número de lote já existe para o produto selecionado. Por favor, use um número diferente.');
      }
      
      // Format the date to ISO string if it exists
      const formattedDate = values.data_validade ? values.data_validade.toISOString().split('T')[0] : null;
      
      if (isEditing && loteId) {
        const { data, error } = await supabase
          .from('lote')
          .update({
            produto_id: values.produto_id,
            numero_lote: values.numero_lote,
            data_validade: formattedDate,
            quantidade_inicial: values.quantidade_inicial,
            quantidade_atual: values.quantidade_atual,
            fornecedor_id: values.fornecedor_id || null,
            preco_custo_unitario: values.custo_unitario_lote || null,
            observacoes: values.notas || null
          })
          .eq('id', loteId);
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('lote')
          .insert({
            produto_id: values.produto_id,
            numero_lote: values.numero_lote,
            data_validade: formattedDate,
            quantidade_inicial: values.quantidade_inicial,
            quantidade_atual: values.quantidade_atual,
            fornecedor_id: values.fornecedor_id || null,
            preco_custo_unitario: values.custo_unitario_lote || null,
            observacoes: values.notas || null,
            ativo: true
          })
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Lote atualizado" : "Lote criado",
        description: isEditing 
          ? "O lote foi atualizado com sucesso." 
          : "Um novo lote foi criado com sucesso.",
        variant: "success",
      });
      
      // Invalidate relevant queries - ALTERADO
      queryClient.invalidateQueries({ queryKey: ['lotes'] });
      queryClient.invalidateQueries({ queryKey: ['lotes', form.getValues().produto_id] });
      queryClient.invalidateQueries({ queryKey: ['produtos-insumos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      
      // Navigate back
      navigateBack();
    },
    onError: (error) => {
      console.error("Erro ao salvar lote:", error);
      
      let errorMessage = `Ocorreu um erro ao ${isEditing ? 'atualizar' : 'criar'} o lote. Por favor, tente novamente.`;
      
      // Check for specific error types
      if (error.message.includes('número de lote já existe')) {
        errorMessage = error.message;
      } else if (error.message && error.message.includes('23505')) {
        errorMessage = 'Este número de lote já existe para o produto selecionado. Por favor, use um número diferente.';
      } else if (error.message && error.message.includes('duplicate key')) {
        errorMessage = 'Este número de lote já existe para o produto selecionado. Por favor, use um número diferente.';
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: LoteFormValues) {
    mutation.mutate(values);
  }

  function navigateBack() {
    navigate('/admin/estoque/lotes');
  }

  const isLoading = isLoadingLote || mutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Editar Lote de Insumo' : 'Novo Lote de Insumo'}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? 'Atualize as informações do lote' : 'Cadastre um novo lote para um insumo'}
          </p>
          {/* ADICIONADO: Indicador de dados do XML */}
          {xmlData && !isEditing && (
            <div className="mt-2">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                📄 Dados pré-carregados do XML
              </span>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={navigateBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>

      {(isLoadingLote || isLoadingInsumos || isLoadingInsumoDetails) ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Insumo Select */}
              <FormField
                control={form.control}
                name="produto_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insumo</FormLabel>
                    <Select 
                      onValueChange={(value) => handleInsumoChange(value)}
                      value={field.value || undefined}
                      disabled={isEditing || !!insumoId || isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className={`w-full ${inputCls}`}>
                          <SelectValue placeholder="Selecione um insumo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {insumos?.map((insumo) => (
                          <SelectItem key={insumo.id} value={insumo.id}>
                            {insumo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Número do Lote */}
              <FormField
                control={form.control}
                name="numero_lote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Lote</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Ex: LOT123456" 
                          {...field} 
                          disabled={isLoading}
                          className={cn(
                            loteValidation.isDuplicate ? "border-red-500 focus-visible:ring-red-500" : "",
                            loteValidation.isChecking ? "pr-8" : ""
                          )}
                        />
                        {loteValidation.isChecking && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                          </div>
                        )}
                        {!loteValidation.isChecking && loteValidation.isDuplicate && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                        {!loteValidation.isChecking && !loteValidation.isDuplicate && field.value && form.getValues().produto_id && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {loteValidation.message && (
                      <p className="text-sm text-red-500 mt-1">{loteValidation.message}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unidade de Medida - Readonly */}
              <FormField
                control={form.control}
                name="unidade_medida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        readOnly
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      A unidade de medida é definida pelo insumo selecionado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantidade Inicial */}
              <FormField
                control={form.control}
                name="quantidade_inicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Inicial</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                          
                          // If creating new, set quantidade_atual = quantidade_inicial
                          if (!isEditing) {
                            form.setValue('quantidade_atual', isNaN(value) ? 0 : value);
                          }
                        }}
                        disabled={isLoading}
                        className={inputCls}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantidade Atual (only editable in edit mode) */}
              <FormField
                control={form.control}
                name="quantidade_atual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Atual</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                        disabled={!isEditing || isLoading}
                        className={inputCls}
                      />
                    </FormControl>
                    {!isEditing && (
                      <FormDescription>
                        Na criação, a quantidade atual será igual à quantidade inicial
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data de Validade */}
              <FormField
                control={form.control}
                name="data_validade"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Validade</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={isLoading}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Data de validade do lote (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fornecedor */}
              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={isLoading || isLoadingFornecedores}
                    >
                      <FormControl>
                        <SelectTrigger className={`w-full ${inputCls}`}>
                          <SelectValue placeholder="Selecione um fornecedor (opcional)" />
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

              {/* Custo Unitário do Lote */}
              <FormField
                control={form.control}
                name="custo_unitario_lote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Unitário do Lote (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00" 
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                        disabled={isLoading}
                        className={inputCls}
                      />
                    </FormControl>
                    <FormDescription>
                      Custo unitário específico deste lote (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notas */}
            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionais</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre este lote..." 
                      className={`${inputCls} min-h-[100px]`}
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Salvando..." : "Criando..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? "Salvar Alterações" : "Salvar Lote"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default LoteInsumoForm;
