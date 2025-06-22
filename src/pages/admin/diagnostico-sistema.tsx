import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, ServerOff, Shield, AlertTriangle, Gauge, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function DiagnosticoSistemaPage() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Diagnóstico do Sistema</h1>
          <p className="text-muted-foreground">
            Ferramentas para diagnosticar e corrigir problemas
          </p>
        </div>

        <Card>
          <CardHeader className="bg-amber-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <CardTitle>Diagnóstico Ativo</CardTitle>
            </div>
            <CardDescription>
              O sistema detectou problemas que precisam ser corrigidos para o funcionamento adequado
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Detectamos um problema com algumas tabelas no banco de dados. Esta ferramenta permite
                verificar e corrigir esses problemas automaticamente.
              </p>
              
              <p className="text-sm font-medium">
                Ações recomendadas:
              </p>
              
              <ul className="text-sm space-y-1 list-disc pl-5 text-gray-600">
                <li>Execute a verificação de tabelas abaixo</li>
                <li>Crie as tabelas faltantes, se necessário</li>
                <li>Reinicie a aplicação após a correção</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tabelas">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tabelas">
              <Database className="h-4 w-4 mr-2" />
              Tabelas
            </TabsTrigger>
            <TabsTrigger value="conexao">
              <ServerOff className="h-4 w-4 mr-2" />
              Conexão
            </TabsTrigger>
            <TabsTrigger value="permissoes">
              <Shield className="h-4 w-4 mr-2" />
              Permissões
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tabelas" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Verificação de Tabelas
                </CardTitle>
                <CardDescription>
                  Verificar integridade das tabelas do banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Database className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                  <p className="text-lg font-medium mb-2">Sistema de Tabelas Estável</p>
                  <p className="text-sm text-muted-foreground">
                    Todas as tabelas essenciais estão funcionando corretamente
                  </p>
                  <Button 
                    onClick={() => navigate('/admin/sistema/verificar-tabelas')}
                    className="mt-4"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Verificar Tabelas Manualmente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="conexao" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ServerOff className="h-5 w-5" />
                  Diagnóstico de Conexão
                </CardTitle>
                <CardDescription>
                  Verifique o status da conexão com o servidor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Gauge className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                  <p className="text-lg font-medium mb-2">Função em desenvolvimento</p>
                  <p className="text-sm text-muted-foreground">
                    Esta funcionalidade estará disponível em breve
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="permissoes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verificação de Permissões
                </CardTitle>
                <CardDescription>
                  Diagnosticar problemas de permissões no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                  <p className="text-lg font-medium mb-2">Função em desenvolvimento</p>
                  <p className="text-sm text-muted-foreground">
                    Esta funcionalidade estará disponível em breve
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin')}
            className="mr-2"
          >
            Voltar ao Dashboard
          </Button>
          <Button 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar Sistema
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
} 