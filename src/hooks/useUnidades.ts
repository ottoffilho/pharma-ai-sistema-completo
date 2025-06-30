import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseFunctionUrl } from '@/integrations/supabase/client';
import type { UnidadeMedida } from '@/types/unidade-medida';

const ENDPOINT = getSupabaseFunctionUrl('gerenciar-unidades-medida');

export function useUnidades() {
  return useQuery<UnidadeMedida[]>(['unidades_medida'], async () => {
    const res = await fetch(ENDPOINT);
    if (!res.ok) throw new Error('Erro ao buscar unidades de medida');
    return res.json();
  });
}

export function useMutateUnidade() {
  const queryClient = useQueryClient();

  const create = useMutation(
    async (unidade: Pick<UnidadeMedida, 'codigo' | 'descricao'>) => {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unidade),
      });
      if (!res.ok) throw new Error('Erro ao criar unidade');
      return res.json();
    },
    { onSuccess: () => queryClient.invalidateQueries(['unidades_medida']) },
  );

  const update = useMutation(
    async ({ id, ...unidade }: UnidadeMedida) => {
      const res = await fetch(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unidade),
      });
      if (!res.ok) throw new Error('Erro ao atualizar unidade');
      return res.json();
    },
    { onSuccess: () => queryClient.invalidateQueries(['unidades_medida']) },
  );

  const remove = useMutation(
    async (id: string) => {
      const res = await fetch(`${ENDPOINT}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir unidade');
      return res.json();
    },
    { onSuccess: () => queryClient.invalidateQueries(['unidades_medida']) },
  );

  return { create, update, remove };
} 