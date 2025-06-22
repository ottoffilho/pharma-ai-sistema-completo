// Hook de Autenticação - Pharma.AI
// Módulo: M09-USUARIOS_PERMISSOES

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { supabase } from '@/integrations/supabase/client';
import type {
  SessaoUsuario,
  RespostaAuth,
  VerificarPermissao
} from '../types';

import {
  ModuloSistema,
  AcaoPermissao,
  NivelAcesso
} from '../types';

/**
 * Interface do contexto de autenticação
 */
interface AuthContextType {
  usuario: SessaoUsuario | null;
  carregando: boolean;
  autenticado: boolean;
  login: (email: string, senha: string) => Promise<RespostaAuth>;
  logout: () => Promise<void>;
  verificarPermissao: VerificarPermissao;
  temPermissao: (modulo: ModuloSistema, acao: AcaoPermissao, nivel?: NivelAcesso) => boolean;
  recarregarUsuario: () => Promise<void>;
}

/**
 * Contexto de autenticação
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook para acessar contexto de autenticação
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

/**
 * Hook para gerenciar estado de autenticação
 */
export const useAuthState = () => {
  const [usuario, setUsuario] = useState<SessaoUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  /**
   * Carrega usuário atual da sessão
   */
  const carregarUsuario = useCallback(async () => {
    try {
      console.log('🔄 useAuth - Iniciando carregamento do usuário...');
      setCarregando(true);
      
      const usuarioAtual = await AuthService.obterUsuarioAtual();
      console.log('👤 useAuth - Usuário obtido:', usuarioAtual ? 'Encontrado' : 'Não encontrado');
      
      setUsuario(usuarioAtual);
    } catch (error) {
      console.error('❌ useAuth - Erro ao carregar usuário:', error);
      setUsuario(null);
    } finally {
      console.log('✅ useAuth - Finalizando carregamento (carregando = false)');
      setCarregando(false);
    }
  }, []);

  /**
   * Realiza login
   */
  const login = useCallback(async (email: string, senha: string): Promise<RespostaAuth> => {
    try {
      setCarregando(true);
      const resposta = await AuthService.login(email, senha);
      
      if (resposta.sucesso && resposta.usuario) {
        setUsuario(resposta.usuario);
      }
      
      return resposta;
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        sucesso: false,
        erro: 'Erro interno do servidor'
      };
    } finally {
      setCarregando(false);
    }
  }, []);

  /**
   * Realiza logout
   */
  const logout = useCallback(async () => {
    try {
      setCarregando(true);
      await AuthService.logout();
      setUsuario(null);
      
      // Força redirecionamento para login
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, limpa o estado e redireciona
      setUsuario(null);
      window.location.href = '/login';
    } finally {
      setCarregando(false);
    }
  }, []);

  /**
   * Verifica se usuário tem permissão específica
   */
  const verificarPermissao = useCallback((
    modulo: ModuloSistema,
    acao: AcaoPermissao,
    nivel?: NivelAcesso
  ): boolean => {
    if (!usuario?.permissoes) {
      return false;
    }

    return AuthService.verificarPermissao(
      usuario.permissoes,
      modulo,
      acao,
      nivel
    );
  }, [usuario]);

  /**
   * Alias para verificarPermissao (compatibilidade)
   */
  const temPermissao = useCallback((
    modulo: ModuloSistema,
    acao: AcaoPermissao,
    nivel?: NivelAcesso
  ): boolean => {
    return verificarPermissao(modulo, acao, nivel);
  }, [verificarPermissao]);

  /**
   * Recarrega dados do usuário
   */
  const recarregarUsuario = useCallback(async () => {
    await carregarUsuario();
  }, [carregarUsuario]);

  // Carregar usuário na inicialização e configurar listener
  useEffect(() => {
    carregarUsuario();

    // Listener para mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUsuario(null);
          setCarregando(false);
        } else if (event === 'SIGNED_IN' && session) {
          await carregarUsuario();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          await carregarUsuario();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [carregarUsuario]);

  return {
    usuario,
    carregando,
    autenticado: !!usuario,
    login,
    logout,
    verificarPermissao,
    temPermissao,
    recarregarUsuario
  };
};

/**
 * Hook para verificar permissões específicas
 */
