import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Database, Tables } from '@/integrations/supabase/types';

// =====================================================
// TIPOS DE TABELAS DO BANCO DE DADOS
// =====================================================

type ConversaAtendimentoRow = Tables<'conversas_atendimento'>;
type MensagemAtendimentoRow = Tables<'mensagens_atendimento'>;
type TemplateRespostaRow = Tables<'templates_resposta'>;

// Tipo específico para a query de mensagens para cálculo de métricas
type MensagemParaCalculoRow = {
  conversa_id: string;
  remetente_tipo: string;
  enviada_em: string | null;
  created_at: string | null;
};

// =====================================================
// INTERFACES E TIPOS
// =====================================================

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
  status_leitura: 'nao_lida' | 'lida' | 'erro';
  lida: boolean; // Campo computado baseado no status_leitura
  entregue: boolean; // Campo computado baseado no status_leitura
  created_at: string;
}

export interface TemplateResposta {
  id: string;
  titulo: string;
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

// =====================================================
// HOOK PRINCIPAL
// =====================================================

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
        try {
          // Consulta tipada usando a interface Database
          let query = supabase
            .from('conversas_atendimento')
            .select('*')
            .order('updated_at', { ascending: false });

          // Aplicar filtros
          if (filtros?.status && filtros.status !== 'todos') {
            query = query.eq('status', filtros.status);
          }

          if (filtros?.busca) {
            query = query.or(`cliente_nome.ilike.%${filtros.busca}%,cliente_telefone.ilike.%${filtros.busca}%`);
          }

          if (filtros?.limite) {
            query = query.limit(filtros.limite);
          }

          if (filtros?.offset) {
            query = query.range(filtros.offset, (filtros.offset + (filtros.limite || 50)) - 1);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Erro ao buscar conversas:', error);
            throw new Error('Erro ao carregar conversas');
          }

          // Mapear dados para interface esperada usando tipos corretos
          return (data || []).map((conversa: ConversaAtendimentoRow): ConversaWhatsApp => ({
            id: conversa.id,
            cliente_id: conversa.cliente_id || undefined,
            cliente_nome: conversa.cliente_nome || '',
            cliente_telefone: conversa.cliente_telefone,
            status: (conversa.status || 'aberto') as 'aberto' | 'em_atendimento' | 'aguardando_cliente' | 'resolvido' | 'cancelado',
            prioridade: (conversa.prioridade || 'media') as 'baixa' | 'media' | 'alta' | 'urgente',
            atendente_id: conversa.atendente_id || undefined,
            atendente_nome: conversa.atendente_nome || undefined,
            ultima_mensagem: undefined, // Será calculado separadamente se necessário
            ultima_mensagem_data: conversa.ultima_mensagem_at || undefined,
            mensagens_nao_lidas: 0, // Será calculado separadamente se necessário
            tags: conversa.tags || [],
            observacoes: conversa.observacoes_internas || undefined,
            created_at: conversa.created_at || '',
            updated_at: conversa.updated_at || ''
          }));
        } catch (error) {
          console.error('Erro na consulta de conversas:', error);
          throw error;
        }
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

