import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
import { Loader2 } from 'lucide-react';

const PrivateRouteSimple: React.FC = () => {
  const { autenticado, carregando } = useAuthSimple();
  const location = useLocation();

  console.log('🔍 PrivateRouteSimple - Estado:', { autenticado, carregando });

  if (carregando) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Carregando...</span>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default PrivateRouteSimple; 