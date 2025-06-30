import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle2, 
  Send, 
  Search,
  Filter,
  Phone,
  MoreVertical,
  Image,
  Paperclip,
  Star,
  Archive,
  Settings,
  Bot,
  AlertCircle,
  TrendingUp,
  MessageSquarePlus,
  UserPlus,
  Activity,
  Calendar,
  ChevronRight,
  Zap,
  Sparkles,
  FileText,
  Download,
  RefreshCw,
  PhoneCall,
  Video,
  Mic,
  Link2,
  QrCode,
  CheckCheck,
  CheckCircle,
  Pause
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getWhatsAppConfig, getBusinessHours, validateEnvConfig, messageTemplates } from '@/config/env-config';

interface Conversa {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  status: 'aguardando' | 'em_atendimento' | 'finalizada' | 'arquivada';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  ultima_mensagem?: string;
  ultima_mensagem_data?: string;
  ultima_atividade?: string;
  mensagens_nao_lidas: number;
  nao_lidas: number;
  atendente_id?: string;
  atendente_nome?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  cliente?: {
    nome: string;
    email?: string;
    telefone: string;
  };
  atendente?: {
    nome: string;
    email: string;
  };
}

interface Mensagem {
  id: string;
  conversa_id: string;
  remetente_tipo: 'cliente' | 'atendente' | 'sistema';
  remetente_nome: string;
  conteudo: string;
  tipo_mensagem: 'texto' | 'imagem' | 'documento' | 'audio';
  arquivo_url?: string;
  timestamp: string;
  lida: boolean;
}

interface MetricasWhatsApp {
  conversas_abertas: number;
  conversas_em_atendimento: number;
  tempo_resposta_medio: string;
  mensagens_hoje: number;
  clientes_ativos: number;
}

const WhatsAppDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [selectedTab, setSelectedTab] = useState('conversas');
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);

  // Configurações obtidas do env-config centralizado
  const whatsappConfig = getWhatsAppConfig();
  const businessHours = getBusinessHours();

  // Validar configurações do WhatsApp
  const configValidation = validateEnvConfig();
  
  // Mostrar aviso se configurações estão faltando
  React.useEffect(() => {
    if (!configValidation.isValid) {
      console.warn('Configurações do WhatsApp incompletas:', configValidation.missingVars);
    }
  }, [configValidation]);

  // Buscar mensagens da conversa selecionada
  const { data: mensagensData } = useQuery({
    queryKey: ['mensagens-whatsapp', conversaSelecionada],
    queryFn: async () => {
      if (!conversaSelecionada) return [];
      
      const { data, error } = await supabase
        .from('mensagens_atendimento')
        .select('*')
        .eq('conversa_id', conversaSelecionada)
        .order('enviada_em', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!conversaSelecionada,
    refetchInterval: 3000, // Atualizar a cada 3 segundos
  });

  // Atualizar mensagens quando dados reais chegarem
  useEffect(() => {
    if (mensagensData) {
      const mensagensProcessadas = mensagensData.map(msg => ({
        id: msg.id,
        conversa_id: msg.conversa_id,
        remetente_tipo: msg.remetente_tipo,
        remetente_nome: msg.remetente_nome || (msg.remetente_tipo === 'cliente' ? 'Cliente' : 'Atendente'),
        conteudo: msg.conteudo,
        tipo_mensagem: msg.tipo_mensagem,
        arquivo_url: msg.arquivo_url,
        timestamp: msg.enviada_em,
        lida: msg.status_leitura === 'lida',
      }));
      setMensagens(mensagensProcessadas);
    } else {
      setMensagens([]);
    }
  }, [mensagensData, conversaSelecionada]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [buscaConversa, setBuscaConversa] = useState('');

  // Buscar conversas usando a função otimizada
  const { data: conversasData, isLoading: conversasLoading } = useQuery({
    queryKey: ['conversas-whatsapp', filterStatus, searchTerm],
    queryFn: async () => {
      // Usar a função buscar_conversas_whatsapp para consultas otimizadas
      const { data, error } = await supabase.rpc('buscar_conversas_whatsapp', {
        p_status: filterStatus === 'todos' ? null : filterStatus,
        p_busca: searchTerm || null,
        p_limit: 50,
        p_offset: 0
      });
      
      if (error) {
        console.error('Erro ao buscar conversas:', error);
        throw error;
      }
      
      // Mapear dados para interface esperada
      return (data || []).map((conversa: any) => ({
        ...conversa,
        cliente: {
          nome: conversa.cliente_nome,
          email: conversa.cliente_email,
          telefone: conversa.cliente_telefone
        },
        ultima_mensagem: conversa.ultima_mensagem_conteudo,
        nao_lidas: conversa.mensagens_nao_lidas,
        mensagens_nao_lidas: conversa.mensagens_nao_lidas
      })) as Conversa[];
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  // Estatísticas
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: async () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeISO = hoje.toISOString();

      // Total de conversas hoje
      const { count: conversasHoje } = await supabase
        .from('conversas_atendimento')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', hojeISO);

      // Mensagens enviadas hoje
      const { count: mensagensHoje } = await supabase
        .from('mensagens_atendimento')
        .select('*', { count: 'exact', head: true })
        .gte('enviada_em', hojeISO);

      // Conversas ativas (aguardando)
      const { count: aguardando } = await supabase
        .from('conversas_atendimento')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativa');

      // Conversas em atendimento
      const { count: emAtendimento } = await supabase
        .from('conversas_atendimento')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'em_atendimento');

      // Calcular tempo médio de resposta real baseado nas mensagens
      const resultadoTempo = await calcularTempoMedioResposta();
      const tempoMedioResposta = resultadoTempo.tempo;

              return {
          conversasHoje: conversasHoje || 0,
          mensagensHoje: mensagensHoje || 0,
          aguardando: aguardando || 0,
          emAtendimento: emAtendimento || 0,
          tempoMedioResposta,
          amostrasTempoResposta: resultadoTempo.amostras
        };
    },
    refetchInterval: 10000,
  });

  /**
   * Calcula o tempo médio de resposta real baseado nas mensagens do WhatsApp
   * 
   * Algoritmo:
   * 1. Busca mensagens dos últimos 7 dias
   * 2. Agrupa por conversa e ordena cronologicamente
   * 3. Identifica padrões cliente -> atendente
   * 4. Calcula diferenças de tempo válidas (10seg a 2h)
   * 5. Remove outliers extremos (top 5%)
   * 6. Retorna média e número de amostras
   * 
   * @returns {Promise<{ tempo: number, amostras: number }>} Tempo em minutos e quantidade de amostras
   */
  const calcularTempoMedioResposta = async (): Promise<{ tempo: number, amostras: number }> => {
    try {
      // Buscar mensagens dos últimos 7 dias para ter uma amostra representativa
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      
      const { data: mensagens, error } = await supabase
        .from('mensagens_atendimento')
        .select('conversa_id, remetente_tipo, enviada_em')
        .gte('enviada_em', seteDiasAtras.toISOString())
        .order('conversa_id', { ascending: true })
        .order('enviada_em', { ascending: true });

      if (error || !mensagens || mensagens.length === 0) {
        console.warn('Não foi possível calcular tempo médio:', error);
        return { tempo: 2.5, amostras: 0 }; // Valor padrão em minutos
      }

      // Agrupar mensagens por conversa
      const conversasMap = new Map<string, Array<{ remetente_tipo: string, enviada_em: string }>>();
      
      mensagens.forEach(msg => {
        if (!conversasMap.has(msg.conversa_id)) {
          conversasMap.set(msg.conversa_id, []);
        }
        conversasMap.get(msg.conversa_id)!.push({
          remetente_tipo: msg.remetente_tipo,
          enviada_em: msg.enviada_em
        });
      });

      // Calcular tempos de resposta
      const temposResposta: number[] = [];

      conversasMap.forEach(mensagensConversa => {
        for (let i = 0; i < mensagensConversa.length - 1; i++) {
          const mensagemAtual = mensagensConversa[i];
          const proximaMensagem = mensagensConversa[i + 1];

          // Verificar se é um padrão: cliente -> atendente
          if (mensagemAtual.remetente_tipo === 'cliente' && 
              proximaMensagem.remetente_tipo === 'atendente') {
            
            const tempoCliente = new Date(mensagemAtual.enviada_em).getTime();
            const tempoAtendente = new Date(proximaMensagem.enviada_em).getTime();
            const diferenca = (tempoAtendente - tempoCliente) / 1000 / 60; // em minutos

            // Considerar apenas respostas realistas (entre 10 segundos e 2 horas)
            if (diferenca >= 0.17 && diferenca <= 120) {
              temposResposta.push(diferenca);
            }
          }
        }
      });

      if (temposResposta.length === 0) {
        return { tempo: 2.5, amostras: 0 }; // Valor padrão se não houver dados
      }

      // Calcular média, removendo outliers extremos
      temposResposta.sort((a, b) => a - b);
      const p95Index = Math.floor(temposResposta.length * 0.95);
      const temposFiltrados = temposResposta.slice(0, p95Index);
      
      const media = temposFiltrados.reduce((sum, tempo) => sum + tempo, 0) / temposFiltrados.length;
      
      return { 
        tempo: Number(media.toFixed(1)), 
        amostras: temposResposta.length 
      };
      
    } catch (error) {
      console.error('Erro ao calcular tempo médio de resposta:', error);
      return { tempo: 2.5, amostras: 0 }; // Valor padrão em caso de erro
    }
  };

  // Função para formatar tempo de resposta
  const formatarTempoResposta = (minutos: number): string => {
    if (minutos < 1) {
      return `${Math.round(minutos * 60)}s`;
    } else if (minutos < 60) {
      return `${minutos.toFixed(1)} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = Math.round(minutos % 60);
      return `${horas}h ${mins}min`;
    }
  };

  // Usar métricas reais dos stats ou valores padrão
  const metricas: MetricasWhatsApp = {
    conversas_abertas: stats?.aguardando || 0,
    conversas_em_atendimento: stats?.emAtendimento || 0,
    tempo_resposta_medio: formatarTempoResposta(stats?.tempoMedioResposta || 0),
    mensagens_hoje: stats?.mensagensHoje || 0,
    clientes_ativos: stats?.conversasHoje || 0
  };

  // Atualizar conversas quando dados reais chegarem
  useEffect(() => {
    if (conversasData) {
      // As conversas já vêm com as últimas mensagens da função otimizada
      const conversasProcessadas = conversasData.map((conversa) => ({
        ...conversa,
        ultima_mensagem_data: conversa.ultima_mensagem_at,
        ultima_atividade: conversa.ultima_mensagem_at 
          ? formatDistanceToNow(new Date(conversa.ultima_mensagem_at), { 
              addSuffix: true, 
              locale: ptBR 
            })
          : 'Sem atividade'
      }));

      setConversas(conversasProcessadas);
    }
  }, [conversasData]);

  // Função para obter o status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aguardando':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando
          </Badge>
        );
      case 'em_atendimento':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <MessageCircle className="w-3 h-3 mr-1" />
            Em Atendimento
          </Badge>
        );
      case 'finalizada':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Finalizada
          </Badge>
        );
      case 'arquivada':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Archive className="w-3 h-3 mr-1" />
            Arquivada
          </Badge>
        );
      default:
        return null;
    }
  };

  // Função para formatar telefone
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-red-100 text-red-800 border-red-200';
      case 'em_atendimento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'aguardando_cliente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolvido': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Função para obter cor da prioridade
  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Função para enviar mensagem
  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !conversaSelecionada) return;

    const novaMensagemObj: Mensagem = {
      id: Date.now().toString(),
      conversa_id: conversaSelecionada,
      remetente_tipo: 'atendente',
      remetente_nome: 'Você',
      conteudo: novaMensagem,
      tipo_mensagem: 'texto',
      timestamp: new Date().toISOString(),
      lida: true,
    };

    setMensagens(prev => [...prev, novaMensagemObj]);
    setNovaMensagem('');

    // Atualizar última mensagem da conversa
    setConversas(prev => prev.map(conv => 
      conv.id === conversaSelecionada 
        ? { ...conv, ultima_mensagem: novaMensagem, ultima_atividade: 'agora' }
        : conv
    ));

    toast({
      title: "Mensagem enviada",
      description: "Sua mensagem foi enviada via WhatsApp",
    });
  };

  // Função para assumir atendimento
  const assumirAtendimento = (conversaId: string) => {
    setConversas(prev => prev.map(conv => 
      conv.id === conversaId 
        ? { 
            ...conv, 
            status: 'em_atendimento',
            atendente_id: 'current_user',
            atendente_nome: 'Você'
          }
        : conv
    ));

    toast({
      title: "Atendimento assumido",
      description: "Você agora está responsável por este atendimento",
    });
  };

  // Filtrar conversas
  const conversasFiltradas = conversas.filter(conv => {
    const matchBusca = conv.cliente?.nome?.toLowerCase().includes(buscaConversa.toLowerCase()) ||
                      conv.cliente?.telefone?.includes(buscaConversa);
    const matchStatus = filterStatus === 'todos' || conv.status === filterStatus;
    return matchBusca && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight dark:text-gray-100">Integração WhatsApp</h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Centro de atendimento integrado via WhatsApp com IA
          </p>
        </div>
        
        {/* Métricas em Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Conversas Abertas</p>
                  <p className="text-2xl font-bold text-red-600">{metricas.conversas_abertas}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Em Atendimento</p>
                  <p className="text-2xl font-bold text-blue-600">{metricas.conversas_em_atendimento}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-400" title="Tempo médio de resposta aos clientes (últimos 7 dias)">
                    Tempo Médio
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoadingStats ? (
                      <span className="animate-pulse">Calculando...</span>
                    ) : (
                      metricas.tempo_resposta_medio
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">Resposta aos clientes</p>
                    {stats?.amostrasTempoResposta !== undefined && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        stats.amostrasTempoResposta > 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {stats.amostrasTempoResposta > 0 
                          ? `${stats.amostrasTempoResposta} amostras` 
                          : 'Estimativa'
                        }
                      </span>
                    )}
                  </div>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Mensagens Hoje</p>
                  <p className="text-2xl font-bold text-purple-600">{metricas.mensagens_hoje}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-orange-600">{metricas.clientes_ativos}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interface Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px] max-h-[calc(100vh-400px)]">
        {/* Lista de Conversas */}
        <Card className="lg:col-span-1 flex flex-col dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg dark:text-gray-100">Conversas</CardTitle>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Filtros e Busca */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou telefone..." 
                  className="pl-8"
                  value={buscaConversa}
                  onChange={(e) => setBuscaConversa(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant={filterStatus === 'todos' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilterStatus('todos')}
                >
                  Todos
                </Button>
                <Button 
                  variant={filterStatus === 'ativa' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilterStatus('ativa')}
                >
                  Ativas
                </Button>
                <Button 
                  variant={filterStatus === 'em_atendimento' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilterStatus('em_atendimento')}
                >
                  Em Atendimento
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[400px]">
              {conversasLoading ? (
                <div className="p-4 text-center text-muted-foreground dark:text-gray-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Carregando conversas...
                </div>
              ) : conversasFiltradas.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground dark:text-gray-400">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhuma conversa encontrada
                </div>
              ) : (
                conversasFiltradas.map((conversa) => (
                <div 
                  key={conversa.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    conversaSelecionada === conversa.id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' 
                      : 'dark:border-gray-700'
                  }`}
                  onClick={() => setConversaSelecionada(conversa.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {(conversa.cliente?.nome || conversa.cliente_nome) 
                            ? getInitials(conversa.cliente?.nome || conversa.cliente_nome) 
                            : 'WA'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">{conversa.cliente?.nome || conversa.cliente_nome || 'Cliente WhatsApp'}</h4>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">{formatPhone(conversa.cliente_telefone)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <div 
                        className={`w-2 h-2 rounded-full ${getPrioridadeColor(conversa.prioridade)}`}
                        title={`Prioridade: ${conversa.prioridade}`}
                      />
                      {conversa.nao_lidas > 0 && (
                        <Badge variant="destructive" className="text-xs px-2">
                          {conversa.nao_lidas}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate mb-2">
                    {conversa.ultima_mensagem}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(conversa.status)}`}
                    >
                      {conversa.status.replace('_', ' ')}
                    </Badge>
                    {conversa.atendente && (
                      <p className="text-xs text-blue-600 mt-1">
                        Atendente: {conversa.atendente.nome}
                      </p>
                    )}
                  </div>

                  {conversa.status === 'aguardando' && (
                    <Button 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        assumirAtendimento(conversa.id);
                      }}
                    >
                      Assumir Atendimento
                    </Button>
                  )}
                </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área de Chat */}
        <Card className="lg:col-span-2 flex flex-col dark:bg-gray-800 dark:border-gray-700">
          {conversaSelecionada ? (
            <div className="flex flex-col h-full max-h-[600px]">
              {/* Header do Chat */}
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {(() => {
                          const conversa = conversas.find(c => c.id === conversaSelecionada);
                          const nome = conversa?.cliente?.nome || conversa?.cliente_nome;
                          return nome ? getInitials(nome) : 'WA';
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {(() => {
                          const conversa = conversas.find(c => c.id === conversaSelecionada);
                          return conversa?.cliente?.nome || conversa?.cliente_nome || 'Cliente WhatsApp';
                        })()}
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        {formatPhone(conversas.find(c => c.id === conversaSelecionada)?.cliente_telefone)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Área de Mensagens */}
              <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-full max-h-[320px]">
                  <div className="space-y-4">
                    {(() => {
                      const mensagensFiltradas = mensagens.filter(msg => msg.conversa_id === conversaSelecionada);
                      
                      return mensagensFiltradas.length === 0 ? (
                        <div className="text-center text-muted-foreground dark:text-gray-400 py-8">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma mensagem nesta conversa</p>
                        </div>
                      ) : (
                        mensagensFiltradas.map((mensagem) => (
                        <div 
                          key={mensagem.id}
                          className={`flex items-start gap-2 ${
                            mensagem.remetente_tipo === 'atendente' ? 'justify-end' : ''
                          }`}
                        >
                          {mensagem.remetente_tipo === 'cliente' && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                {mensagem.remetente_nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`rounded-lg p-3 max-w-[70%] ${
                            mensagem.remetente_tipo === 'atendente' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-100'
                          }`}>
                            <p className="text-sm">{mensagem.conteudo}</p>
                            <div className={`flex items-center gap-1 mt-1 ${
                              mensagem.remetente_tipo === 'atendente' ? 'justify-end' : ''
                            }`}>
                              <span className={`text-xs ${
                                mensagem.remetente_tipo === 'atendente' 
                                  ? 'text-white opacity-70' 
                                  : 'text-muted-foreground dark:text-gray-300'
                              }`}>
                                {new Date(mensagem.timestamp).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              {mensagem.remetente_tipo === 'atendente' && (
                                <CheckCheck className="h-3 w-3 text-white opacity-70" />
                              )}
                            </div>
                          </div>
                          
                          {mensagem.remetente_tipo === 'atendente' && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                VC
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )))
                    })()}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input de Nova Mensagem */}
              <div className="p-4 border-t flex-shrink-0">
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Digite sua mensagem..."
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        enviarMensagem();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline">
                      📎
                    </Button>
                    <Button 
                      size="sm"
                      onClick={enviarMensagem}
                      disabled={!novaMensagem.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Templates Rápidos */}
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNovaMensagem('Olá! Como posso ajudá-lo hoje?')}
                  >
                    Saudação
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNovaMensagem('Vou preparar seu orçamento e retorno em breve!')}
                  >
                    Orçamento
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNovaMensagem('Seu pedido está pronto para retirada!')}
                  >
                    Pronto
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <CardContent className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 dark:text-gray-200">Selecione uma conversa</h3>
                <p className="text-muted-foreground dark:text-gray-400">
                  Escolha uma conversa da lista para começar o atendimento
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

        {/* Tabs para funcionalidades extras */}
        <div className="mt-8">
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="automacao">Automação</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Resposta</CardTitle>
                <CardDescription>
                  Configure mensagens pré-definidas para agilizar o atendimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <h4 className="font-medium mb-1">Saudação Automática</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Olá! Bem-vindo à nossa farmácia...
                        </p>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <h4 className="font-medium mb-1">Solicitação Orçamento</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Vou analisar sua receita e preparar...
                        </p>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <h4 className="font-medium mb-1">Pedido Pronto</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Seu pedido está pronto para retirada...
                        </p>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-4">
                  <Button>
                    + Criar Novo Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="automacao" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Automação Inteligente</CardTitle>
                <CardDescription>
                  Configure respostas automáticas e fluxos de atendimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Resposta Automática - Horário Comercial</h4>
                      <p className="text-sm text-muted-foreground">
                        Enviar mensagem automática fora do horário de funcionamento
                      </p>
                    </div>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">IA para Triagem</h4>
                      <p className="text-sm text-muted-foreground">
                        Usar IA para classificar automaticamente as mensagens
                      </p>
                    </div>
                    <Button variant="outline">
                      <Bot className="h-4 w-4 mr-2" />
                      Ativar IA
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Notificações Push</h4>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações de novas mensagens
                      </p>
                    </div>
                    <Button variant="outline">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="relatorios" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Atendimento</CardTitle>
                <CardDescription>
                  Análise detalhada do desempenho do atendimento via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Resumo do Dia</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Conversas Iniciadas:</span>
                        <span className="font-medium">23</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Conversas Finalizadas:</span>
                        <span className="font-medium">18</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tempo Médio de Resposta:</span>
                        <span className="font-medium">2.5 min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Satisfação do Cliente:</span>
                        <span className="font-medium">4.8/5.0</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Top Atendentes</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">AF</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">Ana Farmacêutica</span>
                        </div>
                        <span className="text-sm font-medium">12 atendimentos</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">BS</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">Bruno Silva</span>
                        </div>
                        <span className="text-sm font-medium">8 atendimentos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="configuracoes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do WhatsApp</CardTitle>
                <CardDescription>
                  Configure a integração e preferências do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Webhook Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">URL do Webhook</label>
                        <Input 
                          value={whatsappConfig.webhookFullUrl}
                          readOnly
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Token de Verificação</label>
                        <Input 
                          value={whatsappConfig.webhookToken}
                          readOnly
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-3">Horário de Atendimento</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Horário de Início</label>
                        <Input type="time" defaultValue={businessHours.start} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Horário de Término</label>
                        <Input type="time" defaultValue={businessHours.end} className="mt-1" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-3">Integrações</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">N8N Workflow</p>
                          <p className="text-sm text-muted-foreground">Conectar com automação N8N</p>
                        </div>
                        <Button variant="outline">Configurar</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Meta Business API</p>
                          <p className="text-sm text-muted-foreground">Integração oficial do WhatsApp</p>
                        </div>
                        <Button variant="outline">Conectar</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
                 </Tabs>
       </div>
      </div>
     </AdminLayout>
  );
};

export default WhatsAppDashboard; 