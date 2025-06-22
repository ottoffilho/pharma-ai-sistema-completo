import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  DollarSign,
  Calculator,
  Package,
  Activity,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';

interface NotaFiscalCardsProps {
  notaFiscal: {
    valor_total_nota: number;
    valor_produtos: number;
    valor_icms?: number;
    valor_ipi?: number;
    valor_pis?: number;
    valor_cofins?: number;
    itens: any[];
  };
}

export function NotaFiscalCards({ notaFiscal }: NotaFiscalCardsProps) {
  const impostosTotais = (notaFiscal.valor_icms || 0) + 
                        (notaFiscal.valor_ipi || 0) + 
                        (notaFiscal.valor_pis || 0) + 
                        (notaFiscal.valor_cofins || 0);

  const percentualImpostos = notaFiscal.valor_total_nota > 0 
    ? (impostosTotais / notaFiscal.valor_total_nota) * 100 
    : 0;

  const percentualProdutos = notaFiscal.valor_total_nota > 0
    ? (notaFiscal.valor_produtos / notaFiscal.valor_total_nota) * 100
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {formatCurrency(notaFiscal.valor_total_nota)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {notaFiscal.itens.length} itens
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Produtos</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(notaFiscal.valor_produtos)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <Progress value={percentualProdutos} className="mt-3 h-2" />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Impostos</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {formatCurrency(impostosTotais)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Calculator className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Target className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-600 dark:text-purple-400">
              {percentualImpostos.toFixed(1)}% do total
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Performance</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">95%</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-600 dark:text-orange-400">Processamento OK</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 