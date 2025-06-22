import React from 'react';
import { Button } from "@/components/ui/button";
import { Bot } from 'lucide-react';
import LeadCaptureChatbot from './LeadCaptureChatbot';
import { useChatbot } from '@/contexts/ChatbotContext'; // Importar o hook do contexto

const FloatingChatbotWidget = () => {
  const { isChatOpen, openChat, closeChat } = useChatbot(); // Usar o contexto

  return (
    <>
      <Button
        onClick={openChat} // Usar openChat do contexto
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-homeo-blue hover:bg-homeo-blue/90 shadow-lg flex items-center justify-center z-50"
        aria-label="Abrir chat com assistente virtual"
      >
        <Bot className="h-8 w-8 text-white" />
      </Button>
      
      {/* O componente LeadCaptureChatbot já usa um Dialog, então ele funcionará como o modal */}
      {/* Podemos precisar ajustar o estilo do DialogContent em LeadCaptureChatbot para um modal maior */}
      <LeadCaptureChatbot 
        isOpen={isChatOpen} // Usar isChatOpen do contexto
        onClose={closeChat}  // Usar closeChat do contexto
      />
    </>
  );
};

export default FloatingChatbotWidget; 