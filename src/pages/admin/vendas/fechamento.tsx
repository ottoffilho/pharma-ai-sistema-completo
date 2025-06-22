import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  DollarSign, 
  Eye, 
  Package, 
  User, 
  AlertTriangle,
  Calculator,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
import AdminLayout from '@/components/layouts/AdminLayout';
import { supabase } from '@/lib/supabase';

interface VendaPendente {
  id: string;
  numero_venda: string;
  data_venda: string;
  cliente_nome?: string;
  cliente_documento?: string;
  total: number;
  status: 'rascunho' | 'aberta';
  status_pagamento: 'pendente' | 'parcial';
  usuario_nome: string;
  itens: {
    produto_nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
  }[];
}

interface PagamentoVenda {
  forma_pagamento: string;
  valor: number;
  bandeira_cartao?: string;
  numero_autorizacao?: string;
  codigo_transacao?: string;
  observacoes?: string;
}

export default function FechamentoVendas() {
  const [vendasPendentes, setVendasPendentes] = useState<VendaPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaPendente | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [pagamentos, setPagamentos] = useState<PagamentoVenda[]>([]);
  const [troco, setTroco] = useState(0);
  const [observacoes, setObservacoes] = useState('');

  const { usuario } = useAuthSimple();
  const { toast } = useToast();

  useEffect(() => {
    carregarVendasPendentes();
  }, []);

  const carregarVendasPendentes = async () => {
    setLoading(true);
    try {
      // Buscar vendas pendentes reais do banco de dados
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select(`
          id,
          numero_venda,
          data_venda,
          cliente_nome,
          cliente_documento,
          total,
          status,
          status_pagamento,
          usuario_nome,
          vendas_itens (
            produto_nome,
            quantidade,
            preco_unitario,
            preco_total
          )
        `)
        .in('status', ['rascunho', 'aberta'])
        .order('data_venda', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Mapear dados para o formato esperado
      const vendasFormatadas: VendaPendente[] = (vendas || []).map(venda => ({
        id: venda.id,
        numero_venda: venda.numero_venda || `VEN${venda.id.toString().padStart(6, '0')}`,
        data_venda: venda.data_venda || new Date().toISOString(),
        cliente_nome: venda.cliente_nome,
        cliente_documento: venda.cliente_documento,
        total: venda.total || 0,
        status: venda.status as 'rascunho' | 'aberta',
        status_pagamento: venda.status_pagamento as 'pendente' | 'parcial',
        usuario_nome: venda.usuario_nome || 'Usuário Sistema',
        itens: venda.vendas_itens || []
      }));
      
      setVendasPendentes(vendasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar vendas pendentes:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar vendas pendentes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogFechamento = (venda: VendaPendente) => {
    setVendaSelecionada(venda);
    setPagamentos([]);
    setTroco(0);
    setObservacoes('');
    setDialogAberto(true);
  };

  const adicionarPagamento = (pagamento: PagamentoVenda) => {
    setPagamentos([...pagamentos, pagamento]);
  };

  const removerPagamento = (index: number) => {
    setPagamentos(pagamentos.filter((_, i) => i !== index));
  };

  const totalPagamentos = pagamentos.reduce((sum, p) => sum + p.valor, 0);
  const restante = vendaSelecionada ? vendaSelecionada.total - totalPagamentos + troco : 0;

  const finalizarVenda = async () => {
    if (!vendaSelecionada) return;

    if (restante > 0.01) {
      toast({
        title: 'Pagamento incompleto',
        description: `Faltam R$ ${restante.toFixed(2)} para completar o pagamento`,
        variant: 'destructive'
      });
      return;
    }

    try {
      // Aqui seria a chamada para a API
      console.log('Finalizando venda:', {
        venda_id: vendaSelecionada.id,
        pagamentos,
        troco,
        observacoes
      });

      toast({
        title: 'Venda finalizada!',
        description: `Venda ${vendaSelecionada.numero_venda} finalizada com sucesso`,
      });

      setDialogAberto(false);
      carregarVendasPendentes();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao finalizar venda',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <Badge variant="secondary">Rascunho</Badge>;
      case 'aberta':
        return <Badge variant="outline">Aberta</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="destructive">Pendente</Badge>;
      case 'parcial':
        return <Badge variant="secondary">Parcial</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Fechamento de Vendas</h1>
                <p className="text-gray-600 mt-1">Finalize vendas pendentes e em aberto</p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vendas Pendentes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {vendasPendentes.filter(v => v.status === 'rascunho').length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vendas em Aberto</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {vendasPendentes.filter(v => v.status === 'aberta').length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Valor Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {vendasPendentes.reduce((sum, v) => sum + v.total, 0).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lista de Vendas Pendentes */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Vendas Aguardando Fechamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {vendasPendentes.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma venda pendente
                  </h3>
                  <p className="text-gray-600">
                    Todas as vendas foram finalizadas.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Atendente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendasPendentes.map((venda) => (
                      <TableRow key={venda.id}>
                        <TableCell className="font-mono font-medium">
                          {venda.numero_venda}
                        </TableCell>
                        <TableCell>
                          {format(new Date(venda.data_venda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {venda.cliente_nome || 'Cliente Avulso'}
                            </div>
                            {venda.cliente_documento && (
                              <div className="text-sm text-gray-500">
                                {venda.cliente_documento}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {venda.usuario_nome}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {venda.total.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(venda.status)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(venda.status_pagamento)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirDialogFechamento(venda)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Finalizar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog de Fechamento */}
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Finalizar Venda {vendaSelecionada?.numero_venda}
                </DialogTitle>
              </DialogHeader>

              {vendaSelecionada && (
                <div className="space-y-6">
                  {/* Informações da Venda */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Informações da Venda</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cliente:</span>
                          <span className="font-medium">
                            {vendaSelecionada.cliente_nome || 'Cliente Avulso'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total:</span>
                          <span className="font-bold text-green-600">
                            {vendaSelecionada.total.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          {getStatusBadge(vendaSelecionada.status)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Resumo do Pagamento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Pago:</span>
                          <span className="font-medium text-blue-600">
                            R$ {totalPagamentos.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Troco:</span>
                          <span className="font-medium text-purple-600">
                            R$ {troco.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Restante:</span>
                          <span className={`font-bold ${restante > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            R$ {restante.toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Itens da Venda */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Itens da Venda
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {vendaSelecionada.itens.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{item.produto_nome}</span>
                              <div className="text-sm text-gray-600">
                                {item.quantidade}x R$ {item.preco_unitario.toFixed(2)}
                              </div>
                            </div>
                            <span className="font-bold">
                              R$ {item.preco_total.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Formas de Pagamento */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Formas de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormaPagamentoComponent
                        onAdd={adicionarPagamento}
                        valorSugerido={Math.max(0, restante)}
                      />
                      
                      {pagamentos.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {pagamentos.map((pagamento, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium capitalize">{pagamento.forma_pagamento}</span>
                                {pagamento.bandeira_cartao && (
                                  <span className="text-sm text-gray-600 ml-2">
                                    ({pagamento.bandeira_cartao})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">
                                  R$ {pagamento.valor.toFixed(2)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removerPagamento(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  ✕
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Troco e Observações */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="troco">Troco (R$)</Label>
                      <Input
                        id="troco"
                        type="number"
                        step="0.01"
                        value={troco}
                        onChange={(e) => setTroco(parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Observações sobre a venda..."
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setDialogAberto(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={finalizarVenda}
                      disabled={restante > 0.01}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar Venda
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
}

// Componente para adicionar formas de pagamento
function FormaPagamentoComponent({ 
  onAdd, 
  valorSugerido 
}: { 
  onAdd: (pagamento: PagamentoVenda) => void;
  valorSugerido: number;
}) {
  const [formaPagamento, setFormaPagamento] = useState('');
  const [valor, setValor] = useState(valorSugerido);
  const [bandeiraCartao, setBandeiraCartao] = useState('');
  const [numeroAutorizacao, setNumeroAutorizacao] = useState('');

  const handleAdd = () => {
    if (!formaPagamento || valor <= 0) return;

    onAdd({
      forma_pagamento: formaPagamento,
      valor,
      bandeira_cartao: bandeiraCartao || undefined,
      numero_autorizacao: numeroAutorizacao || undefined,
    });

    // Reset form
    setFormaPagamento('');
    setValor(0);
    setBandeiraCartao('');
    setNumeroAutorizacao('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Select value={formaPagamento} onValueChange={setFormaPagamento}>
        <SelectTrigger>
          <SelectValue placeholder="Forma de pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dinheiro">Dinheiro</SelectItem>
          <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
          <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
          <SelectItem value="pix">PIX</SelectItem>
          <SelectItem value="transferencia">Transferência</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="number"
        step="0.01"
        placeholder="Valor"
        value={valor}
        onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
      />

      {(formaPagamento.includes('cartao')) && (
        <Input
          placeholder="Bandeira do cartão"
          value={bandeiraCartao}
          onChange={(e) => setBandeiraCartao(e.target.value)}
        />
      )}

      <Button onClick={handleAdd} disabled={!formaPagamento || valor <= 0}>
        Adicionar
      </Button>
    </div>
  );
} 