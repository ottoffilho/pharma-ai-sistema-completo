// Provider de Autenticação - Pharma.AI
// Módulo: M09-USUARIOS_PERMISSOES

import React from 'react';
import { AuthContext, useAuthState } from '../hooks/useAuth';

/**
 * Props do AuthProvider
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provider de Autenticação
 * 
 * Fornece contexto de autenticação para toda a aplicação,
 * gerenciando estado do usuário, permissões e sessão.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}; 