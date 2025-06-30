import { useQuery } from '@tanstack/react-query';
import { supabase, getSupabaseFunctionUrl } from '@/integrations/supabase/client';

export interface FormaFarmaceutica {
  id: string;
  nome: string;
  abreviatura?: string;
  descricao?: string;
  tipo_uso?: string;
  via_administracao?: string;
  ativo: boolean;
}

export const useFormasFarmaceuticas = () => {
  return useQuery({
    queryKey: ['formas-farmaceuticas'],
    queryFn: async (): Promise<FormaFarmaceutica[]> => {
      // Obtém o token de sessão atual para autenticar a chamada da Edge Function
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Para compatibilidade com versões anteriores da Edge Function que
      // aguardam o sufixo "/listar", adicionamos explicitamente esse path.
      // A rota raiz também continua funcionando nas versões mais novas,
      // portanto esta alteração mantém compatibilidade retroativa e futura.
      const functionUrl = getSupabaseFunctionUrl('gerenciar-formas-farmaceuticas/listar');

      try {
        // Controlador para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            const formasComViaDministracao = (result.data as any[]).map((forma:any) => ({
              ...forma,
              via_administracao: forma.tipo_uso,
            }));

            return formasComViaDministracao as FormaFarmaceutica[];
          }
        }
      } catch (err) {
        console.error('Erro ao chamar Edge Function:', err);
      }

      // Fallback: consulta direta via Supabase
      console.warn('Usando fallback direto no banco para carregar formas farmacêuticas.');

      const { data, error } = await supabase
        .from('formas_farmaceuticas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as unknown as FormaFarmaceutica[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};