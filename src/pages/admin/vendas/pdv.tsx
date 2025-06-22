// =====================================================
// PÁGINA PDV (PONTO DE VENDA) - PHARMA.AI
// Interface moderna e intuitiva para vendas
// =====================================================

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useVendasCards } from '@/hooks/useVendasCards';
import { useClientes } from '@/hooks/useClientes';
import { supabase } from '@/integrations/supabase/client';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator, 
  CreditCard,
  Banknote,
  Smartphone,
  User,
  CheckCircle,
  AlertTriangle,
  Package,
  Percent,
  Receipt,
  X,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Check
} from 'lucide-react';
import { ItemCarrinho, CarrinhoCompras, ClienteVenda, FormaPagamento } from '@/types/vendas';
import { UUID } from '@/types/database';
import { toast } from '@/hooks/use-toast';

// =====================================================
// INTERFACES LOCAIS
// =====================================================

interface ProdutoPDV {
  id: UUID;
  nome: string;
  codigo_interno?: string;
  codigo_ean?: string;
  preco_venda: number;
  estoque_atual: number;
  categoria_nome?: string;
  controlado: boolean;
  requer_receita: boolean;
  forma_farmaceutica_nome?: string;
}

interface PagamentoPDV {
  forma_pagamento: FormaPagamento;
  valor: number;
  numero_autorizacao?: string;
  bandeira_cartao?: string;
  codigo_transacao?: string;
}

// =====================================================
// FUNÇÕES DE BUSCA DE PRODUTOS PARA PDV
// =====================================================

