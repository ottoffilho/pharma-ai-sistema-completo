// =====================================================
// PÁGINA - DETALHES DO CLIENTE (REDESENHADA)
// =====================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingCart,
  CreditCard,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Package,
  Clock,
  Star,
  Sparkles,
  Activity,
  Shield,
  Award,
  Hash,
  Globe,
  BarChart3,
  DollarSign,
  Truck,
  Heart,
  Target,
  Zap,
  AlertCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  cpf?: string;
  cnpj?: string;
  tipo_pessoa: 'PF' | 'PJ';
  nome_fantasia?: string;
  rg?: string;
  observacoes?: string;
  data_nascimento?: string;
  total_compras: number;
  ultima_compra?: string;
  pontos_fidelidade: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface Compra {
  id: string;
  data_venda: string;
  valor_total: number;
  status: string;
  produtos_vendidos: any[];
}

interface Estatisticas {
  total_vendas: number;
  ticket_medio: number;
  ultima_compra: string | null;
  produtos_favoritos: string[];
  freq_compras_mes: number;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function DetalhesClientePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("perfil");

  // Query para buscar dados do cliente
  const { data: cliente, isLoading: loadingCliente, error: errorCliente } = useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      if (!id) throw new Error('ID do cliente não fornecido');
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Cliente;
    },
    enabled: !!id,
  });

  // Query para buscar compras do cliente
  const { data: compras = [], isLoading: loadingCompras } = useQuery({
    queryKey: ['cliente-compras', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          id,
          data_venda,
          valor_total,
          status,
          produtos_vendidos
        `)
        .eq('cliente_id', id)
        .order('data_venda', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as Compra[];
    },
    enabled: !!id,
  });

  // Query para estatísticas do cliente
  const { data: estatisticas } = useQuery({
    queryKey: ['cliente-estatisticas', id],
    queryFn: async () => {
      if (!id) return null;
      
      // Calcular estatísticas básicas
      const stats: Estatisticas = {
        total_vendas: compras.length,
        ticket_medio: compras.length > 0 ? compras.reduce((acc, compra) => acc + compra.valor_total, 0) / compras.length : 0,
        ultima_compra: compras.length > 0 ? compras[0].data_venda : null,
        produtos_favoritos: [],
        freq_compras_mes: 0
      };
      
      return stats;
    },
    enabled: !!compras,
  });

  // Loading states
  if (loadingCliente) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <User className="h-16 w-16 text-primary/20" />
              </div>
              <User className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Carregando informações do cliente...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (errorCliente) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                Erro ao carregar dados do cliente: {(errorCliente as Error).message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => navigate('/admin/clientes')}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Clientes
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!cliente) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 mb-6">
              <AlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Cliente não encontrado
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              O cliente que você está procurando não existe ou foi removido do sistema.
            </p>
            <Button
              onClick={() => navigate('/admin/clientes')}
              className="gap-2 bg-gradient-to-r from-orange-500 to-red-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para lista
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Formatação de dados
  const formatarDocumento = (cpf?: string, cnpj?: string) => {
    if (cpf) {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (cnpj) {
      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return 'Não informado';
  };

  const formatarTelefone = (telefone?: string) => {
    if (!telefone) return 'Não informado';
    return telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  const formatarEndereco = () => {
    const parts = [cliente.endereco, cliente.cidade, cliente.estado, cliente.cep].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Não informado';
  };

  // Calcular métricas fictícias para demonstração
  const diasCadastrado = Math.floor((new Date().getTime() - new Date(cliente.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const scoreEngajamento = Math.min(95, 60 + (diasCadastrado / 10) + (cliente.total_compras * 2));
  const nivelFidelidade = cliente.pontos_fidelidade > 1000 ? 'Gold' : cliente.pontos_fidelidade > 500 ? 'Silver' : 'Bronze';

  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-8">
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/clientes')}
                className="gap-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 hover:bg-white/70 dark:hover:bg-gray-800/70"
                >
                  <Heart className="h-4 w-4" />
                  Favoritar
                </Button>
                <Button
                  onClick={() => navigate(`/admin/clientes/${id}/editar`)}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
                >
                  <Edit className="h-4 w-4" />
                  Editar Cliente
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-xl">
                <User className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  {cliente.nome}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span className="font-mono">{formatarDocumento(cliente.cpf, cliente.cnpj)}</span>
                  </div>
                  <Badge className={cliente.ativo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0" : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-0"}>
                    {cliente.ativo ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </>
                    )}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-orange-400 border-0">
                    <Award className="h-3 w-3 mr-1" />
                    {nivelFidelidade}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engajamento</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{scoreEngajamento.toFixed(0)}%</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <Progress value={scoreEngajamento} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Compras</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{cliente.total_compras || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <ShoppingCart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400">+8% este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    R$ {(estatisticas?.ticket_medio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-600 dark:text-purple-400">No alvo</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pontos Fidelidade</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{cliente.pontos_fidelidade || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 dark:text-orange-400">Ativo</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo com Estilo Moderno */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-1 rounded-xl">
            <TabsTrigger 
              value="perfil" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger 
              value="compras" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger 
              value="observacoes" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <FileText className="h-4 w-4" />
              Observações
            </TabsTrigger>
          </TabsList>

          {/* Aba Perfil */}
          <TabsContent value="perfil" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informações Pessoais */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                        <p className="font-semibold text-lg mt-1">{cliente.nome}</p>
                      </div>
                      {cliente.nome_fantasia && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <label className="text-sm font-medium text-muted-foreground">Nome Fantasia</label>
                          <p className="font-semibold text-lg mt-1">{cliente.nome_fantasia}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <label className="text-sm font-medium text-muted-foreground">
                          {cliente.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}
                        </label>
                        <p className="font-mono font-medium mt-1">{formatarDocumento(cliente.cpf, cliente.cnpj)}</p>
                      </div>
                      {cliente.rg && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <label className="text-sm font-medium text-muted-foreground">RG</label>
                          <p className="font-mono font-medium mt-1">{cliente.rg}</p>
                        </div>
                      )}
                    </div>

                    {cliente.data_nascimento && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                        </div>
                        <p className="font-medium mt-1">
                          {new Date(cliente.data_nascimento).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contato */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30">
                        <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Informações de Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cliente.email && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <p className="font-medium">{cliente.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {cliente.telefone && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                          <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                          <p className="font-medium">{formatarTelefone(cliente.telefone)}</p>
                        </div>
                      </div>
                    )}

                    {(cliente.endereco || cliente.cidade || cliente.estado) && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                          <p className="font-medium">{formatarEndereco()}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Card de Performance */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Frequência</span>
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">92%</Badge>
                        </div>
                        <Progress value={92} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Satisfação</span>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">88%</Badge>
                        </div>
                        <Progress value={88} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Valor Lifetime</span>
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">Alto</Badge>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Linha do Tempo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">Cadastro realizado</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(cliente.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {cliente.ultima_compra && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Última compra</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(cliente.ultima_compra).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Aba Compras */}
          <TabsContent value="compras" className="space-y-6 mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30">
                    <ShoppingCart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Histórico de Compras
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCompras ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : compras.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 w-fit mx-auto mb-4">
                      <ShoppingCart className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-muted-foreground">Nenhuma compra realizada ainda</p>
                    <p className="text-sm text-muted-foreground mt-1">As compras do cliente aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Produtos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compras.map((compra) => (
                          <TableRow key={compra.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {new Date(compra.data_venda).toLocaleDateString('pt-BR')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(compra.valor_total)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={compra.status === 'finalizada' ? 'default' : 'secondary'}
                                className={compra.status === 'finalizada' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0' : ''}
                              >
                                {compra.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                {compra.produtos_vendidos?.length || 0} item(s)
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Observações */}
          <TabsContent value="observacoes" className="space-y-6 mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                    <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  Observações e Anotações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[200px] p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  {cliente.observacoes ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{cliente.observacoes}</p>
                  ) : (
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-amber-400 mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground italic">Nenhuma observação registrada</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use o botão editar para adicionar observações sobre este cliente
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer com informações adicionais */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>ID: {cliente.id}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Última atualização: {new Date(cliente.updated_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 