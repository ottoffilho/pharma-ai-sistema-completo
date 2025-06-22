import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import { markupService } from '@/services/markupService';
import type { MarkupCalculationResult } from '@/types/markup';

interface CampoMarkupProps {
  value: number;
  onChange: (markup: number) => void;
  precoCusto?: number;
  categoria?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  showCalculation?: boolean;
  showCategoryDefault?: boolean;
  className?: string;
}

export const CampoMarkup: React.FC<CampoMarkupProps> = ({
  value,
  onChange,
  precoCusto,
  categoria,
  label = "Markup",
  error,
  disabled = false,
  showCalculation = true,
  showCategoryDefault = true,
  className = ""
}) => {
  const [calculation, setCalculation] = useState<MarkupCalculationResult | null>(null);
  const [validation, setValidation] = useState<{ valido: boolean; mensagem?: string }>({ valido: true });
  const [defaultMarkup, setDefaultMarkup] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar markup padrão da categoria
  useEffect(() => {
    const fetchDefaultMarkup = async () => {
      if (categoria) {
        try {
          const markup = await markupService.obterMarkupPadrao(categoria);
          setDefaultMarkup(markup);
        } catch (error) {
          console.error('Erro ao buscar markup padrão:', error);
        }
      }
    };

    fetchDefaultMarkup();
  }, [categoria]);

  // Validar markup sempre que o valor mudar
  useEffect(() => {
    const validateMarkup = async () => {
      if (value !== undefined && value !== null) {
        try {
          const result = await markupService.validarMarkup({ 
            markup: value, 
            categoria 
          });
          setValidation(result);
        } catch (error) {
          console.error('Erro ao validar markup:', error);
          setValidation({ valido: false, mensagem: 'Erro na validação' });
        }
      }
    };

    validateMarkup();
  }, [value, categoria]);

  // Calcular preço de venda quando markup ou preço de custo mudar
  useEffect(() => {
    if (precoCusto && value && showCalculation) {
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
  }, [precoCusto, value, showCalculation]);

  const handleMarkupChange = (newValue: string) => {
    const numericValue = parseFloat(newValue) || 0;
    onChange(numericValue);
  };

  const aplicarMarkupPadrao = () => {
    if (defaultMarkup) {
      onChange(defaultMarkup);
    }
  };

  const getStatusIcon = () => {
    if (!validation.valido) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (value && value > 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label htmlFor="markup">{label}</Label>
        {getStatusIcon()}
      </div>

      <div className="flex items-center gap-2">
        <Input
          id="markup"
          type="number"
          step="0.01"
          min="0"
          value={value || ''}
          onChange={(e) => handleMarkupChange(e.target.value)}
          disabled={disabled}
          className={`
            ${!validation.valido ? 'border-red-500' : ''}
            ${validation.valido && value > 0 ? 'border-green-500' : ''}
          `}
          placeholder="Ex: 6.00"
        />
        
        {showCategoryDefault && defaultMarkup && defaultMarkup !== value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={aplicarMarkupPadrao}
            disabled={disabled}
            className="text-xs whitespace-nowrap"
          >
            Usar {defaultMarkup}x
          </Button>
        )}
      </div>

      {/* Mostrar erro de validação */}
      {(error || !validation.valido) && (
        <p className="text-sm text-red-600">
          {error || validation.mensagem}
        </p>
      )}

      {/* Mostrar markup padrão da categoria */}
      {showCategoryDefault && defaultMarkup && categoria && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {categoria}: {defaultMarkup}x padrão
          </Badge>
        </div>
      )}

      {/* Mostrar cálculos */}
      {showCalculation && calculation && precoCusto && (
        <Card className="bg-gray-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Cálculo Automático</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Preço Custo:</span>
                <div className="font-medium">{formatCurrency(precoCusto)}</div>
              </div>
              
              <div>
                <span className="text-gray-600">Markup:</span>
                <div className="font-medium">{calculation.markup_aplicado}x</div>
              </div>
              
              <div>
                <span className="text-gray-600">Preço Venda:</span>
                <div className="font-bold text-green-600">
                  {formatCurrency(calculation.preco_venda)}
                </div>
              </div>
              
              <div>
                <span className="text-gray-600">Margem:</span>
                <div className="font-medium text-blue-600">
                  {calculation.margem_lucro.toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 