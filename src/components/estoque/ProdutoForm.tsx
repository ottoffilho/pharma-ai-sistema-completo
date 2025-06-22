import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Package, FlaskConical, Package2, Sparkles } from "lucide-react";
import logger from "@/lib/logger";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { CampoMarkup } from "@/components/markup/CampoMarkup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIAS_MARKUP } from "@/constants/categorias";

// Tipos de produtos
const tiposProduto = [
  { value: "MEDICAMENTO", label: "Medicamento", icon: Package },
  { value: "COSMÉTICO", label: "Cosmético", icon: Sparkles },
  { value: "INSUMO", label: "Insumo", icon: FlaskConical },
  { value: "EMBALAGEM", label: "Embalagem", icon: Package2 },
  { value: "PRINCIPIO_ATIVO", label: "Princípio Ativo", icon: FlaskConical },
  { value: "EXCIPIENTE", label: "Excipiente", icon: FlaskConical },
  { value: "MATERIA_PRIMA", label: "Matéria Prima", icon: FlaskConical },
];

// Tipos específicos para insumos homeopáticos
const tiposInsumo = [
  "Tintura Mãe",
  "Veículo",
  "Matriz",
  "Trituração",
  "Outro",
];

// Tipos específicos para embalagens
const tiposEmbalagem = [
  "Frasco",
  "Pote",
  "Bisnaga",
  "Ampola",
  "Cápsula",
  "Refil",
  "Tampa",
  "Rótulo",
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
  markup: z.number().min(0, "Markup deve ser positivo").default(6),
  preco_venda: z.number().optional(),
  estoque_atual: z.number().min(0, "Estoque atual deve ser positivo").default(0),
  estoque_minimo: z.number().min(0, "Estoque mínimo deve ser positivo").default(0),
  estoque_maximo: z.number().min(0, "Estoque máximo deve ser positivo").optional(),
  fornecedor_id: z.string().optional(),
  descricao: z.string().optional(),
  codigo_interno: z.string().optional(),
  codigo_ean: z.string().optional(),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface ProdutoFormProps {
  tipoInicial?: string;
  produtoId?: string;
}

const ProdutoForm: React.FC<ProdutoFormProps> = ({ 
  tipoInicial = 'MEDICAMENTO',
  produtoId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      tipo: tipoInicial,
      custo_unitario: 0,
      markup: 6,
      estoque_atual: 0,
      estoque_minimo: 0,
      unidade_comercial: '',
      unidade_tributaria: '',
    },
  });

  const tipoSelecionado = form.watch("tipo");

  // Buscar categorias de produto
  const { data: categorias } = useQuery({
    queryKey: ['categorias-produto'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categoria_produto')
        .select('id, nome, descricao')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });

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
  React.useEffect(() => {
    if (produto && !carregandoProduto) {
      // Mapear unidade da NF-e para unidade padrão se necessário
      const unidadeMapeada = produto.unidade_medida ? mapearUnidadeNFe(produto.unidade_medida) : '';
      
      form.reset({
        nome: produto.nome,
        tipo: produto.tipo || 'MEDICAMENTO',
        categoria_produto_id: produto.categoria_produto_id || undefined,
        unidade_medida: unidadeMapeada,
        volume_capacidade: produto.volume_capacidade || undefined,
        unidade_comercial: produto.unidade_comercial || undefined,
        unidade_tributaria: produto.unidade_tributaria || undefined,
        custo_unitario: produto.custo_unitario || 0,
        markup: produto.markup || 6,
        preco_venda: produto.preco_venda,
        estoque_atual: produto.estoque_atual || 0,
        estoque_minimo: produto.estoque_minimo || 0,
        estoque_maximo: produto.estoque_maximo,
        fornecedor_id: produto.fornecedor_id || undefined,
        descricao: produto.descricao || undefined,
        codigo_interno: produto.codigo_interno || undefined,
        codigo_ean: produto.codigo_ean || undefined,
      });
    }
  }, [produto, carregandoProduto, form]);

  // Mutation para salvar produto
  // Categorias reais do banco de dados (UUIDs corretos)
  const categoriasSistema = [
    { id: '30bf152e-8ca5-44ed-809a-ac248c166578', nome: 'alopaticos', descricao: 'Medicamentos e matérias-primas alopáticas' },
    { id: 'd94e8f12-65ce-4bf9-8562-5b786619426b', nome: 'homeopaticos', descricao: 'Medicamentos e insumos homeopáticos' },
    { id: 'b59cd291-e19a-4ccb-b541-9be73540c928', nome: 'embalagens', descricao: 'Frascos, potes, caixas e embalagens' },
    { id: '6bdb4cde-77cc-437b-a088-024e55cff536', nome: 'revenda', descricao: 'Produtos para revenda' },
  ];

  const salvarMutation = useMutation({
    mutationFn: async (data: ProdutoFormData) => {
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
        updated_at: new Date().toISOString(),
      };

      if (produtoId) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('produtos')
          .update(produtoData)
          .eq('id', produtoId);
        
        if (error) throw error;
        return { id: produtoId, ...produtoData };
      } else {
        // Criar novo produto
        const { data: novoProduto, error } = await supabase
          .from('produtos')
          .insert(produtoData)
          .select()
          .single();
        
        if (error) throw error;
        return novoProduto;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: `Produto ${produtoId ? 'atualizado' : 'criado'} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      navigate('/admin/estoque/produtos');
    },
    onError: (error) => {
      logger.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: `Erro ao ${produtoId ? 'atualizar' : 'criar'} produto.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ProdutoFormData) => {
    setIsLoading(true);
    try {
      await salvarMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoltar = () => {
    navigate('/admin/estoque/produtos');
  };

  // Filtrar categorias baseado no tipo selecionado
  const getCategoriasFiltradas = (tipo: string) => {
    // Usar categorias do sistema em vez do banco
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
      case 'PRINCIPIO_ATIVO':
      case 'EXCIPIENTE':
      case 'MATERIA_PRIMA':
        return categoriasSistema.filter(cat => 
          ['alopaticos', 'homeopaticos'].includes(cat.nome)
        );
      case 'EMBALAGEM':
        return categoriasSistema.filter(cat => 
          ['embalagens'].includes(cat.nome)
        );
      default:
        return categoriasSistema;
    }
  };

  if (carregandoProduto) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Carregando produto...
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basico" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basico">Informações Básicas</TabsTrigger>
            <TabsTrigger value="precificacao">Precificação</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
          </TabsList>

          <TabsContent value="basico">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Produto</CardTitle>
                <CardDescription>
                  Informações básicas de identificação
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Arnica Montana TM, Creme Anti-idade, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Código Interno */}
                <FormField
                  control={form.control}
                  name="codigo_interno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Interno</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ARM001, COS001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Código EAN */}
                <FormField
                  control={form.control}
                  name="codigo_ean"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código EAN/Barras</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 7891234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo */}
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposProduto.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                <div className="flex items-center gap-2">
                                  <tipo.icon className="h-4 w-4" />
                                  {tipo.label}
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

                {/* Unidade de Medida */}
                <FormField
                  control={form.control}
                  name="unidade_medida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Medida</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Ex: ml, g, unidades" />
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

                {/* Unidade Comercial */}
                <FormField
                  control={form.control}
                  name="unidade_comercial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade Comercial</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: PT, UN, CX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unidade Tributária */}
                <FormField
                  control={form.control}
                  name="unidade_tributaria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade Tributária</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: PT, UN, CX" {...field} />
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

                {/* Fornecedor */}
                <FormField
                  control={form.control}
                  name="fornecedor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
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
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição detalhada do produto..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="precificacao">
            <Card>
              <CardHeader>
                <CardTitle>Precificação</CardTitle>
                <CardDescription>
                  Defina os custos e preços de venda
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custo Unitário */}
                <FormField
                  control={form.control}
                  name="custo_unitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Unitário</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo de Markup integrado */}
                <div>
                  <FormField
                    control={form.control}
                    name="markup"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <CampoMarkup
                            value={field.value}
                            onChange={field.onChange}
                            precoCusto={form.watch("custo_unitario") || 0}
                            categoria={tipoSelecionado === 'EMBALAGEM' ? CATEGORIAS_MARKUP.EMBALAGENS : CATEGORIAS_MARKUP.REVENDA}
                            label="Markup de Venda"
                            showCalculation={true}
                            showCategoryDefault={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Preço de Venda */}
                <FormField
                  control={form.control}
                  name="preco_venda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estoque">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Estoque</CardTitle>
                <CardDescription>
                  Configure os níveis de estoque
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Estoque Atual */}
                <FormField
                  control={form.control}
                  name="estoque_atual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Atual</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.001"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
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
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.001"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
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
                      <FormLabel>Estoque Máximo (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.001"
                          placeholder="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleVoltar}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Lista
          </Button>

          <Button
            type="submit"
            disabled={isLoading || salvarMutation.isPending}
            className="flex items-center gap-2"
          >
            {(isLoading || salvarMutation.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <Save className="h-4 w-4" />
            {produtoId ? 'Atualizar' : 'Cadastrar'} Produto
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProdutoForm; 