export const usePermissoes = () => {
  const { usuario, verificarPermissao } = useAuth();

  /**
   * Verifica se é proprietário
   */
  const isProprietario = useCallback((): boolean => {
    return usuario?.usuario.perfil?.tipo === 'PROPRIETARIO';
  }, [usuario]);

  /**
   * Verifica se é farmacêutico
   */
  const isFarmaceutico = useCallback((): boolean => {
    return usuario?.usuario.perfil?.tipo === 'FARMACEUTICO';
  }, [usuario]);

  /**
   * Verifica se é atendente
   */
  const isAtendente = useCallback((): boolean => {
    return usuario?.usuario.perfil?.tipo === 'ATENDENTE';
  }, [usuario]);

  /**
   * Verifica se é manipulador
   */
  const isManipulador = useCallback((): boolean => {
    return usuario?.usuario.perfil?.tipo === 'MANIPULADOR';
  }, [usuario]);

  /**
   * Verifica se pode acessar módulo financeiro
   */
  const podeAcessarFinanceiro = useCallback((): boolean => {
    return verificarPermissao(ModuloSistema.FINANCEIRO, AcaoPermissao.LER);
  }, [verificarPermissao]);

  /**
   * Verifica se pode gerenciar usuários
   */
  const podeGerenciarUsuarios = useCallback((): boolean => {
    return verificarPermissao(ModuloSistema.USUARIOS_PERMISSOES, AcaoPermissao.CRIAR);
  }, [verificarPermissao]);

  /**
   * Verifica se pode aprovar manipulações
   */
  const podeAprovarManipulacoes = useCallback((): boolean => {
    return verificarPermissao(ModuloSistema.MANIPULACAO, AcaoPermissao.APROVAR);
  }, [verificarPermissao]);

  /**
   * Verifica se pode acessar relatórios
   */
  const podeAcessarRelatorios = useCallback((): boolean => {
    return verificarPermissao(ModuloSistema.RELATORIOS, AcaoPermissao.LER);
  }, [verificarPermissao]);

  /**
   * Verifica se pode exportar dados
   */
  const podeExportarDados = useCallback((): boolean => {
    return verificarPermissao(ModuloSistema.RELATORIOS, AcaoPermissao.EXPORTAR);
  }, [verificarPermissao]);

  /**
   * Verifica se pode editar configurações
   */
  const podeEditarConfiguracoes = useCallback((): boolean => {
    return verificarPermissao(ModuloSistema.CONFIGURACOES, AcaoPermissao.EDITAR);
  }, [verificarPermissao]);

  return {
    isProprietario,
    isFarmaceutico,
    isAtendente,
    isManipulador,
    podeAcessarFinanceiro,
    podeGerenciarUsuarios,
    podeAprovarManipulacoes,
    podeAcessarRelatorios,
    podeExportarDados,
    podeEditarConfiguracoes,
    verificarPermissao
  };
};

/**
 * Hook para gerenciar usuários (apenas para administradores)
 */
export const useUsuarios = () => {
  const { verificarPermissao } = useAuth();
  const [usuarios, setUsuarios] = useState<SessaoUsuario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [estatisticas, setEstatisticas] = useState<Record<string, unknown> | null>(null);

  /**
   * Verifica se pode gerenciar usuários
   */
  const podeGerenciar = verificarPermissao(
    ModuloSistema.USUARIOS_PERMISSOES,
    AcaoPermissao.CRIAR
  );

  /**
   * Lista usuários
   */
  const listarUsuarios = useCallback(async (filtros = {}) => {
    if (!podeGerenciar) {
      throw new Error('Sem permissão para listar usuários');
    }

    try {
      setCarregando(true);
      const lista = await AuthService.listarUsuarios(filtros);
      setUsuarios(lista);
      return lista;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    } finally {
      setCarregando(false);
    }
  }, [podeGerenciar]);

  /**
   * Cria usuário
   */
  const criarUsuario = useCallback(async (dados: Partial<SessaoUsuario>) => {
    if (!podeGerenciar) {
      throw new Error('Sem permissão para criar usuários');
    }

    try {
      const resultado = await AuthService.criarUsuario(dados);
      
      if (resultado.sucesso) {
        // Recarregar lista
        await listarUsuarios();
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }, [podeGerenciar, listarUsuarios]);

  /**
   * Atualiza usuário
   */
  const atualizarUsuario = useCallback(async (id: string, dados: Partial<SessaoUsuario>) => {
    if (!podeGerenciar) {
      throw new Error('Sem permissão para atualizar usuários');
    }

    try {
      const resultado = await AuthService.atualizarUsuario(id, dados);
      
      if (resultado.sucesso) {
        // Recarregar lista
        await listarUsuarios();
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }, [podeGerenciar, listarUsuarios]);

  /**
   * Carrega estatísticas
   */
  const carregarEstatisticas = useCallback(async () => {
    if (!podeGerenciar) {
      return;
    }

    try {
      const stats = await AuthService.obterEstatisticas();
      setEstatisticas(stats);
      return stats;
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, [podeGerenciar]);

  return {
    usuarios,
    carregando,
    estatisticas,
    podeGerenciar,
    listarUsuarios,
    criarUsuario,
    atualizarUsuario,
    carregarEstatisticas
  };
}; 