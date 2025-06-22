// Utilitários para Verificação de Permissões - Pharma.AI
// Módulo: M09-USUARIOS_PERMISSOES

import { 
  Permissao, 
  ModuloSistema, 
  AcaoPermissao, 
  NivelAcesso, 
  SessaoUsuario,
  PerfilUsuario
} from '../types';

/**
 * Verifica se uma lista de permissões contém a permissão necessária
 * @param permissoes Lista de permissões do usuário
 * @param modulo Módulo que se quer verificar
 * @param acao Ação que se quer verificar
 * @param nivel Nível de acesso opcional
 * @returns true se tem a permissão, false caso contrário
 */
export const verificarPermissao = (
  permissoes: Permissao[],
  modulo: ModuloSistema,
  acao: AcaoPermissao,
  nivel?: NivelAcesso
): boolean => {
  if (!permissoes || permissoes.length === 0) {
    return false;
  }

  // Procurar por uma permissão que corresponda aos critérios
  return permissoes.some(permissao => {
    // Verificar módulo e ação
    const moduloCorresponde = permissao.modulo === modulo;
    const acaoCorresponde = permissao.acao === acao;
    
    // Se não há nível especificado, apenas verificar módulo e ação
    if (!nivel) {
      return moduloCorresponde && acaoCorresponde;
    }
    
    // Se há nível especificado, verificar também o nível
    const nivelCorresponde = permissao.nivel === nivel || 
                            permissao.nivel === NivelAcesso.TODOS; // TODOS sempre tem acesso
    
    return moduloCorresponde && acaoCorresponde && nivelCorresponde;
  });
};

/**
 * Verifica se o usuário tem uma permissão específica
 * @param sessao Sessão do usuário
 * @param modulo Módulo que se quer verificar
 * @param acao Ação que se quer verificar
 * @param nivel Nível de acesso opcional
 * @returns true se tem a permissão, false caso contrário
 */
export const verificarPermissaoUsuario = (
  sessao: SessaoUsuario | null,
  modulo: ModuloSistema,
  acao: AcaoPermissao,
  nivel?: NivelAcesso
): boolean => {
  // Proprietário tem acesso total a todas as funcionalidades
  if (sessao?.usuario?.perfil?.tipo === PerfilUsuario.PROPRIETARIO) {
    return true;
  }
  if (!sessao || !sessao.permissoes) {
    return false;
  }

  return verificarPermissao(sessao.permissoes, modulo, acao, nivel);
};

/**
 * Verifica se o usuário tem permissão de administração em um módulo
 * @param permissoes Lista de permissões do usuário
 * @param modulo Módulo que se quer verificar
 * @returns true se tem permissão de administração, false caso contrário
 */
export const temPermissaoAdmin = (
  permissoes: Permissao[],
  modulo: ModuloSistema
): boolean => {
  return verificarPermissao(permissoes, modulo, AcaoPermissao.ADMINISTRAR);
};

/**
 * Verifica se o usuário tem permissão para qualquer ação em um módulo
 * @param permissoes Lista de permissões do usuário
 * @param modulo Módulo que se quer verificar
 * @returns true se tem alguma permissão no módulo, false caso contrário
 */
export const temAcessoModulo = (
  permissoes: Permissao[],
  modulo: ModuloSistema
): boolean => {
  if (!permissoes || permissoes.length === 0) {
    return false;
  }

  return permissoes.some(permissao => permissao.modulo === modulo);
};

/**
 * Retorna todas as permissões de um usuário para um módulo específico
 * @param permissoes Lista de permissões do usuário
 * @param modulo Módulo que se quer verificar
 * @returns Array com as permissões do módulo
 */
export const obterPermissoesModulo = (
  permissoes: Permissao[],
  modulo: ModuloSistema
): Permissao[] => {
  if (!permissoes || permissoes.length === 0) {
    return [];
  }

  return permissoes.filter(permissao => permissao.modulo === modulo);
};

/**
 * Verifica se o usuário tem permissão para múltiplas ações em um módulo
 * @param permissoes Lista de permissões do usuário
 * @param modulo Módulo que se quer verificar
 * @param acoes Array de ações que se quer verificar
 * @param nivel Nível de acesso opcional
 * @returns true se tem todas as permissões, false caso contrário
 */
export const verificarMultiplasPermissoes = (
  permissoes: Permissao[],
  modulo: ModuloSistema,
  acoes: AcaoPermissao[],
  nivel?: NivelAcesso
): boolean => {
  return acoes.every(acao => 
    verificarPermissao(permissoes, modulo, acao, nivel)
  );
};

/**
 * Verifica se o usuário tem pelo menos uma das permissões especificadas
 * @param permissoes Lista de permissões do usuário
 * @param modulo Módulo que se quer verificar
 * @param acoes Array de ações que se quer verificar
 * @param nivel Nível de acesso opcional
 * @returns true se tem pelo menos uma permissão, false caso contrário
 */
export const verificarAlgumaPermissao = (
  permissoes: Permissao[],
  modulo: ModuloSistema,
  acoes: AcaoPermissao[],
  nivel?: NivelAcesso
): boolean => {
  return acoes.some(acao => 
    verificarPermissao(permissoes, modulo, acao, nivel)
  );
}; 