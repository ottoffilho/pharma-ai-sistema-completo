import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { ArrowLeft, MessageSquare, Sparkles, Brain, Send, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProtectedComponent } from "@/modules/usuarios-permissoes/components/ProtectedComponent";
import {
  AcaoPermissao,
  ModuloSistema,
  NivelAcesso,
} from "@/modules/usuarios-permissoes/types";
import { getSupabaseFunctionUrl, supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  data?: Array<Record<string, unknown>> | null;
}

export default function ChatbotPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Carregar histórico quando sessionId estiver disponível
  useEffect(() => {
    if (sessionId) {
      const hasHistory = loadConversationHistory();
      if (!hasHistory) {
        // Mensagem de boas-vindas se não houver histórico
        const welcomeMessage: ChatMessage = {
          id: `welcome_${Date.now()}`,
          text: "Olá! Sou seu assistente de IA para o sistema farmacêutico. Posso ajudar você com informações sobre estoque, vendas, receitas, produção e muito mais. Como posso ajudar hoje?",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        saveConversationHistory([welcomeMessage]);
      }
    }
  }, [sessionId, loadConversationHistory, saveConversationHistory]);

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

  const addMessage = useCallback((text: string, sender: ChatMessage['sender'], data?: unknown) => {
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
  }, [saveConversationHistory]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Adicionar mensagem do usuário
    addMessage(userMessage, 'user');
    setIsLoading(true);

    try {
      // Obter token de acesso do usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(getSupabaseFunctionUrl('admin-chat-agent'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ sessionId, userMessage })
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Adicionar resposta do bot
      addMessage(data.botResponse || 'Desculpe, não consegui processar sua solicitação.', 'bot', data.records);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      addMessage('Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.', 'bot');
      toast({
        title: "Erro de comunicação",
        description: "Não foi possível enviar a mensagem. Verifique sua conexão.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem(`pharma_admin_chat_${sessionId}`);
    toast({
      title: "Conversa limpa",
      description: "O histórico da conversa foi removido."
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  return (
    <ProtectedComponent
      modulo={ModuloSistema.IA}
      acao={AcaoPermissao.LER}
      nivel={NivelAcesso.TODOS}
      fallback={<p>Acesso negado</p>}
    >
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-500 to-indigo-500 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  Assistente IA
                </h1>
                <p className="text-muted-foreground mt-1">
                  Converse em linguagem natural sobre estoque, vendas, receitas e muito mais
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                IA Ativa
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              <Card className="flex flex-col h-[70vh]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-indigo-600" />
                      <CardTitle className="text-lg">Conversa</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {messages.length} mensagens
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Messages Area */}
                  <ScrollArea 
                    ref={scrollAreaRef} 
                    className="flex-1 p-4"
                  >
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.sender === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border'
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap">
                              {message.text}
                            </div>
                            <div className={`text-xs mt-1 opacity-70 ${
                              message.sender === 'user' ? 'text-indigo-100' : 'text-muted-foreground'
                            }`}>
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Loading indicator */}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-800 rounded-bl-none border flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            <span className="text-sm text-muted-foreground">
                              Analisando sua pergunta...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <Separator />
                  
                  {/* Input Area */}
                  <div className="p-4">
                    <div className="flex gap-2">
                      <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua pergunta sobre estoque, vendas, receitas..."
                        className="min-h-[60px] resize-none"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="px-4 h-[60px]"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar with suggestions and info */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Sugestões
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => setInputValue("Qual o status do estoque atual?")}
                  >
                    <div className="text-xs">
                      Qual o status do estoque atual?
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => setInputValue("Mostre as vendas de hoje")}
                  >
                    <div className="text-xs">
                      Mostre as vendas de hoje
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => setInputValue("Quais produtos estão em falta?")}
                  >
                    <div className="text-xs">
                      Quais produtos estão em falta?
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => setInputValue("Relatório de produção da semana")}
                  >
                    <div className="text-xs">
                      Relatório de produção da semana
                    </div>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-indigo-600" />
                    Capacidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div>Consulta dados em tempo real</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div>Análise de estoque e vendas</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div>Relatórios personalizados</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div>Sugestões inteligentes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Este assistente tem acesso aos dados do seu sistema e pode fornecer informações precisas e atualizadas.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedComponent>
  );
}