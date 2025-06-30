// =====================================================
// PDV UNIFICADO - PHARMA.AI
// Interface única e inteligente para todas as vendas
// Implementa item 2.6 do plano de melhorias
// =====================================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import AdminLayout from '@/components/layouts/AdminLayout';

import { usePDVv2 } from '@/hooks/usePDVv2';
import { TipoVendaSelector, TipoVenda } from '@/components/vendas/TipoVendaSelector';
import { SeletorOrdemProducao } from '@/components/vendas/SeletorOrdemProducao';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Banknote,
  Smartphone,
  User,
  CheckCircle,
  Package,
  X,
  DollarSign,
  Info,
  AlertCircle,
  Loader2,
  Receipt,
  Clock,
  ArrowRight,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Interface para ordem de produção
interface OrdemProducao {
  id: string;
  numero_ordem: string;
  cliente_nome: string;
  valor_total: number;
  itens: Array<{
    nome: string;
    quantidade: number;
    valor_unitario: number;
  }>;
}

export default function PDVUnificado() {
  // =====================================================
  // HOOK PRINCIPAL E ESTADOS
  // =====================================================
  
  const {
    // Estados do carrinho
    carrinho,
    
    // Estados de produtos
    produtos,
    
    // Estados de cliente
    clienteSelecionado,
    
    // Estados de pagamento
    pagamentos = [],
    
    // Estados de UI
    loading,
    
    // Funções
    buscarProdutos,
    adicionarProduto: adicionarProdutoCarrinho,
    removerItem: removerProdutoCarrinho,
    atualizarQuantidade,
    limparCarrinho,
    finalizarVenda,
    selecionarCliente,
    adicionarPagamento,
    removerPagamento,
    
    // Utilitários
    descontoGeral,
    caixaAberto,
    isProcessando,
    totalPago,
    restante,
    troco,
  } = usePDVv2();

  // Estados do sistema de tipos de venda (Item 2.6)
  const [tipoVenda, setTipoVenda] = useState<TipoVenda>('MANIPULADO');
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemProducao | null>(null);
  const [carrinhoReadOnly, setCarrinhoReadOnly] = useState(false);

  // Estados locais
  const [termoBusca, setTermoBusca] = useState('');
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);
  const [modalOrdem, setModalOrdem] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [valorPagamento, setValorPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Ref para o input de busca
  const inputBuscaRef = useRef<HTMLInputElement>(null);

  // =====================================================
  // SISTEMA DE TIPOS DE VENDA (Item 2.6)
  // =====================================================
  
  const handleTipoVendaChange = useCallback((novoTipo: TipoVenda) => {
    // Implementação conforme item 2.6 - impedir mudança para ALOPÁTICO
    if (novoTipo === 'ALOPATICO') {
      toast({
        title: "Tipo não disponível",
        description: "Venda de produto alopático deve ser realizada no módulo Revenda",
        variant: "destructive",
      });
      return;
    }

    // Para outros tipos futuros (DELIVERY, PBM)
    if (novoTipo === 'DELIVERY' || novoTipo === 'PBM') {
      toast({
        title: "Em breve",
        description: `Tipo de venda ${novoTipo} estará disponível em breve`,
      });
      return;
    }

    setTipoVenda(novoTipo);
    
    // Se mudou para MANIPULADO, abrir seletor de ordem
    if (novoTipo === 'MANIPULADO') {
      setModalOrdem(true);
    }
  }, []);

  const handleSelecionarOrdem = useCallback((ordem: OrdemProducao) => {
    // Limpar carrinho atual
    limparCarrinho();
    
    // Carregar itens da ordem (carrinho read-only)
    ordem.itens.forEach(item => {
      const produtoOrdem = {
        id: `op-${ordem.id}-${item.nome}`,
        nome: item.nome,
        preco_venda: item.valor_unitario,
        estoque_atual: item.quantidade,
        categoria_nome: 'Manipulado',
        controlado: false,
        requer_receita: false
      };
      
      adicionarProdutoCarrinho(produtoOrdem, item.quantidade);
    });

    // Selecionar cliente da ordem
    if (ordem.cliente_nome) {
      selecionarCliente({
        id: `cliente-${ordem.id}`,
        nome: ordem.cliente_nome
      });
    }

    setOrdemSelecionada(ordem);
    setCarrinhoReadOnly(true); // Bloquear edição conforme item 2.6
    setModalOrdem(false);
    setTermoBusca('');
    
    toast({
      title: "Ordem carregada",
      description: `OP-${ordem.numero_ordem} foi carregada no carrinho`,
    });
  }, [limparCarrinho, adicionarProdutoCarrinho, selecionarCliente]);

  const handleTrocarOrdem = useCallback(() => {
    setModalOrdem(true);
  }, []);

  const handleRemoverOrdem = useCallback(() => {
    setOrdemSelecionada(null);
    setCarrinhoReadOnly(false);
    limparCarrinho();
    
    toast({
      title: "Ordem removida",
      description: "Carrinho liberado para edição manual",
    });
  }, [limparCarrinho]);

  // =====================================================
  // DETECÇÃO INTELIGENTE DE TIPO
  // =====================================================
  
  const detectarTipoVenda = useCallback(async (termo: string) => {
    // Para tipo MANIPULADO, só permitir busca de ordens
    if (tipoVenda === 'MANIPULADO') {
      toast({
        title: "Venda de manipulados",
        description: "Use o seletor de ordens de produção para vendas de manipulados",
        variant: "destructive",
      });
      return;
    }

    // Se começar com OP- ou ordem, sugerir mudança para MANIPULADO
    if (termo.toLowerCase().startsWith('op-') || termo.toLowerCase().includes('ordem')) {
      toast({
        title: "Ordem de produção detectada",
        description: "Altere o tipo de venda para MANIPULADO para buscar ordens",
      });
      return;
    }

    // Busca normal de produtos para outros tipos
    buscarProdutos(termo);
  }, [tipoVenda, buscarProdutos]);

  // =====================================================
  // EFEITOS
  // =====================================================
  
  useEffect(() => {
    // Foco no input de busca ao carregar
    inputBuscaRef.current?.focus();
  }, []);

  // Busca com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (termoBusca.length >= 2) {
        detectarTipoVenda(termoBusca);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [termoBusca, detectarTipoVenda]);

  // =====================================================
  // HANDLERS
  // =====================================================
  
  const handleFinalizarVenda = async () => {
    if (!caixaAberto) {
      toast({
        title: "Caixa fechado",
        description: "Abra o caixa antes de realizar vendas",
        variant: "destructive",
      });
      return;
    }

    if (carrinho.itens.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho",
        variant: "destructive",
      });
      return;
    }

    if (restante > 0) {
      toast({
        title: "Pagamento incompleto",
        description: `Faltam ${formatarDinheiro(restante)} para completar o pagamento`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Dados da venda conforme item 2.6
      const dadosVenda = {
        observacoes,
        troco,
        tipo_venda: tipoVenda,
        origem_id: ordemSelecionada?.id || null, // Para rastreabilidade
      };

      await finalizarVenda(dadosVenda);

      // Limpar tudo
      setObservacoes('');
      setModalPagamento(false);
      setTermoBusca('');
      setOrdemSelecionada(null);
      setCarrinhoReadOnly(false);
      inputBuscaRef.current?.focus();

    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
    }
  };

  const handleAdicionarPagamento = () => {
    const valor = parseFloat(valorPagamento.replace(',', '.'));
    
    if (!formaPagamento || isNaN(valor) || valor <= 0) {
      toast({
        title: "Erro",
        description: "Selecione uma forma de pagamento e informe um valor válido",
        variant: "destructive",
      });
      return;
    }

    adicionarPagamento({
      forma_pagamento: formaPagamento as any,
      valor
    });

    setFormaPagamento('');
    setValorPagamento('');
  };

  // =====================================================
  // FUNÇÕES AUXILIARES
  // =====================================================
  
  const formatarDinheiro = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formasPagamento = [
    { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
    { value: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard },
    { value: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard },
    { value: 'pix', label: 'PIX', icon: Smartphone },
  ];

  // =====================================================
  // RENDERIZAÇÃO
  // =====================================================
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-4 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">PDV - Ponto de Venda Unificado</h1>
          
          {/* Seletor de Tipo de Venda (Item 2.6) */}
          <TipoVendaSelector 
            tipoSelecionado={tipoVenda}
            onTipoChange={handleTipoVendaChange}
            className="mb-4"
          />

          {/* Badge de Ordem Selecionada */}
          {ordemSelecionada && (
            <Card className="mb-4 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">
                        Origem: OP-{ordemSelecionada.numero_ordem}
                      </p>
                      <p className="text-sm text-blue-600">
                        Cliente: {ordemSelecionada.cliente_nome}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      <Lock className="h-3 w-3 mr-1" />
                      Carrinho protegido
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleTrocarOrdem}>
                      Trocar ordem
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleRemoverOrdem}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Barra de busca inteligente */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  ref={inputBuscaRef}
                  placeholder={
                    tipoVenda === 'MANIPULADO' 
                      ? "Use o seletor de ordens de produção acima..."
                      : "Busque produtos por nome ou código..."
                  }
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10 text-lg h-12"
                  disabled={loading || tipoVenda === 'MANIPULADO'}
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin" />
                )}
              </div>
              
              {/* Dica inteligente */}
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>
                  {tipoVenda === 'MANIPULADO' 
                    ? "Para vendas de manipulados, selecione uma ordem de produção pronta"
                    : "Digite o nome ou código do produto para buscar"
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna de produtos */}
          <div className="lg:col-span-2 space-y-4">
            {/* Lista de produtos encontrados */}
            {produtos.length > 0 && tipoVenda !== 'MANIPULADO' && (
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Encontrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {produtos.map((produto) => (
                        <div
                          key={produto.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => adicionarProdutoCarrinho(produto)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{produto.nome}</div>
                            <div className="text-sm text-gray-500">
                              {produto.categoria_nome} • Estoque: {produto.estoque_atual}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatarDinheiro(produto.preco_venda)}</div>
                            <Button size="sm" variant="ghost">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Carrinho */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Carrinho
                    {carrinhoReadOnly && (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Protegido
                      </Badge>
                    )}
                  </CardTitle>
                  {carrinho.itens.length > 0 && !carrinhoReadOnly && (
                    <Button variant="ghost" size="sm" onClick={limparCarrinho}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {carrinho.itens.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Carrinho vazio</p>
                    <p className="text-sm mt-1">
                      {tipoVenda === 'MANIPULADO' 
                        ? "Selecione uma ordem de produção para carregar itens"
                        : "Busque produtos acima para adicionar"
                      }
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {carrinho.itens.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{item.produto_nome}</div>
                            {!carrinhoReadOnly && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removerProdutoCarrinho(item.produto_id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {!carrinhoReadOnly ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => atualizarQuantidade(item.produto_id, item.quantidade - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-12 text-center">{item.quantidade}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => atualizarQuantidade(item.produto_id, item.quantidade + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Lock className="h-3 w-3" />
                                  <span>Qtd: {item.quantidade}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {formatarDinheiro(item.preco_unitario)} cada
                              </div>
                              <div className="font-bold">
                                {formatarDinheiro(item.preco_total)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna de resumo e ações */}
          <div className="space-y-4">
            {/* Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                {clienteSelecionado ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{clienteSelecionado.nome}</p>
                        {clienteSelecionado.documento && (
                          <p className="text-sm text-gray-500">{clienteSelecionado.documento}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModalCliente(true)}
                        disabled={carrinhoReadOnly}
                      >
                        {carrinhoReadOnly ? <Lock className="h-4 w-4" /> : "Trocar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setModalCliente(true)}
                    disabled={carrinhoReadOnly}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {carrinhoReadOnly ? "Cliente da ordem" : "Selecionar Cliente"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatarDinheiro(carrinho.subtotal)}</span>
                </div>
                {carrinho.desconto_total > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatarDinheiro(carrinho.desconto_total)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatarDinheiro(carrinho.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Status do caixa */}
            {!caixaAberto && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Caixa fechado. Abra o caixa para realizar vendas.
                </AlertDescription>
              </Alert>
            )}

            {/* Ações */}
            <div className="space-y-2">
              {tipoVenda === 'MANIPULADO' && !ordemSelecionada && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setModalOrdem(true)}
                >
                  <Package className="h-5 w-5 mr-2" />
                  Selecionar Ordem de Produção
                </Button>
              )}
              
              <Button
                className="w-full"
                size="lg"
                onClick={() => setModalPagamento(true)}
                disabled={carrinho.itens.length === 0 || !caixaAberto}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pagamento
              </Button>
            </div>
          </div>
        </div>

        {/* Modal de Ordens */}
        <SeletorOrdemProducao
          open={modalOrdem}
          onOpenChange={setModalOrdem}
          onOrdemSelecionada={handleSelecionarOrdem}
          ordemAtual={ordemSelecionada}
        />

        {/* Modal de Pagamento */}
        <Dialog open={modalPagamento} onOpenChange={setModalPagamento}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Finalizar Venda</DialogTitle>
              <DialogDescription>
                Total a pagar: {formatarDinheiro(carrinho.total)}
                {ordemSelecionada && (
                  <Badge variant="outline" className="ml-2">
                    OP-{ordemSelecionada.numero_ordem}
                  </Badge>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Formas de pagamento */}
              <div className="space-y-2">
                <Label>Adicionar Pagamento</Label>
                <div className="flex gap-2">
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento.map((forma) => (
                        <SelectItem key={forma.value} value={forma.value}>
                          <div className="flex items-center gap-2">
                            <forma.icon className="h-4 w-4" />
                            {forma.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Valor"
                    value={valorPagamento}
                    onChange={(e) => setValorPagamento(e.target.value)}
                    className="w-32"
                  />
                  <Button onClick={handleAdicionarPagamento}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Pagamentos adicionados */}
              {pagamentos.length > 0 && (
                <div className="space-y-2">
                  <Label>Pagamentos</Label>
                  {pagamentos.map((pag, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{pag.forma_pagamento}</span>
                      <div className="flex items-center gap-2">
                        <span>{formatarDinheiro(pag.valor)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerPagamento(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resumo do pagamento */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total da venda</span>
                      <span>{formatarDinheiro(carrinho.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total pago</span>
                      <span>{formatarDinheiro(totalPago)}</span>
                    </div>
                    <Separator />
                    {restante > 0 ? (
                      <div className="flex justify-between text-red-600 font-bold">
                        <span>Restante</span>
                        <span>{formatarDinheiro(restante)}</span>
                      </div>
                    ) : troco > 0 ? (
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>Troco</span>
                        <span>{formatarDinheiro(troco)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>Pagamento completo</span>
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  placeholder="Observações sobre a venda..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setModalPagamento(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleFinalizarVenda}
                  disabled={restante > 0 || isProcessando}
                >
                  {isProcessando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalizar Venda
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Cliente - Simplificado */}
        <Dialog open={modalCliente} onOpenChange={setModalCliente}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Busca de clientes será implementada em breve. 
                  Por enquanto, a venda será realizada sem cliente.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setModalCliente(false)}
              >
                Continuar sem cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 