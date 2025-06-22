import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/modules/usuarios-permissoes/services/authService';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, Shield, Eye, EyeOff } from 'lucide-react';
import backgroundImg from '@/assets/images/canva.jpg';
import logoPharma from '@/assets/logo/phama-horizon.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// Schema de validação para o formulário de aceitar convite
const aceitarConviteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  telefone: z.string().optional(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string()
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type AceitarConviteFormData = z.infer<typeof aceitarConviteSchema>;

const AceitarConvite: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [processandoForm, setProcessandoForm] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [conviteValido, setConviteValido] = useState<boolean | null>(null);
  const [verificandoConvite, setVerificandoConvite] = useState(true);
  const [perfilNome, setPerfilNome] = useState('');
  const [emailConvite, setEmailConvite] = useState('');

  // Obter parâmetros da URL
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const form = useForm<AceitarConviteFormData>({
    resolver: zodResolver(aceitarConviteSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      senha: '',
      confirmarSenha: '',
    },
  });

  // Verificar validade do token de convite
  useEffect(() => {
    const verificarConvite = async () => {
      if (!token || !email) {
        setConviteValido(false);
        setVerificandoConvite(false);
        return;
      }

      try {
        const resultado = await AuthService.verificarConvite(token, email);
        setConviteValido(resultado.sucesso);
        setEmailConvite(email);
        
        if (resultado.sucesso && resultado.perfilNome) {
          setPerfilNome(resultado.perfilNome);
        } else {
          toast({
            title: 'Convite inválido',
            description: resultado.erro || 'Este convite é inválido ou expirou.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao verificar convite:', error);
        setConviteValido(false);
      } finally {
        setVerificandoConvite(false);
      }
    };

    verificarConvite();
  }, [token, email, toast]);

  const onSubmit = async (data: AceitarConviteFormData) => {
    if (!token || !email) {
      toast({
        title: 'Erro',
        description: 'Informações de convite inválidas.',
        variant: 'destructive',
      });
      return;
    }

    setProcessandoForm(true);
    try {
      const resultado = await AuthService.aceitarConvite(
        token,
        email,
        data.nome,
        data.senha,
        data.telefone
      );

      if (resultado.sucesso) {
        setModalConfirmacao(true);
      } else {
        toast({
          title: 'Erro ao criar conta',
          description: resultado.erro || 'Não foi possível criar sua conta. Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao processar convite:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessandoForm(false);
    }
  };

  // Estado de carregamento (verificando convite)
  if (verificandoConvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando convite...</p>
        </div>
      </div>
    );
  }

  // Convite inválido
  if (conviteValido === false) {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="text-center mb-4">
            <img src={logoPharma} alt="Pharma.AI" className="mx-auto h-16 mb-2" />
            <p className="text-gray-600">Sistema de Gestão para Farmácias de Manipulação</p>
          </div>
          
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-600">Convite Inválido</CardTitle>
              <CardDescription className="text-gray-600">
                Este link de convite é inválido ou expirou. 
                Por favor, solicite um novo convite ao administrador da farmácia.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Ir para Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Formulário de aceitação de convite
  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
      <div className="max-w-lg w-full relative z-10">
        <div className="text-center mb-4">
          <img src={logoPharma} alt="Pharma.AI" className="mx-auto h-16 mb-2" />
          <p className="text-gray-600">Sistema de Gestão para Farmácias de Manipulação</p>
        </div>
        
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <UserPlus className="w-6 h-6 text-blue-600" />
              Criar sua Conta
            </CardTitle>
            <CardDescription className="text-gray-600">
              Você foi convidado(a) como <span className="font-semibold text-blue-600">{perfilNome}</span>.
              <br />Complete seu cadastro para acessar o sistema.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Nome Completo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite seu nome completo" 
                          className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mb-2 flex flex-col">
                  <span className="text-sm font-medium text-gray-700 mb-1">Email (não editável)</span>
                  <Input 
                    type="email"
                    value={emailConvite}
                    disabled
                    className="h-12 bg-gray-50 text-gray-600"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Telefone (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(11) 99999-9999" 
                          className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={mostrarSenha ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres" 
                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                          >
                            {mostrarSenha ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmarSenha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Confirmar Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={mostrarConfirmarSenha ? "text" : "password"}
                            placeholder="Digite a senha novamente" 
                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                          >
                            {mostrarConfirmarSenha ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={processandoForm}
                >
                  {processandoForm ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Criando sua conta...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Criar Minha Conta
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalConfirmacao} onOpenChange={setModalConfirmacao}>
        <DialogContent className="max-w-md rounded-2xl p-8 text-center">
          <DialogHeader>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-14 h-14 text-green-500 mb-2" />
              <DialogTitle className="text-2xl font-bold text-green-700">Conta criada com sucesso!</DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-gray-700">
              Sua conta foi criada com sucesso. Agora você pode fazer login no sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col gap-2">
            <Button 
              className="w-full" 
              onClick={() => { setModalConfirmacao(false); navigate('/login'); }}
            >
              Ir para o Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AceitarConvite; 