// =====================================================
// COMPONENTE: CarrinhoOrdemProducao
// Carrinho read-only para vendas de ordem de produção
// =====================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package,
  User,
  DollarSign,
  Lock,
  AlertCircle,
  Calendar,
  Edit,
  Trash2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ItemOrdem {
  id: string;
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  observacoes?: string;
}

interface OrdemProducao {
  id: string;
  numero_ordem: string;
  cliente_nome?: string;
  valor_total?: number;
  data_conclusao?: string;
  observacoes_gerais?: string;
  itens?: ItemOrdem[];
}

interface CarrinhoOrdemProducaoProps {
  ordem: OrdemProducao | null;
  onRemoverOrdem: () => void;
  onEditarOrdem?: () => void;
  className?: string;
}

export const CarrinhoOrdemProducao: React.FC<CarrinhoOrdemProducaoProps> = ({
  ordem,
  onRemoverOrdem,
  onEditarOrdem,
  className
}) => {
  const formatarDinheiro = (valor: number) => {
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

  if (!ordem) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Carrinho
            <Badge variant="secondary" className="ml-auto">
              Vazio
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 font-medium mb-2">Nenhuma ordem selecionada</p>
          <p className="text-sm text-gray-500">
            Selecione uma ordem de produção para iniciar a venda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Carrinho
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Lock className="h-3 w-3 mr-1" />
            Ordem: {ordem.numero_ordem}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações da ordem */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-blue-800">
                Origem: OP-{ordem.numero_ordem}
              </div>
              {ordem.cliente_nome && (
                <div className="flex items-center gap-1 text-sm text-blue-700">
                  <User className="h-3 w-3" />
                  {ordem.cliente_nome}
                </div>
              )}
              {ordem.data_conclusao && (
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <Calendar className="h-3 w-3" />
                  Concluída: {formatarData(ordem.data_conclusao)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Aviso sobre restrições */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <strong>Carrinho bloqueado:</strong> Itens não podem ser editados ou removidos individualmente. 
              Esta venda está vinculada a uma ordem de produção.
            </div>
          </div>
        </div>

        {/* Lista de itens */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Itens da Ordem</h4>
            <Badge variant="secondary">
              {ordem.itens?.length || 0} item(ns)
            </Badge>
          </div>

          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {ordem.itens && ordem.itens.length > 0 ? (
                ordem.itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 mb-1">
                        {item.produto_nome}
                      </div>
                      <div className="text-xs text-gray-600">
                        Qtd: {item.quantidade} × {formatarDinheiro(item.preco_unitario)}
                      </div>
                      {item.observacoes && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          {item.observacoes}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-3">
                      <div className="font-medium text-sm">
                        {formatarDinheiro(item.preco_total)}
                      </div>
                    </div>

                    {/* Botões desabilitados para mostrar que não podem ser usados */}
                    <div className="flex items-center gap-1 ml-3 opacity-30">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Não é possível editar itens de ordem de produção</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Não é possível remover itens de ordem de produção</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum item encontrado na ordem</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Observações da ordem */}
        {ordem.observacoes_gerais && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {ordem.observacoes_gerais}
            </div>
          </div>
        )}

        <Separator />

        {/* Resumo financeiro */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total da Venda
            </span>
            <span className="text-green-700">
              {formatarDinheiro(ordem.valor_total || 0)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Ações */}
        <div className="flex gap-2">
          {onEditarOrdem && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditarOrdem}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Trocar Ordem
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRemoverOrdem}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover Ordem
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 