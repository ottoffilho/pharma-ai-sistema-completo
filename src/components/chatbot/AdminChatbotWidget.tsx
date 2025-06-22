import React from 'react';
import { Button } from "@/components/ui/button";
import { Database } from 'lucide-react';
import AdminChatbot from './AdminChatbot';
import AdminChatbotMobile from './AdminChatbotMobile';
import { useChatbot } from '@/contexts/ChatbotContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const AdminChatbotWidget = () => {
  const { isChatOpen, openChat, closeChat } = useChatbot();
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <>
      <Button
        onClick={openChat}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-homeo-blue to-homeo-accent hover:from-homeo-blue/90 hover:to-homeo-accent/90 shadow-lg flex items-center justify-center z-50 transition-all duration-300 hover:scale-105"
        aria-label="Abrir assistente operacional"
      >
        <Database className="h-8 w-8 text-white" />
      </Button>
      
      {isMobile ? (
        <AdminChatbotMobile 
          isOpen={isChatOpen}
          onClose={closeChat}
        />
      ) : (
        <AdminChatbot 
          isOpen={isChatOpen}
          onClose={closeChat}
        />
      )}
    </>
  );
};

export default AdminChatbotWidget; 