/**
 * Configuração centralizada de logging para desenvolvimento
 * 
 * COMO USAR:
 * 1. Para habilitar logs específicos durante desenvolvimento, mude as flags abaixo
 * 2. Para debug temporário, use: `enableTempDebug()` no console do browser
 * 3. Para desabilitar tudo: `disableAllLogging()` no console do browser
 */

// Configuração principal - MANTER DESABILITADO EM PRODUÇÃO
export const LOGGING_CONFIG = {
  // LOGS POR MÓDULO (só aparecem se DEV_LOGGING = true)
  DEV_LOGGING: false,           // Master switch - controla todos os logs de desenvolvimento
  
  MODULES: {
    AUTH: false,                // Logs de autenticação (login, sessão, etc)
    IMPORT: false,              // Logs de importação XML/NF-e  
    DATABASE: false,            // Logs de queries e operações de banco
    FORMS: false,               // Logs de formulários
    NAVIGATION: false,          // Logs de navegação/roteamento
    API: false,                 // Logs de chamadas de API
    DEBUG: false                // Logs de debug geral
  },
  
  // LOGS CRÍTICOS (sempre aparecem)
  CRITICAL: {
    ERRORS: true,               // Sempre mostrar erros
    WARNINGS: false,            // Mostrar avisos apenas se necessário
    SUCCESS_MAJOR: false        // Mostrar sucessos importantes (ex: importação completa)
  }
};

// Função para habilitar logging temporário (usar no console do browser)
declare global {
  interface Window {
    enableTempDebug: (modules?: string[]) => void;
    disableAllLogging: () => void;
    showLoggingStatus: () => void;
  }
}

// Função para habilitar debug temporário
export const enableTempDebug = (modules?: string[]): void => {
  LOGGING_CONFIG.DEV_LOGGING = true;
  
  if (modules) {
    modules.forEach(module => {
      const moduleKey = module.toUpperCase() as keyof typeof LOGGING_CONFIG.MODULES;
      if (LOGGING_CONFIG.MODULES[moduleKey] !== undefined) {
        LOGGING_CONFIG.MODULES[moduleKey] = true;
      }
    });
  } else {
    // Habilitar todos os módulos
    Object.keys(LOGGING_CONFIG.MODULES).forEach(key => {
      LOGGING_CONFIG.MODULES[key as keyof typeof LOGGING_CONFIG.MODULES] = true;
    });
  }
  
  console.log('🔍 TEMP DEBUG HABILITADO:', modules || 'TODOS OS MÓDULOS');
  console.log('📋 Status atual:', LOGGING_CONFIG);
};

// Função para desabilitar todos os logs
export const disableAllLogging = (): void => {
  LOGGING_CONFIG.DEV_LOGGING = false;
  Object.keys(LOGGING_CONFIG.MODULES).forEach(key => {
    LOGGING_CONFIG.MODULES[key as keyof typeof LOGGING_CONFIG.MODULES] = false;
  });
  console.log('🔇 TODOS OS LOGS DESABILITADOS');
};

// Função para mostrar status atual
export const showLoggingStatus = (): void => {
  console.table({
    'Dev Logging': LOGGING_CONFIG.DEV_LOGGING,
    'Auth': LOGGING_CONFIG.MODULES.AUTH,
    'Import': LOGGING_CONFIG.MODULES.IMPORT,
    'Database': LOGGING_CONFIG.MODULES.DATABASE,
    'Forms': LOGGING_CONFIG.MODULES.FORMS,
    'Navigation': LOGGING_CONFIG.MODULES.NAVIGATION,
    'API': LOGGING_CONFIG.MODULES.API,
    'Debug': LOGGING_CONFIG.MODULES.DEBUG
  });
};

// Expor funções globalmente para uso no console
if (typeof window !== 'undefined') {
  window.enableTempDebug = enableTempDebug;
  window.disableAllLogging = disableAllLogging;
  window.showLoggingStatus = showLoggingStatus;
}

/**
 * GUIA DE USO NO CONSOLE DO BROWSER:
 * 
 * // Habilitar debug temporário para importação
 * enableTempDebug(['import'])
 * 
 * // Habilitar debug para auth + database
 * enableTempDebug(['auth', 'database'])
 * 
 * // Habilitar TODOS os logs
 * enableTempDebug()
 * 
 * // Desabilitar tudo
 * disableAllLogging()
 * 
 * // Ver status atual
 * showLoggingStatus()
 */ 