/**
 * Configuração Global de Variáveis de Ambiente - Pharma.AI
 * 
 * Este arquivo centraliza TODAS as variáveis de ambiente usadas no sistema,
 * garantindo tipagem e validação adequadas.
 */

// =====================================================
// INTERFACES DE TIPAGEM
// =====================================================

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

interface WhatsAppConfig {
  webhookBaseUrl: string;
  webhookToken: string;
  accessToken?: string;
  phoneNumberId?: string;
  verifyToken?: string;
  businessStart: string;
  businessEnd: string;
  timezone: string;
}

interface IntegracaoConfig {
  n8nWebhookUrl?: string;
  n8nAuthToken?: string;
  cnpjApiUrl: string;
  cepApiUrl: string;
  ncmApiUrl?: string;
}

interface AIConfig {
  deepseekApiKey?: string;
  openaiApiKey?: string;
  openaiModel: string;
}

interface EmailConfig {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  resendApiKey?: string;
}

interface AppConfig {
  env: string;
  url: string;
  version: string;
  debug: boolean;
  demoMode: boolean;
  demoEmail?: string;
  demoPassword?: string;
}

interface StorageConfig {
  maxFileSize: number;
  allowedFileTypes: string;
}

interface PerformanceConfig {
  httpTimeout: number;
  defaultPageSize: number;
  autosaveInterval: number;
}

interface SecurityConfig {
  jwtSecret?: string;
  corsOrigin: string;
}

interface FarmaciaConfig {
  cnpj?: string;
  razaoSocial?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

interface MonitoramentoConfig {
  sentryDsn?: string;
  gaId?: string;
}

interface BackupConfig {
  enabled: boolean;
  frequency: string;
  retentionDays: number;
}

interface EnvConfig {
  supabase: SupabaseConfig;
  whatsapp: WhatsAppConfig;
  integracoes: IntegracaoConfig;
  ai: AIConfig;
  email: EmailConfig;
  app: AppConfig;
  storage: StorageConfig;
  performance: PerformanceConfig;
  security: SecurityConfig;
  farmacia: FarmaciaConfig;
  monitoramento: MonitoramentoConfig;
  backup: BackupConfig;
}

// =====================================================
// CONFIGURAÇÃO PRINCIPAL
// =====================================================

export const envConfig: EnvConfig = {
  // Configurações do Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  },

  // Configurações do WhatsApp
  whatsapp: {
    webhookBaseUrl: import.meta.env.VITE_WHATSAPP_WEBHOOK_BASE_URL || 'https://example.supabase.co/functions/v1',
    webhookToken: import.meta.env.VITE_WHATSAPP_WEBHOOK_TOKEN || 'your-webhook-token-here',
    accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: import.meta.env.VITE_WHATSAPP_VERIFY_TOKEN,
    businessStart: import.meta.env.VITE_WHATSAPP_BUSINESS_START || '08:00',
    businessEnd: import.meta.env.VITE_WHATSAPP_BUSINESS_END || '18:00',
    timezone: import.meta.env.VITE_WHATSAPP_TIMEZONE || 'America/Sao_Paulo',
  },

  // Configurações de Integrações
  integracoes: {
    n8nWebhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL,
    n8nAuthToken: import.meta.env.VITE_N8N_AUTH_TOKEN,
    cnpjApiUrl: import.meta.env.VITE_CNPJ_API_URL || 'https://www.receitaws.com.br/v1',
    cepApiUrl: import.meta.env.VITE_CEP_API_URL || 'https://viacep.com.br/ws',
    ncmApiUrl: import.meta.env.VITE_NCM_API_URL,
  },

  // Configurações de IA
  ai: {
    deepseekApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
    openaiApiKey: import.meta.env.OPENAI_API_KEY,
    openaiModel: import.meta.env.OPENAI_MODEL || 'gpt-4',
  },

  // Configurações de Email
  email: {
    smtpHost: import.meta.env.SMTP_HOST,
    smtpPort: import.meta.env.SMTP_PORT ? parseInt(import.meta.env.SMTP_PORT) : undefined,
    smtpUser: import.meta.env.SMTP_USER,
    smtpPass: import.meta.env.SMTP_PASS,
    smtpFrom: import.meta.env.SMTP_FROM,
    resendApiKey: import.meta.env.RESEND_API_KEY,
  },

  // Configurações da Aplicação
  app: {
    env: import.meta.env.VITE_APP_ENV || 'development',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    debug: import.meta.env.VITE_DEBUG === 'true',
    demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
    demoEmail: import.meta.env.VITE_DEMO_EMAIL,
    demoPassword: import.meta.env.VITE_DEMO_PASSWORD,
  },

  // Configurações de Storage
  storage: {
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
    allowedFileTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES || '.xml,.pdf,.jpg,.png',
  },

  // Configurações de Performance
  performance: {
    httpTimeout: parseInt(import.meta.env.VITE_HTTP_TIMEOUT || '30000'),
    defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '50'),
    autosaveInterval: parseInt(import.meta.env.VITE_AUTOSAVE_INTERVAL || '30000'),
  },

  // Configurações de Segurança
  security: {
    jwtSecret: import.meta.env.JWT_SECRET,
    corsOrigin: import.meta.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  // Configurações da Farmácia
  farmacia: {
    cnpj: import.meta.env.VITE_FARMACIA_CNPJ,
    razaoSocial: import.meta.env.VITE_FARMACIA_RAZAO_SOCIAL,
    endereco: import.meta.env.VITE_FARMACIA_ENDERECO,
    telefone: import.meta.env.VITE_FARMACIA_TELEFONE,
    email: import.meta.env.VITE_FARMACIA_EMAIL,
  },

  // Configurações de Monitoramento
  monitoramento: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    gaId: import.meta.env.VITE_GA_ID,
  },

