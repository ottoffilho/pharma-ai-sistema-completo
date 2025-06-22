import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/modules/usuarios-permissoes/services/authService';
import { isStrongPassword } from '@/lib/auth-utils';

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
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import backgroundImg from '@/assets/images/ambiente_interno.jpg';
import logoPharma from '@/assets/logo/phama-horizon.png';

// Schema de validação para redefinição de senha
const redefinirSenhaSchema = z.object({
  senha: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .refine((password) => isStrongPassword(password).isValid, {
      message: 'A senha deve conter pelo menos: 1 número, 1 letra maiúscula e 1 caractere especial',
    }),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type RedefinirSenhaFormData = z.infer<typeof redefinirSenhaSchema>;

const RedefinirSenha: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [redefinindo, setRedefinindo] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [senhaRedefinida, setSenhaRedefinida] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const form = useForm<RedefinirSenhaFormData>({
    resolver: zodResolver(redefinirSenhaSchema),
    defaultValues: {
      senha: '',
      confirmarSenha: '',
    },
  });

  // Verificar validade do token ao carregar a página
  useEffect(() => {
    const verificarToken = async () => {
      if (!token || !email) {
        setTokenValido(false);
        return;
      }

      try {
        const resultado = await AuthService.verificarTokenRecuperacao(token, email);
        setTokenValido(resultado.sucesso);
        
        if (!resultado.sucesso) {
          toast({
            title: 'Link inválido',
            description: 'Este link de recuperação é inválido ou expirou.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        setTokenValido(false);
      }
    };

    verificarToken();
  }, [token, email, toast]);

  const onSubmit = async (data: RedefinirSenhaFormData) => {
    if (!token || !email) {
      toast({
        title: 'Erro',
        description: 'Token ou email não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    setRedefinindo(true);
    try {
      const resultado = await AuthService.redefinirSenha(token, email, data.senha);
      
      if (resultado.sucesso) {
        setSenhaRedefinida(true);
        toast({
          title: 'Senha redefinida!',
          description: 'Sua senha foi alterada com sucesso.',
        });
      } else {
        toast({
          title: 'Erro ao redefinir senha',
          description: resultado.erro || 'Não foi possível redefinir a senha.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro na redefinição de senha:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setRedefinindo(false);
    }
  };

  // Loading state
  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando link de recuperação...</p>
        </div>
      </div>
    );
  }

  // Token inválido
  if (tokenValido === false) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-md w-full space-y-8 bg-white/80 rounded-xl shadow-lg p-8">
          <div className="text-center mb-4">
            <img src={logoPharma} alt="Pharma.AI" className="mx-auto h-16 mb-2" />
            <p className="text-gray-600">Sistema de Gestão para Farmácias de Manipulação</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-red-600">Link Inválido</CardTitle>
              <CardDescription className="text-center">
                Este link de recuperação é inválido ou expirou.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Solicite um novo link de recuperação de senha.
              </p>
              <Button
                onClick={() => navigate('/esqueci-senha')}
                className="w-full"
              >
                Solicitar Nova Recuperação
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Senha redefinida com sucesso
  if (senhaRedefinida) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-md w-full space-y-8 bg-white/80 rounded-xl shadow-lg p-8">
          <div className="text-center mb-4">
            <img src={logoPharma} alt="Pharma.AI" className="mx-auto h-16 mb-2" />
            <p className="text-gray-600">Sistema de Gestão para Farmácias de Manipulação</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-green-600">Senha Redefinida!</CardTitle>
              <CardDescription className="text-center">
                Sua senha foi alterada com sucesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Agora você pode fazer login com sua nova senha.
                </p>
              </div>
              
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

  // Formulário de redefinição
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-md w-full space-y-8 bg-white/80 rounded-xl shadow-lg p-8">
        <div className="text-center mb-4">
          <img src={logoPharma} alt="Pharma.AI" className="mx-auto h-16 mb-2" />
          <p className="text-gray-600">Sistema de Gestão para Farmácias de Manipulação</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Redefinir Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={mostrarSenha ? 'text' : 'password'}
                            placeholder="Mínimo 8 caracteres"
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
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
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
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={mostrarConfirmarSenha ? 'text' : 'password'}
                            placeholder="Confirme sua nova senha"
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
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
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
                  className="w-full"
                  disabled={redefinindo}
                >
                  {redefinindo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Redefinir Senha
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RedefinirSenha; 