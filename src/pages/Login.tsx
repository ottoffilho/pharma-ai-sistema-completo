import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
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
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import backgroundImg from '@/assets/images/ambiente_interno.jpg';
import logoPharma from '@/assets/logo/phama-horizon.png';

// Schema de validação para o formulário de login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Timeout máximo para verificação inicial (4 segundos)
const MAX_VERIFY_TIME = 4000;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, autenticado, carregando } = useAuthSimple();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [fazendoLogin, setFazendoLogin] = useState(false);
  
  // Estado local para controle mais granular do carregamento
  const [verificandoAuth, setVerificandoAuth] = useState(true);

  // ✅ Hooks SEMPRE devem ser chamados primeiro
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  // Verificação rápida da sessão
  useEffect(() => {
    const verificarSessao = async () => {
      try {
        // Tentar usar cache primeiro
        try {
          const authCache = sessionStorage.getItem('auth_cache');
          if (authCache) {
            const cache = JSON.parse(authCache);
            if (cache.valido && cache.usuario) {
              console.log('✅ Login - Cache de autenticação válido');
              setVerificandoAuth(false);
              return;
            }
          }
        } catch (cacheError) {
          console.log('⚠️ Erro ao verificar cache:', cacheError);
        }
        
        // Verificação direta com Supabase (rápida)
        const { data } = await supabase.auth.getSession();
        // Log removido - apenas verificação silenciosa
      } catch (error) {
        console.error('⚠️ Login - Erro na verificação rápida:', error);
      } finally {
        setVerificandoAuth(false);
      }
    };
    
    // Executar verificação
    verificarSessao();
    
    // Timeout de segurança para não bloquear a UI
    const timeoutId = setTimeout(() => {
      if (verificandoAuth) {
        console.log('⏰ Login - Timeout de verificação');
        setVerificandoAuth(false);
      }
    }, MAX_VERIFY_TIME);
    
    return () => clearTimeout(timeoutId);
  }, [verificandoAuth]);

  // Redirecionamento automático para usuário autenticado
  useEffect(() => {
    // Apenas logs críticos - sem spam no console
    if (autenticado && !carregando) {
      navigate('/admin', { replace: true });
    }
  }, [autenticado, carregando, navigate]);

  // Se já está autenticado, redireciona para o dashboard
  if (autenticado && !carregando) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setFazendoLogin(true);
    try {
      const resultado = await login(data.email, data.senha);
      
      if (resultado.sucesso) {
        
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Redirecionando...',
        });
        
        // Redirecionamento será feito pelo useEffect
        
      } else {
        console.error('❌ Login - Erro:', resultado.erro);
        toast({
          title: 'Erro no login',
          description: resultado.erro || 'Credenciais inválidas',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Login - Erro:', error);
      toast({
        title: 'Erro no login',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setFazendoLogin(false);
    }
  };

  const toggleMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  // Loading state simplificado
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 mb-2">Verificando autenticação...</p>
          <p className="text-sm text-gray-400">
            {verificandoAuth ? 'Verificando sessão...' : 'Carregando dados...'}
          </p>
          
          {/* Debug info após 5 segundos */}
          <div className="mt-4 text-xs text-gray-400">
            Estados: carregando={carregando.toString()}, autenticado={autenticado.toString()}, verificando={verificandoAuth.toString()}
          </div>
          
          {/* Botão de emergência após 10 segundos */}
          <div className="mt-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('🚨 Login - Força reload por causa de carregamento longo');
                window.location.reload();
              }}
            >
              Recarregar se estiver travado
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <CardTitle>Fazer Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Campo Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Campo Senha */}
                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={mostrarSenha ? 'text' : 'password'}
                            placeholder="Sua senha"
                            autoComplete="current-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={toggleMostrarSenha}
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
                {/* Botão de Login */}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={fazendoLogin}
                >
                  {fazendoLogin ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
                {/* Link para recuperar senha */}
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm"
                    onClick={() => navigate('/esqueci-senha')}
                  >
                    Esqueci minha senha
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