  // Configurações de Backup
  backup: {
    enabled: import.meta.env.BACKUP_ENABLED === 'true',
    frequency: import.meta.env.BACKUP_FREQUENCY || 'daily',
    retentionDays: parseInt(import.meta.env.BACKUP_RETENTION_DAYS || '30'),
  },
};

// =====================================================
// FUNÇÕES DE VALIDAÇÃO
// =====================================================

/**
 * Valida se as configurações obrigatórias estão presentes
 */
export const validateEnvConfig = (): { isValid: boolean; missingVars: string[]; warnings: string[] } => {
  const requiredVars = [
    { key: 'VITE_SUPABASE_URL', value: envConfig.supabase.url },
    { key: 'VITE_SUPABASE_ANON_KEY', value: envConfig.supabase.anonKey },
  ];

  const recommendedVars = [
    { key: 'VITE_WHATSAPP_WEBHOOK_BASE_URL', value: envConfig.whatsapp.webhookBaseUrl },
    { key: 'VITE_WHATSAPP_WEBHOOK_TOKEN', value: envConfig.whatsapp.webhookToken },
    { key: 'VITE_DEEPSEEK_API_KEY', value: envConfig.ai.deepseekApiKey },
  ];

  const missingVars = requiredVars
    .filter(({ value }) => !value || value.includes('sua_') || value.includes('_aqui') || value.includes('example.') || value.includes('your-'))
    .map(({ key }) => key);

  const warnings = recommendedVars
    .filter(({ value }) => !value || value.includes('sua_') || value.includes('_aqui') || value.includes('example.') || value.includes('your-'))
    .map(({ key }) => key);

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings,
  };
};

/**
 * Retorna as configurações específicas do WhatsApp (compatibilidade)
 */
export const getWhatsAppConfig = () => ({
  webhookBaseUrl: envConfig.whatsapp.webhookBaseUrl,
  webhookToken: envConfig.whatsapp.webhookToken,
  webhookFullUrl: `${envConfig.whatsapp.webhookBaseUrl}/whatsapp-webhook`,
  accessToken: envConfig.whatsapp.accessToken,
  phoneNumberId: envConfig.whatsapp.phoneNumberId,
  verifyToken: envConfig.whatsapp.verifyToken,
  n8nWebhookUrl: envConfig.integracoes.n8nWebhookUrl,
  n8nAuthToken: envConfig.integracoes.n8nAuthToken,
});

/**
 * Retorna as configurações de horário de funcionamento (compatibilidade)
 */
export const getBusinessHours = () => ({
  start: envConfig.whatsapp.businessStart,
  end: envConfig.whatsapp.businessEnd,
  timezone: envConfig.whatsapp.timezone,
});

/**
 * Templates de mensagem padrão
 */
export const messageTemplates = {
  greeting: 'Olá! Bem-vindo à nossa farmácia. Como posso ajudá-lo hoje?',
  budget: 'Vou analisar sua receita e preparar um orçamento. Aguarde um momento, por favor.',
  ready: 'Seu pedido está pronto para retirada! Você pode vir buscar a qualquer momento durante nosso horário de funcionamento.',
  outOfHours: `Olá! Nossa farmácia está fechada no momento. Nosso horário de atendimento é das ${envConfig.whatsapp.businessStart} às ${envConfig.whatsapp.businessEnd}. Deixe sua mensagem que retornaremos assim que possível.`,
  aiProcessing: 'Nossa IA está analisando sua mensagem. Em breve um atendente entrará em contato.',
};

// =====================================================
// UTILITÁRIOS DE DESENVOLVIMENTO
// =====================================================

/**
 * Log das configurações carregadas (apenas em desenvolvimento)
 */
export const logEnvConfig = () => {
  if (envConfig.app.debug && envConfig.app.env === 'development') {
    console.group('🔧 Configurações de Ambiente Carregadas');
    console.log('App:', {
      env: envConfig.app.env,
      version: envConfig.app.version,
      debug: envConfig.app.debug,
    });
    console.log('Supabase:', {
      url: envConfig.supabase.url ? '✅ Configurado' : '❌ Faltando',
      anonKey: envConfig.supabase.anonKey ? '✅ Configurado' : '❌ Faltando',
    });
    console.log('WhatsApp:', {
      webhook: envConfig.whatsapp.webhookBaseUrl ? '✅ Configurado' : '❌ Faltando',
      token: envConfig.whatsapp.webhookToken ? '✅ Configurado' : '❌ Faltando',
    });
    console.log('IA:', {
      deepseek: envConfig.ai.deepseekApiKey ? '✅ Configurado' : '❌ Faltando',
      openai: envConfig.ai.openaiApiKey ? '✅ Configurado' : '❌ Faltando',
    });
    console.groupEnd();
  }
};

// Executar validação na inicialização (apenas em desenvolvimento)
if (envConfig.app.debug) {
  const validation = validateEnvConfig();
  if (!validation.isValid) {
    console.warn('⚠️ Configurações obrigatórias faltando:', validation.missingVars);
  }
  if (validation.warnings.length > 0) {
    console.warn('💡 Configurações recomendadas faltando:', validation.warnings);
  }
}

export default envConfig; 