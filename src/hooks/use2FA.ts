// Hook para Autenticação de Dois Fatores - Pharma.AI

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
import { logInfo, logError } from '@/lib/secure-logger';
import { toast } from '@/hooks/use-toast';

export interface TwoFASetup {
  secret_key: string;
  backup_codes: string[];
  qr_code_url: string;
}

export interface TwoFAStatus {
  is_enabled: boolean;
  has_backup_codes: boolean;
  last_used: string | null;
  setup_date: string | null;
}

export interface Use2FAReturn {
  // Status
  status: TwoFAStatus | null;
  isLoading: boolean;
  isEnabled: boolean;
  
  // Setup
  setupData: TwoFASetup | null;
  isSettingUp: boolean;
  setup2FA: () => Promise<TwoFASetup | null>;
  
  // Enable/Disable
  isEnabling: boolean;
  enable2FA: (totpCode: string) => Promise<boolean>;
  isDisabling: boolean;
  disable2FA: (verificationCode: string) => Promise<boolean>;
  
  // Verification
  isVerifying: boolean;
  verify2FA: (code: string, type?: 'totp' | 'backup_code') => Promise<boolean>;
  
  // Utils
  generateQRCode: (secret: string, email: string) => string;
  refetch: () => void;
}

export function use2FA(): Use2FAReturn {
  const { usuario } = useAuthSimple();
  const queryClient = useQueryClient();
  
  const [setupData, setSetupData] = useState<TwoFASetup | null>(null);
  
  const userId = usuario?.usuario?.id;

  // Query para status 2FA
  const { 
    data: status, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['2fa-status', userId],
    queryFn: async (): Promise<TwoFAStatus> => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase.rpc('get_user_2fa_status', {
        p_user_id: userId
      });
      
      if (error) {
        logError('Erro ao buscar status 2FA', error);
        throw error;
      }
      
      return data as TwoFAStatus;
    },
    enabled: !!userId,
    staleTime: 30000 // Cache por 30 segundos
  });

  // Mutation para configurar 2FA
  const setup2FAMutation = useMutation({
    mutationFn: async (): Promise<TwoFASetup> => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase.rpc('setup_user_2fa', {
        p_user_id: userId
      });
      
      if (error) {
        logError('Erro ao configurar 2FA', error);
        throw error;
      }
      
      logInfo('2FA configurado para setup', { userId });
      return data as TwoFASetup;
    },
    onSuccess: (data) => {
      setSetupData(data);
      toast({
        title: '2FA Configurado',
        description: 'Configure seu aplicativo autenticador com o QR Code.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro na Configuração',
        description: 'Não foi possível configurar o 2FA. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  // Mutation para habilitar 2FA
  const enable2FAMutation = useMutation({
    mutationFn: async (totpCode: string): Promise<boolean> => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase.rpc('enable_user_2fa', {
        p_user_id: userId,
        p_totp_code: totpCode
      });
      
      if (error) {
        logError('Erro ao habilitar 2FA', error);
        throw error;
      }
      
      return data as boolean;
    },
    onSuccess: (success) => {
      if (success) {
        logInfo('2FA habilitado com sucesso', { userId });
        toast({
          title: '2FA Ativado!',
          description: 'Autenticação de dois fatores foi ativada com sucesso.',
        });
        
        // Limpar dados de setup
        setSetupData(null);
        
        // Invalidar cache
        queryClient.invalidateQueries(['2fa-status', userId]);
      } else {
        toast({
          title: 'Código Inválido',
          description: 'O código fornecido não é válido. Tente novamente.',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Erro na Ativação',
        description: 'Não foi possível ativar o 2FA. Verifique o código.',
        variant: 'destructive',
      });
    }
  });

  // Mutation para desabilitar 2FA
  const disable2FAMutation = useMutation({
    mutationFn: async (verificationCode: string): Promise<boolean> => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase.rpc('disable_user_2fa', {
        p_user_id: userId,
        p_verification_code: verificationCode
      });
      
      if (error) {
        logError('Erro ao desabilitar 2FA', error);
        throw error;
      }
      
      return data as boolean;
    },
    onSuccess: (success) => {
      if (success) {
        logInfo('2FA desabilitado', { userId });
        toast({
          title: '2FA Desativado',
          description: 'Autenticação de dois fatores foi desativada.',
        });
        
        // Invalidar cache
        queryClient.invalidateQueries(['2fa-status', userId]);
      } else {
        toast({
          title: 'Código Inválido',
          description: 'O código fornecido não é válido para desativar o 2FA.',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Erro na Desativação',
        description: 'Não foi possível desativar o 2FA. Verifique o código.',
        variant: 'destructive',
      });
    }
  });

  // Mutation para verificar código 2FA
  const verify2FAMutation = useMutation({
    mutationFn: async ({ code, type }: { code: string; type: 'totp' | 'backup_code' }): Promise<boolean> => {
      if (!userId) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase.rpc('verify_2fa_code', {
        p_user_id: userId,
        p_code: code,
        p_code_type: type
      });
      
      if (error) {
        logError('Erro ao verificar código 2FA', error);
        throw error;
      }
      
      return data as boolean;
    },
    onSuccess: (success, variables) => {
      if (success) {
        logInfo('Código 2FA verificado com sucesso', { 
          userId, 
          type: variables.type 
        });
        
        // Atualizar último uso
        queryClient.invalidateQueries(['2fa-status', userId]);
      }
    }
  });

  // Funções expostas
  const setup2FA = useCallback(async (): Promise<TwoFASetup | null> => {
    try {
      return await setup2FAMutation.mutateAsync();
    } catch (error) {
      return null;
    }
  }, [setup2FAMutation]);

  const enable2FA = useCallback(async (totpCode: string): Promise<boolean> => {
    try {
      return await enable2FAMutation.mutateAsync(totpCode);
    } catch (error) {
      return false;
    }
  }, [enable2FAMutation]);

  const disable2FA = useCallback(async (verificationCode: string): Promise<boolean> => {
    try {
      return await disable2FAMutation.mutateAsync(verificationCode);
    } catch (error) {
      return false;
    }
  }, [disable2FAMutation]);

  const verify2FA = useCallback(async (
    code: string, 
    type: 'totp' | 'backup_code' = 'totp'
  ): Promise<boolean> => {
    try {
      return await verify2FAMutation.mutateAsync({ code, type });
    } catch (error) {
      return false;
    }
  }, [verify2FAMutation]);

  const generateQRCode = useCallback((secret: string, email: string): string => {
    const appName = import.meta.env.VITE_APP_NAME || 'Pharma.AI';
    return `otpauth://totp/${appName}:${email}?secret=${secret}&issuer=${appName}`;
  }, []);

  return {
    // Status
    status: status || null,
    isLoading,
    isEnabled: status?.is_enabled || false,
    
    // Setup
    setupData,
    isSettingUp: setup2FAMutation.isPending,
    setup2FA,
    
    // Enable/Disable
    isEnabling: enable2FAMutation.isPending,
    enable2FA,
    isDisabling: disable2FAMutation.isPending,
    disable2FA,
    
    // Verification
    isVerifying: verify2FAMutation.isPending,
    verify2FA,
    
    // Utils
    generateQRCode,
    refetch: () => refetch()
  };
}