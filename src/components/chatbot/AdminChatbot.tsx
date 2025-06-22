import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getSupabaseFunctionUrl, supabase } from '@/integrations/supabase/client';
import AdminChatbotHeader from './AdminChatbotHeader';
import AdminChatbotBody from './AdminChatbotBody';
import AdminChatbotFooter from './AdminChatbotFooter';
import { ChatMessage } from './ChatMessageBubble';


interface AdminChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  fullPage?: boolean;
}

const AdminChatbot: React.FC<AdminChatbotProps> = ({ isOpen, onClose, fullPage = false }) => {
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
        // Converter timestamps de volta para Date objects
        const historyWithDates = parsedHistory.map((msg: ChatMessage) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
        setMessages(historyWithDates);
        return true; // Indica que havia histórico
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
    return false; // Não havia histórico
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
    // Gera ID único (timestamp + fragmento aleatório) para evitar duplicidade de chaves no React
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
      // Salvar no localStorage sempre que adicionar uma mensagem
      saveConversationHistory(updatedMessages);
      return updatedMessages;
    });

    // Efeito de digitação para mensagens do bot
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
            // Salvar estado atualizado
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
      // Adicionar mensagem de boas-vindas novamente
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

  // Função para processar quick actions
  const handleQuickAction = async (query: string) => {
    if (isLoading) return;
    
    addMessage(query, 'user');
    setIsLoading(true);
    await processNaturalLanguage(query);
    setIsLoading(false);
  };

  // Função para processar mensagem (agora delegando ao agente)
  const processNaturalLanguage = async (userMessage: string) => {
    try {
      // Saudações rápidas locais para boa UX
      if (/(bom dia|boa tarde|boa noite|ol[áa]|oi|hello|hi)/i.test(userMessage.toLowerCase())) {
        addMessage(
          `Olá! 😊 Como posso ajudar você hoje?\n\nPergunte, por exemplo:\n• "Como está meu estoque?"\n• "Faturamento do mês"`,
          'bot',
          null,
          true
        );
        return;
      }

      setIsLoading(true);
      const agentUrl = getSupabaseFunctionUrl('admin-chat-agent');

      // Obter token de acesso do usuário logado
      const { data: { session } } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      const resp = await fetch(agentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
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

    // Processar comando com IA
    await processNaturalLanguage(userMessageText);
    setIsLoading(false);
  };

  if (fullPage) {
    return (
      <Dialog open={true}>
        <DialogContent
          className="fixed inset-0 p-0 flex flex-col h-full w-full max-w-none rounded-none [&>button]:hidden"
        >
          <AdminChatbotHeader
            onClose={onClose}
            onClearHistory={clearConversationHistory}
          />

          <AdminChatbotBody messages={messages} isLoading={isLoading} />

          <AdminChatbotFooter
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSendMessage={handleSendMessage}
            onQuickAction={handleQuickAction}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[900px] w-[95vw] p-0 flex flex-col max-h-[85vh] [&>button]:hidden">
        <AdminChatbotHeader 
          onClose={onClose}
          onClearHistory={clearConversationHistory}
        />
        
        <AdminChatbotBody 
          messages={messages}
          isLoading={isLoading}
        />

        <AdminChatbotFooter 
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
          onQuickAction={handleQuickAction}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AdminChatbot; 