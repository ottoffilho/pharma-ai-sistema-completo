// Headers de Segurança Avançados para Edge Functions - Pharma.AI

export interface SecurityHeadersConfig {
  // Content Security Policy
  csp?: {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    fontSrc?: string[];
    mediaSrc?: string[];
    objectSrc?: string[];
    frameSrc?: string[];
    baseUri?: string[];
    formAction?: string[];
    frameAncestors?: string[];
    upgradeInsecureRequests?: boolean;
  };
  
  // HSTS (HTTP Strict Transport Security)
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  
  // Outras configurações
  nosniff?: boolean;
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  referrerPolicy?: 'strict-origin-when-cross-origin' | 'same-origin' | 'no-referrer';
  permissionsPolicy?: string;
  crossOriginEmbedderPolicy?: 'require-corp' | 'unsafe-none';
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin';
}

export class SecurityHeaders {
  private config: SecurityHeadersConfig;
  private isDevelopment = Deno.env.get('DENO_ENV') === 'development';

  constructor(config: SecurityHeadersConfig = {}) {
    this.config = {
      // Configurações padrão seguras
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.deepseek.com"],
        fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: true,
        ...config.csp
      },
      hsts: {
        maxAge: 31536000, // 1 ano
        includeSubDomains: true,
        preload: true,
        ...config.hsts
      },
      nosniff: true,
      frameOptions: 'DENY',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
      crossOriginEmbedderPolicy: 'unsafe-none', // Compatibilidade
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-site',
      ...config
    };
  }

  /**
   * Gera CSP header
   */
  private generateCSP(): string {
    const csp = this.config.csp!;
    const directives: string[] = [];

    Object.entries(csp).forEach(([key, value]) => {
      if (key === 'upgradeInsecureRequests' && value) {
        directives.push('upgrade-insecure-requests');
      } else if (Array.isArray(value) && value.length > 0) {
        const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        directives.push(`${directiveName} ${value.join(' ')}`);
      }
    });

    return directives.join('; ');
  }

  /**
   * Gera HSTS header
   */
  private generateHSTS(): string {
    const hsts = this.config.hsts!;
    let hstsValue = `max-age=${hsts.maxAge}`;
    
    if (hsts.includeSubDomains) {
      hstsValue += '; includeSubDomains';
    }
    
    if (hsts.preload) {
      hstsValue += '; preload';
    }
    
    return hstsValue;
  }

  /**
   * Gera Permissions Policy header
   */
  private generatePermissionsPolicy(): string {
    // Política restritiva por padrão para farmácias
    const defaultPolicy = [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'accelerometer=()',
      'gyroscope=()',
      'magnetometer=()',
      'payment=()',
      'usb=()',
      'bluetooth=()',
      'speaker-selection=()',
      'screen-wake-lock=()',
      'web-share=()'
    ];

    return this.config.permissionsPolicy || defaultPolicy.join(', ');
  }

  /**
   * Retorna todos os headers de segurança
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (this.config.csp) {
      headers['Content-Security-Policy'] = this.generateCSP();
    }

    // HSTS (apenas em HTTPS/produção)
    if (!this.isDevelopment && this.config.hsts) {
      headers['Strict-Transport-Security'] = this.generateHSTS();
    }

    // X-Content-Type-Options
    if (this.config.nosniff) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // X-Frame-Options
    if (this.config.frameOptions) {
      headers['X-Frame-Options'] = this.config.frameOptions;
    }

    // Referrer Policy
    if (this.config.referrerPolicy) {
      headers['Referrer-Policy'] = this.config.referrerPolicy;
    }

    // Permissions Policy
    headers['Permissions-Policy'] = this.generatePermissionsPolicy();

    // Cross-Origin Policies
    if (this.config.crossOriginEmbedderPolicy) {
      headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginEmbedderPolicy;
    }

    if (this.config.crossOriginOpenerPolicy) {
      headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginOpenerPolicy;
    }

    if (this.config.crossOriginResourcePolicy) {
      headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginResourcePolicy;
    }

    // Headers adicionais de segurança
    headers['X-Powered-By'] = 'Pharma.AI'; // Esconder tecnologia real
    headers['Server'] = 'Pharma.AI/1.0'; // Header personalizado
    headers['X-Download-Options'] = 'noopen';
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';
    headers['X-XSS-Protection'] = '1; mode=block';

    // Cache control para respostas de API
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';

    return headers;
  }

  /**
   * Aplica headers a uma resposta
   */
  applyToResponse(response: Response): Response {
    const headers = this.getHeaders();
    const newHeaders = new Headers(response.headers);

    Object.entries(headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }

  /**
   * Middleware para aplicar headers automaticamente
   */
  middleware() {
    return (response: Response): Response => {
      return this.applyToResponse(response);
    };
  }
}

/**
 * Configurações pré-definidas para diferentes tipos de endpoints
 */
export const SecurityPresets = {
  // Para APIs REST
  api: new SecurityHeaders({
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'none'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    },
    frameOptions: 'DENY',
    crossOriginResourcePolicy: 'same-site'
  }),

  // Para uploads de arquivos
  upload: new SecurityHeaders({
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'none'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    },
    crossOriginResourcePolicy: 'same-origin'
  }),

  // Para webhooks externos
  webhook: new SecurityHeaders({
    frameOptions: 'DENY',
    crossOriginResourcePolicy: 'cross-origin',
    referrerPolicy: 'no-referrer'
  }),

  // Para funcionalidades de IA
  ai: new SecurityHeaders({
    csp: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.deepseek.com", "https://api.openai.com"],
      scriptSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  })
};

/**
 * Helper para criar headers de segurança facilmente
 */
export function createSecurityHeaders(
  preset: keyof typeof SecurityPresets | SecurityHeadersConfig
): SecurityHeaders {
  if (typeof preset === 'string') {
    return SecurityPresets[preset];
  }
  return new SecurityHeaders(preset);
}

/**
 * Aplicar headers de segurança padrão a qualquer resposta
 */
export function secureResponse(
  response: Response,
  config?: SecurityHeadersConfig
): Response {
  const securityHeaders = new SecurityHeaders(config);
  return securityHeaders.applyToResponse(response);
}

export default SecurityHeaders;