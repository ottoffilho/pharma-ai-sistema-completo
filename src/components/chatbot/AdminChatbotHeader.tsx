import React from 'react';
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Database, X, Trash2 } from 'lucide-react';

interface AdminChatbotHeaderProps {
  onClose: () => void;
  onClearHistory: () => void;
}

const AdminChatbotHeader: React.FC<AdminChatbotHeaderProps> = ({ 
  onClose, 
  onClearHistory 
}) => {
  return (
    <DialogHeader className="p-6 pb-4 relative bg-gradient-to-r from-homeo-blue via-homeo-blue to-homeo-accent text-white rounded-t-lg">
      <DialogTitle className="flex items-center gap-2 text-white text-lg font-semibold">
        <Database className="h-6 w-6 text-white" />
        Assistente Inteligente Pharma.AI
      </DialogTitle>
      <DialogDescription className="text-blue-100 text-sm">
        Faça qualquer pergunta sobre seus dados em linguagem natural
      </DialogDescription>
      
      {/* Botões de ação no canto superior direito */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/20 h-8 w-8 transition-colors" 
          onClick={onClearHistory}
          title="Limpar histórico de conversa"
          aria-label="Limpar histórico de conversa"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/20 h-8 w-8 transition-colors" 
          onClick={onClose}
          title="Fechar assistente"
          aria-label="Fechar assistente"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </DialogHeader>
  );
};

export default AdminChatbotHeader;