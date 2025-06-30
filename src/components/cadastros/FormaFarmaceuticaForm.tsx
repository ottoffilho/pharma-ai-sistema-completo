import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase, getSupabaseFunctionUrl } from "@/integrations/supabase/client";
import { 
  Save, 
  Plus, 
  Trash2, 
  GripVertical,
  AlertCircle,
  Clock,
  CheckCircle
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema de validação
const formaFarmaceuticaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  abreviatura: z.string().max(10, "Máximo 10 caracteres").optional(),
  tipo_uso: z.string().optional(),
  descricao: z.string().optional(),
  desconto_maximo: z.number().min(0).max(100).default(0),
  valor_minimo: z.number().min(0).default(0),
  ativo: z.boolean().default(true),
  tempo_estimado_min: z.number().optional(),
  instrucoes: z.string().optional(),
  equipamentos_necessarios: z.array(z.string()).optional(),
});

const processoSchema = z.object({
  id: z.string(),
  ordem: z.number(),
  nome_processo: z.string().min(1, "Nome do processo é obrigatório"),
  tipo_processo: z.enum(['PRODUCAO', 'QUALIDADE', 'LOGISTICA']),
  ponto_controle: z.boolean().default(false),
  tempo_estimado_min: z.number().optional(),
  instrucoes: z.string().optional(),
  equipamentos_necessarios: z.array(z.string()).optional(),
});

type FormaFarmaceuticaFormData = z.infer<typeof formaFarmaceuticaSchema>;
type ProcessoFormData = z.infer<typeof processoSchema>;

interface FormaFarmaceuticaFormProps {
  formaId?: string;
  initialData?: any;
}

