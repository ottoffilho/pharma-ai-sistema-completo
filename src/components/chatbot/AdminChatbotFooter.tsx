import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { Send, Package, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { useEnterSubmit } from '@/hooks/useEnterSubmit';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  query: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Package,
    label: 'Meu Estoque',
    query: 'Como está meu estoque?'
  },
  {
    icon: TrendingUp,
    label: 'Produtos Acabando',
    query: 'Quais produtos estão acabando?'
  },
  {
    icon: DollarSign,
    label: 'Faturamento',
    query: 'Qual meu faturamento este mês?'
  },
  {
    icon: FileText,
    label: 'Receitas Hoje',
    query: 'Receitas processadas hoje'
  }
];

interface AdminChatbotFooterProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onQuickAction: (query: string) => void;
  isLoading: boolean;
}

const AdminChatbotFooter: React.FC<AdminChatbotFooterProps> = ({
  inputValue,
  onInputChange,
  onSendMessage,
  onQuickAction,
  isLoading
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleKeyDown } = useEnterSubmit({ 
    onSubmit: onSendMessage, 
    disabled: isLoading || inputValue.trim() === '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage();
  };

  return (
    <DialogFooter className="p-4 border-t bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
      <div className="w-full space-y-3">
        {/* Quick Actions - Ocultos em telas pequenas conforme especificado */}
        <div className="hidden min-[350px]:flex flex-wrap gap-2">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button 
                key={index}
                variant="outline" 
                size="sm" 
                onClick={() => onQuickAction(action.query)}
                disabled={isLoading}
                className="text-xs h-8 px-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors"
                title={action.query}
              >
                <IconComponent className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{action.label}</span>
              </Button>
            );
          })}
        </div>
        
        {/* Input de mensagem */}
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input 
            ref={inputRef}
            type="text" 
            placeholder="Pergunte qualquer coisa… (Enter envia, Shift+Enter quebra linha)" 
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:border-homeo-blue dark:focus:border-homeo-accent transition-colors"
            disabled={isLoading}
            autoFocus
            aria-label="Digite sua mensagem"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || inputValue.trim() === ''} 
            className="bg-homeo-blue hover:bg-homeo-blue/90 dark:bg-homeo-accent dark:hover:bg-homeo-accent/90 h-10 w-10 transition-all hover:scale-105 disabled:hover:scale-100"
            title="Enviar mensagem"
            aria-label="Enviar mensagem"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </DialogFooter>
  );
};

export default AdminChatbotFooter;