import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Package, DollarSign, BarChart3, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Tipos de produtos com ícones
const tiposProduto = {
  'MEDICAMENTO': { label: 'Medicamento', icon: Package, color: 'blue' },
  'COSMÉTICO': { label: 'Cosmético', icon: Package, color: 'pink' },
  'INSUMO': { label: 'Insumo', icon: Package, color: 'emerald' },
  'EMBALAGEM': { label: 'Embalagem', icon: Package, color: 'amber' },
};

// Categorias formatadas
const categoriasFormatadas = {
  'alopaticos': 'Alopáticos',
  'homeopaticos': 'Homeopáticos', 
  'embalagens': 'Embalagens',
  'revenda': 'Revenda',
};

export const ProductPreview: React.FC = () => {
  const { watch } = useFormContext();
  
  // Observar valores do formulário
  const nome = watch('nome') || 'Nome do Produto';
  const tipo = watch('tipo') || 'MEDICAMENTO';
  const categoria_id = watch('categoria_produto_id');
  const custoUnitario = watch('custo_unitario') || 0;
  const markup = watch('markup') || 0;
  const estoqueAtual = watch('estoque_atual') || 0;
  const estoqueMinimo = watch('estoque_minimo') || 0;
  const unidadeMedida = watch('unidade_medida') || 'unidades';
  const codigoInterno = watch('codigo_interno');

  // Calcular preço de venda
  const precoVenda = custoUnitario * markup;
  
  // Determinar status do estoque
  const getEstoqueStatus = () => {
    if (estoqueAtual <= 0) return { status: 'critical', label: 'Sem Estoque', color: 'red' };
    if (estoqueAtual <= estoqueMinimo) return { status: 'low', label: 'Estoque Baixo', color: 'amber' };
    return { status: 'ok', label: 'Estoque OK', color: 'green' };
  };

  const estoqueStatus = getEstoqueStatus();
  const tipoInfo = tiposProduto[tipo as keyof typeof tiposProduto] || tiposProduto.MEDICAMENTO;
  const TipoIcon = tipoInfo.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header do Produto */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            `bg-${tipoInfo.color}-100 dark:bg-${tipoInfo.color}-900/30`
          )}>
            <TipoIcon className={cn("h-5 w-5", `text-${tipoInfo.color}-600 dark:text-${tipoInfo.color}-400`)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-base truncate" title={nome}>
              {nome}
            </h4>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="secondary" className="text-xs">
                {tipoInfo.label}
              </Badge>
              {categoria_id && (
                <Badge variant="outline" className="text-xs">
                  {categoriasFormatadas[categoria_id as keyof typeof categoriasFormatadas] || categoria_id}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Código Interno */}
        {codigoInterno && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            <span>Código: {codigoInterno}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Informações Financeiras */}
      <div className="space-y-3">
        <h5 className="font-medium text-sm text-muted-foreground">Financeiro</h5>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Custo */}
          <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Custo</span>
            </div>
            <p className="text-sm font-bold">
              {formatCurrency(custoUnitario)}
            </p>
          </div>

          {/* Preço de Venda */}
          <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Venda</span>
            </div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(precoVenda)}
            </p>
          </div>
        </div>

        {/* Markup e Lucro */}
        {markup > 0 && custoUnitario > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-950/30">
              <span className="text-xs text-blue-600 dark:text-blue-400">Markup</span>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {markup.toFixed(1)}x
              </p>
            </div>
            
            <div className="text-center p-2 rounded bg-purple-50 dark:bg-purple-950/30">
              <span className="text-xs text-purple-600 dark:text-purple-400">Lucro</span>
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {formatCurrency(precoVenda - custoUnitario)}
              </p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Informações de Estoque */}
      <div className="space-y-3">
        <h5 className="font-medium text-sm text-muted-foreground">Estoque</h5>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Quantidade Atual</span>
          </div>
          <div className="text-right">
            <span className="font-semibold">{estoqueAtual} {unidadeMedida}</span>
          </div>
        </div>

        {/* Status do Estoque */}
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-lg",
          estoqueStatus.color === 'red' && "bg-red-50 dark:bg-red-950/30",
          estoqueStatus.color === 'amber' && "bg-amber-50 dark:bg-amber-950/30", 
          estoqueStatus.color === 'green' && "bg-green-50 dark:bg-green-950/30"
        )}>
          {estoqueStatus.status === 'critical' || estoqueStatus.status === 'low' ? (
            <AlertCircle className={cn(
              "h-4 w-4",
              estoqueStatus.color === 'red' && "text-red-600",
              estoqueStatus.color === 'amber' && "text-amber-600"
            )} />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          
          <span className={cn(
            "text-sm font-medium",
            estoqueStatus.color === 'red' && "text-red-700 dark:text-red-300",
            estoqueStatus.color === 'amber' && "text-amber-700 dark:text-amber-300",
            estoqueStatus.color === 'green' && "text-green-700 dark:text-green-300"
          )}>
            {estoqueStatus.label}
          </span>
        </div>

        {/* Níveis de Estoque */}
        {estoqueMinimo > 0 && (
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Mínimo:</span>
              <span>{estoqueMinimo} {unidadeMedida}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}; 