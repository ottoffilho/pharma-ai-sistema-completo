import React from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import FornecedorForm from "@/components/cadastros/FornecedorForm";

export default function NovoFornecedorPage() {
  return (
    <AdminLayout>
      <div className="w-full py-6">
        <FornecedorForm />
      </div>
    </AdminLayout>
  );
} 