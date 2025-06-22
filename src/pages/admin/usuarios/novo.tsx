import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import UsuarioInternoForm from '@/components/usuarios/UsuarioInternoForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Users, Shield, Key, Mail, AlertCircle, BadgeHelp, Zap } from 'lucide-react';

const NovoUsuarioPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-8 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-blue-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin/usuarios')}
                  className="mb-4 -ml-4 text-muted-foreground hover:text-indigo-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Usuários
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                    <UserPlus className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Novo Usuário
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Cadastre um novo usuário interno do sistema
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 px-3 py-1">
                    <Users className="h-3 w-3 mr-1" />
                    Gestão de Equipe
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 px-3 py-1">
                    <Shield className="h-3 w-3 mr-1" />
                    Controle de Acesso
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 px-3 py-1">
                    <Key className="h-3 w-3 mr-1" />
                    Permissões Granulares
                  </Badge>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 blur-3xl opacity-20" />
                  <Users className="h-32 w-32 text-indigo-600/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Ajuda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Mail className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Convite Automático</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Após criar o usuário, um e-mail de convite será enviado automaticamente com as 
                instruções para o primeiro acesso ao sistema.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Perfis Disponíveis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Escolha entre Atendente, Farmacêutico, Manipulador ou Administrador. 
                Cada perfil tem permissões específicas no sistema.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Formulário */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/10 border-indigo-200/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Dados do Usuário</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preencha as informações do novo usuário interno
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <UsuarioInternoForm isEditing={false} />
            </CardContent>
          </Card>
        </div>

        {/* Card de Ajuda */}
        <div className="px-6">
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50 border-slate-200/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-slate-500 to-gray-500 text-white">
                  <BadgeHelp className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Tipos de Perfil no Sistema</h3>
                  <p className="text-muted-foreground mb-4">
                    Entenda as responsabilidades de cada perfil de usuário:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">Atendente</Badge>
                        <span className="text-sm text-muted-foreground">Receitas e atendimento</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">Farmacêutico</Badge>
                        <span className="text-sm text-muted-foreground">Validação e supervisão</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">Manipulador</Badge>
                        <span className="text-sm text-muted-foreground">Produção e estoque</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">Administrador</Badge>
                        <span className="text-sm text-muted-foreground">Acesso total</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg mx-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Gestão de usuários | Pharma.AI</span>
            <span>Controle de acesso seguro e granular</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NovoUsuarioPage;
