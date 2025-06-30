// =====================================================
// COMPONENTE: SeletorOrdemProducao
// Modal para seleção de ordem de produção no PDV
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search,
  Package,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrdensProducaoProntas } from '@/hooks/useOrdensProducaoProntas';

interface OrdemProducaoPronta {
  id: string;
  numero_ordem: string;
  cliente_id?: string;
  cliente_nome?: string;
  valor_total?: number;
  data_conclusao?: string;
  itens_count?: number;
}

interface SeletorOrdemProducaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrdemSelecionada: (ordem: OrdemProducaoPronta) => void;
  ordemAtual?: OrdemProducaoPronta | null;
}

export const SeletorOrdemProducao: React.FC<SeletorOrdemProducaoProps> = ({
  open,
  onOpenChange,
  onOrdemSelecionada,
  ordemAtual
}) => {
  const { ordens, loading, error, buscarOrdens, buscarOrdemDetalhes } = useOrdensProducaoProntas();
  const [termoBusca, setTermoBusca] = useState('');
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemProducaoPronta | null>(ordemAtual || null);
  const [detalhesOrdem, setDetalhesOrdem] = useState<any>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  // Buscar ordens quando modal abre
  useEffect(() => {
    if (open) {
      buscarOrdens();
      setOrdemSelecionada(ordemAtual || null);
    }
  }, [open, buscarOrdens, ordemAtual]);

  // Buscar detalhes quando ordem é selecionada
  useEffect(() => {
    if (ordemSelecionada && ordemSelecionada.id !== detalhesOrdem?.id) {
      const carregarDetalhes = async () => {
        try {
          setLoadingDetalhes(true);
          const detalhes = await buscarOrdemDetalhes(ordemSelecionada.id);
          setDetalhesOrdem(detalhes);
        } catch (error) {
          console.error('Erro ao carregar detalhes:', error);
        } finally {
          setLoadingDetalhes(false);
        }
      };
      
      carregarDetalhes();
    }
  }, [ordemSelecionada, buscarOrdemDetalhes]);

  const ordensFiltered = ordens.filter(ordem => {
    if (!termoBusca) return true;
    
    const termo = termoBusca.toLowerCase();
    return (
      ordem.numero_ordem?.toLowerCase().includes(termo) ||
      ordem.cliente_nome?.toLowerCase().includes(termo) ||
      ordem.id.toLowerCase().includes(termo)
    );
  });

  const formatarDinheiro = (valor?: number) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data?: string) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleConfirmarSelecao = () => {
    if (ordemSelecionada) {
      onOrdemSelecionada(ordemSelecionada);
      onOpenChange(false);
    }
  };

  const handleLimparSelecao = () => {
    setOrdemSelecionada(null);
    setDetalhesOrdem(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Selecionar Ordem de Produção
          </DialogTitle>
          <DialogDescription>
            Escolha uma ordem de produção pronta para venda. Apenas ordens finalizadas aparecem aqui.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Lista de ordens - Lado esquerdo */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Busca e refresh */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por número, cliente..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={buscarOrdens}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>

            {/* Status da busca */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">
                {loading ? (
                  "Carregando ordens..."
                ) : error ? (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </span>
                ) : (
                  `${ordensFiltered.length} ordem(ns) pronta(s)`
                )}
              </div>
              
              {ordemSelecionada && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLimparSelecao}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar seleção
                </Button>
              )}
            </div>

            {/* Lista de ordens */}
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-2">
                {loading ? (
                  // Skeleton loading
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="p-3">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </Card>
                  ))
                ) : ordensFiltered.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhuma ordem encontrada</p>
                    <p className="text-sm">
                      {termoBusca ? 'Tente buscar com outros termos' : 'Não há ordens prontas para venda'}
                    </p>
                  </div>
                ) : (
                  ordensFiltered.map((ordem) => (
                    <Card
                      key={ordem.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all hover:shadow-md",
                        ordemSelecionada?.id === ordem.id
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => setOrdemSelecionada(ordem)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            OP-{ordem.numero_ordem}
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pronta
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-3 w-3" />
                          {ordem.cliente_nome || 'Cliente não informado'}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {formatarData(ordem.data_conclusao)}
                          </div>
                          <div className="flex items-center gap-1 font-medium text-green-700">
                            <DollarSign className="h-3 w-3" />
                            {formatarDinheiro(ordem.valor_total)}
                          </div>
                        </div>
                        
                        {ordem.itens_count && (
                          <div className="text-xs text-gray-500">
                            {ordem.itens_count} item(ns)
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Detalhes da ordem - Lado direito */}
          <div className="w-80 flex flex-col">
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Detalhes da Ordem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!ordemSelecionada ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Selecione uma ordem para ver os detalhes</p>
                  </div>
                ) : loadingDetalhes ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Número</label>
                      <p className="text-lg font-semibold">OP-{ordemSelecionada.numero_ordem}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Cliente</label>
                      <p>{ordemSelecionada.cliente_nome || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total</label>
                      <p className="text-lg font-semibold text-green-700">
                        {formatarDinheiro(ordemSelecionada.valor_total)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Concluída em</label>
                      <p>{formatarData(ordemSelecionada.data_conclusao)}</p>
                    </div>

                    {detalhesOrdem?.observacoes_gerais && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Observações</label>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {detalhesOrdem.observacoes_gerais}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleConfirmarSelecao}
            disabled={!ordemSelecionada}
            className="min-w-32"
          >
            {ordemSelecionada ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Seleção
              </>
            ) : (
              'Selecione uma ordem'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 