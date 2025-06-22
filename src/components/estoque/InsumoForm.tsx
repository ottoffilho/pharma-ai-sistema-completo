import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft } from "lucide-react";
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

// Tipos de insumos homeopáticos
const tiposInsumo = [
  "Tintura Mãe",
  "Veículo",
  "Matriz",
  "Trituração",
  "Outro",
];

// Unidades de medida comuns
const unidadesMedidaExpandidas = [
  "ml", "g", "unidades", "kg", "litro", "miligrama",
  // Unidades comuns da NF-e
  "UN", "CX", "PT", "PC", "FR", "TB", "GL", "RL", "SC", "BD",
  // Unidades específicas para farmácia
  "cx", "pote", "frasco", "ampola", "bisnaga", "sachê", "kit",
  // Medidas de peso/volume
  "mg", "mcg", "L", "mL", "grama", "quilograma"
];

// Schema de validação com Zod
const insumoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  unidade_medida: z.string().min(1, "Unidade de medida é obrigatória"),
  custo_unitario: z
    .string()
    .min(1, "Custo unitário é obrigatório")
    .transform((val) => parseFloat(val.replace(",", "."))),
  markup: z
    .number()
    .min(0, "Markup deve ser maior ou igual a zero")
    .default(6.00),
  markup_personalizado: z.boolean().default(false),
  fornecedor_id: z.string().nullable().optional(),
  descricao: z.string().optional(),
  estoque_atual: z
    .string()
    .default("0")
    .transform((val) => parseFloat(val.replace(",", "."))),
  estoque_minimo: z
    .string()
    .default("0")
    .transform((val) => parseFloat(val.replace(",", "."))),
  estoque_maximo: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(val.replace(",", ".")) : null)),
});

type InsumoFormValues = z.infer<typeof insumoSchema>;

interface InsumoFormProps {
  initialData?: Record<string, unknown>; // Dados iniciais para edição
  isEditing?: boolean; // Modo edição
  insumoId?: string; // ID do insumo para edição
}

export default function InsumoForm({
  initialData,
  isEditing = false,
  insumoId,
}: InsumoFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Consultar fornecedores para o dropdown
  const { data: fornecedores, isLoading: isLoadingFornecedores } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .order("nome");

      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  // Configurar o formulário com os valores iniciais
  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      tipo: initialData?.tipo || "",
      unidade_medida: initialData?.unidade_medida || "",
      custo_unitario: initialData?.custo_unitario?.toString() || "",
      markup: initialData?.markup || 6.00,
      markup_personalizado: initialData?.markup_personalizado || false,
      fornecedor_id: initialData?.fornecedor_id || null,
      descricao: initialData?.descricao || "",
      estoque_atual: initialData?.estoque_atual?.toString() || "0",
      estoque_minimo: initialData?.estoque_minimo?.toString() || "0",
      estoque_maximo: initialData?.estoque_maximo?.toString() || "",
    },
  });

  const { isSubmitting } = form.formState;

  // Função para salvar os dados
  const onSubmit = async (values: InsumoFormValues) => {
    try {
      // Garantir que os campos obrigatórios estejam presentes
      if (!values.nome || !values.tipo || !values.unidade_medida || values.custo_unitario === undefined) {
        throw new Error("Campos obrigatórios faltando");
      }

      // Preparar objeto para salvar no Supabase
      const insumoData = {
        nome: values.nome,
        tipo: values.tipo,
        unidade_medida: values.unidade_medida,
        custo_unitario: values.custo_unitario,
        markup: values.markup,
        markup_personalizado: values.markup !== 6.00,
        fornecedor_id: values.fornecedor_id || null,
        descricao: values.descricao || null,
        estoque_atual: values.estoque_atual || 0,
        estoque_minimo: values.estoque_minimo || 0,
        estoque_maximo: values.estoque_maximo,
      };

      if (isEditing && insumoId) {
        // Atualizar insumo existente
        // Sanitizar dados antes de enviar ao banco
        const sanitizedData = Object.entries(insumoData).reduce((acc, [key, value]) => {
          // Sanitizar string inputs
          acc[key] = typeof value === 'string' ? value.trim().replace(/['";<>]/g, '') : value;
          return acc;
        }, {} as Record<string, unknown>);
        
        const { error } = await supabase
          .from("insumos")
          .update(sanitizedData)
          .eq("id", insumoId);

        if (error) throw new Error(error.message);

        toast({
          title: "Insumo atualizado",
          description: "O insumo foi atualizado com sucesso.",
        });
      } else {
        // Criar novo insumo
        // Sanitizar dados antes de enviar ao banco
        const sanitizedData = Object.entries(insumoData).reduce((acc, [key, value]) => {
          // Sanitizar string inputs
          acc[key] = typeof value === 'string' ? value.trim().replace(/['";<>]/g, '') : value;
          return acc;
        }, {} as Record<string, unknown>);
        
        const { error } = await supabase.from("insumos").insert([sanitizedData]);

        if (error) throw new Error(error.message);

        toast({
          title: "Insumo criado",
          description: "O novo insumo foi adicionado com sucesso.",
        });
      }

      // Navegar de volta para a listagem
      navigate("/admin/estoque/insumos");
    } catch (error: unknown) {
      // Usar o logger para sanitizar informações sensíveis
      const errorCode = (error as Record<string, unknown>)?.code || 'unknown';
      const errorType = error?.constructor?.name || 'unknown';
      logger.error("Erro ao salvar insumo", { errorCode, errorType });
      toast({
        title: "Erro",
        description: `Não foi possível salvar o insumo. Tente novamente.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/estoque/insumos")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEditing ? "Editar Insumo" : "Novo Insumo"}
        </h1>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 max-w-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome*</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do insumo" {...field} />
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
                  <FormLabel>Tipo*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposInsumo.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
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
              name="unidade_medida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade de Medida*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unidadesMedidaExpandidas.map((unidade) => (
                        <SelectItem key={unidade} value={unidade}>
                          {unidade}
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
              name="custo_unitario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo Unitário*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      {...field}
                      type="text"
                      inputMode="decimal"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de Markup integrado */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="markup"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CampoMarkup
                        value={field.value}
                        onChange={field.onChange}
                        precoCusto={parseFloat(form.watch("custo_unitario")?.replace(",", ".") || "0")}
                        categoria="alopaticos"
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

            <FormField
              control={form.control}
              name="fornecedor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingFornecedores ? (
                          <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Carregando...
                          </div>
                        ) : (
                          <SelectValue placeholder="Selecione o fornecedor (opcional)" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum fornecedor</SelectItem>
                      {fornecedores?.map((fornecedor) => (
                        <SelectItem
                          key={fornecedor.id}
                          value={fornecedor.id}
                        >
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
              name="estoque_atual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque Atual*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      {...field}
                      type="text"
                      inputMode="decimal"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estoque_minimo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque Mínimo*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      {...field}
                      type="text"
                      inputMode="decimal"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estoque_maximo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque Máximo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00 (opcional)"
                      {...field}
                      value={field.value || ""}
                      type="text"
                      inputMode="decimal"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição do insumo (opcional)"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Salvar Alterações" : "Salvar Insumo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/estoque/insumos")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