// Componente para item de processo arrastável
function ProcessoItem({ processo, onEdit, onDelete }: {
  processo: ProcessoFormData;
  onEdit: (processo: ProcessoFormData) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: processo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getProcessTypeBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'PRODUCAO':
        return 'default';
      case 'QUALIDADE':
        return 'secondary';
      case 'LOGISTICA':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border rounded-lg"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{processo.ordem}.</span>
          <span className="font-medium">{processo.nome_processo}</span>
          <Badge variant={getProcessTypeBadgeVariant(processo.tipo_processo)}>
            {processo.tipo_processo}
          </Badge>
          {processo.ponto_controle && (
            <Badge variant="destructive">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ponto de Controle
            </Badge>
          )}
          {processo.tempo_estimado_min && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {processo.tempo_estimado_min} min
            </div>
          )}
        </div>
        {processo.instrucoes && (
          <p className="text-sm text-muted-foreground mt-1">{processo.instrucoes}</p>
        )}
        {processo.equipamentos_necessarios && processo.equipamentos_necessarios.length > 0 && (
          <div className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">Equipamentos:</span> {processo.equipamentos_necessarios.join(', ')}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(processo)}
        >
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(processo.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function FormaFarmaceuticaForm({ formaId, initialData }: FormaFarmaceuticaFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [processos, setProcessos] = useState<ProcessoFormData[]>([]);
  const [editingProcesso, setEditingProcesso] = useState<ProcessoFormData | null>(null);
  const [rotuloConfig, setRotuloConfig] = useState({
    mostrar_concentracao: true,
    mostrar_posologia: false,
    mostrar_volume: false,
    mostrar_area_aplicacao: false,
    mostrar_sabor: false,
    mostrar_via: false,
  });

  const form = useForm<FormaFarmaceuticaFormData>({
    resolver: zodResolver(formaFarmaceuticaSchema),
    defaultValues: {
      nome: "",
      abreviatura: "",
      tipo_uso: "",
      descricao: "",
      desconto_maximo: 0,
      valor_minimo: 0,
      ativo: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.nome || "",
        abreviatura: initialData.abreviatura || "",
        tipo_uso: initialData.tipo_uso || "",
        descricao: initialData.descricao || "",
        desconto_maximo: initialData.desconto_maximo || 0,
        valor_minimo: initialData.valor_minimo || 0,
        ativo: initialData.ativo !== undefined ? initialData.ativo : true,
      });
      if (initialData.rotulo_config) {
        setRotuloConfig(initialData.rotulo_config);
      }
      if (initialData.forma_processos) {
        setProcessos(initialData.forma_processos.map((p: any) => ({
          ...p,
          id: p.id || Date.now().toString(),
        })));
      }
    }
  }, [initialData, form]);

  const processoForm = useForm<ProcessoFormData>({
    resolver: zodResolver(processoSchema),
    defaultValues: {
      id: "",
      ordem: 1,
      nome_processo: "",
      tipo_processo: "PRODUCAO",
      ponto_controle: false,
      tempo_estimado_min: undefined,
      instrucoes: "",
      equipamentos_necessarios: [],
    },
  });

  // Configurar drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setProcessos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Atualizar ordem
        return newItems.map((item, index) => ({
          ...item,
          ordem: index + 1,
        }));
      });
    }
  };

  // Adicionar ou editar processo
  const handleProcessoSubmit = (data: ProcessoFormData) => {
    if (editingProcesso) {
      setProcessos(processos.map(p => 
        p.id === editingProcesso.id ? { ...data, id: editingProcesso.id } : p
      ));
      setEditingProcesso(null);
    } else {
      const newProcesso = {
        ...data,
        id: Date.now().toString(),
        ordem: processos.length + 1,
      };
      setProcessos([...processos, newProcesso]);
    }
    
    processoForm.reset({
      id: "",
      ordem: processos.length + 1,
      nome_processo: "",
      tipo_processo: "PRODUCAO",
      ponto_controle: false,
      tempo_estimado_min: undefined,
      instrucoes: "",
      equipamentos_necessarios: [],
    });
  };

  // Editar processo
  const handleEditProcesso = (processo: ProcessoFormData) => {
    setEditingProcesso(processo);
    processoForm.reset(processo);
  };

  // Deletar processo
  const handleDeleteProcesso = (id: string) => {
    setProcessos(processos.filter(p => p.id !== id).map((p, index) => ({
      ...p,
      ordem: index + 1,
    })));
  };

  // Salvar forma farmacêutica
  const onSubmit = async (data: FormaFarmaceuticaFormData) => {
    setIsLoading(true);
    
    try {
      // Obter token de autenticação do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const endpoint = formaId 
        ? getSupabaseFunctionUrl(`gerenciar-formas-farmaceuticas/atualizar/${formaId}`)
        : getSupabaseFunctionUrl('gerenciar-formas-farmaceuticas/criar');

      const response = await fetch(endpoint, {
        method: formaId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: data.nome,
          abreviatura: data.abreviatura,
          tipo_uso: data.tipo_uso,
          descricao: data.descricao,
          desconto_maximo: data.desconto_maximo,
          valor_minimo: data.valor_minimo,
          ativo: data.ativo,
          rotulo_config: rotuloConfig,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const message = errorData.details || errorData.error || 'Erro ao salvar forma farmacêutica';
        throw new Error(message);
      }

      const result = await response.json();
      const formaIdResult = formaId || result.data?.id;

      // Salvar processos se houver
      if (processos.length > 0 && formaIdResult) {
        for (const processo of processos) {
          const processoResponse = await fetch(
            `${getSupabaseFunctionUrl('gerenciar-formas-farmaceuticas/processos/criar')}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...processo,
                forma_id: formaIdResult,
              }),
            }
          );

          if (!processoResponse.ok) {
            console.error('Erro ao salvar processo:', processo.nome_processo);
          }
        }
      }

      toast({
        title: "Sucesso!",
        description: `Forma farmacêutica ${formaId ? 'atualizada' : 'criada'} com sucesso.`,
      });

      navigate('/admin/cadastros/formas-farmaceuticas');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a forma farmacêutica.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
            <TabsTrigger value="processos">Processos de Produção</TabsTrigger>
            <TabsTrigger value="rotulo">Configuração de Rótulo</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <Card>
              <CardHeader>
                <CardTitle>Dados Básicos</CardTitle>
                <CardDescription>
                  Informações gerais da forma farmacêutica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cápsula, Pomada, Solução" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="abreviatura"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Abreviatura</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: CAPS, POM, SOL" maxLength={10} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo_uso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Uso</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de uso" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="oral">Oral</SelectItem>
                            <SelectItem value="topico">Tópico</SelectItem>
                            <SelectItem value="injetavel">Injetável</SelectItem>
                            <SelectItem value="nasal">Nasal</SelectItem>
                            <SelectItem value="oftalmico">Oftálmico</SelectItem>
                            <SelectItem value="vaginal">Vaginal</SelectItem>
                            <SelectItem value="retal">Retal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ativo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativo</FormLabel>
                          <FormDescription>
                            Define se a forma está disponível para uso
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
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
                          placeholder="Descrição detalhada da forma farmacêutica..."
                          className="min-h-[100px]"
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
                    name="desconto_maximo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto Máximo (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentual máximo de desconto permitido
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valor_minimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Mínimo (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Valor mínimo de venda para esta forma
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rotulo">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Rótulo</CardTitle>
                <CardDescription>
                  Defina quais informações devem aparecer no rótulo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    Selecione os campos que devem ser exibidos no rótulo para esta forma farmacêutica.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Concentração</div>
                      <div className="text-sm text-muted-foreground">
                        Exibir concentração do princípio ativo
                      </div>
                    </div>
                    <Switch
                      checked={rotuloConfig.mostrar_concentracao}
                      onCheckedChange={(checked) => 
                        setRotuloConfig({ ...rotuloConfig, mostrar_concentracao: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Posologia</div>
                      <div className="text-sm text-muted-foreground">
                        Exibir instruções de uso e dosagem
                      </div>
                    </div>
                    <Switch
                      checked={rotuloConfig.mostrar_posologia}
                      onCheckedChange={(checked) => 
                        setRotuloConfig({ ...rotuloConfig, mostrar_posologia: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Volume</div>
                      <div className="text-sm text-muted-foreground">
                        Exibir volume total (ml, L)
                      </div>
                    </div>
                    <Switch
                      checked={rotuloConfig.mostrar_volume}
                      onCheckedChange={(checked) => 
                        setRotuloConfig({ ...rotuloConfig, mostrar_volume: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Área de Aplicação</div>
                      <div className="text-sm text-muted-foreground">
                        Exibir local de aplicação (uso tópico)
                      </div>
                    </div>
                    <Switch
                      checked={rotuloConfig.mostrar_area_aplicacao}
                      onCheckedChange={(checked) => 
                        setRotuloConfig({ ...rotuloConfig, mostrar_area_aplicacao: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Sabor</div>
                      <div className="text-sm text-muted-foreground">
                        Exibir sabor (xaropes, soluções)
                      </div>
                    </div>
                    <Switch
                      checked={rotuloConfig.mostrar_sabor}
                      onCheckedChange={(checked) => 
                        setRotuloConfig({ ...rotuloConfig, mostrar_sabor: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Via de Administração</div>
                      <div className="text-sm text-muted-foreground">
                        Exibir via (injetáveis)
                      </div>
                    </div>
                    <Switch
                      checked={rotuloConfig.mostrar_via}
                      onCheckedChange={(checked) => 
                        setRotuloConfig({ ...rotuloConfig, mostrar_via: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processos">
            <Card>
              <CardHeader>
                <CardTitle>Processos de Produção</CardTitle>
                <CardDescription>
                  Configure a sequência de processos para esta forma farmacêutica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Formulário de processo */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium">
                    {editingProcesso ? 'Editar Processo' : 'Adicionar Processo'}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={processoForm.control}
                      name="nome_processo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Processo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Pesagem, Mistura, Encapsulação" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={processoForm.control}
                      name="tipo_processo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PRODUCAO">Produção</SelectItem>
                              <SelectItem value="QUALIDADE">Qualidade</SelectItem>
                              <SelectItem value="LOGISTICA">Logística</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={processoForm.control}
                      name="tempo_estimado_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempo Estimado (min)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ex: 30"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={processoForm.control}
                      name="ponto_controle"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Ponto de Controle</FormLabel>
                            <FormDescription>
                              Requer validação
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={processoForm.control}
                    name="instrucoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instruções</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Instruções detalhadas para execução do processo..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={processoForm.control}
                    name="equipamentos_necessarios"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipamentos Necessários</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Liste os equipamentos separados por vírgula: Balança analítica, Espátula, Béquer..."
                            className="min-h-[60px]"
                            value={field.value?.join(', ') || ''}
                            onChange={(e) => {
                              const equipamentos = e.target.value
                                .split(',')
                                .map(item => item.trim())
                                .filter(item => item.length > 0);
                              field.onChange(equipamentos);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Digite os equipamentos separados por vírgula
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    {editingProcesso && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingProcesso(null);
                          processoForm.reset({
                            id: "",
                            ordem: processos.length + 1,
                            nome_processo: "",
                            tipo_processo: "PRODUCAO",
                            ponto_controle: false,
                            tempo_estimado_min: undefined,
                            instrucoes: "",
                            equipamentos_necessarios: [],
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={processoForm.handleSubmit(handleProcessoSubmit)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {editingProcesso ? 'Salvar Alterações' : 'Adicionar Processo'}
                    </Button>
                  </div>
                </div>

                {/* Lista de processos */}
                {processos.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={processos.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {processos.map((processo) => (
                          <ProcessoItem
                            key={processo.id}
                            processo={processo}
                            onEdit={handleEditProcesso}
                            onDelete={handleDeleteProcesso}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum processo adicionado. Adicione processos para definir o fluxo de produção.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/cadastros/formas-farmaceuticas')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Save className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Salvar Forma Farmacêutica
          </Button>
        </div>
      </form>
    </Form>
  );
} 