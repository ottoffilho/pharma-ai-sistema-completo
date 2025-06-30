/**
 * Configurações do WhatsApp centralizadas
 * 
 * ARQUIVO DEPRECIADO - Use /config/env-config.ts
 * Mantido apenas para compatibilidade
 */

import { 
  getWhatsAppConfig, 
  getBusinessHours, 
  messageTemplates as templates,
  validateEnvConfig
} from './env-config';

/**
 * @deprecated Use getWhatsAppConfig() de env-config.ts
 */
export const whatsappConfig = getWhatsAppConfig();

/**
 * @deprecated Use validateEnvConfig() de env-config.ts
 */
export const validateWhatsAppConfig = () => {
  const validation = validateEnvConfig();
  return {
    isValid: validation.isValid,
    missingVars: validation.missingVars,
  };
};

/**
 * @deprecated Use getBusinessHours() de env-config.ts
 */
export const businessHours = getBusinessHours();

/**
 * @deprecated Use messageTemplates de env-config.ts
 */
export const messageTemplates = templates;

export default whatsappConfig; 