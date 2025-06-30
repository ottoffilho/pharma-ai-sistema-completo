// Utilitários para cálculos de fórmulas farmacêuticas

export interface Capsula {
  id: string;
  numero: string;
  volume_ml: number;
  descricao: string;
}

export interface Recipiente {
  id: string;
  tipo: string;
  volume_ml: number;
  material: string;
  cor: string;
  descricao: string;
}

/**
 * Calcula o volume a partir da massa e densidade
 * @param massa_g Massa em gramas
 * @param densidade Densidade em g/ml
 * @returns Volume em ml
 */
export function calcVolume(massa_g: number, densidade: number): number {
  if (densidade <= 0) {
    throw new Error('Densidade deve ser maior que zero');
  }
  return massa_g / densidade;
}

/**
 * Calcula a massa a partir do volume e densidade
 * @param volume_ml Volume em ml
 * @param densidade Densidade em g/ml
 * @returns Massa em gramas
 */
export function calcMassa(volume_ml: number, densidade: number): number {
  return volume_ml * densidade;
}

/**
 * Sugere o tamanho de cápsula adequado baseado no volume
 * @param volume_ml Volume total em ml
 * @param capsulas Lista de cápsulas disponíveis
 * @returns Cápsula sugerida ou null se nenhuma comportar o volume
 */
export function suggestCapsuleSize(volume_ml: number, capsulas: Capsula[]): Capsula | null {
  // Ordenar cápsulas por volume (menor para maior)
  const capsulasSorted = [...capsulas].sort((a, b) => a.volume_ml - b.volume_ml);
  
  // Encontrar a menor cápsula que comporta o volume
  for (const capsula of capsulasSorted) {
    if (capsula.volume_ml >= volume_ml) {
      return capsula;
    }
  }
  
  return null; // Nenhuma cápsula comporta o volume
}

/**
 * Sugere recipiente adequado baseado no volume e forma farmacêutica
 * @param volume_total_ml Volume total em ml
 * @param tipo_forma Tipo de forma farmacêutica (pomada, creme, solução, etc)
 * @param recipientes Lista de recipientes disponíveis
 * @returns Recipiente sugerido ou null
 */
export function suggestRecipient(
  volume_total_ml: number, 
  tipo_forma: string, 
  recipientes: Recipiente[]
): Recipiente | null {
  // Mapear formas farmacêuticas para tipos de recipiente preferidos
  const tipoRecipienteMap: Record<string, string[]> = {
    'pomada': ['pote'],
    'creme': ['pote'],
    'gel': ['pote', 'frasco'],
    'solução': ['frasco'],
    'suspensão': ['frasco'],
    'xarope': ['frasco'],
    'loção': ['frasco'],
    'óleo': ['frasco'],
    'spray': ['frasco'],
    'colírio': ['frasco'],
    'injetável': ['seringa']
  };

  // Obter tipos de recipiente preferidos para a forma farmacêutica
  const tiposPreferidos = tipoRecipienteMap[tipo_forma.toLowerCase()] || ['frasco'];
  
  // Filtrar recipientes por tipo e que comportem o volume
  const recipientesFiltrados = recipientes
    .filter(r => tiposPreferidos.includes(r.tipo) && r.volume_ml >= volume_total_ml)
    .sort((a, b) => a.volume_ml - b.volume_ml);

  // Retornar o menor recipiente que comporta o volume
  return recipientesFiltrados[0] || null;
}

/**
 * Calcula a concentração percentual peso/volume
 * @param massa_ativo Massa do princípio ativo em gramas
 * @param volume_total Volume total em ml
 * @returns Concentração em % p/v
 */
export function calculateConcentration(massa_ativo: number, volume_total: number): number {
  if (volume_total <= 0) {
    throw new Error('Volume total deve ser maior que zero');
  }
  return (massa_ativo / volume_total) * 100;
}

/**
 * Valida se a densidade está dentro de faixas típicas
 * @param densidade Densidade em g/ml
 * @param tipo_produto Tipo de produto (sólido, líquido, etc)
 * @returns true se válida, false caso contrário
 */
export function validateDensity(densidade: number, tipo_produto?: string): boolean {
  if (densidade <= 0) return false;
  
  // Faixas típicas de densidade
  const faixasDensidade: Record<string, [number, number]> = {
    'sólido': [0.5, 3.0],    // Pós e sólidos farmacêuticos
    'líquido': [0.7, 1.5],   // Líquidos farmacêuticos
    'óleo': [0.8, 1.0],      // Óleos
    'creme': [0.9, 1.2],     // Cremes e pomadas
    'gel': [0.9, 1.1]        // Géis
  };

  if (tipo_produto && faixasDensidade[tipo_produto]) {
    const [min, max] = faixasDensidade[tipo_produto];
    return densidade >= min && densidade <= max;
  }

  // Validação genérica
  return densidade >= 0.1 && densidade <= 5.0;
}

/**
 * Formata volume para exibição
 * @param volume_ml Volume em ml
 * @returns String formatada
 */
export function formatVolume(volume_ml: number): string {
  if (volume_ml < 1) {
    return `${(volume_ml * 1000).toFixed(0)}μl`;
  } else if (volume_ml >= 1000) {
    return `${(volume_ml / 1000).toFixed(1)}L`;
  } else {
    return `${volume_ml.toFixed(1)}ml`;
  }
}

/**
 * Formata massa para exibição
 * @param massa_g Massa em gramas
 * @returns String formatada
 */
export function formatMassa(massa_g: number): string {
  if (massa_g < 0.001) {
    return `${(massa_g * 1000000).toFixed(0)}μg`;
  } else if (massa_g < 1) {
    return `${(massa_g * 1000).toFixed(0)}mg`;
  } else if (massa_g >= 1000) {
    return `${(massa_g / 1000).toFixed(1)}kg`;
  } else {
    return `${massa_g.toFixed(1)}g`;
  }
} 