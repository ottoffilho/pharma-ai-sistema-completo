import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContaPagarForm } from '@/components/financeiro/ContaPagarForm';

export default function NovaContaPagarPage() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="w-full py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/financeiro/contas-a-pagar')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nova Conta a Pagar</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Conta a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <ContaPagarForm onSuccess={() => navigate('/admin/financeiro/contas-a-pagar')} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
