
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SuccessView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h2 className="text-2xl font-semibold">Receita Validada com Sucesso!</h2>
      <p className="text-muted-foreground">
        Os dados foram salvos e um pedido foi criado com base nesta receita.
      </p>
      <Button onClick={() => window.location.href = '/admin/pedidos'} className="mt-4">
        Ver Lista de Pedidos
      </Button>
    </div>
  );
};

export default SuccessView;
