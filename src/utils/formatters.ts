/**
 * Formatação de valores para padrão brasileiro
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

export function parseCurrency(value: string): number {
  // Remove caracteres não numéricos exceto vírgula e ponto
  const cleaned = value.replace(/[^\d,.-]/g, '')
  
  // Se contém vírgula, assume formato brasileiro
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
  }
  
  // Senão, assume formato americano
  return parseFloat(cleaned)
}

export function formatInputValue(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') {
    return '1'
  }
  return String(value)
} 