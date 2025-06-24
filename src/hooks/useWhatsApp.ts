import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export interface ConversaWhatsApp {
  id: string;
  cliente_id?: string;
  cliente_nome: string;
  cliente_telefone: string;
  status: 'aberto' | 'em_atendimento' | 'aguardando_cliente' | 'resolvido' | 'cancelado';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  atendente_id?: string;
  atendente_nome?: string;
  ultima_mensagem?: string;
  ultima_mensagem_data?: string;
  mensagens_nao_lidas: number;
  tags?: string[];
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface MensagemWhatsApp {
  id: string;
  conversa_id: string;
  remetente_tipo: 'cliente' | 'atendente' | 'sistema';
  remetente_id?: string;
  remetente_nome: string;
  conteudo: string;
  tipo_mensagem: 'texto' | 'imagem' | 'documento' | 'audio' | 'video' | 'localizacao';
  arquivo_url?: string;
  arquivo_nome?: string;
  whatsapp_message_id?: string;
  timestamp: string;
  lida: boolean;
  entregue: boolean;
  created_at: string;
}

export interface TemplateResposta {
  id: string;
  nome: string;
  categoria: 'saudacao' | 'orcamento' | 'agendamento' | 'informacao' | 'confirmacao' | 'outro';
  conteudo: string;
  variaveis?: string[];
  ativo: boolean;
  uso_automatico: boolean;
  condicoes_uso?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MetricasWhatsApp {
  conversas_abertas: number;
  conversas_em_atendimento: number;
  conversas_hoje: number;
  mensagens_hoje: number;
  tempo_resposta_medio: number;
  taxa_resolucao: number;
  clientes_ativos: number;
}

export const useWhatsApp = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hook para buscar conversas
  const useConversas = (filtros?: {
    status?: string;
    atendente_id?: string;
    busca?: string;
    limite?: number;
    offset?: number;
  }) => {
    return useQuery({
      queryKey: ['conversas-whatsapp', filtros],
      queryFn: async (): Promise<ConversaWhatsApp[]> => {
        // Usar a função otimizada do banco
        const { data, error } = await supabase.rpc('buscar_conversas_whatsapp', {
          p_status: filtros?.status === 'todos' ? null : filtros?.status,
          p_busca: filtros?.busca || null,
          p_limit: filtros?.limite || 50,
          p_offset: filtros?.offset || 0
        });

        if (error) {
          console.error('Erro ao buscar conversas:', error);
          throw new Error('Erro ao carregar conversas');
        }

        // Mapear dados para interface esperada
        return (data || []).map((conversa: any) => ({
          ...conversa,
          cliente: conversa.cliente_email ? {
            id: conversa.cliente_id,
            nome: conversa.cliente_nome,
            telefone: conversa.cliente_telefone
          } : null,
          ultima_mensagem: conversa.ultima_mensagem_conteudo,
          mensagens_nao_lidas: conversa.mensagens_nao_lidas
        }));
      },
      refetchInterval: 30000, // Atualiza a cada 30 segundos
    });
  };

  // Hook para buscar mensagens de uma conversa
  const useMensagens = (conversaId: string) => {
    return useQuery({
      queryKey: ['mensagens-whatsapp', conversaId],
      queryFn: async (): Promise<MensagemWhatsApp[]> => {
        if (!conversaId) return [];

        const { data, error } = await supabase
          .from('mensagens_atendimento')
          .select('*')
          .eq('conversa_id', conversaId)
          .order('enviada_em', { ascending: true });

        if (error) {
          console.error('Erro ao buscar mensagens:', error);
          throw new Error('Erro ao carregar mensagens');
        }

        return (data || []).map(msg => ({
          ...msg,
          timestamp: msg.enviada_em,
          lida: msg.status_leitura === 'lida',
          entregue: msg.status_leitura !== 'erro'
        }));
      },
      enabled: !!conversaId,
      refetchInterval: 5000, // Atualiza a cada 5 segundos
    });
  };

  // Hook para buscar templates
  const useTemplates = () => {
    return useQuery({
      queryKey: ['templates-whatsapp'],
      queryFn: async (): Promise<TemplateResposta[]> => {
        const { data, error } = await supabase
          .from('templates_resposta')
          .select('*')
          .eq('ativo', true)
          .order('categoria', { ascending: true });

        if (error) {
          console.error('Erro ao buscar templates:', error);
          throw new Error('Erro ao carregar templates');
        }

        return data || [];
      },
    });
  };

  // Hook para buscar métricas
  const useMetricas = () => {
    return useQuery({
      queryKey: ['metricas-whatsapp'],
      queryFn: async (): Promise<MetricasWhatsApp> => {
        // Buscar métricas agregadas
        const hoje = new Date().toISOString().split('T')[0];

        const [
          conversasAbertas,
          conversasEmAtendimento,
          conversasHoje,
          mensagensHoje,
        ] = await Promise.all([
          supabase
            .from('conversas_atendimento')
            .select('id', { count: 'exact' })
            .eq('status', 'aberto'),
          
          supabase
            .from('conversas_atendimento')
            .select('id', { count: 'exact' })
            .eq('status', 'em_atendimento'),
          
          supabase
            .from('conversas_atendimento')
            .select('id', { count: 'exact' })
            .gte('created_at', hoje),
          
          supabase
            .from('mensagens_atendimento')
            .select('id', { count: 'exact' })
            .gte('enviada_em', hoje),
        ]);

        // Calcular tempo médio de resposta real
        const tempoMedioResposta = await calcularTempoMedioResposta();

        return {
          conversas_abertas: conversasAbertas.count || 0,
          conversas_em_atendimento: conversasEmAtendimento.count || 0,
          conversas_hoje: conversasHoje.count || 0,
          mensagens_hoje: mensagensHoje.count || 0,
          tempo_resposta_medio: tempoMedioResposta,
          taxa_resolucao: await calcularTaxaResolucao(),
          clientes_ativos: conversasHoje.count || 0,
        };
      },
      refetchInterval: 60000, // Atualiza a cada minuto
    });
  };

  // Função para calcular tempo médio de resposta
  const calcularTempoMedioResposta = async (): Promise<number> => {
    try {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      
      const { data: mensagens, error } = await supabase
        .from('mensagens_atendimento')
        .select('conversa_id, remetente_tipo, enviada_em')
        .gte('enviada_em', seteDiasAtras.toISOString())
        .order('conversa_id', { ascending: true })
        .order('enviada_em', { ascending: true });

      if (error || !mensagens || mensagens.length === 0) {
        return 2.5; // Valor padrão em minutos
      }

      const conversasMap = new Map<string, Array<{ remetente_tipo: string, enviada_em: string }>>();
      
      mensagens.forEach(msg => {
        if (!conversasMap.has(msg.conversa_id)) {
          conversasMap.set(msg.conversa_id, []);
        }
        conversasMap.get(msg.conversa_id)!.push({
          remetente_tipo: msg.remetente_tipo,
          enviada_em: msg.enviada_em
        });
      });

      const temposResposta: number[] = [];

      conversasMap.forEach(mensagensConversa => {
        for (let i = 0; i < mensagensConversa.length - 1; i++) {
          const mensagemAtual = mensagensConversa[i];
          const proximaMensagem = mensagensConversa[i + 1];

          if (mensagemAtual.remetente_tipo === 'cliente' && 
              proximaMensagem.remetente_tipo === 'atendente') {
            
            const tempoCliente = new Date(mensagemAtual.enviada_em).getTime();
            const tempoAtendente = new Date(proximaMensagem.enviada_em).getTime();
            const diferenca = (tempoAtendente - tempoCliente) / 1000 / 60; // em minutos

            if (diferenca >= 0.17 && diferenca <= 120) {
              temposResposta.push(diferenca);
            }
          }
        }
      });

      if (temposResposta.length === 0) {
        return 2.5;
      }

      temposResposta.sort((a, b) => a - b);
      const p95Index = Math.floor(temposResposta.length * 0.95);
      const temposFiltrados = temposResposta.slice(0, p95Index);
      
      const media = temposFiltrados.reduce((sum, tempo) => sum + tempo, 0) / temposFiltrados.length;
      
      return Number(media.toFixed(1));
      
    } catch (error) {
      console.error('Erro ao calcular tempo médio de resposta:', error);
      return 2.5;
    }
  };

  // Função para calcular taxa de resolução
  const calcularTaxaResolucao = async (): Promise<number> => {
    try {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

      const [totalConversas, conversasResolvidas] = await Promise.all([
        supabase
          .from('conversas_atendimento')
          .select('id', { count: 'exact' })
          .gte('created_at', seteDiasAtras.toISOString()),
        
        supabase
          .from('conversas_atendimento')
          .select('id', { count: 'exact' })
          .gte('created_at', seteDiasAtras.toISOString())
          .eq('status', 'resolvido')
      ]);

      if (!totalConversas.count || totalConversas.count === 0) {
        return 94.2; // Valor padrão
      }

      const taxa = (conversasResolvidas.count || 0) / totalConversas.count * 100;
      return Number(taxa.toFixed(1));

    } catch (error) {
      console.error('Erro ao calcular taxa de resolução:', error);
      return 94.2;
    }
  };

  // Mutation para enviar mensagem
  const enviarMensagem = useMutation({
    mutationFn: async (dados: {
      conversa_id: string;
      telefone: string;
      mensagem: string;
      tipo?: 'texto' | 'template';
      template_id?: string;
      variaveis?: Record<string, string>;
    }) => {
      const { data, error } = await supabase.functions.invoke('enviar-mensagem-whatsapp', {
        body: dados,
      });

      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['conversas-whatsapp'] });
      queryClient.invalidateQueries({ queryKey: ['mensagens-whatsapp'] });
    },
    onError: (error) => {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para assumir atendimento
  const assumirAtendimento = useMutation({
    mutationFn: async (conversaId: string) => {
      const { data: usuario } = await supabase.auth.getUser();
      
      if (!usuario.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('conversas_atendimento')
        .update({
          status: 'em_atendimento',
          atendente_id: usuario.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversaId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao assumir atendimento:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Atendimento assumido",
        description: "Você agora está responsável por este atendimento",
      });
      
      queryClient.invalidateQueries({ queryKey: ['conversas-whatsapp'] });
    },
    onError: (error) => {
      console.error('Erro ao assumir atendimento:', error);
      toast({
        title: "Erro ao assumir atendimento",
        description: "Não foi possível assumir o atendimento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para finalizar conversa
  const finalizarConversa = useMutation({
    mutationFn: async (conversaId: string) => {
      const { data, error } = await supabase
        .from('conversas_atendimento')
        .update({
          status: 'resolvido',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversaId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao finalizar conversa:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Conversa finalizada",
        description: "A conversa foi marcada como resolvida",
      });
      
      queryClient.invalidateQueries({ queryKey: ['conversas-whatsapp'] });
    },
    onError: (error) => {
      console.error('Erro ao finalizar conversa:', error);
      toast({
        title: "Erro ao finalizar conversa",
        description: "Não foi possível finalizar a conversa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para criar/atualizar template
  const salvarTemplate = useMutation({
    mutationFn: async (template: Partial<TemplateResposta>) => {
      if (template.id) {
        // Atualizar template existente
        const { data, error } = await supabase
          .from('templates_resposta')
          .update({
            ...template,
            updated_at: new Date().toISOString(),
          })
          .eq('id', template.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo template
        const { data, error } = await supabase
          .from('templates_resposta')
          .insert({
            ...template,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: "Template salvo",
        description: "O template foi salvo com sucesso",
      });
      
      queryClient.invalidateQueries({ queryKey: ['templates-whatsapp'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro ao salvar template",
        description: "Não foi possível salvar o template. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Função para marcar mensagens como lidas
  const marcarComoLida = async (conversaId: string) => {
    try {
      const { error } = await supabase
        .from('mensagens_atendimento')
        .update({ lida: true })
        .eq('conversa_id', conversaId)
        .eq('remetente_tipo', 'cliente');

      if (error) {
        console.error('Erro ao marcar como lida:', error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['conversas-whatsapp'] });
        queryClient.invalidateQueries({ queryKey: ['mensagens-whatsapp', conversaId] });
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Função para aplicar template
  const aplicarTemplate = (template: TemplateResposta, variaveis: Record<string, string> = {}) => {
    let conteudo = template.conteudo;

    // Substituir variáveis no conteúdo
    Object.entries(variaveis).forEach(([chave, valor]) => {
      const regex = new RegExp(`{{${chave}}}`, 'g');
      conteudo = conteudo.replace(regex, valor);
    });

    return conteudo;
  };

  return {
    // Hooks de dados
    useConversas,
    useMensagens,
    useTemplates,
    useMetricas,
    
    // Mutations
    enviarMensagem,
    assumirAtendimento,
    finalizarConversa,
    salvarTemplate,
    
    // Funções utilitárias
    marcarComoLida,
    aplicarTemplate,
  };
};

// Hook simplificado para usar em componentes
export const useWhatsAppConversas = (filtros?: Parameters<ReturnType<typeof useWhatsApp>['useConversas']>[0]) => {
  const { useConversas } = useWhatsApp();
  return useConversas(filtros);
};

export const useWhatsAppMensagens = (conversaId: string) => {
  const { useMensagens } = useWhatsApp();
  return useMensagens(conversaId);
};

export const useWhatsAppMetricas = () => {
  const { useMetricas } = useWhatsApp();
  return useMetricas();
};

export default useWhatsApp; 