import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Save, 
  ArrowLeft, 
  ArrowRight,
  Package, 
  FlaskConical, 
  Package2, 
  Sparkles,
  DollarSign,
  BarChart3,
  Info,
  CheckCircle2,
  Upload,
  X,
  TrendingUp,
  Calculator,
  AlertCircle
} from "lucide-react";
import logger from "@/lib/logger";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CampoMarkupModerno } from "@/components/markup/CampoMarkupModerno";
import { ProductPreview } from "@/components/estoque/ProductPreview";
import { cn } from "@/lib/utils";

// Tipos de produtos com cores
const tiposProduto = [
  { value: "MEDICAMENTO", label: "Medicamento", icon: Package, color: "from-blue-500 to-indigo-500" },
  { value: "COSMÉTICO", label: "Cosmético", icon: Sparkles, color: "from-pink-500 to-rose-500" },
  { value: "INSUMO", label: "Insumo", icon: FlaskConical, color: "from-emerald-500 to-teal-500" },
  { value: "EMBALAGEM", label: "Embalagem", icon: Package2, color: "from-amber-500 to-orange-500" },
];

// Unidades de medida expandidas para incluir variações da NF-e
const unidadesMedidaExpandidas = [
  "ml", "g", "unidades", "kg", "litro", "miligrama",
  // Unidades comuns da NF-e
  "UN", "CX", "PT", "PC", "FR", "TB", "GL", "RL", "SC", "BD",
  // Unidades específicas para farmácia
  "cx", "pote", "frasco", "ampola", "bisnaga", "sachê", "kit",
  // Medidas de peso/volume
  "mg", "mcg", "L", "mL", "grama", "quilograma"
];

// Função para mapear unidades da NF-e para unidades padrão
const mapearUnidadeNFe = (unidadeNFe: string): string => {
  const unidadeLimpa = unidadeNFe.replace(/^\d+\s*/, '').trim().toUpperCase();
  
  const mapeamento: Record<string, string> = {
    'UN': 'unidades',
    'CX': 'unidades', 
    'PT': 'unidades',
    'PC': 'unidades',
    'FR': 'unidades',
    'TB': 'unidades',
    'GL': 'unidades',
    'RL': 'unidades',
    'SC': 'unidades',
    'BD': 'unidades',
    'KIT': 'unidades',
    'CAIXA': 'unidades',
    'FRASCO': 'unidades',
    'POTE': 'unidades',
    'MG': 'miligrama',
    'MCG': 'miligrama',
    'ML': 'ml',
    'L': 'litro',
    'G': 'g',
    'KG': 'kg'
  };
  
  return mapeamento[unidadeLimpa] || unidadeNFe;
};

// Schema de validação
const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  categoria_produto_id: z.string().optional(),
  unidade_medida: z.string().min(1, "Unidade de medida é obrigatória"),
  volume_capacidade: z.string().optional(),
  unidade_comercial: z.string().optional(),
  unidade_tributaria: z.string().optional(),
  custo_unitario: z.number().min(0, "Custo deve ser positivo"),
  markup: z.number().min(0.1, "Markup deve ser maior que 0").default(6),
  preco_venda: z.number().min(0, "Preço de venda deve ser positivo").optional(),
  estoque_atual: z.number().min(0, "Estoque atual deve ser positivo").default(0),
  estoque_minimo: z.number().min(0, "Estoque mínimo deve ser positivo").default(0),
  estoque_maximo: z.number().min(0, "Estoque máximo deve ser positivo").optional(),
  fornecedor_id: z.string().optional(),
  descricao: z.string().optional(),
  codigo_interno: z.string().optional(),
  codigo_ean: z.string().optional(),
  densidade: z.number().optional().nullable()
    .refine((val) => !val || (val > 0 && val < 10), {
      message: "Densidade deve estar entre 0 e 10 g/ml"
    }),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface ProdutoFormModernoProps {
  produtoId?: string;
}

// Etapas do formulário
const steps = [
  {
    id: "basico",
    title: "Informações Básicas",
    description: "Identificação e categorização",
    icon: Package,
    color: "from-teal-500 to-cyan-500",
  },
  {
    id: "precificacao",
    title: "Precificação",
    description: "Custos e preços de venda",
    icon: DollarSign,
    color: "from-emerald-500 to-green-500",
  },
  {
    id: "estoque",
    title: "Controle de Estoque",
    description: "Níveis e alertas",
    icon: BarChart3,
    color: "from-amber-500 to-orange-500",
  },
];

