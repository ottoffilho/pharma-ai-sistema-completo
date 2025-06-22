import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/modules/usuarios-permissoes/services/authService";
import { PerfilUsuario } from "@/modules/usuarios-permissoes/types";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mapeamento de cargos para perfis do sistema de permissões
const CARGO_TO_PERFIL: Record<string, PerfilUsuario> = {
  "Proprietário": PerfilUsuario.PROPRIETARIO,
  "Farmacêutico": PerfilUsuario.FARMACEUTICO,
  "Atendente": PerfilUsuario.ATENDENTE,
  "Manipulador": PerfilUsuario.MANIPULADOR,
};

// Esquema de validação condicional com Zod
const usuarioInternoSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email_contato: z.string().email("Email inválido"),
  cargo_perfil: z.string().min(1, "Selecione um cargo"),
  telefone_contato: z.string().optional(),
  ativo: z.boolean().default(true),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").optional(),
  confirmar_senha: z.string().optional(),
}).refine((data) => {
  // Se não estamos editando (criação) ou senha está presente (edição com alteração de senha)
  if (data.senha) {
    return data.senha === data.confirmar_senha;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmar_senha"],
});

// Tipo dos dados do formulário baseado no schema Zod
type UsuarioInternoFormData = z.infer<typeof usuarioInternoSchema>;

// Props do componente de formulário
interface UsuarioInternoFormProps {
  usuarioId?: string;
  usuarioData?: Omit<UsuarioInternoFormData, 'senha' | 'confirmar_senha'> & { 
    supabase_auth_id?: string 
  };
  isEditing: boolean;
}

const UsuarioInternoForm: React.FC<UsuarioInternoFormProps> = ({
  usuarioId,
  usuarioData,
  isEditing,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = React.useState(false);
  const [showPasswordFields, setShowPasswordFields] = React.useState(!isEditing);
  const [perfisDisponiveis, setPerfisDisponiveis] = React.useState<Array<{
    id: string;
    nome: string;
    descricao?: string;
    ativo: boolean;
  }>>([]);

  // Carregar perfis disponíveis
  React.useEffect(() => {
    const carregarPerfis = async () => {
      try {
        const { data, error } = await supabase
          .from('perfis_usuario')
          .select('*')
          .eq('ativo', true)
          .order('nome');
        
        if (error) throw error;
        setPerfisDisponiveis(data || []);
      } catch (error) {
        console.error('Erro ao carregar perfis:', error);
      }
    };

    carregarPerfis();
  }, []);

  // Inicializar o formulário com react-hook-form e validação zod
  const form = useForm<UsuarioInternoFormData>({
    resolver: zodResolver(usuarioInternoSchema),
    defaultValues: {
      nome_completo: usuarioData?.nome_completo || "",
      email_contato: usuarioData?.email_contato || "",
      cargo_perfil: usuarioData?.cargo_perfil || "",
      telefone_contato: usuarioData?.telefone_contato || "",
      ativo: usuarioData?.ativo ?? true,
      senha: "",
      confirmar_senha: "",
    },
    mode: "onBlur", // Validar ao sair do campo
  });

  // Function to handle the form submission
  const onSubmit = async (data: UsuarioInternoFormData) => {
    setIsSaving(true);
    try {
      if (isEditing && usuarioId) {
        // Atualizar usuário existente usando o AuthService
        const resultado = await AuthService.atualizarUsuario(usuarioId, {
          nome: data.nome_completo,
          email: data.email_contato,
          telefone: data.telefone_contato,
          ativo: data.ativo,
        });

        if (!resultado.sucesso) {
          throw new Error(resultado.erro || 'Erro ao atualizar usuário');
        }

        toast({
          title: "Usuário atualizado",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        // Criar novo usuário usando o AuthService
        if (!data.senha) {
          throw new Error("Senha é obrigatória para criar um novo usuário");
        }

        // Buscar o perfil_id baseado no cargo selecionado
        const perfilSelecionado = perfisDisponiveis.find(p => p.nome === data.cargo_perfil);
        if (!perfilSelecionado) {
          throw new Error("Perfil selecionado não encontrado");
        }

        const resultado = await AuthService.criarUsuario({
          nome: data.nome_completo,
          email: data.email_contato,
          telefone: data.telefone_contato,
          perfil_id: perfilSelecionado.id,
          senha: data.senha,
          ativo: data.ativo,
        });

        if (!resultado.sucesso) {
          throw new Error(resultado.erro || 'Erro ao criar usuário');
        }

        toast({
          title: "Usuário criado",
          description: "O usuário foi criado com sucesso e já pode fazer login no sistema.",
          duration: 4000,
        });
      }

      // Retornar para a página de listagem após sucesso
      navigate("/admin/usuarios");
    } catch (error) {
      console.error('Erro ao salvar usuário interno:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido ao salvar usuário",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to cancel and go back to the listing page
  const handleCancel = () => {
    navigate("/admin/usuarios");
  };

  // Toggle to show/hide password fields in edit mode
  const togglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
    if (!showPasswordFields) {
      // Clear password fields when they are hidden
      form.setValue("senha", "");
      form.setValue("confirmar_senha", "");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Campo Nome Completo */}
          <FormField
            control={form.control}
            name="nome_completo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo Email */}
          <FormField
            control={form.control}
            name="email_contato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo Cargo/Perfil - Agora usando perfis do sistema */}
          <FormField
            control={form.control}
            name="cargo_perfil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo/Perfil</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {perfisDisponiveis.map((perfil) => (
                      <SelectItem key={perfil.id} value={perfil.nome}>
                        {perfil.nome}
                        {perfil.descricao && (
                          <span className="text-xs text-gray-500 ml-2">
                            - {perfil.descricao}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo Telefone */}
          <FormField
            control={form.control}
            name="telefone_contato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo Ativo */}
          <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Usuário Ativo</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Determina se o usuário pode acessar o sistema
                  </div>
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

          {/* Toggle to show/hide password fields in edit mode */}
          {isEditing && (
            <div className="col-span-1 md:col-span-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={togglePasswordFields}
              >
                {showPasswordFields ? "Cancelar alteração de senha" : "Alterar senha"}
              </Button>
            </div>
          )}

          {/* Conditional password fields */}
          {(!isEditing && showPasswordFields) || (isEditing && showPasswordFields) ? (
            <>
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditing ? "Nova Senha" : "Senha"}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmar_senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar {isEditing ? "Nova Senha" : "Senha"}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme a senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Salvar Alterações" : "Salvar Usuário"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UsuarioInternoForm;
