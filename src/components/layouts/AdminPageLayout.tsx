import React from 'react';
import { cn } from '@/lib/utils';

interface AdminPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente de layout para páginas administrativas
 * Garante que todas as páginas tenham consistência na largura e espaçamento
 */
export function AdminPageLayout({ children, className }: AdminPageLayoutProps) {
  return (
    <div className={cn("w-full py-6", className)}>
      {children}
    </div>
  );
} 