import { useCallback, KeyboardEvent } from 'react';

interface UseEnterSubmitProps {
  onSubmit: () => void;
  disabled?: boolean;
}

export const useEnterSubmit = ({ onSubmit, disabled = false }: UseEnterSubmitProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (disabled) return;
    
    // Enter sem Shift = envia mensagem
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
    
    // Shift + Enter = quebra linha (comportamento padrão)
    // Não fazemos nada aqui, deixamos o comportamento padrão
  }, [onSubmit, disabled]);

  return { handleKeyDown };
};