import React, { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, X, Trash2 } from 'lucide-react';
import { getSupabaseFunctionUrl } from '@/integrations/supabase/client';
import ChatMessageBubble, { ChatMessage } from './ChatMessageBubble';
import AdminChatbotFooter from './AdminChatbotFooter';
import { useEnterSubmit } from '@/hooks/useEnterSubmit';

interface AdminChatbotMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminChatbotMobile: React.FC<AdminChatbotMobileProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Gerar ID de sessão único
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `admin_chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, [sessionId]);

  // Carregar histórico de conversa do localStorage
  const loadConversationHistory = useCallback(() => {
    try {
      const savedHistory = localStorage.getItem(`pharma_admin_chat_${sessionId}`);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        const historyWithDates = parsedHistory.map((msg: ChatMessage) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
        setMessages(historyWithDates);
        return true;
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
    return false;
  }, [sessionId]);

  // Salvar conversa no localStorage
  const saveConversationHistory = useCallback((newMessages: ChatMessage[]) => {
    try {
      localStorage.setItem(`pharma_admin_chat_${sessionId}`, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }, [sessionId]);

  const addMessage = useCallback((text: string, sender: ChatMessage['sender'], data?: unknown, useTypingEffect: boolean = false) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newMessage: ChatMessage = {
      id,
      text,
      sender,
      timestamp: new Date(),
      data: Array.isArray(data) ? data as Array<Record<string, unknown>> : null
    };
    
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newMessage];
      saveConversationHistory(updatedMessages);
      return updatedMessages;
    });

    if (useTypingEffect && sender === 'bot') {
      let currentText = '';
      let charIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (charIndex < text.length) {
          currentText += text[charIndex];
          setMessages((prevMessages) => {
            const updatedMessages = prevMessages.map(msg => 
              msg.id === newMessage.id 
                ? { ...msg, text: currentText }
                : msg
            );
            saveConversationHistory(updatedMessages);
            return updatedMessages;
          });
          charIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, 20);
    }
  }, [saveConversationHistory]);

  // Limpar histórico de conversa
  const clearConversationHistory = useCallback(() => {
    try {
      localStorage.removeItem(`pharma_admin_chat_${sessionId}`);
      setMessages([]);
      setTimeout(() => {
        addMessage(
          `🤖 Histórico limpo! Olá novamente!

Posso responder **qualquer pergunta** sobre seus dados da farmácia em tempo real.

💡 **Exemplos:** "Como está meu estoque?", "Faturamento do mês", "Produtos acabando"

Como posso te ajudar?`, 
          'bot',
          null,
          true
        );
      }, 500);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  }, [sessionId, addMessage]);

  // Inicializar chatbot quando aberto
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      const hadHistory = loadConversationHistory();
      setHasInitialized(true);

      if (!hadHistory) {
        setTimeout(() => {
          addMessage(
            `👋 Olá! Sou seu assistente inteligente.

Posso te ajudar com consultas rápidas sobre seus dados:
• Situação do estoque
• Produtos que estão acabando  
• Faturamento e vendas
• Preços de produtos
• Status de pedidos e receitas

Como posso te ajudar?`, 
            'bot',
            null,
            true
          );
        }, 500);
      }
    } else if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen, hasInitialized, sessionId, loadConversationHistory, addMessage]);

  // Função para processar mensagem
  const processNaturalLanguage = async (userMessage: string) => {
    try {
      if (/(bom dia|boa tarde|boa noite|ol[áa]|oi|hello|hi)/i.test(userMessage.toLowerCase())) {
        addMessage(
          `Olá! 😊 Como posso ajudar você hoje?\n\nPergunte, por exemplo:\n• \"Como está meu estoque?\"\n• \"Faturamento do mês\"`,
          'bot',
          null,
          true
        );
        return;
      }

      setIsLoading(true);
      const agentUrl = getSupabaseFunctionUrl('admin-chat-agent');

      const resp = await fetch(agentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ sessionId, userMessage })
      });

      if (!resp.ok) {
        throw new Error(`agent status ${resp.status}`);
      }

      const result = await resp.json();
      addMessage(result.botResponse || '🤖 Sem resposta agora.', 'bot', result.records, true);
    } catch (error) {
      console.error('processNaturalLanguage error', error);
      addMessage('❌ Ops! Erro ao consultar o assistente.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const userMessageText = inputValue;
    addMessage(userMessageText, 'user');
    setInputValue('');
    setIsLoading(true);

    await processNaturalLanguage(userMessageText);
    setIsLoading(false);
  };

  // Função para processar quick actions
  const handleQuickAction = async (query: string) => {
    if (isLoading) return;
    
    addMessage(query, 'user');
    setIsLoading(true);
    await processNaturalLanguage(query);
    setIsLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[95vh] p-0 flex flex-col"
      >
        <SheetHeader className="p-4 pb-3 bg-gradient-to-r from-homeo-blue via-homeo-blue to-homeo-accent text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-white" />
              <div>
                <SheetTitle className="text-white text-left">
                  Assistente Pharma.AI
                </SheetTitle>
                <SheetDescription className="text-blue-100 text-left text-sm">
                  Faça perguntas sobre seus dados
                </SheetDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 h-8 w-8" 
                onClick={clearConversationHistory}
                title="Limpar histórico"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 h-8 w-8" 
                onClick={onClose}
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessageBubble 
                  key={message.id} 
                  message={message} 
                />
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
            <AdminChatbotFooter 
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSendMessage={handleSendMessage}
              onQuickAction={handleQuickAction}
              isLoading={isLoading}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdminChatbotMobile;