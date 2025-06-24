import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Lazy loading das páginas
const WhatsAppIndex = lazy(() => import('@/pages/admin/whatsapp/index'));
const WhatsAppDebug = lazy(() => import('@/pages/admin/whatsapp/debug'));
const AdminIndex = lazy(() => import('@/pages/admin/index'));

const AdminRouter: React.FC = () => {
  return (
    <Routes>
      {/* Dashboard principal */}
      <Route index element={<AdminIndex />} />
      
      {/* Rotas de WhatsApp */}
      <Route path="whatsapp" element={<WhatsAppIndex />} />
      <Route path="whatsapp/debug" element={<WhatsAppDebug />} />
      
      {/* Outras rotas administrativas podem ser adicionadas aqui */}
    </Routes>
  );
};

export default AdminRouter; 