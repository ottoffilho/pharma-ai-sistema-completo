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
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import useCaixa from '@/hooks/useCaixa';

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
  // Usar o hook customizado
  const {
    caixaAtivo, // Usaremos este como a fonte de verdade principal
    isCaixaAberto,
    isLoading: isCaixaHookLoading,
    abrirCaixa,
    fecharCaixa,
    registrarSangria,
    registrarSuprimento,
    isAbrindoCaixa,
    isFechandoCaixa,
    isRegistrandoMovimento
  } = useCaixa();

  // Estados para dados que ainda não vêm do hook
  const [loading, setLoading] = useState(true);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [resumoVendas, setResumoVendas] = useState<ResumoVendas | null>(null);
  
  // Estados para abertura de caixa
  const [aberturaOpen, setAberturaOpen] = useState(false);
  const [valorInicialAbertura, setValorInicialAbertura] = useState('0');
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
      
      // 1. Buscar caixa aberto atual
      const { data: caixaAberto, error: caixaError } = await supabase
        .from('abertura_caixa')
        .select(`
          id,
          data_abertura,
          valor_inicial,
          observacoes,
          ativo,
          data_fechamento,
          valor_final,
          total_vendas,
          total_sangrias,
          total_suprimentos,
          valor_esperado,
          diferenca,
          observacoes_fechamento,
          usuario_id,
          usuario_fechamento
        `)
        .eq('ativo', true)
        .order('data_abertura', { ascending: false })
        .limit(1);

      if (caixaError && caixaError.code !== 'PGRST116') {
        throw caixaError;
      }

      const caixaAtivo = caixaAberto && caixaAberto.length > 0 ? caixaAberto[0] : null;

      if (caixaAtivo) {
        // 2. Buscar dados dos usuários de abertura e fechamento
        let usuarioAbertura = null;
        let usuarioFechamento = null;

        if (caixaAtivo.usuario_id) {
          const { data: userAbertura } = await supabase
            .from('usuarios')
            .select('nome_completo, email')
            .eq('id', caixaAtivo.usuario_id)
            .single();
          usuarioAbertura = userAbertura;
        }

        if (caixaAtivo.usuario_fechamento) {
          const { data: userFechamento } = await supabase
            .from('usuarios')
            .select('nome_completo, email')
            .eq('id', caixaAtivo.usuario_fechamento)
            .single();
          usuarioFechamento = userFechamento;
        }

        // 3. Calcular vendas do dia atual
        const hoje = new Date().toISOString().split('T')[0];
        const { data: vendasHoje, error: vendasError } = await supabase
          .from('vendas')
          .select('total, status')
          .gte('data_venda', `${hoje}T00:00:00.000Z`)
          .lt('data_venda', `${hoje}T23:59:59.999Z`)
          .eq('status', 'finalizada');

        if (vendasError) {
          console.warn('Erro ao buscar vendas:', vendasError);
        }

        // 4. Calcular vendas por forma de pagamento
        const { data: pagamentosHoje, error: pagamentosError } = await supabase
          .from('pagamentos_venda')
          .select('forma_pagamento, valor')
          .gte('data_pagamento', `${hoje}T00:00:00.000Z`)
          .lt('data_pagamento', `${hoje}T23:59:59.999Z`);

        if (pagamentosError) {
          console.warn('Erro ao buscar pagamentos:', pagamentosError);
        }

        // 5. Buscar movimentações do caixa (apenas se houver caixa ativo)
        let movimentacoes = [];
        let movError = null;

        if (caixaAtivo && caixaAtivo.data_abertura) {
          // Tentar primeiro com movimentacoes_caixa
          try {
            const { data, error } = await supabase
              .from('movimentacoes_caixa')
              .select(`
                id,
                data_movimentacao,
                tipo_movimentacao,
                descricao,
                valor,
                observacoes,
                usuario_id,
                usuarios(nome_completo, email)
              `)
              .gte('data_movimentacao', caixaAtivo.data_abertura)
              .eq('is_deleted', false)
              .order('data_movimentacao', { ascending: false });

            if (!error) {
              movimentacoes = data || [];
            } else if (error.code === 'PGRST116') {
              // Tabela movimentacoes_caixa não existe, tentar movimentos_caixa
              const { data: data2, error: error2 } = await supabase
                .from('movimentos_caixa')
                .select(`
                  id,
                  created_at,
                  tipo,
                  descricao,
                  valor,
                  usuarios(nome_completo, email)
                `)
                .gte('created_at', caixaAtivo.data_abertura)
                .order('created_at', { ascending: false });

              if (!error2) {
                // Mapear para estrutura esperada
                movimentacoes = data2?.map(m => ({
                  id: m.id,
                  data_movimentacao: m.created_at,
                  tipo_movimentacao: m.tipo,
                  descricao: m.descricao,
                  valor: m.valor,
                  usuarios: m.usuarios
                })) || [];
              } else {
                movError = error2;
              }
            } else {
              movError = error;
            }
          } catch (e) {
            console.warn('Erro ao buscar movimentações:', e);
            movimentacoes = [];
          }

          if (movError) {
            console.warn('Erro ao buscar movimentações:', movError);
          }
        }

        // Processar dados
        const totalVendas = vendasHoje?.reduce((sum, v) => sum + Number(v.total), 0) || 0;
        const quantidadeVendas = vendasHoje?.length || 0;

        // Calcular vendas por forma de pagamento
        const vendasDinheiro = pagamentosHoje
          ?.filter(p => p.forma_pagamento === 'dinheiro')
          .reduce((sum, p) => sum + Number(p.valor), 0) || 0;
        
        const vendasCartao = pagamentosHoje
          ?.filter(p => ['cartao_debito', 'cartao_credito'].includes(p.forma_pagamento))
          .reduce((sum, p) => sum + Number(p.valor), 0) || 0;
        
        const vendasPix = pagamentosHoje
          ?.filter(p => p.forma_pagamento === 'pix')
          .reduce((sum, p) => sum + Number(p.valor), 0) || 0;

        // Calcular sangrias e suprimentos
        const totalSangrias = movimentacoes
          ?.filter(m => m.tipo_movimentacao === 'sangria')
          .reduce((sum, m) => sum + Number(m.valor), 0) || 0;
        
        const totalSuprimentos = movimentacoes
          ?.filter(m => m.tipo_movimentacao === 'suprimento')
          .reduce((sum, m) => sum + Number(m.valor), 0) || 0;

        // Montar objeto do caixa
        const caixaStatus: CaixaStatus = {
          id: caixaAtivo.id,
          data_abertura: caixaAtivo.data_abertura,
          data_fechamento: caixaAtivo.data_fechamento,
          usuario_abertura: usuarioAbertura?.nome_completo || usuarioAbertura?.email || 'Usuário',
          usuario_fechamento: usuarioFechamento?.nome_completo || usuarioFechamento?.email,
          valor_inicial: Number(caixaAtivo.valor_inicial),
          valor_final: caixaAtivo.valor_final ? Number(caixaAtivo.valor_final) : undefined,
          valor_vendas: totalVendas,
          valor_sangrias: totalSangrias,
          valor_suprimentos: totalSuprimentos,
          valor_calculado: Number(caixaAtivo.valor_inicial) + totalVendas - totalSangrias + totalSuprimentos,
          status: caixaAtivo.ativo ? 'aberto' : 'fechado',
          observacoes_abertura: caixaAtivo.observacoes,
          observacoes_fechamento: caixaAtivo.observacoes_fechamento
        };

        // Resumo de vendas
        setResumoVendas({
          total_vendas: totalVendas,
          vendas_dinheiro: vendasDinheiro,
          vendas_cartao: vendasCartao,
          vendas_pix: vendasPix,
          vendas_outros: totalVendas - vendasDinheiro - vendasCartao - vendasPix,
          quantidade_vendas: quantidadeVendas
        });

        // Movimentos formatados
        const movimentosFormatados: MovimentoCaixa[] = movimentacoes?.map(m => ({
          id: m.id,
          tipo: m.tipo_movimentacao as 'sangria' | 'suprimento',
          valor: Number(m.valor),
          descricao: m.descricao,
          usuario: m.usuarios?.nome_completo || m.usuarios?.email || 'Usuário',
          data_movimento: m.data_movimentacao
        })) || [];

        setMovimentos(movimentosFormatados);

      } else {
        // Não há caixa aberto
        setResumoVendas({
          total_vendas: 0,
          vendas_dinheiro: 0,
          vendas_cartao: 0,
          vendas_pix: 0,
          vendas_outros: 0,
          quantidade_vendas: 0
        });

        setMovimentos([]);
      }
      
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
    if (!valorInicialAbertura || Number(valorInicialAbertura) <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe um valor inicial válido',
        variant: 'destructive'
      });
      return;
    }

    if (!usuario) {
      toast({
        title: 'Erro',
        description: 'Usuário não identificado',
        variant: 'destructive'
      });
      return;
    }

    // Usar o hook para abrir caixa via Edge Function
    abrirCaixa({
      valor_inicial: Number(valorInicialAbertura),
      observacoes: observacoesAbertura || undefined
    });

    // Limpar formulário se sucesso (o toast já é tratado pelo hook)
    setAberturaOpen(false);
    setValorInicialAbertura('');
    setObservacoesAbertura('');
    
    // Recarregar dados complementares
    loadCaixaStatus();
  };

  const handleFecharCaixa = async () => {
    if (!valorFinalFechamento || Number(valorFinalFechamento) <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe um valor final válido',
        variant: 'destructive'
      });
      return;
    }

    if (!caixaAtivo?.id) {
      toast({
        title: 'Erro',
        description: 'Caixa não identificado',
        variant: 'destructive'
      });
      return;
    }

    if (!usuario) {
      toast({
        title: 'Erro',
        description: 'Usuário não identificado',
        variant: 'destructive'
      });
      return;
    }

    // Usar o hook para fechar caixa via Edge Function
    fecharCaixa({
      caixa_id: caixaAtivo.id,
      valor_final: Number(valorFinalFechamento),
      observacoes: observacoesFechamento || undefined
    });

    // Limpar formulário se sucesso (o toast já é tratado pelo hook)
    setFechamentoOpen(false);
    setValorFinalFechamento('');
    setObservacoesFechamento('');
    
    // Recarregar dados complementares
    loadCaixaStatus();
  };

  const handleMovimentoCaixa = async () => {
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

    if (!usuario) {
      toast({
        title: 'Erro',
        description: 'Usuário não identificado',
        variant: 'destructive'
      });
      return;
    }

    // Usar o hook para registrar movimento via service
    if (tipoMovimento === 'sangria') {
      registrarSangria(Number(valorMovimento), descricaoMovimento);
    } else {
      registrarSuprimento(Number(valorMovimento), descricaoMovimento);
    }

    // Limpar formulário se sucesso (o toast já é tratado pelo hook)
    setMovimentoOpen(false);
    setValorMovimento('');
    setDescricaoMovimento('');
    
    // Recarregar dados complementares
    loadCaixaStatus();
  };

  const valorAtualCaixa = isCaixaAberto && caixaAtivo && resumoVendas
    ? caixaAtivo.valor_inicial + resumoVendas.total_vendas - (movimentos.filter(m => m.tipo === 'sangria').reduce((sum, m) => sum + m.valor, 0)) + (movimentos.filter(m => m.tipo === 'suprimento').reduce((sum, m) => sum + m.valor, 0))
    : 0;

  const diferenca = isCaixaAberto && caixaAtivo && valorFinalFechamento
    ? Number(valorFinalFechamento) - valorAtualCaixa
    : 0;

  // Métricas do caixa
  const caixaMetrics = [
    {
      label: 'Valor Atual',
      value: isCaixaHookLoading ? '-' : formatarDinheiro(valorAtualCaixa),
      change: isCaixaAberto ? 'Caixa Aberto' : 'Caixa Fechado',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-green-600',
      isLoading: isCaixaHookLoading
    },
    {
      label: 'Vendas do Dia',
      value: isCaixaHookLoading ? '-' : formatarDinheiro(resumoVendas?.total_vendas || 0),
      change: `${resumoVendas?.quantidade_vendas || 0} vendas`,
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-blue-600',
      isLoading: isCaixaHookLoading
    },
    {
      label: 'Sangrias',
      value: isCaixaHookLoading ? '-' : formatarDinheiro(movimentos.filter(m => m.tipo === 'sangria').reduce((sum, m) => sum + m.valor, 0)),
      change: movimentos.filter(m => m.tipo === 'sangria').length + ' movimentos',
      trend: 'down' as const,
      icon: TrendingDown,
      color: 'text-red-600',
      isLoading: isCaixaHookLoading
    },
    {
      label: 'Suprimentos',
      value: isCaixaHookLoading ? '-' : formatarDinheiro(movimentos.filter(m => m.tipo === 'suprimento').reduce((sum, m) => sum + m.valor, 0)),
      change: movimentos.filter(m => m.tipo === 'suprimento').length + ' movimentos',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-purple-600',
      isLoading: isCaixaHookLoading
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
                    {caixaAtivo && (
                      <Badge 
                        variant={isCaixaAberto ? 'default' : 'secondary'}
                        className="ml-4"
                      >
                        {isCaixaAberto ? 'Caixa Aberto' : 'Caixa Fechado'}
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
                {!isCaixaAberto && (
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

                {isCaixaAberto && (
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
            {isCaixaAberto && (
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
                            {formatarDinheiro(caixaAtivo?.valor_inicial || 0)}
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
                            {formatarDinheiro(movimentos.filter(m => m.tipo === 'sangria').reduce((sum, m) => sum + m.valor, 0))}
                          </div>
                          <div className="text-sm text-muted-foreground">Sangrias</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {formatarDinheiro(movimentos.filter(m => m.tipo === 'suprimento').reduce((sum, m) => sum + m.valor, 0))}
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
                        <span className="text-sm font-medium">{caixaAtivo?.usuario?.nome || 'Usuário'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Data/Hora:</span>
                        <span className="text-sm font-medium">
                          {caixaAtivo?.data_abertura ? format(new Date(caixaAtivo.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={isCaixaAberto ? 'default' : 'secondary'}>
                          {isCaixaAberto ? 'Aberto' : 'Fechado'}
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
                      <span className="text-sm font-medium">Status do Caixa</span>
                      <span className="text-sm text-muted-foreground">
                        {isCaixaAberto ? 'Operacional' : 'Fechado'}
                      </span>
                    </div>
                    <Progress 
                      value={isCaixaAberto ? 100 : 0} 
                      className="h-2" 
                      indicatorColor={isCaixaAberto ? "bg-emerald-500" : "bg-gray-500"} 
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Movimentações Hoje</span>
                      <span className="text-sm text-muted-foreground">{movimentos.length} movimentos</span>
                    </div>
                    <Progress 
                      value={Math.min(movimentos.length * 10, 100)} 
                      className="h-2" 
                      indicatorColor="bg-blue-500" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Vendas Registradas</span>
                      <span className="text-sm text-muted-foreground">{resumoVendas?.quantidade_vendas || 0} vendas</span>
                    </div>
                    <Progress 
                      value={Math.min((resumoVendas?.quantidade_vendas || 0) * 5, 100)} 
                      className="h-2" 
                      indicatorColor="bg-purple-500" 
                    />
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