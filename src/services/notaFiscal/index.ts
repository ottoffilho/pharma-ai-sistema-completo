// =====================================================
// BARREL FILE - SERVIÇOS DE NOTA FISCAL - PHARMA.AI
// =====================================================

// Serviço principal (CRUD)
export * from './notaFiscal.service';

// Serviço de importação XML
export * from './notaFiscal.import.service';

// Serviço de documentos (DANFE/XML)
export * from './notaFiscal.document.service';

// Utilitários
export * from './notaFiscal.utils';

// Parser de XML
export * from './notaFiscal.xml.parser';

// Processamento de produtos
export * from './notaFiscal.produto.processor';

// Diagnósticos (não exportar por padrão - uso interno)
// export * from './notaFiscal.diagnostics'; 