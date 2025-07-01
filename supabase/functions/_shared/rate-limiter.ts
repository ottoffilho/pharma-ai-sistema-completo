// Rate Limiter para Edge Functions - Pharma.AI
// Implementa controle de taxa usando Supabase como backend

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private supabase: any;

  constructor(config: RateLimitConfig, supabase: any) {
    this.config = {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutos
      keyGenerator: (req) => this.getClientIP(req),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };
    this.supabase = supabase;
  }

  /**
   * Obtém IP do cliente da requisição
   */
  private getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIP = req.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Fallback para desenvolvimento
    return 'unknown';
  }

  /**
   * Verifica e atualiza rate limit
   */
  async checkRateLimit(req: Request): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Limpar entradas antigas
      await this.supabase
        .from('rate_limits')
        .delete()
        .lt('created_at', new Date(windowStart).toISOString());

      // Contar requisições na janela atual
      const { data: existingRequests, error: countError } = await this.supabase
        .from('rate_limits')
        .select('id')
        .eq('client_key', key)
        .gte('created_at', new Date(windowStart).toISOString());

      if (countError) {
        console.error('Rate limit count error:', countError);
        // Em caso de erro, permitir a requisição
        return {
          allowed: true,
          remaining: this.config.maxRequests,
          resetTime: now + this.config.windowMs,
          totalHits: 0
        };
      }

      const currentHits = existingRequests?.length || 0;
      const remaining = Math.max(0, this.config.maxRequests - currentHits);
      const resetTime = now + this.config.windowMs;

      // Verificar se excedeu o limite
      if (currentHits >= this.config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalHits: currentHits
        };
      }

      // Registrar esta requisição
      await this.supabase
        .from('rate_limits')
        .insert({
          client_key: key,
          endpoint: new URL(req.url).pathname,
          user_agent: req.headers.get('user-agent') || '',
          created_at: new Date().toISOString()
        });

      return {
        allowed: true,
        remaining: remaining - 1,
        resetTime,
        totalHits: currentHits + 1
      };

    } catch (error) {
      console.error('Rate limiter error:', error);
      // Em caso de erro crítico, permitir a requisição
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        totalHits: 0
      };
    }
  }

  /**
   * Retorna headers HTTP para rate limiting
   */
  getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      'X-RateLimit-Window': Math.ceil(this.config.windowMs / 1000).toString()
    };
  }

  /**
   * Middleware para verificar rate limit
   */
  async middleware(req: Request): Promise<Response | null> {
    const result = await this.checkRateLimit(req);
    
    if (!result.allowed) {
      const headers = {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        ...this.getRateLimitHeaders(result)
      };

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers
        }
      );
    }

    return null; // Permitir requisição
  }
}

/**
 * Configurações pré-definidas para diferentes tipos de endpoints
 */
export const RateLimitPresets = {
  // Para autenticação - mais restritivo
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000 // 15 minutos
  },

  // Para APIs gerais
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000 // 15 minutos
  },

  // Para uploads/operações pesadas
  upload: {
    maxRequests: 10,
    windowMs: 60 * 1000 // 1 minuto
  },

  // Para operações de vendas
  vendas: {
    maxRequests: 200,
    windowMs: 60 * 1000 // 1 minuto
  }
};

/**
 * Helper para criar rate limiter facilmente
 */
export function createRateLimiter(
  preset: keyof typeof RateLimitPresets | RateLimitConfig,
  supabase: any
): RateLimiter {
  const config = typeof preset === 'string' ? RateLimitPresets[preset] : preset;
  return new RateLimiter(config, supabase);
}