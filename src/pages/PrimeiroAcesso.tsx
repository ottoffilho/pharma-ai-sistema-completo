import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
import { Loader2, Sparkles, Shield, Users, BarChart3, Eye, EyeOff } from 'lucide-react';
import backgroundImg from '@/assets/images/canva.jpg';
import logoPharma from '@/assets/logo/phama-horizon.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';

// Schema de validação para o formulário de primeiro acesso
const primeiroAcessoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string()
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type PrimeiroAcessoFormData = z.infer<typeof primeiroAcessoSchema>;

const PrimeiroAcesso: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [criandoConta, setCriandoConta] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);

  const form = useForm<PrimeiroAcessoFormData>({
    resolver: zodResolver(primeiroAcessoSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      senha: '',
      confirmarSenha: '',
    },
  });

  const onSubmit = async (data: PrimeiroAcessoFormData) => {
    setCriandoConta(true);
    try {
      console.log('🚀 Criando primeiro usuário proprietário...');

      // 1. Obter ID do perfil proprietário
      const { data: perfisData, error: perfilError } = await supabase
        .from('perfis_usuario')
        .select('id')
        .eq('tipo', 'PROPRIETARIO')
        .single();

      if (perfilError || !perfisData?.id) {
        console.error('Erro ao obter perfil proprietário:', perfilError);
        toast({
          title: 'Erro de configuração',
          description: 'Perfil de proprietário não encontrado no sistema.',
          variant: 'destructive',
        });
        return;
      }

      // 2. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          data: {
            nome: data.nome,
            telefone: data.telefone || null
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar usuário no Auth:', authError);
        toast({
          title: 'Erro ao criar conta',
          description: authError.message || 'Erro interno do servidor',
          variant: 'destructive',
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: 'Erro ao criar conta',
          description: 'Não foi possível criar o usuário',
          variant: 'destructive',
        });
        return;
      }

      // 3. Criar usuário na tabela usuarios com perfil de proprietário
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .insert({
          supabase_auth_id: authData.user.id,
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || null,
          perfil_id: perfisData.id,
          ativo: true
        })
        .select()
        .single();

      if (usuarioError) {
        console.error('Erro ao criar usuário na tabela:', usuarioError);
        
        // Se falhou, tentar limpar o usuário do Auth também
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          console.error('Erro ao limpar usuário do Auth:', deleteError);
        }
        
        toast({
          title: 'Erro ao criar perfil',
          description: 'Erro ao criar perfil do usuário. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Usuário proprietário criado com sucesso!', usuarioData);

      // Mostrar modal de confirmação de e-mail
      setModalConfirmacao(true);
      return;

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCriandoConta(false);
    }
  };

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
      {/* Overlay sutil para contraste, sem escurecer demais */}
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
      <div className="max-w-4xl w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Lado Esquerdo - Boas-vindas */}
          <div className="text-center lg:text-left space-y-6">
            <div className="flex justify-center lg:justify-start">
              <img src={logoPharma} alt="Pharma.AI" className="h-20" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-blue-900 drop-shadow">
                Bem-vindo ao
                <span className="text-cyan-700 block drop-shadow">Pharma.AI</span>
              </h1>
              
              <p className="text-xl text-gray-800 leading-relaxed drop-shadow">
                O sistema completo de gestão para farmácias de manipulação.
                Vamos configurar sua conta de proprietário para começar!
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 drop-shadow">Seguro e Confiável</h3>
                  <p className="text-sm text-gray-700">Dados protegidos</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 drop-shadow">Gestão de Equipe</h3>
                  <p className="text-sm text-gray-700">Controle total</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 drop-shadow">Relatórios Avançados</h3>
                  <p className="text-sm text-gray-700">Insights valiosos</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-cyan-500/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 drop-shadow">IA Integrada</h3>
                  <p className="text-sm text-gray-700">Automação inteligente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito - Formulário */}
          <div className="w-full">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  Criar Conta do Proprietário
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Configure sua conta para começar a usar o sistema
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

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="seu@email.com" 
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
                      disabled={criandoConta}
                    >
                      {criandoConta ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Criando sua conta...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Criar Minha Conta
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Ao criar sua conta, você concorda com nossos{' '}
                    <a href="#" className="text-blue-600 hover:underline">Termos de Uso</a>
                    {' '}e{' '}
                    <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={modalConfirmacao} onOpenChange={setModalConfirmacao}>
        <DialogContent className="max-w-md rounded-2xl p-8 text-center">
          <DialogHeader>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-14 h-14 text-green-500 mb-2" />
              <DialogTitle className="text-2xl font-bold text-green-700">Cadastro realizado!</DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-gray-700">
              Enviamos um e-mail de confirmação para <span className="font-semibold">{form.getValues('email')}</span>.<br />
              Por favor, acesse seu e-mail e clique no link para ativar sua conta.<br />
              <span className="text-sm text-gray-500">(Verifique também a caixa de spam/lixo eletrônico)</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col gap-2">
            <Button className="w-full" onClick={() => { setModalConfirmacao(false); navigate('/login'); }}>
              Ir para o Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrimeiroAcesso; 