const buscarProdutosPDV = async (termo: string): Promise<ProdutoPDV[]> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        codigo_interno,
        codigo_ean,
        preco_venda,
        estoque_atual,
        controlado,
        requer_receita,
        categoria_produto:categoria_produto_id(nome),
        forma_farmaceutica:forma_farmaceutica_id(nome)
      `)
      .or(`nome.ilike.%${termo}%,codigo_interno.ilike.%${termo}%,codigo_ean.ilike.%${termo}%`)
      .eq('ativo', true)
      .gt('estoque_atual', 0) // Apenas produtos com estoque
      .order('nome')
      .limit(20);

    if (error) {
      throw new Error(error.message);
    }

    return data?.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      codigo_interno: produto.codigo_interno,
      codigo_ean: produto.codigo_ean,
      preco_venda: parseFloat(produto.preco_venda?.toString() || '0'),
      estoque_atual: parseFloat(produto.estoque_atual?.toString() || '0'),
      categoria_nome: produto.categoria_produto?.nome || '',
      controlado: produto.controlado || false,
      requer_receita: produto.requer_receita || false,
      forma_farmaceutica_nome: produto.forma_farmaceutica?.nome || ''
    })) || [];

  } catch (error) {
    console.error('Erro ao buscar produtos PDV:', error);
    throw error;
  }
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function PDVPage() {
  // =====================================================
  // ESTADOS
  // =====================================================
  
  const [carrinho, setCarrinho] = useState<CarrinhoCompras>({
    itens: [],
    subtotal: 0,
    desconto_total: 0,
    total: 0
  });
  
  const [produtos, setProdutos] = useState<ProdutoPDV[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteVenda | null>(null);
  const [pagamentos, setPagamentos] = useState<PagamentoPDV[]>([]);
  const [descontoGeral, setDescontoGeral] = useState({ valor: 0, percentual: 0 });
  const [modalCliente, setModalCliente] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalDesconto, setModalDesconto] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);
  
  // Estados para busca de clientes
  const [termoBuscaCliente, setTermoBuscaCliente] = useState('');
  
  // Estados para controle de caixa
  const [caixaAberto, setCaixaAberto] = useState<any>(null);
  const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false);
  const [valorInicialCaixa, setValorInicialCaixa] = useState('');
  const [observacoesCaixa, setObservacoesCaixa] = useState('');
  
  // Variáveis do ambiente Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Hook para dados das vendas
  const {
    data: vendasData,
    isLoading: isLoadingVendas,
    formatarDinheiro,
    formatarTempo,
    refetch: refetchVendas
  } = useVendasCards();

  // Hook para buscar clientes com filtro
  const { data: clientes = [], isLoading: isLoadingClientes, error: errorClientes } = useClientes({
    busca: termoBuscaCliente,
    ativo: true, // Apenas clientes ativos
    ordem: 'nome',
    direcao: 'asc'
  });

  // Hook alternativo para testar - buscar todos os clientes ativos
  const { data: todosClientes = [], isLoading: loadingTodos } = useClientes({
    ativo: true
  });

  // =====================================================
  // CORREÇÃO DE ACESSIBILIDADE PARA MODAIS
  // =====================================================
  
  useEffect(() => {
    // Função para corrigir aria-hidden em modais abertos
    const fixModalAccessibility = () => {
      const openModals = document.querySelectorAll('[role="dialog"][data-state="open"]');
      openModals.forEach(modal => {
        // Remover aria-hidden="true" de modais abertos
        if (modal.getAttribute('aria-hidden') === 'true') {
          modal.removeAttribute('aria-hidden');
        }
        
        // Garantir que elementos focáveis dentro do modal não tenham aria-hidden
        const focusableElements = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        focusableElements.forEach(element => {
          if (element.getAttribute('aria-hidden') === 'true') {
            element.removeAttribute('aria-hidden');
          }
        });

        // Garantir que o modal tenha foco se não houver elemento focado
        const activeElement = document.activeElement;
        if (!modal.contains(activeElement)) {
          const firstFocusable = modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (firstFocusable && typeof (firstFocusable as HTMLElement).focus === 'function') {
            (firstFocusable as HTMLElement).focus();
          }
        }
      });
    };

    // Executar quando modais abrem/fecham
    if (modalCliente || modalPagamento || modalDesconto) {
      // Múltiplas tentativas para garantir que o Radix UI termine sua renderização
      const timeoutId1 = setTimeout(fixModalAccessibility, 50);
      const timeoutId2 = setTimeout(fixModalAccessibility, 100);
      const timeoutId3 = setTimeout(fixModalAccessibility, 200);
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
      };
    }
  }, [modalCliente, modalPagamento, modalDesconto]);

  // =====================================================
  // FUNÇÕES DE BUSCA
  // =====================================================
  
  const buscarProdutos = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) {
      setProdutos([]);
      return;
    }
    
    setLoading(true);
    try {
      const produtos = await buscarProdutosPDV(termo);
      setProdutos(produtos);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar produtos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // FUNÇÕES DO CLIENTE
  // =====================================================
  
  const selecionarCliente = (cliente: any) => {
    // Transformar cliente para o formato ClienteVenda
    const clienteVenda: ClienteVenda = {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf,
      cnpj: cliente.cnpj,
      documento: cliente.cpf || cliente.cnpj || '',
      telefone: cliente.telefone,
      email: cliente.email,
      endereco: cliente.endereco,
      cidade: cliente.cidade,
      estado: cliente.estado,
      cep: cliente.cep,
      data_nascimento: cliente.data_nascimento,
      created_at: cliente.created_at,
      updated_at: cliente.updated_at
    };
    
    setClienteSelecionado(clienteVenda);
    setModalCliente(false);
    setTermoBuscaCliente('');
    
    toast({
      title: "Cliente selecionado",
      description: `${cliente.nome} foi selecionado para a venda`,
    });
  };

  const removerCliente = () => {
    setClienteSelecionado(null);
    toast({
      title: "Cliente removido",
      description: "Cliente foi removido da venda",
    });
  };

  // =====================================================
  // FUNÇÕES DO CARRINHO
  // =====================================================
  
  const adicionarProduto = (produto: ProdutoPDV) => {
    const itemExistente = carrinho.itens.find(item => item.produto_id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade >= produto.estoque_atual) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${produto.estoque_atual} unidades disponíveis`,
          variant: "destructive"
        });
        return;
      }
      
      atualizarQuantidade(produto.id, itemExistente.quantidade + 1);
    } else {
      if (produto.estoque_atual === 0) {
        toast({
          title: "Produto sem estoque",
          description: "Este produto não possui estoque disponível",
          variant: "destructive"
        });
        return;
      }
      
      const novoItem: ItemCarrinho = {
        produto_id: produto.id,
        produto_nome: produto.nome,
        produto_codigo: produto.codigo_interno,
        quantidade: 1,
        preco_unitario: produto.preco_venda,
        preco_total: produto.preco_venda,
        estoque_disponivel: produto.estoque_atual,
        desconto_valor: 0,
        desconto_percentual: 0
      };
      
      setCarrinho(prev => {
        const novosItens = [...prev.itens, novoItem];
        return calcularTotais(novosItens);
      });
      
      // Atualizar localmente o estoque do produto para refletir a reserva
      setProdutos(prev => prev.map(p => 
        p.id === produto.id 
          ? { ...p, estoque_atual: p.estoque_atual - 1 }
          : p
      ));
      
      // Limpar busca após adicionar
      setTermoBusca('');
      setProdutos([]);
      
      toast({
        title: "Produto adicionado",
        description: `${produto.nome} foi adicionado ao carrinho`,
      });
    }
  };
  
  const atualizarQuantidade = (produtoId: UUID, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItem(produtoId);
      return;
    }
    
    setCarrinho(prev => {
      const itemAtual = prev.itens.find(item => item.produto_id === produtoId);
      if (!itemAtual) return prev;
      
      // Verificar se a nova quantidade não excede o estoque disponível
      if (novaQuantidade > itemAtual.estoque_disponivel) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${itemAtual.estoque_disponivel} unidades disponíveis`,
          variant: "destructive"
        });
        return prev;
      }
      
      const novosItens = prev.itens.map(item => {
        if (item.produto_id === produtoId) {
          const novoPrecoTotal = item.preco_unitario * novaQuantidade - (item.desconto_valor || 0);
          return {
            ...item,
            quantidade: novaQuantidade,
            preco_total: novoPrecoTotal
          };
        }
        return item;
      });
      return calcularTotais(novosItens);
    });
  };
  
  const removerItem = (produtoId: UUID) => {
    const itemRemovido = carrinho.itens.find(item => item.produto_id === produtoId);
    
    setCarrinho(prev => {
      const novosItens = prev.itens.filter(item => item.produto_id !== produtoId);
      return calcularTotais(novosItens);
    });
    
    // Restaurar estoque localmente quando remover item
    if (itemRemovido) {
      setProdutos(prev => prev.map(p => 
        p.id === produtoId 
          ? { ...p, estoque_atual: p.estoque_atual + itemRemovido.quantidade }
          : p
      ));
    }
  };
  
  const calcularTotais = (itens: ItemCarrinho[]): CarrinhoCompras => {
    const subtotal = itens.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
    const desconto_total = itens.reduce((acc, item) => acc + (item.desconto_valor || 0), 0) + descontoGeral.valor;
    const total = subtotal - desconto_total;
    
    return {
      itens,
      subtotal,
      desconto_total,
      total: Math.max(0, total)
    };
  };
  
  const limparCarrinho = () => {
    setCarrinho({
      itens: [],
      subtotal: 0,
      desconto_total: 0,
      total: 0
    });
    setPagamentos([]);
    setClienteSelecionado(null);
    setObservacoes('');
    setDescontoGeral({ valor: 0, percentual: 0 });
    
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos"
    });
  };

  // =====================================================
  // FUNÇÕES DE PAGAMENTO
  // =====================================================
  
  const adicionarPagamento = (pagamento: PagamentoPDV) => {
    setPagamentos(prev => [...prev, pagamento]);
  };
  
  const removerPagamento = (index: number) => {
    setPagamentos(prev => prev.filter((_, i) => i !== index));
  };
  
  const totalPago = pagamentos.reduce((acc, pag) => acc + pag.valor, 0);
  const restante = carrinho.total - totalPago;
  const troco = totalPago > carrinho.total ? totalPago - carrinho.total : 0;

  // =====================================================
  // FINALIZAR VENDA
  // =====================================================
  
  const finalizarVenda = async () => {
    if (carrinho.itens.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos antes de finalizar a venda",
        variant: "destructive"
      });
      return;
    }
    
    if (restante > 0) {
      toast({
        title: "Pagamento incompleto",
        description: `Faltam R$ ${restante.toFixed(2)} para completar o pagamento`,
        variant: "destructive"
      });
      return;
    }

    if (pagamentos.length === 0) {
      toast({
        title: "Pagamento necessário",
        description: "Adicione pelo menos uma forma de pagamento",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsProcessando(true);

      // 1. Primeiro criar a venda em rascunho
      const criarVendaResponse = await fetch(`${supabaseUrl}/functions/v1/vendas-operations?action=criar-venda`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cliente_id: clienteSelecionado?.id,
          cliente_nome: clienteSelecionado?.nome || 'Cliente não informado',
          cliente_documento: clienteSelecionado?.cpf || clienteSelecionado?.cnpj,
          cliente_telefone: clienteSelecionado?.telefone,
          itens: carrinho.itens.map(item => ({
            produto_id: item.produto_id,
            produto_codigo: item.produto_codigo,
            produto_nome: item.produto_nome,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            preco_total: item.preco_total,
            lote_id: item.lote_id,
          })),
          subtotal: carrinho.subtotal,
          desconto_valor: carrinho.desconto_valor,
          desconto_percentual: carrinho.desconto_percentual,
          total: carrinho.total,
          observacoes: observacoes
        })
      });

      if (!criarVendaResponse.ok) {
        const errorData = await criarVendaResponse.json();
        throw new Error(errorData.error || 'Erro ao criar venda');
      }

      const { venda } = await criarVendaResponse.json();

      // 2. Finalizar a venda com os pagamentos
      const finalizarResponse = await fetch(`${supabaseUrl}/functions/v1/vendas-operations?action=finalizar-venda`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venda_id: venda.id,
          pagamentos: pagamentos.map(pagamento => ({
            forma_pagamento: pagamento.forma_pagamento,
            valor: pagamento.valor,
            bandeira_cartao: pagamento.bandeira_cartao,
            numero_autorizacao: pagamento.numero_autorizacao,
            codigo_transacao: pagamento.codigo_transacao,
            observacoes: pagamento.observacoes
          })),
          troco: troco
        })
      });

      if (!finalizarResponse.ok) {
        const errorData = await finalizarResponse.json();
        throw new Error(errorData.error || 'Erro ao finalizar venda');
      }

      const resultadoFinalizacao = await finalizarResponse.json();
      
      toast({
        title: "Venda finalizada!",
        description: `Venda ${resultadoFinalizacao.numero_venda} realizada com sucesso. Troco: R$ ${troco.toFixed(2)}`,
      });
      
      // Limpar tudo após sucesso
      limparCarrinho();
      setPagamentos([]);
      setClienteSelecionado(null);
      setObservacoes('');
      
      // Refresh dos dados
      await refetchVendas();
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao finalizar venda",
        variant: "destructive"
      });
    } finally {
      setIsProcessando(false);
    }
  };

  // Métricas do PDV
  const pdvMetrics = [
    {
      label: 'Itens no Carrinho',
      value: carrinho.itens.length.toString(),
      change: `${carrinho.itens.reduce((acc, item) => acc + item.quantidade, 0)} unidades`,
      trend: 'up' as const,
      icon: ShoppingBag,
      color: 'text-emerald-600',
      isLoading: false
    },
    {
      label: 'Total da Venda',
      value: formatarDinheiro(carrinho.total),
      change: carrinho.desconto_total > 0 ? `${formatarDinheiro(carrinho.desconto_total)} desconto` : 'Sem desconto',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-blue-600',
      isLoading: false
    },
    {
      label: 'Valor Pago',
      value: formatarDinheiro(totalPago),
      change: restante > 0 ? `Restam ${formatarDinheiro(restante)}` : troco > 0 ? `Troco ${formatarDinheiro(troco)}` : 'Pago completo',
      trend: restante > 0 ? 'down' as const : 'up' as const,
      icon: CreditCard,
      color: 'text-purple-600',
      isLoading: false
    },
    {
      label: 'Vendas Hoje',
      value: isLoadingVendas ? '-' : vendasData?.vendas.hoje.toString() || '0',
      change: isLoadingVendas ? '' : `${formatarTempo(vendasData?.vendas.tempoMedioVenda || 0)} tempo médio`,
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-orange-600',
      isLoading: isLoadingVendas
    }
  ];

  // =====================================================
  // RENDER
  // =====================================================
  
  return (
    <AdminLayout>
      <div>
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20" />
          <div className="relative px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-10 w-10 text-emerald-600" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      PDV - Ponto de Venda
                    </h1>
                    <Badge 
                      variant={carrinho.itens.length > 0 ? 'default' : 'secondary'}
                      className="ml-4"
                    >
                      {carrinho.itens.length} itens
                    </Badge>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    Sistema de vendas moderno e intuitivo. Busque produtos, adicione ao carrinho
                    e finalize vendas com múltiplas formas de pagamento em tempo real.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 blur-3xl opacity-20" />
                    <ShoppingCart className="h-48 w-48 text-emerald-600/20" />
                  </div>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="h-12 px-8"
                  onClick={() => setModalCliente(true)}
                  variant={clienteSelecionado ? 'default' : 'outline'}
                >
                  <User className="h-5 w-5 mr-2" />
                  {clienteSelecionado ? clienteSelecionado.nome : 'Selecionar Cliente'}
                </Button>
                
                {/* Botões de Pagamento Rápido */}
                <div className="flex gap-2">
                  <Button 
                    size="lg" 
                    className="h-12 px-6"
                    onClick={() => {
                      const valorRestante = Math.max(0, carrinho.total - totalPago);
                      if (valorRestante > 0) {
                        adicionarPagamento({
                          forma_pagamento: 'DINHEIRO',
                          valor: valorRestante
                        });
                        toast({
                          title: "Pagamento em dinheiro",
                          description: `${formatarDinheiro(valorRestante)} adicionado`,
                        });
                      }
                    }}
                    variant="outline"
                    disabled={carrinho.itens.length === 0 || restante <= 0}
                  >
                    <Banknote className="h-5 w-5 mr-2" />
                    Dinheiro
                  </Button>
                  
                  <Button 
                    size="lg" 
                    className="h-12 px-6"
                    onClick={() => {
                      const valorRestante = Math.max(0, carrinho.total - totalPago);
                      if (valorRestante > 0) {
                        adicionarPagamento({
                          forma_pagamento: 'PIX',
                          valor: valorRestante
                        });
                        toast({
                          title: "Pagamento PIX",
                          description: `${formatarDinheiro(valorRestante)} adicionado`,
                        });
                      }
                    }}
                    variant="outline"
                    disabled={carrinho.itens.length === 0 || restante <= 0}
                  >
                    <Smartphone className="h-5 w-5 mr-2" />
                    PIX
                  </Button>
                  
                  <Button 
                    size="lg" 
                    className="h-12 px-6"
                    onClick={() => setModalPagamento(true)}
                    variant="outline"
                    disabled={carrinho.itens.length === 0}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Cartão ({pagamentos.length})
                  </Button>
                </div>

                <Button 
                  size="lg" 
                  className="h-12 px-8"
                  onClick={() => setModalDesconto(true)}
                  variant="outline"
                  disabled={carrinho.itens.length === 0}
                >
                  <Percent className="h-5 w-5 mr-2" />
                  Aplicar Desconto
                </Button>

                {/* Botões de Desconto Rápido */}
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    className="h-12 px-3"
                    onClick={() => {
                      if (carrinho.subtotal > 0) {
                        const desconto = { valor: (carrinho.subtotal * 5) / 100, percentual: 5 };
                        setDescontoGeral(desconto);
                        setCarrinho(prev => {
                          const subtotal = prev.itens.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
                          const desconto_total = prev.itens.reduce((acc, item) => acc + (item.desconto_valor || 0), 0) + desconto.valor;
                          const total = subtotal - desconto_total;
                          
                          return {
                            ...prev,
                            subtotal,
                            desconto_total,
                            total: Math.max(0, total)
                          };
                        });
                        toast({
                          title: "Desconto aplicado",
                          description: "5% de desconto aplicado",
                        });
                      }
                    }}
                    variant="outline"
                    disabled={carrinho.itens.length === 0}
                    title="Aplicar 5% de desconto"
                  >
                    5%
                  </Button>
                  
                  <Button 
                    size="sm" 
                    className="h-12 px-3"
                    onClick={() => {
                      if (carrinho.subtotal > 0) {
                        const desconto = { valor: (carrinho.subtotal * 10) / 100, percentual: 10 };
                        setDescontoGeral(desconto);
                        setCarrinho(prev => {
                          const subtotal = prev.itens.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
                          const desconto_total = prev.itens.reduce((acc, item) => acc + (item.desconto_valor || 0), 0) + desconto.valor;
                          const total = subtotal - desconto_total;
                          
                          return {
                            ...prev,
                            subtotal,
                            desconto_total,
                            total: Math.max(0, total)
                          };
                        });
                        toast({
                          title: "Desconto aplicado",
                          description: "10% de desconto aplicado",
                        });
                      }
                    }}
                    variant="outline"
                    disabled={carrinho.itens.length === 0}
                    title="Aplicar 10% de desconto"
                  >
                    10%
                  </Button>
                  
                  <Button 
                    size="sm" 
                    className="h-12 px-3"
                    onClick={() => {
                      if (carrinho.subtotal > 0) {
                        const desconto = { valor: (carrinho.subtotal * 15) / 100, percentual: 15 };
                        setDescontoGeral(desconto);
                        setCarrinho(prev => {
                          const subtotal = prev.itens.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
                          const desconto_total = prev.itens.reduce((acc, item) => acc + (item.desconto_valor || 0), 0) + desconto.valor;
                          const total = subtotal - desconto_total;
                          
                          return {
                            ...prev,
                            subtotal,
                            desconto_total,
                            total: Math.max(0, total)
                          };
                        });
                        toast({
                          title: "Desconto aplicado",
                          description: "15% de desconto aplicado",
                        });
                      }
                    }}
                    variant="outline"
                    disabled={carrinho.itens.length === 0}
                    title="Aplicar 15% de desconto"
                  >
                    15%
                  </Button>
                </div>

                <Button 
                  size="lg" 
                  className="h-12 px-8"
                  onClick={limparCarrinho}
                  variant="outline"
                  disabled={carrinho.itens.length === 0}
                >
                  <X className="h-5 w-5 mr-2" />
                  Limpar Carrinho
                </Button>

                <Button 
                  size="lg" 
                  className="h-12 px-8 ml-auto"
                  onClick={finalizarVenda}
                  disabled={carrinho.itens.length === 0 || isProcessando || restante > 0}
                  variant={restante <= 0 && carrinho.itens.length > 0 ? 'default' : 'outline'}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {isProcessando ? 'Processando...' : 
                   restante > 0 && carrinho.itens.length > 0 ? 
                    `Faltam ${formatarDinheiro(restante)}` : 
                    'Finalizar Venda'
                  }
                </Button>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {pdvMetrics.map((metric, index) => {
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
                            metric.trend === 'up' ? 'text-green-600' : 
                            metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna 1 e 2: Busca e Carrinho */}
              <div className="lg:col-span-2 space-y-6">
                {/* Busca de Produtos */}
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                        <Search className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Buscar Produtos</CardTitle>
                        <CardDescription>
                          Digite o nome, código interno ou EAN do produto
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Digite o nome, código interno ou EAN do produto..."
                        value={termoBusca}
                        onChange={(e) => {
                          setTermoBusca(e.target.value);
                          buscarProdutos(e.target.value);
                        }}
                        className="pl-10 h-12 text-lg"
                      />
                    </div>
                    
                    {loading && (
                      <div className="mt-4 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-3 w-1/4" />
                              </div>
                              <Skeleton className="h-10 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {produtos.length > 0 && (
                      <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                        {produtos.map((produto) => (
                          <div
                            key={produto.id}
                            className="p-4 border rounded-lg hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/20 dark:hover:to-teal-950/20 cursor-pointer transition-all duration-200 group"
                            onClick={() => adicionarProduto(produto)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium group-hover:text-emerald-700 transition-colors">
                                  {produto.nome}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                  <span>Código: {produto.codigo_interno}</span>
                                  {produto.categoria_nome && (
                                    <Badge variant="outline" className="text-xs">
                                      {produto.categoria_nome}
                                    </Badge>
                                  )}
                                  {produto.forma_farmaceutica_nome && (
                                    <Badge variant="secondary" className="text-xs">
                                      {produto.forma_farmaceutica_nome}
                                    </Badge>
                                  )}
                                  {produto.controlado && (
                                    <Badge variant="destructive" className="text-xs">
                                      Controlado
                                    </Badge>
                                  )}
                                  {produto.requer_receita && (
                                    <Badge variant="secondary" className="text-xs">
                                      Receita
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
                                  <span className={`${produto.estoque_atual <= 10 ? 'text-red-600 font-medium' : ''}`}>
                                    Estoque: {produto.estoque_atual} unidades
                                  </span>
                                  {produto.codigo_ean && (
                                    <span>EAN: {produto.codigo_ean}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-bold text-emerald-600 text-lg">
                                  {formatarDinheiro(produto.preco_venda)}
                                </div>
                                <Button size="sm" className="mt-2 group-hover:scale-105 transition-transform">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Adicionar
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {termoBusca && produtos.length === 0 && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum produto encontrado</p>
                        <p className="text-sm">Tente buscar por outro termo ou verifique o estoque</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Carrinho de Compras */}
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle>
                            Carrinho de Compras ({carrinho.itens.length} itens)
                          </CardTitle>
                          <CardDescription>
                            {carrinho.itens.reduce((acc, item) => acc + item.quantidade, 0)} unidades no total
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {carrinho.itens.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-medium mb-2">Carrinho Vazio</h3>
                        <p>Busque e adicione produtos para iniciar uma venda</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {carrinho.itens.map((item) => (
                          <div key={item.produto_id} className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{item.produto_nome}</div>
                                <div className="text-sm text-muted-foreground">
                                  Código: {item.produto_codigo}
                                </div>
                                <div className="text-sm text-emerald-600 font-medium mt-1">
                                  {formatarDinheiro(item.preco_unitario)} x {item.quantidade} = {formatarDinheiro(item.preco_total)}
                                </div>
                                {(item.desconto_valor || 0) > 0 && (
                                  <div className="text-sm text-red-600">
                                    Desconto: {formatarDinheiro(item.desconto_valor || 0)}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => atualizarQuantidade(item.produto_id, item.quantidade - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                
                                <span className="w-12 text-center font-medium">
                                  {item.quantidade}
                                </span>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => atualizarQuantidade(item.produto_id, item.quantidade + 1)}
                                  disabled={item.quantidade >= item.estoque_disponivel}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removerItem(item.produto_id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Resumo do Carrinho */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal:</span>
                              <span>{formatarDinheiro(carrinho.subtotal)}</span>
                            </div>
                            
                            {carrinho.desconto_total > 0 && (
                              <div className="flex justify-between text-sm text-red-600">
                                <span>Desconto:</span>
                                <span>- {formatarDinheiro(carrinho.desconto_total)}</span>
                              </div>
                            )}
                            
                            <Separator />
                            
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total:</span>
                              <span className="text-emerald-600">{formatarDinheiro(carrinho.total)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Coluna 3: Sidebar - Cliente, Resumo e Pagamentos */}
              <div className="space-y-6">
                {/* Cliente */}
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Cliente</CardTitle>
                        <CardDescription>
                          {clienteSelecionado ? 'Cliente selecionado' : 'Selecione um cliente'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clienteSelecionado ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{clienteSelecionado.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {clienteSelecionado.documento}
                            </p>
                            {clienteSelecionado.telefone && (
                              <p className="text-sm text-muted-foreground">
                                {clienteSelecionado.telefone}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={removerCliente}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-muted-foreground mb-4">Nenhum cliente selecionado</p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setModalCliente(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Selecionar Cliente
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Resumo Financeiro */}
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                          <Calculator className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle>Resumo da Venda</CardTitle>
                          <CardDescription>
                            Valores e totais da transação
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModalPagamento(true)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pagar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModalDesconto(true)}
                          disabled={carrinho.itens.length === 0}
                        >
                          <Percent className="h-4 w-4 mr-1" />
                          Desconto
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Botões de Pagamento Rápido */}
                    {carrinho.total > 0 && restante > 0 && (
                      <div className="grid grid-cols-2 gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            adicionarPagamento({
                              forma_pagamento: 'DINHEIRO',
                              valor: restante
                            });
                            toast({
                              title: "Pagamento adicionado",
                              description: `Dinheiro: ${formatarDinheiro(restante)}`,
                            });
                          }}
                          className="w-full"
                        >
                          <Banknote className="h-4 w-4 mr-1" />
                          Dinheiro
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            adicionarPagamento({
                              forma_pagamento: 'PIX',
                              valor: restante
                            });
                            toast({
                              title: "Pagamento adicionado",
                              description: `PIX: ${formatarDinheiro(restante)}`,
                            });
                          }}
                          className="w-full"
                        >
                          <Smartphone className="h-4 w-4 mr-1" />
                          PIX
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModalPagamento(true)}
                          className="w-full"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Cartão
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModalDesconto(true)}
                          disabled={carrinho.itens.length === 0}
                          className="w-full"
                        >
                          <Percent className="h-4 w-4 mr-1" />
                          Desconto
                        </Button>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">{formatarDinheiro(carrinho.subtotal)}</span>
                      </div>
                      
                      {carrinho.desconto_total > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Desconto:</span>
                          <span className="font-medium">- {formatarDinheiro(carrinho.desconto_total)}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-emerald-600">{formatarDinheiro(carrinho.total)}</span>
                      </div>
                      
                      {totalPago > 0 && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex justify-between text-blue-600">
                            <span>Valor Pago:</span>
                            <span className="font-medium">{formatarDinheiro(totalPago)}</span>
                          </div>
                          
                          {restante > 0 && (
                            <div className="flex justify-between text-orange-600">
                              <span>Restante:</span>
                              <span className="font-medium">{formatarDinheiro(restante)}</span>
                            </div>
                          )}
                          
                          {troco > 0 && (
                            <div className="flex justify-between text-green-600 font-bold text-lg">
                              <span>Troco:</span>
                              <span>{formatarDinheiro(troco)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Status do Pagamento */}
                    {carrinho.total > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Status do Pagamento</span>
                          <span className="text-sm text-muted-foreground">
                            {totalPago === 0 ? '0%' : Math.round((totalPago / carrinho.total) * 100) + '%'}
                          </span>
                        </div>
                        <Progress 
                          value={totalPago === 0 ? 0 : Math.min((totalPago / carrinho.total) * 100, 100)} 
                          className="h-3" 
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Observações */}
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500 to-slate-500 text-white">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Observações</CardTitle>
                        <CardDescription>
                          Anotações sobre a venda
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Observações sobre a venda..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Finalizar Venda */}
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <Button 
                      onClick={finalizarVenda}
                      className="w-full h-14 text-lg font-medium group-hover:scale-[1.02] transition-transform"
                      disabled={carrinho.itens.length === 0 || isProcessando || restante > 0}
                      size="lg"
                    >
                      <CheckCircle className="h-6 w-6 mr-3" />
                      {isProcessando ? 'Processando...' : 
                       restante > 0 && carrinho.itens.length > 0 ? 
                        `Faltam ${formatarDinheiro(restante)}` : 
                        'Finalizar Venda'
                      }
                    </Button>
                    
                    {restante > 0 && carrinho.itens.length > 0 && (
                      <Alert className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Adicione os pagamentos para completar a venda
                        </AlertDescription>
                      </Alert>
                    )}

                    {troco > 0 && (
                      <Alert className="mt-4 border-green-200 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 dark:text-green-400">
                          Troco a devolver: <strong>{formatarDinheiro(troco)}</strong>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Cliente */}
      <Dialog open={modalCliente} onOpenChange={setModalCliente}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Selecionar Cliente</DialogTitle>
            <DialogDescription>
              Busque e selecione o cliente para esta venda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome, CPF, CNPJ ou telefone..." 
                value={termoBuscaCliente}
                onChange={(e) => setTermoBuscaCliente(e.target.value)}
                className="pl-10"
                autoFocus
                aria-label="Campo de busca de clientes"
              />
            </div>
            
            {/* Lista de clientes */}
            <div 
              className="max-h-96 overflow-y-auto" 
              role="listbox" 
              aria-label="Lista de clientes disponíveis"
            >
              {isLoadingClientes ? (
                <div className="space-y-2" aria-label="Carregando clientes">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : clientes.length === 0 && termoBuscaCliente ? (
                <div className="text-center py-8 text-muted-foreground" role="status">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum cliente encontrado</p>
                  <p className="text-sm">Tente ajustar o termo de busca</p>
                </div>
              ) : (termoBuscaCliente ? clientes : todosClientes).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" role="status">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Digite para buscar clientes</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {(termoBuscaCliente ? clientes : todosClientes).map((cliente) => (
                    <button
                      key={cliente.id}
                      onClick={() => selecionarCliente(cliente)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                      role="option"
                      aria-label={`Selecionar cliente ${cliente.nome}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{cliente.nome}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            {(cliente.cpf || cliente.cnpj) && (
                              <span>{cliente.cpf || cliente.cnpj}</span>
                            )}
                            {cliente.telefone && (
                              <span>• {cliente.telefone}</span>
                            )}
                          </div>
                          {cliente.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {cliente.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <Button 
                onClick={() => setModalCliente(false)} 
                className="w-full"
                variant="outline"
                aria-label="Continuar venda sem selecionar cliente"
              >
                Venda sem Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Pagamento */}
      <Dialog open={modalPagamento} onOpenChange={setModalPagamento}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Pagamento</DialogTitle>
            <DialogDescription>
              Escolha a forma de pagamento e informe o valor
            </DialogDescription>
          </DialogHeader>
          <FormPagamento 
            onAdicionarPagamento={(pagamento) => {
              adicionarPagamento(pagamento);
              setModalPagamento(false);
            }}
            valorSugerido={Math.max(0, carrinho.total - totalPago)}
            onCancelar={() => setModalPagamento(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Aplicar Desconto */}
      <Dialog open={modalDesconto} onOpenChange={setModalDesconto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar Desconto</DialogTitle>
            <DialogDescription>
              Escolha o tipo de desconto e informe o valor
            </DialogDescription>
          </DialogHeader>
          <FormDesconto 
            subtotal={carrinho.subtotal}
            onAplicarDesconto={(desconto) => {
              setDescontoGeral(desconto);
              // Recalcular totais com o novo desconto
              setCarrinho(prev => {
                const subtotal = prev.itens.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
                const desconto_total = prev.itens.reduce((acc, item) => acc + (item.desconto_valor || 0), 0) + desconto.valor;
                const total = subtotal - desconto_total;
                
                return {
                  ...prev,
                  subtotal,
                  desconto_total,
                  total: Math.max(0, total)
                };
              });
              setModalDesconto(false);
            }}
            descontoAtual={descontoGeral}
            onCancelar={() => setModalDesconto(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Lista de Pagamentos Adicionados */}
      {pagamentos.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
              Pagamentos Adicionados ({pagamentos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" role="list" aria-label="Lista de pagamentos adicionados">
              {pagamentos.map((pagamento, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                  role="listitem"
                  aria-label={`Pagamento ${index + 1}: ${pagamento.forma_pagamento.replace('_', ' ')} no valor de ${formatarDinheiro(pagamento.valor)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-muted" aria-hidden="true">
                      {pagamento.forma_pagamento === 'DINHEIRO' && <Banknote className="h-4 w-4" />}
                      {pagamento.forma_pagamento === 'CARTAO_CREDITO' && <CreditCard className="h-4 w-4" />}
                      {pagamento.forma_pagamento === 'CARTAO_DEBITO' && <CreditCard className="h-4 w-4" />}
                      {pagamento.forma_pagamento === 'PIX' && <Smartphone className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {pagamento.forma_pagamento.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatarDinheiro(pagamento.valor)}
                      </p>
                      {pagamento.bandeira_cartao && (
                        <p className="text-xs text-muted-foreground">
                          {pagamento.bandeira_cartao}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removerPagamento(index)}
                    aria-label={`Remover pagamento ${index + 1}: ${pagamento.forma_pagamento.replace('_', ' ')}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}

// =====================================================
// COMPONENTE FORMULÁRIO DE PAGAMENTO
// =====================================================

interface FormPagamentoProps {
  onAdicionarPagamento: (pagamento: PagamentoPDV) => void;
  valorSugerido: number;
  onCancelar: () => void;
}

function FormPagamento({ onAdicionarPagamento, valorSugerido, onCancelar }: FormPagamentoProps) {
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('DINHEIRO');
  const [valor, setValor] = useState('');
  const [numeroAutorizacao, setNumeroAutorizacao] = useState('');
  const [bandeiraCartao, setBandeiraCartao] = useState('');

  // Atualizar valor quando valorSugerido mudar
  useEffect(() => {
    if (valorSugerido > 0) {
      setValor(valorSugerido.toFixed(2));
    }
  }, [valorSugerido]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const valorNumerico = parseFloat(valor);
    if (valorNumerico <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    const pagamento: PagamentoPDV = {
      forma_pagamento: formaPagamento,
      valor: valorNumerico,
      numero_autorizacao: numeroAutorizacao || undefined,
      bandeira_cartao: bandeiraCartao || undefined,
    };

    onAdicionarPagamento(pagamento);
    
    toast({
      title: "Pagamento adicionado",
      description: `${formaPagamento.replace('_', ' ')} - R$ ${valorNumerico.toFixed(2)}`,
    });
    
    // Limpar formulário
    setValor('');
    setNumeroAutorizacao('');
    setBandeiraCartao('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulário de pagamento">
      <div>
        <Label htmlFor="forma-pagamento">Forma de Pagamento</Label>
        <Select value={formaPagamento} onValueChange={(value: FormaPagamento) => setFormaPagamento(value)}>
          <SelectTrigger id="forma-pagamento" aria-label="Selecionar forma de pagamento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DINHEIRO">💵 Dinheiro</SelectItem>
            <SelectItem value="CARTAO_CREDITO">💳 Cartão de Crédito</SelectItem>
            <SelectItem value="CARTAO_DEBITO">💳 Cartão de Débito</SelectItem>
            <SelectItem value="PIX">📱 PIX</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="valor">Valor</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" aria-hidden="true">R$</span>
          <Input
            id="valor"
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="pl-10"
            placeholder="0,00"
            aria-label="Valor do pagamento em reais"
            aria-describedby="valor-help"
            autoFocus
          />
        </div>
        <p id="valor-help" className="text-xs text-muted-foreground mt-1">
          Digite o valor a ser pago nesta forma de pagamento
        </p>
      </div>

      {(formaPagamento === 'CARTAO_CREDITO' || formaPagamento === 'CARTAO_DEBITO') && (
        <>
          <div>
            <Label htmlFor="bandeira">Bandeira do Cartão</Label>
            <Select value={bandeiraCartao} onValueChange={setBandeiraCartao}>
              <SelectTrigger id="bandeira" aria-label="Selecionar bandeira do cartão">
                <SelectValue placeholder="Selecione a bandeira" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VISA">Visa</SelectItem>
                <SelectItem value="MASTERCARD">Mastercard</SelectItem>
                <SelectItem value="ELO">Elo</SelectItem>
                <SelectItem value="AMEX">American Express</SelectItem>
                <SelectItem value="HIPERCARD">Hipercard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="autorizacao">Número de Autorização (opcional)</Label>
            <Input
              id="autorizacao"
              value={numeroAutorizacao}
              onChange={(e) => setNumeroAutorizacao(e.target.value)}
              placeholder="Número da autorização"
              aria-label="Número de autorização da transação (opcional)"
            />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancelar} 
          className="flex-1"
          aria-label="Cancelar adição de pagamento"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          aria-label="Confirmar adição do pagamento"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Adicionar
        </Button>
      </div>
    </form>
  );
}

// =====================================================
// COMPONENTE FORMULÁRIO DE DESCONTO
// =====================================================

interface FormDescontoProps {
  onAplicarDesconto: (desconto: { valor: number; percentual: number }) => void;
  subtotal: number;
  descontoAtual: { valor: number; percentual: number };
  onCancelar: () => void;
}

function FormDesconto({ onAplicarDesconto, subtotal, descontoAtual, onCancelar }: FormDescontoProps) {
  const [tipoDesconto, setTipoDesconto] = useState<'valor' | 'percentual'>('percentual');
  const [valor, setValor] = useState(descontoAtual.valor.toString());
  const [percentual, setPercentual] = useState(descontoAtual.percentual.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let descontoCalculado = { valor: 0, percentual: 0 };
    
    if (tipoDesconto === 'valor') {
      const valorDesconto = parseFloat(valor);
      if (valorDesconto < 0 || valorDesconto > subtotal) {
        toast({
          title: "Valor inválido",
          description: "O desconto não pode ser negativo ou maior que o subtotal",
          variant: "destructive"
        });
        return;
      }
      descontoCalculado = {
        valor: valorDesconto,
        percentual: subtotal > 0 ? (valorDesconto / subtotal) * 100 : 0
      };
    } else {
      const percentualDesconto = parseFloat(percentual);
      if (percentualDesconto < 0 || percentualDesconto > 100) {
        toast({
          title: "Percentual inválido",
          description: "O desconto deve estar entre 0% e 100%",
          variant: "destructive"
        });
        return;
      }
      const valorDesconto = (subtotal * percentualDesconto) / 100;
      descontoCalculado = {
        valor: valorDesconto,
        percentual: percentualDesconto
      };
    }

    onAplicarDesconto(descontoCalculado);
    
    toast({
      title: "Desconto aplicado",
      description: `Desconto de ${descontoCalculado.percentual.toFixed(1)}% aplicado`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulário de desconto">
      <div>
        <Label>Tipo de Desconto</Label>
        <div className="flex gap-2 mt-2" role="radiogroup" aria-label="Escolher tipo de desconto">
          <Button
            type="button"
            variant={tipoDesconto === 'percentual' ? 'default' : 'outline'}
            onClick={() => setTipoDesconto('percentual')}
            className="flex-1"
            role="radio"
            aria-checked={tipoDesconto === 'percentual'}
            aria-label="Desconto por percentual"
          >
            <Percent className="h-4 w-4 mr-2" aria-hidden="true" />
            Percentual
          </Button>
          <Button
            type="button"
            variant={tipoDesconto === 'valor' ? 'default' : 'outline'}
            onClick={() => setTipoDesconto('valor')}
            className="flex-1"
            role="radio"
            aria-checked={tipoDesconto === 'valor'}
            aria-label="Desconto por valor fixo"
          >
            <DollarSign className="h-4 w-4 mr-2" aria-hidden="true" />
            Valor
          </Button>
        </div>
      </div>

      {tipoDesconto === 'percentual' ? (
        <div>
          <Label htmlFor="percentual">Percentual de Desconto</Label>
          <div className="relative">
            <Input
              id="percentual"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={percentual}
              onChange={(e) => setPercentual(e.target.value)}
              className="pr-8"
              placeholder="0"
              aria-label="Percentual de desconto de 0 a 100"
              aria-describedby="percentual-help"
              autoFocus
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" aria-hidden="true">%</span>
          </div>
          {parseFloat(percentual) > 0 && (
            <p id="percentual-help" className="text-sm text-muted-foreground mt-1">
              Desconto: {((subtotal * parseFloat(percentual)) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
        </div>
      ) : (
        <div>
          <Label htmlFor="valor-desconto">Valor do Desconto</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" aria-hidden="true">R$</span>
            <Input
              id="valor-desconto"
              type="number"
              step="0.01"
              min="0"
              max={subtotal}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="pl-10"
              placeholder="0,00"
              aria-label="Valor do desconto em reais"
              aria-describedby="valor-desconto-help"
              autoFocus
            />
          </div>
          {parseFloat(valor) > 0 && (
            <p id="valor-desconto-help" className="text-sm text-muted-foreground mt-1">
              Percentual: {subtotal > 0 ? ((parseFloat(valor) / subtotal) * 100).toFixed(1) : 0}%
            </p>
          )}
        </div>
      )}

      <div className="p-3 bg-muted rounded-lg" role="region" aria-label="Resumo do desconto">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        <div className="flex justify-between text-sm text-red-600">
          <span>Desconto:</span>
          <span>
            - {(tipoDesconto === 'valor' ? parseFloat(valor) || 0 : (subtotal * (parseFloat(percentual) || 0)) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        <div className="flex justify-between font-medium border-t pt-2 mt-2">
          <span>Total:</span>
          <span className="text-green-600">
            {(subtotal - (tipoDesconto === 'valor' ? parseFloat(valor) || 0 : (subtotal * (parseFloat(percentual) || 0)) / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancelar} 
          className="flex-1"
          aria-label="Cancelar aplicação de desconto"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          aria-label="Confirmar aplicação do desconto"
        >
          <Check className="h-4 w-4 mr-2" aria-hidden="true" />
          Aplicar Desconto
        </Button>
      </div>
    </form>
  );
}

// =====================================================
// EXPORTAÇÃO PRINCIPAL
// =====================================================