const ProdutoFormModerno: React.FC<ProdutoFormModernoProps> = ({ produtoId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      tipo: 'MEDICAMENTO',
      categoria_produto_id: '',
      unidade_medida: '',
      volume_capacidade: '',
      unidade_comercial: '',
      unidade_tributaria: '',
      custo_unitario: 0,
      markup: 6,
      preco_venda: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
      estoque_maximo: 0,
      fornecedor_id: '',
      descricao: '',
      codigo_interno: '',
      codigo_ean: '',
      densidade: null,
    },
  });

  const tipoSelecionado = form.watch("tipo");
  const custoUnitario = form.watch("custo_unitario");
  const markup = form.watch("markup");

  // Calcular automaticamente o preço de venda
  useEffect(() => {
    if (custoUnitario && markup) {
      const precoVenda = custoUnitario * markup;
      form.setValue('preco_venda', precoVenda);
    }
  }, [custoUnitario, markup, form]);

  // Não precisamos mais buscar categorias do banco - usamos categorias fixas

  // Buscar fornecedores
  const { data: fornecedores } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar produto existente (para edição)
  const { data: produto, isLoading: carregandoProduto } = useQuery({
    queryKey: ['produto', produtoId],
    queryFn: async () => {
      if (!produtoId) return null;
      
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', produtoId)
        .eq('is_deleted', false)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!produtoId,
  });

  // Preencher formulário com dados do produto existente
  useEffect(() => {
    if (produto && !carregandoProduto) {
      console.log('📝 Carregando produto para edição:', produto);
      
      // Mapear unidade da NF-e para unidade padrão se necessário
      const unidadeMapeada = produto.unidade_medida ? mapearUnidadeNFe(produto.unidade_medida) : '';
      console.log(`🔄 Mapeando unidade: "${produto.unidade_medida}" → "${unidadeMapeada}"`);
      
      form.reset({
        nome: produto.nome || '',
        tipo: produto.tipo || 'MEDICAMENTO',
        categoria_produto_id: produto.categoria_produto_id || '',
        unidade_medida: unidadeMapeada,
        volume_capacidade: produto.volume_capacidade || '',
        unidade_comercial: produto.unidade_comercial || '',
        unidade_tributaria: produto.unidade_tributaria || '',
        custo_unitario: produto.custo_unitario || 0,
        markup: produto.markup || 6,
        preco_venda: produto.preco_venda || 0,
        estoque_atual: produto.estoque_atual || 0,
        estoque_minimo: produto.estoque_minimo || 0,
        estoque_maximo: produto.estoque_maximo || 0,
        fornecedor_id: produto.fornecedor_id || '',
        descricao: produto.descricao || '',
        codigo_interno: produto.codigo_interno || '',
        codigo_ean: produto.codigo_ean || '',
        densidade: produto.densidade || null,
      });

      // Para edição, marcar todas as etapas como completas para permitir navegação livre
      if (produtoId) {
        console.log('🔄 Produto em edição - habilitando navegação livre entre etapas');
        setCompletedSteps([0, 1, 2]); // Marcar todas as etapas como completas para permitir navegação
      }
    }
  }, [produto, carregandoProduto, form, produtoId]);

  // Mutation para salvar produto
  const salvarMutation = useMutation({
    mutationFn: async (data: ProdutoFormData) => {
      console.log('🔧 Iniciando salvar produto:', { produtoId, data });
      
      // Mapear categoria_produto_id para categoria (string) para markup
      let categoriaString = '';
      if (data.categoria_produto_id) {
        const categoriaEncontrada = categoriasSistema.find(cat => cat.id === data.categoria_produto_id);
        categoriaString = categoriaEncontrada?.nome || '';
        console.log(`🏷️ Mapeando categoria: ${data.categoria_produto_id} → "${categoriaString}"`);
      }
      
      const produtoData = {
        nome: data.nome,
        tipo: data.tipo,
        categoria_produto_id: data.categoria_produto_id || null,
        categoria: categoriaString, // ✅ NOVO: Campo categoria para markup
        unidade_medida: data.unidade_medida,
        volume_capacidade: data.volume_capacidade,
        unidade_comercial: data.unidade_comercial,
        unidade_tributaria: data.unidade_tributaria,
        custo_unitario: data.custo_unitario,
        markup: data.markup,
        preco_venda: data.preco_venda,
        estoque_atual: data.estoque_atual,
        estoque_minimo: data.estoque_minimo,
        estoque_maximo: data.estoque_maximo,
        fornecedor_id: data.fornecedor_id || null,
        descricao: data.descricao,
        codigo_interno: data.codigo_interno,
        codigo_ean: data.codigo_ean,
        densidade: data.densidade || null,
        updated_at: new Date().toISOString(),
      };

      console.log('📦 Dados processados para salvar:', produtoData);

      if (produtoId) {
        console.log('🔄 Atualizando produto existente:', produtoId);
        const { data: resultado, error } = await supabase
          .from('produtos')
          .update(produtoData)
          .eq('id', produtoId)
          .select();
        
        if (error) {
          console.error('❌ Erro na atualização:', error);
          throw error;
        }
        
        console.log('✅ Produto atualizado com sucesso:', resultado);
        return { id: produtoId, ...produtoData };
      } else {
        console.log('➕ Criando novo produto');
        const { data: novoProduto, error } = await supabase
          .from('produtos')
          .insert(produtoData)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro na criação:', error);
          throw error;
        }
        
        console.log('✅ Produto criado com sucesso:', novoProduto);
        return novoProduto;
      }
    },
    onSuccess: (resultado) => {
      console.log('🎉 Sucesso na mutation:', resultado);
      toast({
        title: "Sucesso!",
        description: `Produto ${produtoId ? 'atualizado' : 'criado'} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      navigate('/admin/estoque/produtos');
    },
    onError: (error) => {
      console.error('💥 Erro na mutation:', error);
      logger.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: `Erro ao ${produtoId ? 'atualizar' : 'criar'} produto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ProdutoFormData) => {
    console.log('🚀 onSubmit chamado com dados:', data);
    console.log('🔍 ProdutoId atual:', produtoId);
    
    setIsLoading(true);
    try {
      console.log('⏳ Executando mutation...');
      await salvarMutation.mutateAsync(data);
      console.log('✅ Mutation executada com sucesso');
    } catch (error) {
      console.error('❌ Erro no onSubmit:', error);
    } finally {
      setIsLoading(false);
      console.log('🏁 onSubmit finalizado');
    }
  };

  // Navegação entre etapas
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.includes(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  // Calcular progresso
  const progress = ((completedSteps.length + 1) / steps.length) * 100;

  // Categorias reais do banco de dados (UUIDs corretos)
  const categoriasSistema = [
    { id: '30bf152e-8ca5-44ed-809a-ac248c166578', nome: 'alopaticos', descricao: 'Medicamentos e matérias-primas alopáticas' },
    { id: 'd94e8f12-65ce-4bf9-8562-5b786619426b', nome: 'homeopaticos', descricao: 'Medicamentos e insumos homeopáticos' },
    { id: 'b59cd291-e19a-4ccb-b541-9be73540c928', nome: 'embalagens', descricao: 'Frascos, potes, caixas e embalagens' },
    { id: '6bdb4cde-77cc-437b-a088-024e55cff536', nome: 'revenda', descricao: 'Produtos para revenda' },
  ];

  // Filtrar categorias baseado no tipo selecionado
  const getCategoriasFiltradas = (tipo: string) => {
    // Usar categorias fixas em vez do banco
    switch (tipo) {
      case 'MEDICAMENTO':
        return categoriasSistema.filter(cat => 
          ['alopaticos', 'homeopaticos'].includes(cat.nome)
        );
      case 'COSMÉTICO':
        return categoriasSistema.filter(cat => 
          ['revenda'].includes(cat.nome)
        );
      case 'INSUMO':
        return categoriasSistema.filter(cat => 
          ['alopaticos', 'homeopaticos'].includes(cat.nome)
        );
      case 'EMBALAGEM':
        return categoriasSistema.filter(cat => 
          ['embalagens'].includes(cat.nome)
        );
      default:
        // Mostrar todas as categorias
        return categoriasSistema;
    }
  };

  if (carregandoProduto) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={(e) => {
          console.log('📝 Form submit event:', e);
          form.handleSubmit(onSubmit)(e);
        }} className="space-y-6">
          {/* Header com Stepper */}
          <div className="p-6 pb-0">
            {/* Progress Bar */}
            <div className="mb-8">
              <Progress value={progress} className="h-2 bg-gray-100 dark:bg-gray-800" />
            </div>

            {/* Stepper */}
            <div className="flex justify-between mb-8">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === index;
                const isCompleted = completedSteps.includes(index);
                const isClickable = index <= currentStep || isCompleted;

                return (
                  <motion.div
                    key={step.id}
                    className={cn(
                      "flex-1 relative",
                      index < steps.length - 1 && "after:content-[''] after:absolute after:top-6 after:left-[60%] after:right-[-40%] after:h-[2px]",
                      isCompleted ? "after:bg-teal-500" : "after:bg-gray-200 dark:after:bg-gray-700"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleStepClick(index)}
                      disabled={!isClickable}
                      className={cn(
                        "w-full flex flex-col items-center gap-2 transition-all",
                        isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                      )}
                    >
                      <motion.div
                        whileHover={isClickable ? { scale: 1.1 } : {}}
                        whileTap={isClickable ? { scale: 0.95 } : {}}
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                          isActive
                            ? `bg-gradient-to-br ${step.color} text-white`
                            : isCompleted
                            ? "bg-teal-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <StepIcon className="h-6 w-6" />
                        )}
                      </motion.div>
                      
                      <div className="text-center">
                        <p className={cn(
                          "font-medium text-sm transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          {step.description}
                        </p>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Conteúdo das Etapas */}
          <div className="p-6 pt-0">
            <AnimatePresence mode="wait">
              {/* Etapa 1: Informações Básicas */}
              {currentStep === 0 && (
                <motion.div
                  key="basico"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-teal-600" />
                        Dados do Produto
                      </CardTitle>
                      <CardDescription>
                        Informações básicas para identificação do produto
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Preview em Tempo Real */}
                      <div className="lg:hidden">
                        <Card className="border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30">
                          <div className="p-4">
                            <h4 className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-3">
                              Preview do Produto
                            </h4>
                            <ProductPreview />
                          </div>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Nome do Produto */}
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Nome do Produto</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Ex: Arnica Montana TM, Creme Anti-idade" 
                                  className="pl-10"
                                  {...field} 
                                />
                                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tipo de Produto - Cards Visuais */}
                      <FormField
                        control={form.control}
                        name="tipo"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Tipo de Produto</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {tiposProduto.map((tipo) => {
                                  const TipoIcon = tipo.icon;
                                  const isSelected = field.value === tipo.value;

                                  return (
                                    <motion.button
                                      key={tipo.value}
                                      type="button"
                                      onClick={() => field.onChange(tipo.value)}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className={cn(
                                        "p-4 rounded-xl border-2 transition-all",
                                        isSelected
                                          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/50"
                                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center",
                                        isSelected
                                          ? `bg-gradient-to-br ${tipo.color} text-white`
                                          : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                      )}>
                                        <TipoIcon className="h-6 w-6" />
                                      </div>
                                      <p className={cn(
                                        "text-sm font-medium",
                                        isSelected ? "text-teal-700 dark:text-teal-300" : "text-gray-600 dark:text-gray-400"
                                      )}>
                                        {tipo.label}
                                      </p>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Códigos */}
                      <FormField
                        control={form.control}
                        name="codigo_interno"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código Interno</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: ARM001, COS001" {...field} />
                            </FormControl>
                            <FormDescription>
                              Código único para controle interno
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="codigo_ean"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código EAN/Barras</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 7891234567890" {...field} />
                            </FormControl>
                            <FormDescription>
                              Código de barras do produto
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Categoria */}
                      <FormField
                        control={form.control}
                        name="categoria_produto_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getCategoriasFiltradas(tipoSelecionado).map((categoria) => (
                                    <SelectItem key={categoria.id} value={categoria.id}>
                                      <div className="flex flex-col">
                                        <span>{categoria.nome}</span>
                                        {categoria.descricao && (
                                          <span className="text-xs text-muted-foreground">
                                            {categoria.descricao}
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Unidades */}
                      <FormField
                        control={form.control}
                        name="unidade_medida"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Unidade de Medida
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Unidade principal de controle do estoque</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {unidadesMedidaExpandidas.map((unidade) => (
                                    <SelectItem key={unidade} value={unidade}>
                                      {unidade}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Volume/Capacidade */}
                      <FormField
                        control={form.control}
                        name="volume_capacidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Volume/Capacidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 10ml, 30g, 100 cápsulas" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Densidade */}
                      <FormField
                        control={form.control}
                        name="densidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Densidade (g/ml)
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Importante para cálculo de volume em fórmulas</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="Ex: 1.00"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormDescription>
                              Usado para converter massa em volume
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
                            <FormLabel>Fornecedor Principal</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o fornecedor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fornecedores?.map((fornecedor) => (
                                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                                      {fornecedor.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Descrição */}
                      <FormField
                        control={form.control}
                        name="descricao"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Descrição Detalhada</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva as características, indicações e observações sobre o produto..."
                                className="min-h-[120px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Informações adicionais que ajudam na identificação e uso do produto
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Etapa 2: Precificação */}
              {currentStep === 1 && (
                <motion.div
                  key="precificacao"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        Precificação Inteligente
                      </CardTitle>
                      <CardDescription>
                        Configure os custos e calcule automaticamente o preço de venda ideal
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Custo Unitário */}
                        <FormField
                          control={form.control}
                          name="custo_unitario"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custo Unitário</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0.00"
                                    className="pl-8"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="absolute left-3 top-3 text-muted-foreground">R$</span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Markup */}
                        <FormField
                          control={form.control}
                          name="markup"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <CampoMarkupModerno
                                  value={field.value}
                                  onChange={field.onChange}
                                  precoCusto={custoUnitario || 0}
                                  categoria={tipoSelecionado}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Simulador de Lucro Visual */}
                      {custoUnitario > 0 && markup > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800"
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <Calculator className="h-5 w-5 text-emerald-600" />
                            <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                              Simulador de Lucro
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 rounded-lg bg-white/80 dark:bg-gray-900/50">
                              <p className="text-sm text-muted-foreground mb-1">Preço de Venda</p>
                              <p className="text-2xl font-bold text-emerald-600">
                                R$ {(custoUnitario * markup).toFixed(2)}
                              </p>
                            </div>

                            <div className="text-center p-4 rounded-lg bg-white/80 dark:bg-gray-900/50">
                              <p className="text-sm text-muted-foreground mb-1">Lucro por Unidade</p>
                              <p className="text-2xl font-bold text-green-600">
                                R$ {((custoUnitario * markup) - custoUnitario).toFixed(2)}
                              </p>
                            </div>

                            <div className="text-center p-4 rounded-lg bg-white/80 dark:bg-gray-900/50">
                              <p className="text-sm text-muted-foreground mb-1">Margem de Lucro</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {(((markup - 1) / markup) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {/* Gráfico de Projeção */}
                          <div className="mt-6 p-4 rounded-lg bg-white/80 dark:bg-gray-900/50">
                            <p className="text-sm font-medium mb-3">Projeção de Vendas Mensais</p>
                            <div className="space-y-2">
                              {[10, 50, 100, 500].map((qtd) => (
                                <div key={qtd} className="flex items-center gap-3">
                                  <span className="text-sm text-muted-foreground w-20">
                                    {qtd} un/mês
                                  </span>
                                  <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min((qtd / 500) * 100, 100)}%` }}
                                      transition={{ duration: 1, delay: 0.2 }}
                                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-end pr-2"
                                    >
                                      <span className="text-xs text-white font-medium">
                                        R$ {(((custoUnitario * markup) - custoUnitario) * qtd).toFixed(0)}
                                      </span>
                                    </motion.div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Etapa 3: Estoque */}
              {currentStep === 2 && (
                <motion.div
                  key="estoque"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-amber-600" />
                        Controle de Estoque Inteligente
                      </CardTitle>
                      <CardDescription>
                        Configure os níveis de estoque e receba alertas automáticos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Indicadores Visuais de Estoque */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Estoque Atual */}
                        <FormField
                          control={form.control}
                          name="estoque_atual"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estoque Atual</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  <Input 
                                    type="number" 
                                    step="0.001"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                  {/* Indicador Visual */}
                                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ 
                                        width: field.value > 0 && form.watch("estoque_maximo") 
                                          ? `${Math.min((field.value / form.watch("estoque_maximo")) * 100, 100)}%` 
                                          : "0%"
                                      }}
                                      className={cn(
                                        "h-full transition-all",
                                        field.value <= form.watch("estoque_minimo")
                                          ? "bg-red-500"
                                          : field.value >= form.watch("estoque_maximo")
                                          ? "bg-amber-500"
                                          : "bg-green-500"
                                      )}
                                    />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Estoque Mínimo */}
                        <FormField
                          control={form.control}
                          name="estoque_minimo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Estoque Mínimo
                                <Badge variant="outline" className="text-xs">
                                  Alerta
                                </Badge>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Você será notificado quando atingir este nível
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Estoque Máximo */}
                        <FormField
                          control={form.control}
                          name="estoque_maximo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estoque Máximo</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001"
                                  placeholder="100"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </FormControl>
                              <FormDescription>
                                Limite ideal para não ter excesso
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Dashboard de Insights de Estoque */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="h-5 w-5 text-amber-600" />
                          <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                            Análise de Estoque
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Status do Estoque */}
                          <div className="p-4 rounded-lg bg-white/80 dark:bg-gray-900/50">
                            <p className="text-sm font-medium mb-2">Status Atual</p>
                            {form.watch("estoque_atual") <= form.watch("estoque_minimo") ? (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Estoque Crítico - Reabastecer Urgente!</span>
                              </div>
                            ) : form.watch("estoque_atual") >= form.watch("estoque_maximo") ? (
                              <div className="flex items-center gap-2 text-amber-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Estoque Acima do Ideal</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm">Estoque em Nível Ideal</span>
                              </div>
                            )}
                          </div>

                          {/* Recomendação de Compra */}
                          <div className="p-4 rounded-lg bg-white/80 dark:bg-gray-900/50">
                            <p className="text-sm font-medium mb-2">Recomendação</p>
                            <p className="text-sm text-muted-foreground">
                              {form.watch("estoque_atual") <= form.watch("estoque_minimo")
                                ? `Comprar pelo menos ${Math.max(0, form.watch("estoque_maximo") - form.watch("estoque_atual"))} unidades`
                                : "Estoque adequado para o momento"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navegação entre Etapas */}
          <Separator />
          
          <div className="p-6 pt-0">
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              <div className="flex gap-3">
                {/* Se for edição, sempre mostrar botão Atualizar */}
                {produtoId && (
                  <Button
                    type="submit"
                    disabled={isLoading || salvarMutation.isPending}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white min-w-[120px]"
                    onClick={() => {
                      console.log('👆 Botão Atualizar clicado');
                      console.log('🔍 Erros do formulário:', form.formState.errors);
                      console.log('📊 Estado do formulário:', {
                        isValid: form.formState.isValid,
                        isDirty: form.formState.isDirty,
                        isSubmitting: form.formState.isSubmitting
                      });
                      console.log('💾 Dados atuais do formulário:', form.getValues());
                      console.log('🆔 ProdutoId:', produtoId);
                      
                      // Forçar validação
                      form.trigger().then((isValid) => {
                        console.log('✅ Validação forçada - É válido?', isValid);
                        if (!isValid) {
                          console.log('❌ Campos com erro:', form.formState.errors);
                        }
                      });
                    }}
                  >
                    {(isLoading || salvarMutation.isPending) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Atualizar
                      </>
                    )}
                  </Button>
                )}

                {/* Botão Próximo / Cadastrar para novos produtos */}
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  // Só mostrar se não for edição
                  !produtoId && (
                    <Button
                      type="submit"
                      disabled={isLoading || salvarMutation.isPending}
                      className="gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white min-w-[120px]"
                      onClick={() => {
                        console.log('👆 Botão Cadastrar clicado');
                        console.log('🔍 Erros do formulário:', form.formState.errors);
                        console.log('📊 Estado do formulário:', {
                          isValid: form.formState.isValid,
                          isDirty: form.formState.isDirty,
                          isSubmitting: form.formState.isSubmitting
                        });
                      }}
                    >
                      {(isLoading || salvarMutation.isPending) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Cadastrar
                        </>
                      )}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
};

export default ProdutoFormModerno; 