import React from 'react';
import { User, Bot } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system';
  timestamp?: Date;
  data?: Array<Record<string, unknown>> | null;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const { sender, text, data } = message;

  if (sender === 'system') {
    return (
      <div className="flex justify-center">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs italic text-center px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800 max-w-[85%]">
          {text}
        </div>
      </div>
    );
  }

  const isUser = sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div 
        className={`max-w-[85%] p-3 rounded-lg text-sm ${
          isUser 
            ? 'bg-homeo-blue text-white rounded-br-none shadow-md' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700 shadow-sm'
        }`}
      >
        <div className="flex items-start gap-2">
          {isUser ? (
            <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-homeo-blue dark:text-homeo-accent" />
          )}
          <div className="flex-1">
            <div className="whitespace-pre-line leading-relaxed">{text}</div>
            
            {/* Dados estruturados se houver */}
            {data && Array.isArray(data) && data.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                <Badge 
                  variant="outline" 
                  className="text-xs bg-white/50 dark:bg-gray-700/50"
                >
                  {data.length} registro(s) encontrado(s)
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageBubble;