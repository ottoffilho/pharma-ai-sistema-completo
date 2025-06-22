import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import backgroundImg from '@/assets/images/ambiente_interno.jpg';
import logoPharma from '@/assets/logo/phama-horizon.png';

// Schema de validação para o formulário de recuperação
const recuperacaoSchema = z.object({
  email: z.string().email('Email inválido'),
});

type RecuperacaoFormData = z.infer<typeof recuperacaoSchema>;

const EsqueciSenha: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const form = useForm<RecuperacaoFormData>({
    resolver: zodResolver(recuperacaoSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: RecuperacaoFormData) => {
    setEnviandoEmail(true);
    try {
      console.log('Solicitando recuperação de senha para:', data.email);
      
      const resultado = await AuthService.solicitarRecuperacaoSenha(data.email);
      
      if (resultado.sucesso) {
        setEmailEnviado(true);
        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
        });
      } else {
        toast({
          title: 'Erro ao enviar email',
          description: resultado.erro || 'Não foi possível enviar o email de recuperação.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setEnviandoEmail(false);
    }
  };

  if (emailEnviado) {
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
              <CardTitle className="text-center text-green-600">Email Enviado!</CardTitle>
              <CardDescription className="text-center">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Mail className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Se você não receber o email em alguns minutos, verifique sua pasta de spam.
                </p>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailEnviado(false);
                    form.reset();
                  }}
                  className="w-full"
                >
                  Enviar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
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
            <CardTitle>Recuperar Senha</CardTitle>
            <CardDescription>
              Digite seu email para receber as instruções de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={enviandoEmail}
                >
                  {enviandoEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Email de Recuperação
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Link to="/login">
                    <Button type="button" variant="link" className="text-sm">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar ao Login
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EsqueciSenha; 