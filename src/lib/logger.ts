/**
 * Módulo de logging centralizado com funcionalidades para sanitizar dados sensíveis
 */

// Lista de chaves sensíveis que devem ser redatadas nos logs
const SENSITIVE_KEYS = [
  'password', 'senha', 'token', 'secret', 'key', 'api_key', 'apiKey', 
  'auth', 'credentials', 'credit_card', 'creditCard', 'cvv', 'cvc'
];

// Controle de logging por módulo
const isDev = import.meta.env.DEV;

// Configuração de logging - CONTROLE CENTRAL
const LOGGING_CONFIG = {
  // DESATIVE LOGS VERBOSOS POR PADRÃO - apenas erros críticos
  VERBOSE: false,
  
  // Módulos específicos que podem ter logs (apenas quando VERBOSE = true)
  MODULES: {
    AUTH: false,          // Logs de autenticação
    IMPORT: false,        // Logs de importação XML
    DATABASE: false,      // Logs de banco de dados
    FORMS: false,         // Logs de formulários
    NAVIGATION: false,    // Logs de navegação
    DEBUG: false          // Logs de debug geral
  },
  
  // Apenas logs críticos sempre aparecem
  ALWAYS_SHOW: {
    ERRORS: true,         // Sempre mostrar erros
    WARNINGS: false,      // Mostrar avisos apenas se necessário
    SUCCESS: false        // Mostrar sucessos apenas se necessário
  }
};

// Função para sanitizar objetos recursivamente
const sanitizeObject = (obj: unknown): unknown => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  return Object.entries(obj as Record<string, unknown>).reduce((acc, [key, value]) => {
    // Verifique se a chave contém palavras sensíveis
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive && value) {
      // Redatar valores sensíveis
      acc[key] = typeof value === 'string' 
        ? '********' 
        : '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      // Sanitizar objetos aninhados
      acc[key] = sanitizeObject(value);
    } else {
      acc[key] = value;
    }

    return acc;
  }, {} as Record<string, unknown>);
};

// Interface para o logger
interface Logger {
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  // Logs por módulo específico
  auth: (message: string, ...args: unknown[]) => void;
  import: (message: string, ...args: unknown[]) => void;
  database: (message: string, ...args: unknown[]) => void;
  forms: (message: string, ...args: unknown[]) => void;
  navigation: (message: string, ...args: unknown[]) => void;
}

// Função helper para verificar se deve fazer log
const shouldLog = (module?: keyof typeof LOGGING_CONFIG.MODULES): boolean => {
  if (!isDev) return false;
  if (!LOGGING_CONFIG.VERBOSE) return false;
  if (module && !LOGGING_CONFIG.MODULES[module]) return false;
  return true;
};

// Implementação do logger
const logger: Logger = {
  // SEMPRE MOSTRAR ERROS
  error: (message: string, ...args: unknown[]): void => {
    if (LOGGING_CONFIG.ALWAYS_SHOW.ERRORS) {
      console.error(
        `[ERROR] ${message}`, 
        ...args.map(arg => sanitizeObject(arg))
      );
    }
  },
  
  // AVISOS APENAS SE CONFIGURADO
  warn: (message: string, ...args: unknown[]): void => {
    if (LOGGING_CONFIG.ALWAYS_SHOW.WARNINGS || shouldLog()) {
      console.warn(
        `[WARN] ${message}`, 
        ...args.map(arg => sanitizeObject(arg))
      );
    }
  },
  
  // INFO APENAS EM MODO VERBOSE
  info: (message: string, ...args: unknown[]): void => {
    if (shouldLog()) {
      console.info(
        `[INFO] ${message}`, 
        ...args.map(arg => sanitizeObject(arg))
      );
    }
  },
  
  // DEBUG APENAS EM MODO VERBOSE
  debug: (message: string, ...args: unknown[]): void => {
    if (shouldLog('DEBUG')) {
      console.log(
        `[DEBUG] ${message}`, 
        ...args.map(arg => sanitizeObject(arg))
      );
    }
  },

  // LOGS POR MÓDULO ESPECÍFICO
  auth: (message: string, ...args: unknown[]): void => {
    if (shouldLog('AUTH')) {
      console.log(
        `[AUTH] ${message}`, 
        ...args.map(arg => sanitizeObject(arg))
      );
    }
  },

  import: (message: string, ...args: unknown[]): void => {
    if (shouldLog('IMPORT')) {
      console.log(
        `[IMPORT] ${message}`, 
        ...args.map(arg => sanitizeObject(arg))
      );
    }
  },

  database: (message: string, ...args: unknown[]): void => {
    if (shouldLog('DATABASE')) {
      console.log(
        `[DB] ${message}`, 
        ...args.map(arg => sanitizeObject(arg))
      );
    }
  },

  forms: (message: string, ...args: unknown[]): void => {
    if (shouldLog('FORMS')) {
      console.log(
        `[FORMS] ${message}`, 
        ...args.map(arg => sanitizeObject(arg))
      );
    }
  },

  navigation: (message: string, ...args: unknown[]): void => {
    if (shouldLog('NAVIGATION')) {
      console.log(
        `[NAV] ${message}`, 
        ...args.map(arg => sanitizeObject(arg))
      );
    }
  }
};

export default logger;

// Função para habilitar logs verbosos (para debug específico)
export const enableVerboseLogging = (modules?: (keyof typeof LOGGING_CONFIG.MODULES)[]): void => {
  LOGGING_CONFIG.VERBOSE = true;
  if (modules) {
    modules.forEach(module => {
      LOGGING_CONFIG.MODULES[module] = true;
    });
  } else {
    // Habilitar todos os módulos
    Object.keys(LOGGING_CONFIG.MODULES).forEach(key => {
      LOGGING_CONFIG.MODULES[key as keyof typeof LOGGING_CONFIG.MODULES] = true;
    });
  }
  console.log('🔍 Logging verboso habilitado para:', modules || 'TODOS OS MÓDULOS');
};

// Função para desabilitar logs verbosos
export const disableVerboseLogging = (): void => {
  LOGGING_CONFIG.VERBOSE = false;
  Object.keys(LOGGING_CONFIG.MODULES).forEach(key => {
    LOGGING_CONFIG.MODULES[key as keyof typeof LOGGING_CONFIG.MODULES] = false;
  });
  console.log('🔇 Logging verboso desabilitado');
};

// Ative para ver logs de debug no console. Desative para manter console limpo mesmo em dev.
const VERBOSE = false;

// Log simples mostrado apenas em ambiente de desenvolvimento (CONTROLADO)
export const log = (...args: unknown[]): void => {
  if (isDev && VERBOSE && LOGGING_CONFIG.VERBOSE) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

// Avisos mostrados apenas em desenvolvimento (CONTROLADO)
export const warn = (...args: unknown[]): void => {
  if (isDev && VERBOSE && LOGGING_CONFIG.VERBOSE) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
};

// Erros devem aparecer sempre
export const error = (...args: unknown[]): void => {
  // eslint-disable-next-line no-console
  console.error(...args);
};

// Logs específicos para produção (apenas erros críticos)
export const logError = (...args: unknown[]): void => {
  console.error('[CRITICAL]', ...args);
};

export const logSuccess = (message: string, ...args: unknown[]): void => {
  if (LOGGING_CONFIG.ALWAYS_SHOW.SUCCESS || shouldLog()) {
    console.log(`✅ ${message}`, ...args);
  }
};

// Helper para debug temporário (sempre aparece)
export const debugLog = (...args: unknown[]): void => {
  if (isDev) {
    console.log('[TEMP-DEBUG]', ...args);
  }
}; 