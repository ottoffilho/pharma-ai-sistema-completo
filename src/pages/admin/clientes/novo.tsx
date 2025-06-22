// =====================================================
// PÁGINA - NOVO CLIENTE
// =====================================================

import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ClienteForm from '@/components/clientes/ClienteForm';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function NovoClientePage() {
  return (
    <AdminLayout>
      <div className="px-6 w-full mt-8 mb-12">
        <div className="border dark:border-slate-800 border-transparent shadow-lg bg-white dark:bg-slate-900/70 p-8 rounded-lg backdrop-blur-sm">
          <ClienteForm />
        </div>
      </div>
    </AdminLayout>
  );
} 