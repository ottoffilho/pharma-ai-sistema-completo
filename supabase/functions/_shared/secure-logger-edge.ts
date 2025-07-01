// Sistema de Logs Seguro para Edge Functions - Pharma.AI

export interface SecurityEvent {
  type: 'login_attempt' | 'failed_auth' | 'permission_denied' | 'rate_limit_exceeded' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  endpoint?: string;
  details?: any;
}

class EdgeSecureLogger {
  private isDevelopment = Deno.env.get('DENO_ENV') === 'development';

  /**
   * Sanitiza dados sensíveis
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveFields = [
      'password', 'senha', 'token', 'jwt', 'secret', 'key',
      'cpf', 'cnpj', 'credit_card', 'card_number', 'cvv'
    ];

    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };

      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Obtém IP do cliente
   */
  private getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.headers.get('x-real-ip') || 'unknown';
  }

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  /**
   * Log de informação
   */
  info(message: string, data?: any): void {
    console.info(`[INFO] ${message}`, data ? this.sanitizeData(data) : '');
  }

  /**
   * Log de erro
   */
  error(message: string, error?: any): void {
    let sanitizedError = error;
    if (error instanceof Error) {
      sanitizedError = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : '[REDACTED]'
      };
    }

    console.error(`[ERROR] ${message}`, sanitizedError);
  }

  /**
   * Log de evento de segurança
   */
  security(event: SecurityEvent, req?: Request): void {
    const logData = {
      timestamp: new Date().toISOString(),
      type: event.type,
      userId: event.userId ? `user_${event.userId.substring(0, 8)}***` : undefined,
      ip: event.ip || (req ? this.getClientIP(req) : undefined),
      endpoint: event.endpoint || (req ? new URL(req.url).pathname : undefined),
      details: event.details ? this.sanitizeData(event.details) : undefined
    };

    console.warn(`[SECURITY] ${event.type}`, logData);

    // Em produção, enviar para webhook de segurança
    if (!this.isDevelopment) {
      this.sendSecurityAlert(logData).catch(err => 
        console.error('[LOGGER] Failed to send security alert:', err)
      );
    }
  }

  /**
   * Enviar alerta de segurança
   */
  private async sendSecurityAlert(data: any): Promise<void> {
    try {
      const webhookUrl = Deno.env.get('SECURITY_WEBHOOK_URL');
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': Deno.env.get('SECURITY_API_KEY') || ''
          },
          body: JSON.stringify(data)
        });
      }
    } catch (error) {
      // Falha silenciosa
    }
  }
}

// Instância singleton
export const edgeLogger = new EdgeSecureLogger();

// Exports
export const logDebug = edgeLogger.debug.bind(edgeLogger);
export const logInfo = edgeLogger.info.bind(edgeLogger);
export const logError = edgeLogger.error.bind(edgeLogger);
export const logSecurity = edgeLogger.security.bind(edgeLogger);

export default edgeLogger;