import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const WhatsAppDebug: React.FC = () => {
  const [conversaSelecionada, setConversaSelecionada] = useState<string>('cfab467b-4aa7-4d4d-9d1a-dea0193030fa');

  // Buscar conversas
  const { data: conversas } = useQuery({
    queryKey: ['debug-conversas'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('buscar_conversas_whatsapp', {
        p_status: null,
        p_busca: null,
        p_limit: 10,
        p_offset: 0
      });
      
      if (error) {
        console.error('Erro conversas:', error);
        throw error;
      }
      
      console.log('CONVERSAS DEBUG:', data);
      return data || [];
    },
  });

  // Buscar mensagens
  const { data: mensagens } = useQuery({
    queryKey: ['debug-mensagens', conversaSelecionada],
    queryFn: async () => {
      if (!conversaSelecionada) return [];
      
      const { data, error } = await supabase
        .from('mensagens_atendimento')
        .select('*')
        .eq('conversa_id', conversaSelecionada)
        .order('enviada_em', { ascending: true });

      if (error) {
        console.error('Erro mensagens:', error);
        throw error;
      }
      
      console.log('MENSAGENS DEBUG:', data);
      return data || [];
    },
    enabled: !!conversaSelecionada,
  });

  console.log('RENDER DEBUG - conversaSelecionada:', conversaSelecionada);
  console.log('RENDER DEBUG - conversas:', conversas);
  console.log('RENDER DEBUG - mensagens:', mensagens);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug WhatsApp</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Conversas ({conversas?.length || 0})</h2>
          <div className="space-y-2">
            {conversas?.map((conv: any) => (
              <div 
                key={conv.id}
                className={`p-2 border rounded cursor-pointer ${
                  conversaSelecionada === conv.id ? 'bg-blue-100' : 'bg-gray-50'
                }`}
                onClick={() => setConversaSelecionada(conv.id)}
              >
                <div className="font-medium">{conv.cliente_nome}</div>
                <div className="text-sm text-gray-600">{conv.cliente_telefone}</div>
                <div className="text-xs text-gray-500">ID: {conv.id}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Mensagens ({mensagens?.length || 0})</h2>
          <div className="space-y-2">
            {mensagens?.length === 0 ? (
              <div className="text-gray-500">Nenhuma mensagem</div>
            ) : (
              mensagens?.map((msg: any) => (
                <div key={msg.id} className={`p-2 rounded ${
                  msg.remetente_tipo === 'cliente' ? 'bg-gray-100' : 'bg-blue-100'
                }`}>
                  <div className="font-medium text-sm">{msg.remetente_nome}</div>
                  <div>{msg.conteudo}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(msg.enviada_em).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">Debug Info:</h3>
        <p>Conversa Selecionada: {conversaSelecionada}</p>
        <p>Total Conversas: {conversas?.length || 0}</p>
        <p>Total Mensagens: {mensagens?.length || 0}</p>
      </div>
    </div>
  );
};

export default WhatsAppDebug; 