import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Componente de rota para debug - permite acesso sem autenticação
 * Usado para testar funcionalidades em desenvolvimento
 */
const PrivateRouteDebug: React.FC = () => {
  console.log('🐛 PrivateRouteDebug - Acesso sem autenticação para debug');
  
  // Renderiza diretamente sem verificação de autenticação
  return <Outlet />;
};

export default PrivateRouteDebug; 