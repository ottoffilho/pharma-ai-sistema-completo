import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Save, 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2,
  Users,
  User,
  FileText,
  ShoppingCart,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

// Schema de validação com Zod
const clienteSchema = z.object({
  tipo_pessoa: z.enum(["PJ", "PF"]),
  documento: z.string().min(11, "Documento é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  nome_fantasia: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Email deve ter um formato válido",
    }),
  telefone: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message: "Telefone deve ter pelo menos 10 dígitos",
    }),
  endereco: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  rg: z.string().optional(),
  observacoes: z.string().optional(),
  data_nascimento: z.string().optional(),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  initialData?: any;
  isEditing?: boolean;
  clienteId?: string;
}

interface ClienteCompra {
  id: string;
  produto_nome: string;
  data_compra: string;
  valor_total: number;
  status: string;
}

interface ClienteContato {
  id: string;
  nome: string;
  cargo?: string;
  email?: string;
  telefone?: string;
}

const inputCls = "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-600/40 dark:bg-slate-800/80 dark:border-slate-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-blue-600/50 rounded-md";

export default function ClienteForm({
  initialData,
  isEditing = false,
  clienteId,
}: ClienteFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados
  const [activeTab, setActiveTab] = useState("geral");
  const [isSearchingDocument, setIsSearchingDocument] = useState(false);
  const [clienteCompras, setClienteCompras] = useState<ClienteCompra[]>([]);
  const [clienteContatos, setClienteContatos] = useState<ClienteContato[]>([]);
  const [showContatoDialog, setShowContatoDialog] = useState(false);
  const [editingContato, setEditingContato] = useState<ClienteContato | null>(null);
  const [contatoLoading, setContatoLoading] = useState(false);
  const [contatoForm, setContatoForm] = useState({ nome: "", cargo: "", email: "", telefone: "" });

  // Configurar o formulário
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo_pessoa: "PF",
      documento: initialData?.cpf || initialData?.cnpj || "",
      nome: initialData?.nome || "",
      nome_fantasia: "",
      email: initialData?.email || "",
      telefone: initialData?.telefone || "",
      endereco: initialData?.endereco || "",
      cep: "",
      cidade: initialData?.cidade || "",
      estado: initialData?.estado || "",
      rg: "",
      observacoes: "",
      data_nascimento: "",
    },
  });

  const { isSubmitting } = form.formState;
  const tipoPessoa = form.watch("tipo_pessoa");

  // Limpar documento quando mudar o tipo de pessoa
  useEffect(() => {
    form.setValue("documento", "");
  }, [tipoPessoa, form]);

  // Função para mascarar documento (CNPJ/CPF)
  const maskDocument = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    
    if (tipoPessoa === "PJ") {
      // Máscara CNPJ: 00.000.000/0000-00
      return cleanValue
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .substring(0, 18);
    } else {
      // Máscara CPF: 000.000.000-00
      return cleanValue
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2")
        .substring(0, 14);
    }
  };

  // Função para buscar dados por CNPJ/CPF
  const searchDocumentData = async () => {
    try {
      const documento = form.getValues("documento")?.replace(/[^\d]/g, '') || '';
      
      if (!documento) {
        toast({
          title: "Documento obrigatório",
          description: "Informe o CNPJ ou CPF para buscar os dados.",
          variant: "destructive",
        });
        return;
      }

      if ((tipoPessoa === "PJ" && documento.length !== 14) || 
          (tipoPessoa === "PF" && documento.length !== 11)) {
        toast({
          title: "Documento inválido",
          description: `Informe um ${tipoPessoa === "PJ" ? "CNPJ" : "CPF"} válido.`,
          variant: "destructive",
        });
        return;
      }

      setIsSearchingDocument(true);
      
      const { data, error } = await supabase.functions.invoke('buscar-dados-documento', {
        body: { documento }
      });

      if (error) throw error;

      if (data.success) {
        // Verificar se existem dados para preencher usando o campo dados_preenchidos
        if (data.dados_preenchidos) {
          // Preencher campos com dados encontrados (CNPJ)
          form.setValue("tipo_pessoa", data.tipo_pessoa);
          form.setValue("nome", data.razao_social || data.nome || "");
          form.setValue("nome_fantasia", data.nome_fantasia || "");
          form.setValue("endereco", data.endereco_completo || "");
          form.setValue("cep", data.cep || "");
          form.setValue("cidade", data.municipio || "");
          form.setValue("estado", data.uf || "");
          form.setValue("telefone", data.telefone || "");

          toast({
            title: "Dados encontrados",
            description: "As informações foram preenchidas automaticamente.",
          });
        } else {
          // Apenas validação realizada (CPF)
          form.setValue("tipo_pessoa", data.tipo_pessoa);
          
          toast({
            title: "Documento válido",
            description: data.message || "CPF válido. Preencha os dados manualmente.",
          });
        }
      } else {
        toast({
          title: "Dados não encontrados",
          description: data.message || "Não foi possível encontrar os dados do documento informado.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Erro ao buscar dados do documento:", error);
      toast({
        title: "Erro na busca",
        description: "Ocorreu um erro ao buscar os dados. Preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingDocument(false);
    }
  };

  // Função para salvar o cliente
  const onSubmit = async (values: ClienteFormValues) => {
    try {
      if (!values.nome) {
        throw new Error("Nome é obrigatório");
      }

      console.log('💾 Salvando cliente...', { values, isEditing, clienteId });

      const clienteData = {
        nome: values.nome.trim(),
        email: values.email?.trim() || null,
        telefone: values.telefone?.trim() || null,
        endereco: values.endereco?.trim() || null,
        cidade: values.cidade?.trim() || null,
        estado: values.estado?.trim() || null,
        cep: values.cep?.trim() || null,
        cpf: tipoPessoa === "PF" ? values.documento?.replace(/[^\d]/g, '') || null : null,
        cnpj: tipoPessoa === "PJ" ? values.documento?.replace(/[^\d]/g, '') || null : null,
        tipo_pessoa: values.tipo_pessoa,
        nome_fantasia: values.nome_fantasia?.trim() || null,
        rg: values.rg?.trim() || null,
        observacoes: values.observacoes?.trim() || null,
        data_nascimento: values.data_nascimento || null,
        ativo: true,
      };

      let savedClienteId = clienteId;

      if (isEditing && clienteId) {
        console.log('📝 Atualizando cliente existente...');
        const { error } = await supabase
          .from("clientes")
          .update(clienteData)
          .eq("id", clienteId);

        if (error) throw new Error(error.message);

        console.log('✅ Cliente atualizado com sucesso');
        toast({
          title: "✅ Cliente atualizado!",
          description: `Dados salvos com sucesso.`,
          duration: 4000
        });
      } else {
        console.log('🆕 Criando novo cliente...');
        const { data, error } = await supabase
          .from("clientes")
          .insert([clienteData])
          .select()
          .single();

        if (error) throw new Error(error.message);
        
        savedClienteId = data.id;
        console.log('✅ Novo cliente criado com sucesso:', savedClienteId);

        toast({
          title: "✅ Cliente criado!",
          description: "O novo cliente foi adicionado com sucesso.",
          duration: 4000
        });
      }

      queryClient.invalidateQueries({ queryKey: ["clientes"] });

      setTimeout(() => {
        navigate("/admin/clientes");
      }, 1500);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("💥 Erro ao salvar cliente:", errorMessage);
      
      toast({
        title: "❌ Erro ao salvar",
        description: `Não foi possível salvar o cliente: ${errorMessage}`,
        variant: "destructive",
        duration: 6000
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/clientes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEditing ? "Editar Cliente" : "Novo Cliente"}
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-lg border dark:border-slate-800 backdrop-blur-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-slate-800/60 dark:border dark:border-slate-700 rounded-md">
            <TabsTrigger value="geral" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações Gerais
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Histórico de Compras
            </TabsTrigger>
            <TabsTrigger value="contatos" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contatos Adicionais
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* ABA 1: INFORMAÇÕES GERAIS */}
              <TabsContent value="geral" className="p-6 space-y-6">
                {/* Tipo de Pessoa */}
                <FormField
                  control={form.control}
                  name="tipo_pessoa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Pessoa</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="PF" id="pf" />
                            <Label htmlFor="pf">Pessoa Física</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="PJ" id="pj" />
                            <Label htmlFor="pj">Pessoa Jurídica</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Documento com busca */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="documento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tipoPessoa === "PJ" ? "CNPJ" : "CPF"} *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={tipoPessoa === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                              {...field}
                              value={maskDocument(field.value || '')}
                              onChange={(e) => {
                                const maskedValue = maskDocument(e.target.value);
                                field.onChange(maskedValue);
                              }}
                              onBlur={(e) => {
                                field.onBlur(e);
                                const doc = e.target.value.replace(/[^\d]/g, '');
                                if ((tipoPessoa === "PJ" && doc.length === 14) || (tipoPessoa === "PF" && doc.length === 11)) {
                                  searchDocumentData();
                                }
                              }}
                              className={inputCls}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={searchDocumentData}
                      disabled={isSearchingDocument}
                      className="w-full bg-homeo-green hover:bg-homeo-green/90 text-white"
                    >
                      {isSearchingDocument ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Buscar Dados
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Nome e Nome Fantasia */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {tipoPessoa === "PJ" ? "Razão Social" : "Nome Completo"} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={tipoPessoa === "PJ" ? "Ex: Empresa ABC Ltda" : "Ex: João Silva"}
                            {...field}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {tipoPessoa === "PJ" && (
                    <FormField
                      control={form.control}
                      name="nome_fantasia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Fantasia</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: ABC Farmácia"
                              {...field}
                              className={inputCls}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {tipoPessoa === "PF" && (
                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 12.345.678-9"
                              {...field}
                              className={inputCls}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Email e Telefone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Ex: cliente@email.com"
                            {...field}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: (11) 99999-9999"
                            {...field}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Data de Nascimento (apenas PF) */}
                {tipoPessoa === "PF" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="data_nascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className={inputCls}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Endereço */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Rua das Flores, 123"
                              {...field}
                              className={inputCls}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00000-000"
                            {...field}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: São Paulo"
                            {...field}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Estado e Observações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: SP"
                            {...field}
                            className={inputCls}
                          />
                        </FormControl>
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
                            placeholder="Observações sobre o cliente..."
                            {...field}
                            rows={3}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* ABA 2: HISTÓRICO DE COMPRAS */}
              <TabsContent value="historico" className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Histórico de Compras</h3>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto/Serviço</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clienteCompras.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            Nenhuma compra realizada ainda
                          </TableCell>
                        </TableRow>
                      ) : (
                        clienteCompras.map((compra) => (
                          <TableRow key={compra.id}>
                            <TableCell>
                              {new Date(compra.data_compra).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="font-medium">{compra.produto_nome}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(compra.valor_total)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={compra.status === "finalizada" ? "default" : "secondary"}>
                                {compra.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* ABA 3: CONTATOS ADICIONAIS */}
              <TabsContent value="contatos" className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contatos Adicionais
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowContatoDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Contato
                  </Button>
                </div>

                <div className="space-y-3">
                  {clienteContatos.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                      Nenhum contato adicional cadastrado
                    </div>
                  ) : (
                    clienteContatos.map((contato) => (
                      <div key={contato.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{contato.nome}</p>
                            <p className="text-sm text-muted-foreground">{contato.cargo}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              Editar
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {contato.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {contato.telefone}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Botões de ação */}
              <div className="flex justify-end gap-4 p-6 border-t bg-gray-50 dark:bg-slate-800/60 dark:border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/clientes")}
                  disabled={isSubmitting}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/40"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="min-w-[120px] bg-homeo-green hover:bg-homeo-green/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>

      {/* Modal de contato */}
      <Dialog open={showContatoDialog} onOpenChange={setShowContatoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input 
                name="nome" 
                value={contatoForm.nome} 
                onChange={(e) => setContatoForm({...contatoForm, nome: e.target.value})}
                required 
                className={inputCls}
              />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input 
                name="cargo" 
                value={contatoForm.cargo} 
                onChange={(e) => setContatoForm({...contatoForm, cargo: e.target.value})}
                className={inputCls}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                name="email" 
                type="email"
                value={contatoForm.email} 
                onChange={(e) => setContatoForm({...contatoForm, email: e.target.value})}
                className={inputCls}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input 
                name="telefone" 
                value={contatoForm.telefone} 
                onChange={(e) => setContatoForm({...contatoForm, telefone: e.target.value})}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowContatoDialog(false)}
              disabled={contatoLoading}
            >
              Cancelar
            </Button>
            <Button disabled={contatoLoading}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 