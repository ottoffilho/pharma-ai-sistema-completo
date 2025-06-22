import React from 'react';
import { AuthSimpleContext, useAuthSimpleState } from '../hooks/useAuthSimple';

interface AuthSimpleProviderProps {
  children: React.ReactNode;
}

export const AuthSimpleProvider: React.FC<AuthSimpleProviderProps> = ({ children }) => {
  const authState = useAuthSimpleState();

  return (
    <AuthSimpleContext.Provider value={authState}>
      {children}
    </AuthSimpleContext.Provider>
  );
}; 