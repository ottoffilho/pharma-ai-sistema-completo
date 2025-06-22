import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormPageLayoutProps {
  /**
   * Título exibido no topo do card. Ex: "Novo Cliente" ou "Editar Produto".
   */
  title: string;
  /**
   * Conteúdo principal da página (normalmente o componente de formulário).
   */
  children: React.ReactNode;
  /**
   * Classe Tailwind opcional para ajustes pontuais no container externo.
   */
  className?: string;
}

/**
 * Componente de layout reutilizável para páginas de criação/edição de entidades.
 *
 * Ele centraliza o conteúdo em um card responsivo, garantindo consistência
 * visual entre as diversas páginas de cadastro do sistema.
 */
export default function FormPageLayout({ title, children, className = '' }: FormPageLayoutProps) {
  return (
    <div className={`w-full p-6 ${className}`}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
} 