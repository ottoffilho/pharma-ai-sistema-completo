import React, { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from 'lucide-react';
import ChatMessageBubble, { ChatMessage } from './ChatMessageBubble';

interface AdminChatbotBodyProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

const AdminChatbotBody: React.FC<AdminChatbotBodyProps> = ({ 
  messages, 
  isLoading 
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto scroll para novas mensagens
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea 
      ref={scrollAreaRef} 
      className="flex-1 p-4 h-[60vh] overflow-y-auto"
      role="log"
      aria-live="polite"
      aria-label="Histórico de conversa do assistente"
    >
      <div className="space-y-4">
        {messages.map((message) => (
          <ChatMessageBubble 
            key={message.id} 
            message={message} 
          />
        ))}
        
        {/* Indicador de carregamento */}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="max-w-[75%] p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none flex items-center border border-gray-200 dark:border-gray-700 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-homeo-blue flex-shrink-0" />
              <span className="text-sm">Analisando sua pergunta e consultando dados...</span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default AdminChatbotBody;