        try {
          const { data, error } = await supabase
            .from('mensagens_atendimento')
            .select('*')
            .eq('conversa_id', conversaId)
            .order('enviada_em', { ascending: true });

          if (error) {
            console.error('Erro ao buscar mensagens:', error);
            throw new Error('Erro ao carregar mensagens');
          }

          return (data || []).map((msg: MensagemAtendimentoRow): MensagemWhatsApp => ({
            id: msg.id,
            conversa_id: msg.conversa_id,
            remetente_tipo: msg.remetente_tipo as 'cliente' | 'atendente' | 'sistema',
            remetente_id: msg.remetente_id || undefined,
            remetente_nome: msg.remetente_nome || '',
            conteudo: msg.conteudo,
            tipo_mensagem: (msg.tipo_mensagem || 'texto') as 'texto' | 'imagem' | 'documento' | 'audio' | 'video' | 'localizacao',
            arquivo_url: msg.arquivo_url || undefined,
            arquivo_nome: msg.arquivo_nome || undefined,
            whatsapp_message_id: undefined, // Campo não presente na tabela
            timestamp: msg.enviada_em || msg.created_at || '',
            status_leitura: msg.status_leitura as 'nao_lida' | 'lida' | 'erro',
            lida: msg.status_leitura === 'lida',
            entregue: msg.status_leitura !== 'erro',
            created_at: msg.created_at || ''
          }));
        } catch (error) {
          console.error('Erro na consulta de mensagens:', error);
          throw error;
        }
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
        try {
          const { data, error } = await supabase
            .from('templates_resposta')
            .select('*')
            .eq('ativo', true)
            .order('categoria', { ascending: true });

          if (error) {
            console.error('Erro ao buscar templates:', error);
            throw new Error('Erro ao carregar templates');
          }

          return (data || []).map((template: TemplateRespostaRow): TemplateResposta => ({
            id: template.id,
            titulo: template.titulo,
            categoria: (template.categoria || 'outro') as 'saudacao' | 'orcamento' | 'agendamento' | 'informacao' | 'confirmacao' | 'outro',
            conteudo: template.conteudo,
            variaveis: [],
            ativo: template.ativo !== false,
            uso_automatico: false,
            condicoes_uso: undefined,
            created_at: template.created_at || '',
            updated_at: template.updated_at || ''
          }));
        } catch (error) {
          console.error('Erro na consulta de templates:', error);
          throw error;
        }
      },
    });
  };

  // Hook para buscar métricas
  const useMetricas = () => {
    return useQuery({
      queryKey: ['metricas-whatsapp'],
      queryFn: async (): Promise<MetricasWhatsApp> => {
        try {
          // Buscar métricas agregadas
          const hoje = new Date().toISOString().split('T')[0];

          const resultados = await Promise.allSettled([
            // Queries básicas para contagem
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

            // Queries para cálculos de métricas
            // Total de conversas para taxa de resolução
            supabase
              .from('conversas_atendimento')
              .select('id', { count: 'exact' }),

            // Conversas resolvidas para taxa de resolução
            supabase
              .from('conversas_atendimento')
              .select('id', { count: 'exact' })
              .eq('status', 'resolvido'),

            // Mensagens para cálculo de tempo de resposta (últimos 7 dias)
            supabase
              .from('mensagens_atendimento')
              .select('conversa_id, remetente_tipo, enviada_em, created_at')
              .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
              .order('conversa_id, enviada_em', { ascending: true })
          ]);

          // Extrair resultados de forma segura, com fallbacks para queries que falharam
          const conversasAbertas = resultados[0].status === 'fulfilled' ? resultados[0].value : { count: 0 };
          const conversasEmAtendimento = resultados[1].status === 'fulfilled' ? resultados[1].value : { count: 0 };
          const conversasHoje = resultados[2].status === 'fulfilled' ? resultados[2].value : { count: 0 };
          const mensagensHoje = resultados[3].status === 'fulfilled' ? resultados[3].value : { count: 0 };
          const totalConversas = resultados[4].status === 'fulfilled' ? resultados[4].value : { count: 0 };
          const conversasResolvidas = resultados[5].status === 'fulfilled' ? resultados[5].value : { count: 0 };
          const mensagensParaCalculos = resultados[6].status === 'fulfilled' ? resultados[6].value : { data: [] };

          // Log de erros das queries que falharam (se houver)
          resultados.forEach((resultado, index) => {
            if (resultado.status === 'rejected') {
              const nomes = ['conversasAbertas', 'conversasEmAtendimento', 'conversasHoje', 'mensagensHoje', 'totalConversas', 'conversasResolvidas', 'mensagensParaCalculos'];
              console.error(`Erro na query ${nomes[index]}:`, resultado.reason);
            }
          });

          // Calcular tempo de resposta médio
          let tempoRespostaMedio = 0;
          if (mensagensParaCalculos.data && mensagensParaCalculos.data.length > 0) {
            const temposResposta: number[] = [];
            const mensagensPorConversa = new Map<string, MensagemParaCalculoRow[]>();

            // Agrupar mensagens por conversa
            mensagensParaCalculos.data.forEach((msg: MensagemParaCalculoRow) => {
              if (!mensagensPorConversa.has(msg.conversa_id)) {
                mensagensPorConversa.set(msg.conversa_id, []);
              }
              mensagensPorConversa.get(msg.conversa_id)!.push(msg);
            });

            // Calcular tempos de resposta para cada conversa
            mensagensPorConversa.forEach((mensagens) => {
              for (let i = 0; i < mensagens.length - 1; i++) {
                const msgAtual = mensagens[i];
                const proximaMsg = mensagens[i + 1];

                // Se cliente enviou mensagem e próxima é do atendente
                if (msgAtual.remetente_tipo === 'cliente' && proximaMsg.remetente_tipo === 'atendente') {
                  const tempoCliente = new Date(msgAtual.enviada_em || msgAtual.created_at || '').getTime();
                  const tempoAtendente = new Date(proximaMsg.enviada_em || proximaMsg.created_at || '').getTime();
                  const tempoResposta = (tempoAtendente - tempoCliente) / (1000 * 60); // em minutos

                  if (tempoResposta > 0 && tempoResposta < 24 * 60) { // Filtrar tempos válidos (até 24h)
                    temposResposta.push(tempoResposta);
                  }
                }
              }
            });

            // Calcular média dos tempos de resposta
            if (temposResposta.length > 0) {
              tempoRespostaMedio = temposResposta.reduce((acc, tempo) => acc + tempo, 0) / temposResposta.length;
            }
          }

          // Calcular taxa de resolução
          const taxaResolucao = totalConversas.count && totalConversas.count > 0 
            ? Math.round((conversasResolvidas.count || 0) / totalConversas.count * 100)
            : 0;

          return {
            conversas_abertas: conversasAbertas.count || 0,
            conversas_em_atendimento: conversasEmAtendimento.count || 0,
            conversas_hoje: conversasHoje.count || 0,
            mensagens_hoje: mensagensHoje.count || 0,
            tempo_resposta_medio: Math.round(tempoRespostaMedio * 10) / 10, // Arredondar para 1 casa decimal
            taxa_resolucao: taxaResolucao,
            clientes_ativos: conversasHoje.count || 0,
          };
        } catch (error) {
          console.error('Erro ao calcular métricas:', error);
          return {
            conversas_abertas: 0,
            conversas_em_atendimento: 0,
            conversas_hoje: 0,
            mensagens_hoje: 0,
            tempo_resposta_medio: 0,
            taxa_resolucao: 0,
            clientes_ativos: 0,
          };
        }
      },
      refetchInterval: 60000, // Atualiza a cada minuto
    });
  };

  // Função para marcar mensagens como lidas
  const marcarComoLida = async (conversaId: string) => {
    try {
      const { error } = await supabase
        .from('mensagens_atendimento')
        .update({ status_leitura: 'lida' })
        .eq('conversa_id', conversaId)
        .eq('remetente_tipo', 'cliente');

      if (error) {
        console.error('Erro ao marcar como lida:', error);
        return;
      }

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['conversas-whatsapp'] });
      queryClient.invalidateQueries({ queryKey: ['mensagens-whatsapp', conversaId] });
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Função para aplicar template
  const aplicarTemplate = (template: TemplateResposta, variaveis: Record<string, string> = {}) => {
    let conteudo = template.conteudo;
    
    // Substituir variáveis no template
    Object.entries(variaveis).forEach(([chave, valor]) => {
      conteudo = conteudo.replace(new RegExp(`{{${chave}}}`, 'g'), valor);
    });

    return conteudo;
  };

  return {
    useConversas,
    useMensagens,
    useTemplates,
    useMetricas,
    marcarComoLida,
    aplicarTemplate,
  };
};

// =====================================================
// HOOKS AUXILIARES (para compatibilidade)
// =====================================================

export const useWhatsAppConversas = (filtros?: Parameters<ReturnType<typeof useWhatsApp>['useConversas']>[0]) => {
  return useWhatsApp().useConversas(filtros);
};

export const useWhatsAppMensagens = (conversaId: string) => {
  return useWhatsApp().useMensagens(conversaId);
};

export const useWhatsAppMetricas = () => {
  return useWhatsApp().useMetricas();
}; 