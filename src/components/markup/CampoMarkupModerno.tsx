import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Calculator, 
  TrendingUp, 
  Sparkles,
  Info,
  ChevronUp,
  ChevronDown,
  DollarSign,
  Percent
} from 'lucide-react';
import { markupService } from '@/services/markupService';
import type { MarkupCalculationResult } from '@/types/markup';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CampoMarkupModernoProps {
  value: number;
  onChange: (markup: number) => void;
  precoCusto?: number;
  categoria?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// Markups predefinidos por categoria (sugestões, não limitações)
const markupPresets = {
  MEDICAMENTO: { default: 6, min: 1, max: 50, step: 0.1 },
  COSMÉTICO: { default: 8, min: 1, max: 50, step: 0.1 },
  INSUMO: { default: 5, min: 1, max: 50, step: 0.1 },
  EMBALAGEM: { default: 4, min: 1, max: 50, step: 0.1 },
};

export const CampoMarkupModerno: React.FC<CampoMarkupModernoProps> = ({
  value,
  onChange,
  precoCusto,
  categoria = 'MEDICAMENTO',
  label = "Markup Inteligente",
  error,
  disabled = false,
  className = ""
}) => {
  const [calculation, setCalculation] = useState<MarkupCalculationResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const preset = markupPresets[categoria as keyof typeof markupPresets] || markupPresets.MEDICAMENTO;

  // Calcular preço de venda quando markup ou preço de custo mudar
  useEffect(() => {
    if (precoCusto && value) {
      try {
        const result = markupService.calcularPrecoVenda({
          preco_custo: precoCusto,
          markup: value
        });
        setCalculation(result);
      } catch (error) {
        console.error('Erro ao calcular preço:', error);
        setCalculation(null);
      }
    } else {
      setCalculation(null);
    }
  }, [precoCusto, value]);

  const handleMarkupChange = (newValue: number) => {
    // Permitir qualquer valor positivo (remover limitação rígida)
    const clampedValue = Math.max(0.1, newValue);
    onChange(clampedValue);
  };

  const handleSliderChange = (values: number[]) => {
    handleMarkupChange(values[0]);
  };

  const incrementMarkup = () => {
    handleMarkupChange(value + preset.step);
  };

  const decrementMarkup = () => {
    handleMarkupChange(value - preset.step);
  };

  const aplicarMarkupPadrao = () => {
    onChange(preset.default);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Calcular cor baseada no markup
  const getMarkupColor = () => {
    const percentage = ((value - preset.min) / (preset.max - preset.min)) * 100;
    if (percentage < 33) return 'from-red-500 to-orange-500';
    if (percentage < 66) return 'from-amber-500 to-yellow-500';
    return 'from-emerald-500 to-green-500';
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-600" />
            {label}
          </Label>
          
          <div className="flex items-center gap-2">
            {value !== preset.default && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={aplicarMarkupPadrao}
                  disabled={disabled}
                  className="text-xs h-7 px-2"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Usar {preset.default}x
                </Button>
              </motion.div>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  O markup é o multiplicador aplicado ao custo para calcular o preço de venda.
                  Ex: Markup 6x = preço 6 vezes maior que o custo.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Card Principal com Glass-morphism */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-900/70 backdrop-blur-md">
          <div className="p-6 space-y-6">
            {/* Input Visual com Controles */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {/* Botão Decrementar */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={decrementMarkup}
                  disabled={disabled || value <= preset.min}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    "bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.button>

                {/* Display do Valor */}
                <div className="flex-1 relative">
                  {isEditing ? (
                    <Input
                      type="number"
                      step={preset.step}
                      min={preset.min}
                      max={preset.max}
                      value={value}
                      onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                      onBlur={() => setIsEditing(false)}
                      disabled={disabled}
                      className="text-center text-2xl font-bold h-14"
                      autoFocus
                    />
                  ) : (
                    <motion.div
                      onClick={() => !disabled && setIsEditing(true)}
                      className={cn(
                        "h-14 rounded-lg flex items-center justify-center cursor-pointer",
                        "bg-gradient-to-br", getMarkupColor(),
                        "text-white font-bold text-2xl",
                        "hover:opacity-90 transition-opacity",
                        disabled && "cursor-not-allowed opacity-50"
                      )}
                      whileHover={!disabled ? { scale: 1.02 } : {}}
                      whileTap={!disabled ? { scale: 0.98 } : {}}
                    >
                      {value.toFixed(1)}x
                    </motion.div>
                  )}
                </div>

                {/* Botão Incrementar */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={incrementMarkup}
                  disabled={disabled || value >= preset.max}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    "bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <ChevronUp className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Slider Visual */}
              <div className="px-2">
                <Slider
                  value={[Math.min(value, preset.max)]} // Limitar apenas visualmente
                  onValueChange={handleSliderChange}
                  min={preset.min}
                  max={preset.max}
                  step={preset.step}
                  disabled={disabled}
                  className="w-full"
                />
                
                {/* Campo de entrada para valores personalizados */}
                <div className="mt-3 flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Valor personalizado:</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="999"
                    value={value}
                    onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0.1)}
                    disabled={disabled}
                    className="h-8 w-20 text-center text-sm"
                    placeholder="0.0"
                  />
                  <span className="text-xs text-muted-foreground">x</span>
                </div>
                
                            {/* Labels do Slider */}
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Sugerido: {preset.min}x - {preset.max}x</span>
              <span className="font-medium">{categoria}</span>
              <span>Atual: {value.toFixed(1)}x</span>
            </div>
            
            {/* Aviso para valores fora da faixa recomendada */}
            {(value < preset.default * 0.5 || value > preset.default * 2) && (
              <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  ⚠️ Markup fora da faixa recomendada para {categoria}. 
                  Valor sugerido: {preset.default}x
                </p>
              </div>
            )}
              </div>
            </div>

            {/* Cálculos em Tempo Real */}
            {precoCusto > 0 && calculation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-3"
              >
                {/* Preço de Venda */}
                <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Venda</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(calculation.preco_venda)}
                  </p>
                </div>

                {/* Lucro */}
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs text-blue-600 dark:text-blue-400">Lucro</span>
                  </div>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(calculation.preco_venda - precoCusto)}
                  </p>
                </div>

                {/* Margem */}
                <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Percent className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-xs text-purple-600 dark:text-purple-400">Margem</span>
                  </div>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {calculation.margem_lucro.toFixed(1)}%
                  </p>
                </div>
              </motion.div>
            )}

            {/* Botão para Mostrar Análise Avançada */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full"
            >
              {showAdvanced ? 'Ocultar' : 'Mostrar'} Análise Avançada
              <motion.div
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 ml-2" />
              </motion.div>
            </Button>

            {/* Análise Avançada */}
            <AnimatePresence>
              {showAdvanced && precoCusto > 0 && calculation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-3 border-t"
                >
                  {/* Comparação com Markups Diferentes */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Comparação de Markups
                    </p>
                    {[preset.min, preset.default, preset.max].map((markupValue) => {
                      const precoVenda = precoCusto * markupValue;
                      const isActive = Math.abs(markupValue - value) < 0.1;
                      
                      return (
                        <motion.button
                          key={markupValue}
                          type="button"
                          onClick={() => onChange(markupValue)}
                          disabled={disabled}
                          className={cn(
                            "w-full p-3 rounded-lg text-left transition-all",
                            isActive
                              ? "bg-emerald-100 dark:bg-emerald-900/50 border-2 border-emerald-500"
                              : "bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{markupValue}x</span>
                              {markupValue === preset.default && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Padrão
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(precoVenda)}</p>
                              <p className="text-xs text-muted-foreground">
                                Lucro: {formatCurrency(precoVenda - precoCusto)}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Fórmula do Cálculo */}
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Fórmula do Cálculo
                    </p>
                    <div className="space-y-1 text-xs font-mono">
                      <p>Preço Venda = Custo × Markup</p>
                      <p className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(calculation.preco_venda)} = {formatCurrency(precoCusto)} × {value}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Mensagem de Erro */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    </TooltipProvider>
  );
}; 