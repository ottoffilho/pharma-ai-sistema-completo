// =====================================================
// CONSTANTES DAS CATEGORIAS DE MARKUP
// Pharma.AI - Sistema de categorização unificado
// =====================================================

/**
 * Categorias válidas para markup no sistema
 * APENAS estas 4 categorias devem existir
 */
export const CATEGORIAS_MARKUP = {
  ALOPATICOS: 'alopaticos',
  HOMEOPATICOS: 'homeopaticos', 
  EMBALAGENS: 'embalagens',
  REVENDA: 'revenda'
} as const;

/**
 * Array com todas as categorias válidas
 */
export const CATEGORIAS_VALIDAS = Object.values(CATEGORIAS_MARKUP);

/**
 * Tipo TypeScript para as categorias
 */
export type CategoriaMarkup = typeof CATEGORIAS_MARKUP[keyof typeof CATEGORIAS_MARKUP];

/**
 * Mapeia tipos de produto para categorias de markup
 */
export function mapearTipoParaCategoria(tipoProduto: string): CategoriaMarkup {
  const tipo = (tipoProduto || '').trim().toUpperCase();
  switch (tipo) {
    case 'EMBALAGEM':
    case 'EMBALAGENS':
      return CATEGORIAS_MARKUP.EMBALAGENS;
    
    case 'MATERIA_PRIMA':
    case 'MATÉRIA_PRIMA':
    case 'PRINCIPIO_ATIVO':
    case 'PRINCÍPIO_ATIVO':
      return CATEGORIAS_MARKUP.ALOPATICOS;
    
    case 'HOMEOPATICO':
    case 'HOMEOPÁTICO':
      return CATEGORIAS_MARKUP.HOMEOPATICOS;
    
    default:
      return CATEGORIAS_MARKUP.REVENDA;
  }
}

/**
 * Valida se uma categoria é válida
 */
export function isCategoriaValida(categoria: string): categoria is CategoriaMarkup {
  return CATEGORIAS_VALIDAS.includes(categoria as CategoriaMarkup);
}

/**
 * Normaliza uma categoria para o padrão correto
 * ou retorna 'revenda' como fallback
 */
export function normalizarCategoria(categoria: string): CategoriaMarkup {
  const categoriaLower = categoria.toLowerCase();
  
  // Mapeamentos de categorias antigas/incorretas
  const mapeamentos: Record<string, CategoriaMarkup> = {
    'medicamentos': CATEGORIAS_MARKUP.REVENDA,
    'alopático': CATEGORIAS_MARKUP.ALOPATICOS,
    'alopáticos': CATEGORIAS_MARKUP.ALOPATICOS,
    'homeopático': CATEGORIAS_MARKUP.HOMEOPATICOS,
    'homeopáticos': CATEGORIAS_MARKUP.HOMEOPATICOS,
    'embalagem': CATEGORIAS_MARKUP.EMBALAGENS,
    'insumos': CATEGORIAS_MARKUP.REVENDA,
    'cosméticos': CATEGORIAS_MARKUP.REVENDA,
    'medicamento': CATEGORIAS_MARKUP.REVENDA
  };
  
  // Verificar se existe mapeamento
  if (mapeamentos[categoriaLower]) {
    return mapeamentos[categoriaLower];
  }
  
  // Verificar se já é uma categoria válida
  if (isCategoriaValida(categoriaLower)) {
    return categoriaLower as CategoriaMarkup;
  }
  
  // Fallback para revenda
  return CATEGORIAS_MARKUP.REVENDA;
} 