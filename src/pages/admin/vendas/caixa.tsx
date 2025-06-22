import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calculator, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  TrendingUp, 
  TrendingDown,
  Clock,
  User,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  PiggyBank
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
import AdminLayout from '@/components/layouts/AdminLayout';

interface CaixaStatus {
  id?: string;
  data_abertura: string;
  data_fechamento?: string;
  usuario_abertura: string;
  usuario_fechamento?: string;
  valor_inicial: number;
  valor_final?: number;
  valor_vendas: number;
  valor_sangrias: number;
  valor_suprimentos: number;
  valor_calculado: number;
  status: 'aberto' | 'fechado';
  observacoes_abertura?: string;
  observacoes_fechamento?: string;
}

interface MovimentoCaixa {
  id: string;
  tipo: 'sangria' | 'suprimento';
  valor: number;
  descricao: string;
  usuario: string;
  data_movimento: string;
}

interface ResumoVendas {
  total_vendas: number;
  vendas_dinheiro: number;
  vendas_cartao: number;
  vendas_pix: number;
  vendas_outros: number;
  quantidade_vendas: number;
}

export default function ControleCaixa() {
  const [caixaAtual, setCaixaAtual] = useState<CaixaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [resumoVendas, setResumoVendas] = useState<ResumoVendas | null>(null);
  
  // Estados para abertura de caixa
  const [aberturaOpen, setAberturaOpen] = useState(false);
  const [valorInicialAbertura, setValorInicialAbertura] = useState('');
  const [observacoesAbertura, setObservacoesAbertura] = useState('');
  
  // Estados para fechamento de caixa
  const [fechamentoOpen, setFechamentoOpen] = useState(false);
  const [valorFinalFechamento, setValorFinalFechamento] = useState('');
  const [observacoesFechamento, setObservacoesFechamento] = useState('');
  
  // Estados para movimento de caixa
  const [movimentoOpen, setMovimentoOpen] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState<'sangria' | 'suprimento'>('sangria');
  const [valorMovimento, setValorMovimento] = useState('');
  const [descricaoMovimento, setDescricaoMovimento] = useState('');

  const { usuario } = useAuthSimple();
  const { toast } = useToast();

  useEffect(() => {
    loadCaixaStatus();
  }, []);

  const loadCaixaStatus = async () => {
    try {
      setLoading(true);
      
      // Mock de dados para demonstração
      const mockCaixa: CaixaStatus = {
        id: '1',
        data_abertura: new Date().toISOString(),
        usuario_abertura: usuario?.email || 'Usuario',
        valor_inicial: 200.00,
        valor_vendas: 1500.50,
        valor_sangrias: 300.00,
        valor_suprimentos: 100.00,
        valor_calculado: 1500.50,
        status: 'aberto',
        observacoes_abertura: 'Abertura normal do caixa'
      };
      
      setCaixaAtual(mockCaixa);
      
      // Mock de movimentos
      setMovimentos([
        {
          id: '1',
          tipo: 'sangria',
          valor: 200.00,
          descricao: 'Troco para posto de gasolina',
          usuario: usuario?.email || 'Usuario',
          data_movimento: new Date().toISOString()
        },
        {
          id: '2',
          tipo: 'suprimento',
          valor: 50.00,
          descricao: 'Dinheiro adicional',
          usuario: usuario?.email || 'Usuario',
          data_movimento: new Date().toISOString()
        }
      ]);
      
      // Mock de resumo de vendas
      setResumoVendas({
        total_vendas: 1500.50,
        vendas_dinheiro: 800.00,
        vendas_cartao: 500.50,
        vendas_pix: 200.00,
        vendas_outros: 0.00,
        quantidade_vendas: 15
      });
      
    } catch (error) {
      console.error('Erro ao carregar status do caixa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar informações do caixa',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarDinheiro = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handleAbrirCaixa = async () => {
    try {
      if (!valorInicialAbertura || Number(valorInicialAbertura) <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor inicial válido',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Caixa aberto com sucesso'
      });

      setAberturaOpen(false);
      setValorInicialAbertura('');
      setObservacoesAbertura('');
      loadCaixaStatus();

    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao abrir caixa',
        variant: 'destructive'
      });
    }
  };

  const handleFecharCaixa = async () => {
    try {
      if (!valorFinalFechamento || Number(valorFinalFechamento) <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor final válido',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Caixa fechado com sucesso'
      });

      setFechamentoOpen(false);
      setValorFinalFechamento('');
      setObservacoesFechamento('');
      loadCaixaStatus();

    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fechar caixa',
        variant: 'destructive'
      });
    }
  };

  const handleMovimentoCaixa = async () => {
    try {
      if (!valorMovimento || Number(valorMovimento) <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido',
          variant: 'destructive'
        });
        return;
      }

      if (!descricaoMovimento.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe a descrição do movimento',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: `${tipoMovimento === 'sangria' ? 'Sangria' : 'Suprimento'} registrado com sucesso`
      });

      setMovimentoOpen(false);
      setValorMovimento('');
      setDescricaoMovimento('');
      loadCaixaStatus();

    } catch (error) {
      console.error('Erro ao registrar movimento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao registrar movimento',
        variant: 'destructive'
      });
    }
  };

  const valorAtualCaixa = caixaAtual 
    ? caixaAtual.valor_inicial + caixaAtual.valor_vendas - caixaAtual.valor_sangrias + caixaAtual.valor_suprimentos
    : 0;

  const diferenca = caixaAtual && valorFinalFechamento 
    ? Number(valorFinalFechamento) - valorAtualCaixa 
    : 0;

  // Métricas do caixa
  const caixaMetrics = [
    {
      label: 'Valor Atual',
      value: loading ? '-' : formatarDinheiro(valorAtualCaixa),
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-green-600',
      isLoading: loading
    },
    {
      label: 'Vendas do Dia',
      value: loading ? '-' : formatarDinheiro(resumoVendas?.total_vendas || 0),
      change: `${resumoVendas?.quantidade_vendas || 0} vendas`,
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-blue-600',
      isLoading: loading
    },
    {
      label: 'Sangrias',
      value: loading ? '-' : formatarDinheiro(caixaAtual?.valor_sangrias || 0),
      change: '-5.2%',
      trend: 'down' as const,
      icon: TrendingDown,
      color: 'text-red-600',
      isLoading: loading
    },
    {
      label: 'Suprimentos',
      value: loading ? '-' : formatarDinheiro(caixaAtual?.valor_suprimentos || 0),
      change: '+8.1%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-purple-600',
      isLoading: loading
    }
  ];

  return (
    <AdminLayout>
      <div>
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 dark:from-orange-950/20 dark:via-yellow-950/20 dark:to-amber-950/20" />
          <div className="relative px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-10 w-10 text-orange-600" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      Controle de Caixa
                    </h1>
                    {caixaAtual && (
                      <Badge 
                        variant={caixaAtual.status === 'aberto' ? 'default' : 'secondary'}
                        className="ml-4"
                      >
                        {caixaAtual.status === 'aberto' ? 'Caixa Aberto' : 'Caixa Fechado'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xl text-muted-foreground">
                    Gerencie a abertura, fechamento e movimentações do caixa com controle 
                    total sobre valores, sangrias e suprimentos em tempo real.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 blur-3xl opacity-20" />
                    <PiggyBank className="h-48 w-48 text-orange-600/20" />
                  </div>
                </div>
              </div>

              {/* Status e Ações Rápidas */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                {caixaAtual?.status === 'fechado' && (
                  <Dialog open={aberturaOpen} onOpenChange={setAberturaOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="h-12 px-8">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Abrir Caixa
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Abrir Caixa</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="valor-inicial">Valor Inicial</Label>
                          <Input
                            id="valor-inicial"
                            type="number"
                            placeholder="0,00"
                            value={valorInicialAbertura}
                            onChange={(e) => setValorInicialAbertura(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="observacoes-abertura">Observações</Label>
                          <Textarea
                            id="observacoes-abertura"
                            placeholder="Observações sobre a abertura do caixa..."
                            value={observacoesAbertura}
                            onChange={(e) => setObservacoesAbertura(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleAbrirCaixa} className="w-full">
                          Confirmar Abertura
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {caixaAtual?.status === 'aberto' && (
                  <>
                    <Dialog open={movimentoOpen} onOpenChange={setMovimentoOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="lg" className="h-12 px-8">
                          <Calculator className="h-5 w-5 mr-2" />
                          Movimento
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Movimento de Caixa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant={tipoMovimento === 'sangria' ? 'default' : 'outline'}
                              onClick={() => setTipoMovimento('sangria')}
                            >
                              <Minus className="h-4 w-4 mr-2" />
                              Sangria
                            </Button>
                            <Button
                              variant={tipoMovimento === 'suprimento' ? 'default' : 'outline'}
                              onClick={() => setTipoMovimento('suprimento')}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Suprimento
                            </Button>
                          </div>
                          <div>
                            <Label htmlFor="valor-movimento">Valor</Label>
                            <Input
                              id="valor-movimento"
                              type="number"
                              placeholder="0,00"
                              value={valorMovimento}
                              onChange={(e) => setValorMovimento(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="descricao-movimento">Descrição</Label>
                            <Textarea
                              id="descricao-movimento"
                              placeholder="Descreva o motivo do movimento..."
                              value={descricaoMovimento}
                              onChange={(e) => setDescricaoMovimento(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleMovimentoCaixa} className="w-full">
                            Confirmar {tipoMovimento === 'sangria' ? 'Sangria' : 'Suprimento'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={fechamentoOpen} onOpenChange={setFechamentoOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="lg" className="h-12 px-8">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Fechar Caixa
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Fechar Caixa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Valor esperado no caixa: {formatarDinheiro(valorAtualCaixa)}
                            </AlertDescription>
                          </Alert>
                          <div>
                            <Label htmlFor="valor-final">Valor Contado</Label>
                            <Input
                              id="valor-final"
                              type="number"
                              placeholder="0,00"
                              value={valorFinalFechamento}
                              onChange={(e) => setValorFinalFechamento(e.target.value)}
                            />
                            {valorFinalFechamento && (
                              <p className={`text-sm mt-1 ${diferenca === 0 ? 'text-green-600' : diferenca > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                Diferença: {formatarDinheiro(diferenca)}
                                {diferenca > 0 ? ' (sobra)' : diferenca < 0 ? ' (falta)' : ' (confere)'}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="observacoes-fechamento">Observações</Label>
                            <Textarea
                              id="observacoes-fechamento"
                              placeholder="Observações sobre o fechamento..."
                              value={observacoesFechamento}
                              onChange={(e) => setObservacoesFechamento(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleFecharCaixa} className="w-full" variant="destructive">
                            Confirmar Fechamento
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {caixaMetrics.map((metric, index) => {
                  const IconComponent = metric.icon;
                  return (
                    <Card key={index} className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                          <IconComponent className={`h-4 w-4 ${metric.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-end justify-between">
                          {metric.isLoading ? (
                            <Skeleton className="h-6 w-24" />
                          ) : (
                            <span className="text-2xl font-bold">{metric.value}</span>
                          )}
                          <span className={`text-sm font-medium ${
                            metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.change}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="px-6 pb-16">
          <div className="mx-auto max-w-7xl space-y-8">
            {caixaAtual?.status === 'aberto' && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Resumo do Caixa - 2/3 da largura */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Resumo Financeiro */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Resumo Financeiro
                      </CardTitle>
                      <CardDescription>
                        Status atual do caixa desde a abertura
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatarDinheiro(caixaAtual?.valor_inicial || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Valor Inicial</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {formatarDinheiro(resumoVendas?.total_vendas || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Vendas</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {formatarDinheiro(caixaAtual?.valor_sangrias || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Sangrias</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {formatarDinheiro(caixaAtual?.valor_suprimentos || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Suprimentos</div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-orange-600">
                            {formatarDinheiro(valorAtualCaixa)}
                          </div>
                          <div className="text-lg text-muted-foreground">Valor Atual no Caixa</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vendas por Forma de Pagamento */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Banknote className="h-5 w-5" />
                        Vendas por Forma de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Dinheiro</span>
                            <span className="text-sm text-muted-foreground">
                              {formatarDinheiro(resumoVendas?.vendas_dinheiro || 0)}
                            </span>
                          </div>
                          <Progress 
                            value={resumoVendas?.total_vendas ? (resumoVendas.vendas_dinheiro / resumoVendas.total_vendas) * 100 : 0} 
                            className="h-2" 
                            indicatorColor="bg-emerald-500"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Cartão</span>
                            <span className="text-sm text-muted-foreground">
                              {formatarDinheiro(resumoVendas?.vendas_cartao || 0)}
                            </span>
                          </div>
                          <Progress 
                            value={resumoVendas?.total_vendas ? (resumoVendas.vendas_cartao / resumoVendas.total_vendas) * 100 : 0} 
                            className="h-2" 
                            indicatorColor="bg-blue-500"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">PIX</span>
                            <span className="text-sm text-muted-foreground">
                              {formatarDinheiro(resumoVendas?.vendas_pix || 0)}
                            </span>
                          </div>
                          <Progress 
                            value={resumoVendas?.total_vendas ? (resumoVendas.vendas_pix / resumoVendas.total_vendas) * 100 : 0} 
                            className="h-2" 
                            indicatorColor="bg-purple-500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar - 1/3 da largura */}
                <div className="space-y-6">
                  {/* Informações do Caixa */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações do Caixa
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Aberto por:</span>
                        <span className="text-sm font-medium">{caixaAtual?.usuario_abertura}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Data/Hora:</span>
                        <span className="text-sm font-medium">
                          {format(new Date(caixaAtual?.data_abertura || ''), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={caixaAtual?.status === 'aberto' ? 'default' : 'secondary'}>
                          {caixaAtual?.status === 'aberto' ? 'Aberto' : 'Fechado'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Últimos Movimentos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Últimos Movimentos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {loading ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))
                        ) : movimentos.slice(-3).map((movimento) => (
                          <div key={movimento.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {movimento.tipo === 'sangria' ? (
                                    <Minus className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <Plus className="h-4 w-4 text-green-500" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {movimento.tipo === 'sangria' ? 'Sangria' : 'Suprimento'}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {movimento.descricao}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(movimento.data_movimento), 'HH:mm', { locale: ptBR })}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold ${
                                  movimento.tipo === 'sangria' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {movimento.tipo === 'sangria' ? '-' : '+'}
                                  {formatarDinheiro(movimento.valor)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Insights */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <Sparkles className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Insights do Caixa</CardTitle>
                    <CardDescription>
                      Análise baseada no movimento do dia atual
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Eficiência de Vendas</span>
                      <span className="text-sm text-muted-foreground">85%</span>
                    </div>
                    <Progress value={85} className="h-2" indicatorColor="bg-emerald-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Controle de Movimento</span>
                      <span className="text-sm text-muted-foreground">92%</span>
                    </div>
                    <Progress value={92} className="h-2" indicatorColor="bg-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Acuracidade do Caixa</span>
                      <span className="text-sm text-muted-foreground">98%</span>
                    </div>
                    <Progress value={98} className="h-2" indicatorColor="bg-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 