/**
 * Utilitários para autenticação e segurança
 */

/**
 * Verifica se uma senha atende aos requisitos mínimos de segurança:
 * - Pelo menos 8 caracteres
 * - Pelo menos um número
 * - Pelo menos uma letra maiúscula
 * - Pelo menos um caractere especial
 */
export const isStrongPassword = (password: string): { 
  isValid: boolean; 
  message?: string; 
} => {
  if (password.length < 8) {
    return { 
      isValid: false, 
      message: "A senha deve ter pelo menos 8 caracteres" 
    };
  }

  if (!/\d/.test(password)) {
    return { 
      isValid: false, 
      message: "A senha deve conter pelo menos um número" 
    };
  }

  if (!/[A-Z]/.test(password)) {
    return { 
      isValid: false, 
      message: "A senha deve conter pelo menos uma letra maiúscula" 
    };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { 
      isValid: false, 
      message: "A senha deve conter pelo menos um caractere especial" 
    };
  }

  return { isValid: true };
};

/**
 * Estrutura para controlar tentativas de login para evitar ataques de força bruta
 * Usa o armazenamento local para persistir entre recarregamentos de página
 */
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockUntil?: number;
}

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos em milissegundos

export const checkLoginAttempts = (email: string): { 
  canLogin: boolean; 
  message?: string;
  remainingTime?: number;
} => {
  const storageKey = `login_attempts_${email}`;
  const now = Date.now();
  
  // Recuperar tentativas anteriores
  let attempt: LoginAttempt;
  try {
    const stored = localStorage.getItem(storageKey);
    attempt = stored ? JSON.parse(stored) : { count: 0, lastAttempt: 0 };
  } catch (e) {
    // Em caso de erro, reiniciar contagem
    attempt = { count: 0, lastAttempt: 0 };
  }
  
  // Verificar se o usuário está bloqueado
  if (attempt.lockUntil && now < attempt.lockUntil) {
    const remainingTime = Math.ceil((attempt.lockUntil - now) / 1000 / 60); // minutos restantes
    return { 
      canLogin: false, 
      message: `Muitas tentativas falhas. Tente novamente em ${remainingTime} minutos.`,
      remainingTime: remainingTime
    };
  }
  
  // Se já passou o período de bloqueio ou nunca foi bloqueado, continuar
  return { canLogin: true };
};

export const recordLoginAttempt = (email: string, successful: boolean): void => {
  const storageKey = `login_attempts_${email}`;
  const now = Date.now();
  
  // Recuperar tentativas anteriores
  let attempt: LoginAttempt;
  try {
    const stored = localStorage.getItem(storageKey);
    attempt = stored ? JSON.parse(stored) : { count: 0, lastAttempt: 0 };
  } catch (e) {
    attempt = { count: 0, lastAttempt: 0 };
  }
  
  if (successful) {
    // Resetar em caso de login bem-sucedido
    localStorage.removeItem(storageKey);
    return;
  }
  
  // Incrementar contagem de tentativas
  attempt.count += 1;
  attempt.lastAttempt = now;
  
  // Se excedeu o limite, definir tempo de bloqueio
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockUntil = now + LOCKOUT_TIME;
  }
  
  // Salvar no localStorage
  localStorage.setItem(storageKey, JSON.stringify(attempt));
}; 