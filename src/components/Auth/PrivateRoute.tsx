import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
import { Loader2 } from 'lucide-react';

const PrivateRoute: React.FC = () => {
  const { autenticado, carregando } = useAuthSimple();
  const location = useLocation();

  if (carregando) {
    // Still loading authentication status
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-homeo-green" />
        <span className="ml-2 text-lg">Verificando autenticação...</span>
      </div>
    );
  }

  if (!autenticado) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected route
  return <Outlet />;
};

export default PrivateRoute;
