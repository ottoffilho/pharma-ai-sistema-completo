import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UseApiMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKeyToInvalidate?: string | string[];
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

export const useApiMutation = <TData = unknown, TVariables = void>({
  mutationFn,
  queryKeyToInvalidate,
  successMessage = 'Operação realizada com sucesso!',
  errorMessage = 'Ocorreu um erro',
  onSuccess,
  onError,
}: UseApiMutationOptions<TData, TVariables>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation<TData, Error, TVariables>({
    mutationFn: mutationFn,
    onSuccess: (data, variables, context) => {
      if (queryKeyToInvalidate) {
        queryClient.invalidateQueries({ queryKey: [queryKeyToInvalidate] });
      }
      toast({
        title: 'Sucesso',
        description: successMessage,
      });
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    onError: (error, variables, context) => {
      toast({
        title: errorMessage,
        description: error.message,
        variant: 'destructive',
      });
      if (onError) {
        onError(error, variables);
      }
    },
  });

  return mutation;
}; 