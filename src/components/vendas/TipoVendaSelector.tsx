// =====================================================
// COMPONENTE: TipoVendaSelector
// Seletor de tipo de venda para PDV
// =====================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package,
  Pill,
  Truck,
  CreditCard,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type TipoVenda = 'MANIPULADO' | 'ALOPATICO' | 'DELIVERY' | 'PBM';

interface TipoVendaSelectorProps {
  tipoSelecionado: TipoVenda;
  onTipoChange: (tipo: TipoVenda) => void;
  className?: string;
}

interface OpcaoTipo {
  value: TipoVenda;
  label: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  description: string;
  tooltip?: string;
  color: string;
  bgColor: string;
}

const opcoesDescricoes: Record<TipoVenda, OpcaoTipo> = {
  MANIPULADO: {
    value: 'MANIPULADO',
    label: 'Manipulado',
    icon: Package,
    enabled: true,
    description: 'Produtos manipulados',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  ALOPATICO: {
    value: 'ALOPATICO',
    label: 'Alopático',
    icon: Pill,
    enabled: true,
    description: 'Produtos para revenda',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  DELIVERY: {
    value: 'DELIVERY',
    label: 'Delivery',
    icon: Truck,
    enabled: true,
    description: 'Vendas com entrega a domicílio',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  PBM: {
    value: 'PBM',
    label: 'PBM',
    icon: CreditCard,
    enabled: true,
    description: 'Programa de Benefício Médico',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  }
};

export const TipoVendaSelector: React.FC<TipoVendaSelectorProps> = ({
  tipoSelecionado,
  onTipoChange,
  className
}) => {
  const handleTipoClick = (tipo: TipoVenda) => {
    const opcao = opcoesDescricoes[tipo];
    
    if (!opcao.enabled) {
      // Não permite seleção de tipos desabilitados
      return;
    }
    
    onTipoChange(tipo);
  };

  const opcaoSelecionada = opcoesDescricoes[tipoSelecionado];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <opcaoSelecionada.icon className="h-5 w-5" />
          Tipo de Venda
          <Badge variant="outline" className="ml-auto">
            {opcaoSelecionada.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(opcoesDescricoes).map((opcao) => {
            const isSelected = opcao.value === tipoSelecionado;
            const Icon = opcao.icon;

            return (
              <TooltipProvider key={opcao.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-auto p-4 flex flex-col items-center gap-3 relative transition-all",
                        isSelected && opcao.enabled ? 
                          "border-blue-500 bg-blue-50 shadow-md" : 
                          opcao.bgColor,
                        !opcao.enabled && "opacity-60"
                      )}
                      onClick={() => handleTipoClick(opcao.value)}
                      disabled={!opcao.enabled}
                    >
                      {/* Indicador de seleção */}
                      {isSelected && opcao.enabled && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                      )}
                      
                      {/* Ícone */}
                      <Icon className={cn(
                        "h-6 w-6",
                        isSelected && opcao.enabled ? "text-blue-600" : opcao.color
                      )} />
                      
                      {/* Label */}
                      <div className="text-center">
                        <div className={cn(
                          "font-medium text-sm",
                          isSelected && opcao.enabled ? "text-blue-700" : opcao.color
                        )}>
                          {opcao.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 break-words leading-tight text-center">
                          {opcao.description}
                        </div>
                      </div>
                      
                      {/* Status indicator */}
                      {!opcao.enabled && (
                        <div className="absolute top-2 left-2">
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </Button>
                  </TooltipTrigger>
                  
                  {opcao.tooltip && (
                    <TooltipContent side="bottom">
                      <p className="text-sm">{opcao.tooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        
        {/* Informações adicionais sobre o tipo selecionado */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>Tipo selecionado:</strong> {opcaoSelecionada.label}
              <br />
              <span className="text-blue-600">
                {opcaoSelecionada.description}
              </span>
              {tipoSelecionado === 'MANIPULADO' && (
                <>
                  <br />
                  <span className="text-blue-700 font-medium">
                    → Próximo passo: Selecionar Ordem de Produção
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 