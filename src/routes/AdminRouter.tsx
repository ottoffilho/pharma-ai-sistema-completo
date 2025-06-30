import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Lazy loading das páginas
const WhatsAppIndex = lazy(() => import('@/pages/admin/whatsapp/index'));
const WhatsAppDebug = lazy(() => import('@/pages/admin/whatsapp/debug'));
const AdminIndex = lazy(() => import('@/pages/admin/index'));
const PDVUnificado = lazy(() => import('@/pages/admin/vendas/pdv'));
const FormasIndex = lazy(() => import('@/pages/admin/cadastros/formas-farmaceuticas/index'));
const FormasNova = lazy(() => import('@/pages/admin/cadastros/formas-farmaceuticas/nova'));
const FormasEditar = lazy(() => import('@/pages/admin/cadastros/formas-farmaceuticas/[id]/editar'));

const AdminRouter: React.FC = () => {
  return (
    <Routes>
      {/* Dashboard principal */}
      <Route index element={<AdminIndex />} />
      
      {/* Rotas de WhatsApp */}
      <Route path="whatsapp" element={<WhatsAppIndex />} />
      <Route path="whatsapp/debug" element={<WhatsAppDebug />} />
      
      {/* Rotas de Vendas */}
      <Route path="vendas/pdv" element={<PDVUnificado />} />
      
      {/* Rotas de Cadastros - Formas Farmacêuticas */}
      <Route path="cadastros/formas-farmaceuticas" element={<FormasIndex />} />
      <Route path="cadastros/formas-farmaceuticas/nova" element={<FormasNova />} />
      <Route path="cadastros/formas-farmaceuticas/:id/editar" element={<FormasEditar />} />
      
      {/* Outras rotas administrativas podem ser adicionadas aqui */}
    </Routes>
  );
};

export default AdminRouter; 