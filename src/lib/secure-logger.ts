// Sistema de Logs Seguro - Pharma.AI
// Implementa sanitização e controle de níveis de log

export interface LogEvent {
  level: 'debug' | 'info' | 'warn' | 'error' | 'security';
  message: string;
  data?: any;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

export interface SecurityEvent {
  type: 'login_attempt' | 'failed_auth' | 'permission_denied' | 'rate_limit_exceeded' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  details?: any;
}

class SecureLogger {
  private isDevelopment = import.meta.env.MODE === 'development';
  private enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

  /**
   * Sanitiza dados sensíveis antes do log
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveFields = [
      'password', 'senha', 'token', 'jwt', 'secret', 'key',
      'cpf', 'cnpj', 'credit_card', 'card_number', 'cvv',
      'phone', 'telefone', 'email', 'document'
    ];

    if (typeof data === 'string') {
      // Mascarar CPF/CNPJ parcialmente
      return data.replace(/(\d{3})\d{3}(\d{3})/, '$1***$2');
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };

      for (const field of sensitiveFields) {
        if (sensitized[field]) {
          if (typeof sanitized[field] === 'string') {
            // Mostrar apenas primeiros e últimos caracteres
            const value = sanitized[field];
            sanitized[field] = value.length > 4 
              ? `${value.substring(0, 2)}***${value.substring(value.length - 2)}`
              : '***';
          } else {
            sanitized[field] = '[REDACTED]';
          }
        }
      }

      // Recursivamente sanitizar objetos aninhados
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Obtém contexto da requisição
   */
  private getContext(): Partial<LogEvent> {
    try {
      return {
        timestamp: new Date().toISOString(),
        // Adicionar mais contexto se necessário
      };
    } catch {
      return { timestamp: new Date().toISOString() };
    }
  }

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment && this.enableDebugLogs) {
      const context = this.getContext();
      console.debug(`[DEBUG] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  /**
   * Log de informação
   */
  info(message: string, data?: any): void {
    const context = this.getContext();
    const logData = {
      level: 'info' as const,
      message,
      data: data ? this.sanitizeData(data) : undefined,
      ...context
    };

    console.info(`[INFO] ${message}`, logData.data || '');
  }

  /**
   * Log de aviso
   */
  warn(message: string, data?: any): void {
    const context = this.getContext();
    const logData = {
      level: 'warn' as const,
      message,
      data: data ? this.sanitizeData(data) : undefined,
      ...context
    };

    console.warn(`[WARN] ${message}`, logData.data || '');
  }

  /**
   * Log de erro
   */
  error(message: string, error?: any): void {
    const context = this.getContext();
    
    let sanitizedError = error;
    if (error instanceof Error) {
      sanitizedError = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : '[REDACTED IN PRODUCTION]'
      };
    } else if (error) {
      sanitizedError = this.sanitizeData(error);
    }

    const logData = {
      level: 'error' as const,
      message,
      data: sanitizedError,
      ...context
    };

    console.error(`[ERROR] ${message}`, logData.data || '');
  }

  /**
   * Log de evento de segurança
   */
  security(event: SecurityEvent): void {
    const context = this.getContext();
    const logData = {
      level: 'security' as const,
      message: `Security Event: ${event.type}`,
      data: {
        type: event.type,
        userId: event.userId ? `user_${event.userId.substring(0, 8)}***` : undefined,
        ip: event.ip ? this.maskIP(event.ip) : undefined,
        details: event.details ? this.sanitizeData(event.details) : undefined
      },
      ...context
    };

    console.warn(`[SECURITY] ${logData.message}`, logData.data);
    
    // Em produção, enviar para serviço de monitoramento
    if (!this.isDevelopment) {
      this.sendToSecurityService(logData);
    }
  }

  /**
   * Mascarar IP parcialmente
   */
  private maskIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return 'xxx.xxx.xxx.xxx';
  }

  /**
   * Enviar eventos de segurança para serviço de monitoramento
   */
  private async sendToSecurityService(logData: LogEvent): Promise<void> {
    try {
      // Implementar integração com serviço de monitoramento
      // Ex: Sentry, DataDog, CloudWatch, etc.
      if (import.meta.env.VITE_SECURITY_WEBHOOK_URL) {
        await fetch(import.meta.env.VITE_SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': import.meta.env.VITE_SECURITY_API_KEY || ''
          },
          body: JSON.stringify(logData)
        });
      }
    } catch (error) {
      // Falha silenciosa para não afetar a aplicação
      console.error('[LOGGER] Failed to send security event:', error);
    }
  }
}

// Instância singleton
export const secureLogger = new SecureLogger();

// Aliases para compatibilidade
export const log = secureLogger.info.bind(secureLogger);
export const logDebug = secureLogger.debug.bind(secureLogger);
export const logWarn = secureLogger.warn.bind(secureLogger);
export const logError = secureLogger.error.bind(secureLogger);
export const logSecurity = secureLogger.security.bind(secureLogger);

// Export default
export default secureLogger;