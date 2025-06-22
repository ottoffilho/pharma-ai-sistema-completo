import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Settings, Shield, Clock, Bell, Edit3, Camera, Save, Eye, Smartphone, Mail, MapPin, Calendar, BadgeHelp, Zap } from 'lucide-react';

export default function PerfilPage() {
  return (
    <AdminLayout>
      <div className="space-y-8 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/20 dark:via-cyan-950/20 dark:to-teal-950/20" />
          <div className="relative px-6 py-12 w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      Meu Perfil
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Gerencie suas informações pessoais e preferências do sistema
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 px-3 py-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Configuração Pessoal
                  </Badge>
                  <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50 px-3 py-1">
                    <Shield className="h-3 w-3 mr-1" />
                    Privacidade
                  </Badge>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 px-3 py-1">
                    <Bell className="h-3 w-3 mr-1" />
                    Notificações
                  </Badge>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 blur-3xl opacity-20" />
                  <User className="h-32 w-32 text-blue-600/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status da Conta</p>
                  <p className="text-lg font-bold text-green-600">Ativa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Último Acesso</p>
                  <p className="text-lg font-bold text-blue-600">Agora</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 text-white">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Perfil</p>
                  <p className="text-lg font-bold text-purple-600">Admin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessões</p>
                  <p className="text-lg font-bold text-amber-600">156</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
          {/* Informações Pessoais */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/10 border-blue-200/50 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-blue-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Informações Pessoais</CardTitle>
                      <CardDescription>
                        Seus dados pessoais e de contato
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold mb-4">
                      A
                    </div>
                    <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8">
                      <Camera className="h-3 w-3" />
                    </Button>
                  </div>
                  <h3 className="text-xl font-semibold">Administrador</h3>
                  <p className="text-muted-foreground">admin@pharma.ai</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </label>
                      <p className="text-lg">admin@pharma.ai</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                        <Smartphone className="h-4 w-4" />
                        Telefone
                      </label>
                      <p className="text-lg text-muted-foreground">Não informado</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4" />
                        Localização
                      </label>
                      <p className="text-lg text-muted-foreground">Não informado</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4" />
                        Membro desde
                      </label>
                      <p className="text-lg">Janeiro 2025</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com Configurações */}
          <div className="space-y-6">
            {/* Configurações Rápidas */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 text-white">
                    <Settings className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Configurações</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-purple-200 hover:bg-purple-50">
                  <Bell className="h-4 w-4 mr-2" />
                  Notificações
                </Button>
                <Button variant="outline" className="w-full justify-start border-purple-200 hover:bg-purple-50">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacidade
                </Button>
                <Button variant="outline" className="w-full justify-start border-purple-200 hover:bg-purple-50">
                  <Settings className="h-4 w-4 mr-2" />
                  Preferências
                </Button>
              </CardContent>
            </Card>

            {/* Status de Desenvolvimento */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Status do Sistema</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Funcionalidade de Perfil</span>
                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                      Em Desenvolvimento
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A edição completa do perfil será implementada nas próximas atualizações do sistema.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card de Ajuda */}
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50 border-slate-200/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-gray-500 text-white">
                    <BadgeHelp className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Precisa de Ajuda?</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Entre em contato com nossa equipe de suporte para assistência.
                    </p>
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Contatar Suporte
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg mx-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Perfil do usuário | Pharma.AI</span>
            <span>Mantenha seus dados sempre atualizados</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 