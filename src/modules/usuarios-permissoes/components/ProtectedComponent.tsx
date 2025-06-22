// Componente de Proteção por Permissões - Pharma.AI
// Módulo: M09-USUARIOS_PERMISSOES

import React from 'react';
import { useAuthSimple } from '../hooks/useAuthSimple';
import { verificarPermissaoUsuario } from '../utils/permissions';
import type { ProtecaoProps, ModuloSistema, AcaoPermissao, NivelAcesso } from '../types';

/**
 * Componente que protege conteúdo baseado em permissões
 */
export const ProtectedComponent: React.FC<ProtecaoProps> = ({
  children,
  modulo,
  acao,
  nivel,
  fallback = null
}) => {
  const { usuario, autenticado } = useAuthSimple();

  // Se não está autenticado, não mostra nada
  if (!autenticado) {
    return <>{fallback}</>;
  }

  // Verifica se tem a permissão necessária
  const temPermissao = verificarPermissaoUsuario(usuario, modulo, acao, nivel);

  if (!temPermissao) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * HOC para proteger componentes
 */
export const withPermission = (
  modulo: ModuloSistema,
  acao: AcaoPermissao,
  nivel?: NivelAcesso,
  fallback?: React.ReactNode
) => {
  return function <P extends object>(Component: React.ComponentType<P>) {
    const ProtectedWrapper: React.FC<P> = (props) => (
      <ProtectedComponent
        modulo={modulo}
        acao={acao}
        nivel={nivel}
        fallback={fallback}
      >
        <Component {...props} />
      </ProtectedComponent>
    );

    ProtectedWrapper.displayName = `withPermission(${Component.displayName || Component.name})`;
    
    return ProtectedWrapper;
  };
};

/**
 * Componente para mostrar conteúdo apenas para proprietários
 */
export const ProprietarioOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => {
  const { usuario } = useAuthSimple();
  
  if (usuario?.usuario.perfil?.tipo !== 'PROPRIETARIO') {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * Componente para mostrar conteúdo apenas para farmacêuticos
 */
export const FarmaceuticoOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => {
  const { usuario } = useAuthSimple();
  
  const isFarmaceuticoOuProprietario = 
    usuario?.usuario.perfil?.tipo === 'FARMACEUTICO' ||
    usuario?.usuario.perfil?.tipo === 'PROPRIETARIO';
  
  if (!isFarmaceuticoOuProprietario) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * Componente para mostrar conteúdo baseado no perfil
 */
interface PerfilBasedProps {
  children: React.ReactNode;
  perfis: string[];
  fallback?: React.ReactNode;
}

export const PerfilBased: React.FC<PerfilBasedProps> = ({
  children,
  perfis,
  fallback = null
}) => {
  const { usuario } = useAuthSimple();
  
  const temPerfil = perfis.includes(usuario?.usuario.perfil?.tipo || '');
  
  if (!temPerfil) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * Componente para mostrar mensagem de acesso negado
 */
export const AcessoNegado: React.FC<{ 
  titulo?: string; 
  mensagem?: string;
  className?: string;
}> = ({ 
  titulo = 'Acesso Negado',
  mensagem = 'Você não tem permissão para acessar este recurso.',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 mb-4 text-red-500">
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10m2-5a9 9 0 110 18 9 9 0 010-18z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{titulo}</h3>
      <p className="text-gray-600 max-w-md">{mensagem}</p>
    </div>
  );
};

/**
 * Hook para verificar permissões em componentes
 */
export const usePermissionCheck = (
  modulo: ModuloSistema,
  acao: AcaoPermissao,
  nivel?: NivelAcesso
) => {
  const { verificarPermissao, autenticado } = useAuthSimple();
  
  return {
    hasPermission: autenticado && verificarPermissao(modulo, acao, nivel),
    isAuthenticated: autenticado
  };
}; 