// Serviço de Autenticação e Permissões - Pharma.AI
// Módulo: M09-USUARIOS_PERMISSOES

import { supabase } from '@/integrations/supabase/client';
import type {
  Usuario,
  SessaoUsuario,
  RespostaAuth,
  CriarEditarUsuario,
  FiltrosUsuarios,
  EstatisticasUsuarios,
  LogAuditoria,
  PerfilUsuarioInterface,
  PerfilUsuario
} from '../types';

import {
  ModuloSistema,
  AcaoPermissao,
  NivelAcesso
} from '../types';

/**
 * Serviço de Autenticação e Gerenciamento de Usuários
 */
export class AuthService {
  
  /**
   * Realiza login do usuário
   */
  static async login(email: string, senha: string): Promise<RespostaAuth> {
    try {
      // Autenticação via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (authError) {
        return {
          sucesso: false,
          erro: 'Credenciais inválidas'
        };
      }

      // Garantir que o usuário esteja sincronizado na tabela `usuarios`
      try {
        if (authData.session?.access_token) {
          await supabase.functions.invoke('verificar-sincronizar-usuario', {
            headers: {
              Authorization: `Bearer ${authData.session.access_token}`
            },
            body: {}
          });
        }
      } catch (syncError) {
        console.error('Erro ao sincronizar usuário:', syncError);
      }

      // Buscar dados completos do usuário
      const usuario = await this.obterUsuarioCompleto(authData.user.id);
      
      if (!usuario) {
        return {
          sucesso: false,
          erro: 'Usuário não encontrado no sistema'
        };
      }

      if (!usuario.ativo) {
        return {
          sucesso: false,
          erro: 'Usuário inativo. Contate o administrador.'
        };
      }

      // Registrar log de acesso
      await this.registrarLogAuditoria(
        usuario.id,
        'LOGIN',
        ModuloSistema.USUARIOS_PERMISSOES,
        'sessao',
        {},
        { timestamp: new Date().toISOString() }
      );

      // Atualizar último acesso
      await this.atualizarUltimoAcesso(usuario.id);

      const sessao: SessaoUsuario = {
        usuario,
        permissoes: usuario.perfil?.permissoes || [],
        dashboard: usuario.perfil?.dashboard || 'atendimento',
        token: authData.session?.access_token,
        expires_at: authData.session?.expires_at?.toString()
      };

      return {
        sucesso: true,
        usuario: sessao
      };

    } catch (error) {
      console.error('Erro na autenticação:', error);
      
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido na autenticação',
        usuario: null
      };
    }
  }

  /**
   * Realiza logout do usuário
   */
  static async logout(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Registrar log de logout
        const usuario = await this.obterUsuarioCompleto(user.id);
        if (usuario) {
          await this.registrarLogAuditoria(
            usuario.id,
            'LOGOUT',
            ModuloSistema.USUARIOS_PERMISSOES,
            'sessao',
            {},
            { timestamp: new Date().toISOString() }
          );
        }
      }

      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }

  /**
   * Obtém usuário atual da sessão
   */
  static async obterUsuarioAtual(): Promise<SessaoUsuario | null> {
    try {
      console.log('🔍 AuthService - Obtendo usuário da sessão...');
      
      // Timeout de 5 segundos para evitar travamento
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na obtenção do usuário')), 5000);
      });
      
      const getUserPromise = supabase.auth.getUser();
      
      const { data: { user }, error } = await Promise.race([getUserPromise, timeoutPromise]) as Awaited<typeof getUserPromise>;
      
      if (error) {
        console.log('❌ AuthService - Erro ao obter usuário da sessão:', error);
        return null;
      }
      
      if (!user) {
        console.log('⚠️ AuthService - Nenhum usuário na sessão');
        return null;
      }

      console.log('👤 AuthService - Usuário encontrado na sessão, ID:', user.id);
      
      // Buscar usuário diretamente com timeout
      const usuarioPromise = this.obterUsuarioCompleto(user.id);
      const usuario = await Promise.race([usuarioPromise, timeoutPromise]) as Awaited<typeof usuarioPromise>;
      
      if (!usuario) {
        console.log('❌ AuthService - Usuário não encontrado no banco de dados');
        return null;
      }
      
      if (!usuario.ativo) {
        console.log('⚠️ AuthService - Usuário inativo');
        return null;
      }

      console.log('✅ AuthService - Usuário completo obtido:', usuario.nome);
      return {
        usuario,
        permissoes: usuario.perfil?.permissoes || [],
        dashboard: usuario.perfil?.dashboard_padrao || 'administrativo'
      };

    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  /**
   * Obtém dados completos do usuário incluindo perfil e permissões
   */
  static async obterUsuarioCompleto(authId: string): Promise<Usuario | null> {
    try {
      console.log('🔍 AuthService - Buscando usuário completo para auth_id:', authId);
      
      // Consultar usuário primeiro
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('supabase_auth_id', authId)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          console.error(`❌ AuthService - Usuário não encontrado para auth_id: ${authId}. Verifique se o usuário foi criado corretamente na tabela usuarios.`);
        } else {
          console.error('Erro ao buscar usuário:', userError);
        }
        return null;
      }
      
      if (!userData) {
        console.error(`❌ AuthService - Nenhum usuário encontrado para auth_id: ${authId}`);
        return null;
      }

      console.log('👤 AuthService - Usuário encontrado:', userData.nome, 'perfil_id:', userData.perfil_id);

      // Consultar perfil e permissões em consultas separadas
      if (userData.perfil_id) {
        console.log('🔍 AuthService - Buscando perfil:', userData.perfil_id);
        
        const { data: perfilData, error: perfilError } = await supabase
          .from('perfis_usuario')
          .select('*')
          .eq('id', userData.perfil_id)
          .single();

        if (perfilError) {
          console.error('❌ AuthService - Erro ao buscar perfil:', perfilError);
        } else if (perfilData) {
          console.log('✅ AuthService - Perfil encontrado:', perfilData.nome);
          
          // Buscar permissões do perfil
          console.log('🔍 AuthService - Buscando permissões para perfil:', userData.perfil_id);
          
          const { data: permissoesData, error: permissoesError } = await supabase
            .from('permissoes')
            .select('*')
            .eq('perfil_id', userData.perfil_id)
            .eq('permitido', true);

          if (permissoesError) {
            console.error('❌ AuthService - Erro ao buscar permissões:', permissoesError);
          } else {
            console.log('✅ AuthService - Permissões encontradas:', permissoesData?.length || 0);
          }

          const permissoes = permissoesData || [];

          const usuarioCompleto = {
            ...userData,
            perfil: {
              ...perfilData,
              permissoes: permissoes
            }
          };
          
          console.log('✅ AuthService - Usuário completo montado com sucesso');
          return usuarioCompleto;
        }
      }

      // Retornar usuário sem perfil se não conseguiu buscar o perfil
      console.log('⚠️ AuthService - Retornando usuário sem perfil');
      return userData;

    } catch (error) {
      console.error('Erro ao obter usuário completo:', error);
      return null;
    }
  }

  /**
   * Verifica se usuário tem permissão específica
   */
  static verificarPermissao(
    permissoes: Permissao[],
    modulo: ModuloSistema,
    acao: AcaoPermissao,
    nivel?: NivelAcesso
  ): boolean {
    return permissoes.some(p => 
      p.modulo === modulo && 
      p.acao === acao && 
      (!nivel || p.nivel === nivel || p.nivel === NivelAcesso.TODOS)
    );
  }

  /**
   * Cria novo usuário
   */
  static async criarUsuario(dados: Partial<SessaoUsuario>): Promise<RespostaOperacao> {
    try {
      // Verificar se senha foi fornecida
      if (!dados.senha) {
        return {
          sucesso: false,
          erro: 'Senha é obrigatória para criar um novo usuário'
        };
      }

      // Usar Edge Function para criar usuário no Auth e na tabela usuarios
      const { data, error: functionError } = await supabase.functions.invoke('criar-usuario', {
        body: {
          email: dados.email,
          password: dados.senha,
          userData: {
            nome: dados.nome,
            telefone: dados.telefone,
            perfil_id: dados.perfil_id,
            ativo: dados.ativo
          }
        }
      });

      if (functionError) {
        console.error('Erro ao chamar Edge Function:', functionError);
        return {
          sucesso: false,
          erro: `Erro ao criar usuário: ${functionError.message}`
        };
      }

      if (!data?.sucesso) {
        console.error('Erro retornado pela Edge Function:', data);
        return {
          sucesso: false,
          erro: (data as { error?: string })?.error || 'Erro ao criar usuário'
        };
      }

      return {
        sucesso: true,
        usuario: (data as { usuario?: Usuario }).usuario
      };

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return {
        sucesso: false,
        erro: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Lista usuários com filtros
   */
  static async listarUsuarios(filtros: FiltrosUsuarios = {}): Promise<Usuario[]> {
    try {
      // Primeiro, consultar usuários com filtros
      let query = supabase
        .from('usuarios')
        .select('*');

      if (filtros.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo);
      }

      if (filtros.busca) {
        query = query.or(`nome.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%`);
      }

      if (filtros.data_inicio) {
        query = query.gte('created_at', filtros.data_inicio);
      }

      if (filtros.data_fim) {
        query = query.lte('created_at', filtros.data_fim);
      }

      const { data: usuarios, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!usuarios || usuarios.length === 0) {
        return [];
      }

      // Coletar todos os IDs de perfil únicos
      const perfilIds = [...new Set(usuarios.filter(u => u.perfil_id).map(u => u.perfil_id))];
      
      // Buscar todos os perfis necessários em uma única consulta
      const { data: perfis, error: perfilError } = await supabase
        .from('perfis_usuario')
        .select('*')
        .in('id', perfilIds);

      if (perfilError) {
        console.error('Erro ao buscar perfis:', perfilError);
      }

      // Mapear perfis por ID para fácil acesso
      const perfisPorId = (perfis || []).reduce((acc, perfil) => {
        acc[perfil.id] = perfil;
        return acc;
      }, {} as Record<string, PerfilUsuarioInterface>);

      // Buscar permissões para todos os perfis
      const { data: todasPermissoes, error: permissoesError } = await supabase
        .from('permissoes')
        .select('*')
        .in('perfil_id', perfilIds)
        .eq('permitido', true);

      if (permissoesError) {
        console.error('Erro ao buscar permissões:', permissoesError);
      }

      // Agrupar permissões por perfil_id
      const permissoesPorPerfil = (todasPermissoes || []).reduce((acc, permissao) => {
        if (!acc[permissao.perfil_id]) {
          acc[permissao.perfil_id] = [];
        }
        acc[permissao.perfil_id].push(permissao);
        return acc;
      }, {} as Record<string, Permissao[]>);

      // Juntar usuários com seus perfis e permissões
      return usuarios.map(usuario => ({
        ...usuario,
        perfil: usuario.perfil_id && perfisPorId[usuario.perfil_id] ? {
          ...perfisPorId[usuario.perfil_id],
          permissoes: permissoesPorPerfil[usuario.perfil_id] || []
        } : undefined
      }));

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return [];
    }
  }

  /**
   * Atualiza usuário
   */
  static async atualizarUsuario(id: string, dados: Partial<SessaoUsuario>): Promise<RespostaOperacao> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update(dados)
        .eq('id', id);

      if (error) {
        return {
          sucesso: false,
          erro: 'Erro ao atualizar usuário'
        };
      }

      return { sucesso: true };

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return {
        sucesso: false,
        erro: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Registra log de auditoria
   */
  static async registrarLogAuditoria(
    usuarioId: string,
    acao: string,
    modulo: ModuloSistema,
    recurso: string,
    dadosAnteriores: Record<string, unknown>,
    dadosNovos: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase
        .from('logs_auditoria')
        .insert({
          usuario_id: usuarioId,
          acao,
          modulo,
          recurso,
          dados_anteriores: dadosAnteriores,
          dados_novos: dadosNovos,
          ip_address: await this.obterIP(),
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  }

  /**
   * Atualiza último acesso do usuário
   */
  private static async atualizarUltimoAcesso(usuarioId: string): Promise<void> {
    try {
      await supabase
        .from('usuarios')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', usuarioId);
    } catch (error) {
      console.error('Erro ao atualizar último acesso:', error);
    }
  }

  /**
   * Solicita recuperação de senha para um email
   */
  static async solicitarRecuperacaoSenha(email: string): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      // Verificar se email existe
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nome')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return {
          sucesso: false,
          erro: 'Email não encontrado'
        };
      }

      // Gerar token de recuperação
      const token = this.gerarTokenRecuperacao();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token válido por 1 hora

      // Salvar token no banco
      const { error: tokenError } = await supabase
        .from('tokens_recuperacao_senha')
        .insert({
          usuario_id: userData.id,
          token,
          email: email,
          expires_at: expiresAt.toISOString(),
          usado: false
        });

      if (tokenError) {
        console.error('Erro ao salvar token:', tokenError);
        return {
          sucesso: false,
          erro: 'Erro interno do servidor'
        };
      }

      // Construir URL de recuperação
      const resetUrl = `${window.location.origin}/redefinir-senha?token=${token}&email=${encodeURIComponent(email)}`;
      
      // Chamar Edge Function para enviar email
      console.log('Enviando requisição para função de recuperação de senha...');
      try {
        const { data, error: emailError } = await supabase.functions.invoke('enviar-email-recuperacao', {
          body: {
            email,
            nome: userData.nome,
            token,
            resetUrl
          }
        });

        if (emailError) {
          console.error('Erro ao enviar email:', emailError);
          console.error('Detalhes do erro:', emailError.message);
          
          // Tentar obter mais informações do erro
          if (emailError.message && emailError.message.includes('500')) {
            console.error('Erro interno na função Edge. Verifique os logs no painel do Supabase.');
          }
          
          return {
            sucesso: false,
            erro: 'Erro ao enviar email de recuperação. Por favor, tente novamente mais tarde.'
          };
        }
        
        console.log('Resposta da função:', data);
      } catch (funcError) {
        console.error('Exceção ao chamar função:', funcError);
        return {
          sucesso: false,
          erro: 'Erro ao processar solicitação de recuperação'
        };
      }

      // Registrar log
      await this.registrarLogAuditoria(
        userData.id,
        'SOLICITAR_RECUPERACAO_SENHA',
        ModuloSistema.USUARIOS_PERMISSOES,
        'senha',
        {},
        { email, timestamp: new Date().toISOString() }
      );

      return { sucesso: true };

    } catch (error) {
      console.error('Erro na solicitação de recuperação:', error);
      return {
        sucesso: false,
        erro: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Verifica se o token de recuperação é válido
   */
  static async verificarTokenRecuperacao(token: string, email: string): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      const { data: tokenData, error } = await supabase
        .from('tokens_recuperacao_senha')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .eq('usado', false)
        .single();

      if (error || !tokenData) {
        return {
          sucesso: false,
          erro: 'Token inválido ou não encontrado'
        };
      }

      // Verificar se não expirou
      if (new Date() > new Date(tokenData.expires_at)) {
        return {
          sucesso: false,
          erro: 'Token expirado'
        };
      }

      return { sucesso: true };

    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return {
        sucesso: false,
        erro: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Redefine a senha do usuário
   */
  static async redefinirSenha(token: string, email: string, novaSenha: string): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      // Verificar token primeiro
      const verificacao = await this.verificarTokenRecuperacao(token, email);
      if (!verificacao.sucesso) {
        return verificacao;
      }

      // Buscar dados do token
      const { data: tokenData, error: tokenError } = await supabase
        .from('tokens_recuperacao_senha')
        .select('usuario_id')
        .eq('token', token)
        .eq('email', email)
        .eq('usado', false)
        .single();

      if (tokenError || !tokenData) {
        return {
          sucesso: false,
          erro: 'Token inválido'
        };
      }

      // Buscar usuário
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('supabase_auth_id')
        .eq('id', tokenData.usuario_id)
        .single();

      if (userError || !userData) {
        return {
          sucesso: false,
          erro: 'Usuário não encontrado'
        };
      }

      // Atualizar senha no Supabase Auth
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userData.supabase_auth_id,
        { password: novaSenha }
      );

      if (authError) {
        console.error('Erro ao atualizar senha:', authError);
        return {
          sucesso: false,
          erro: 'Erro ao atualizar senha'
        };
      }

      // Marcar token como usado
      await supabase
        .from('tokens_recuperacao_senha')
        .update({ usado: true, usado_em: new Date().toISOString() })
        .eq('token', token);

      // Registrar log
      await this.registrarLogAuditoria(
        tokenData.usuario_id,
        'REDEFINIR_SENHA',
        ModuloSistema.USUARIOS_PERMISSOES,
        'senha',
        {},
        { email, timestamp: new Date().toISOString() }
      );

      return { sucesso: true };

    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return {
        sucesso: false,
        erro: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Gera token de recuperação seguro
   */
  private static gerarTokenRecuperacao(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Gera senha temporária
   */
  private static gerarSenhaTemporaria(): string {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  }

  /**
   * Obtém IP do usuário
   */
  private static async obterIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Obtém estatísticas de usuários
   */
  static async obterEstatisticas(): Promise<EstatisticasUsuarios> {
    try {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('ativo, perfil_id, atualizado_em');

      const total = usuarios?.length || 0;
      const ativos = usuarios?.filter(u => u.ativo).length || 0;
      
      const porPerfil = usuarios?.reduce((acc, u) => {
        const tipo = u.perfil_id || 'ATENDENTE';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {} as Record<string, number>;

      const agora = new Date();
      const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const semanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
      const mesAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

      const ultimosAcessos = {
        hoje: usuarios?.filter(u => u.atualizado_em && new Date(u.atualizado_em) >= hoje).length || 0,
        semana: usuarios?.filter(u => u.atualizado_em && new Date(u.atualizado_em) >= semanaAtras).length || 0,
        mes: usuarios?.filter(u => u.atualizado_em && new Date(u.atualizado_em) >= mesAtras).length || 0
      };

      return {
        total,
        ativos,
        por_perfil: porPerfil as Record<string, number>,
        ultimos_acessos: ultimosAcessos
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        total: 0,
        ativos: 0,
        por_perfil: {} as Record<PerfilUsuario, number>,
        ultimos_acessos: { hoje: 0, semana: 0, mes: 0 }
      };
    }
  }

  /**
   * Exclui usuário usando Edge Function (método seguro)
   */
  static async excluirUsuarioCompleto(usuarioId: string, supabaseAuthId: string): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      // Obter token de autenticação atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return { 
          sucesso: false, 
          erro: 'Usuário não autenticado' 
        };
      }

      // Chamar Edge Function para exclusão segura
      const { data, error } = await supabase.functions.invoke('excluir-usuario', {
        body: {
          usuarioId,
          supabaseAuthId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Erro na Edge Function excluir-usuario:', error);
        return { 
          sucesso: false, 
          erro: error.message || 'Erro ao excluir usuário' 
        };
      }

      if (data?.error) {
        console.error('Erro retornado pela Edge Function:', data.error);
        return { 
          sucesso: false, 
          erro: data.error 
        };
      }

      return { sucesso: true };
    } catch (error: unknown) {
      console.error('Exceção ao excluir usuário:', error);
      return { 
        sucesso: false, 
        erro: error instanceof Error ? error.message : 'Erro desconhecido ao excluir usuário' 
      };
    }
  }

  /**
   * Exclui usuário do Supabase Auth (auth.users) usando Service Role
   * @deprecated Use excluirUsuarioCompleto() em vez disso
   */
  static async excluirUsuarioAuth(supabaseAuthId: string): Promise<{ sucesso: boolean; erro?: string }> {
    console.warn('⚠️ excluirUsuarioAuth() está deprecated. Use excluirUsuarioCompleto() em vez disso.');
    
    try {
      // Importar o cliente administrativo
      const { getAdminClient, isAdminClientAvailable } = await import('@/lib/supabase-admin');
      
      // Verificar se o cliente admin está disponível
      if (!isAdminClientAvailable()) {
        console.error('Cliente administrativo não disponível. Verifique se VITE_SUPABASE_SERVICE_ROLE_KEY está configurada.');
        return { 
          sucesso: false, 
          erro: 'Configuração administrativa não disponível. Use a Edge Function excluir-usuario em vez disso.' 
        };
      }
      
      // Obter cliente administrativo
      const adminClient = getAdminClient();
      
      // Excluir usuário usando o cliente administrativo
      const { error } = await adminClient.auth.admin.deleteUser(supabaseAuthId);
      
      if (error) {
        console.error('Erro ao excluir usuário do Supabase Auth:', error);
        return { sucesso: false, erro: error.message };
      }
      
      return { sucesso: true };
    } catch (error: unknown) {
      console.error('Exceção ao excluir usuário do Supabase Auth:', error);
      return { sucesso: false, erro: error instanceof Error ? error.message : 'Erro desconhecido ao excluir usuário' };
    }
  }

  /**
   * Cria e envia um convite para um novo usuário
   * @param email - Email do usuário a ser convidado
   * @param perfilId - ID do perfil a ser atribuído ao novo usuário
   * @param usuarioAtualId - ID do usuário que está enviando o convite (opcional)
   * @param nomeConvidado - Nome do usuário convidado (opcional)
   * @returns Resposta indicando sucesso ou falha
   */
  static async criarEnviarConvite(
    email: string, 
    perfilId: string, 
    usuarioAtualId?: string,
    nomeConvidado?: string
  ): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      // Verificar se o email já está cadastrado
      const { data: usuarioExistente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (usuarioExistente) {
        return {
          sucesso: false,
          erro: 'Este email já está cadastrado no sistema'
        };
      }

      // Verificar se já existe um convite ativo para este email
      const { data: conviteExistente } = await supabase
        .from('convites_usuario')
        .select('id')
        .eq('email', email)
        .eq('usado', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (conviteExistente) {
        return {
          sucesso: false,
          erro: 'Já existe um convite ativo para este email'
        };
      }

      // Verificar perfil
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis_usuario')
        .select('id, nome, tipo')
        .eq('id', perfilId)
        .single();

      if (perfilError || !perfilData) {
        return {
          sucesso: false,
          erro: 'Perfil não encontrado'
        };
      }

      // Gerar token único para o convite
      const token = crypto.randomUUID().replace(/-/g, '');

      // Definir data de expiração (48 horas)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      // Salvar convite no banco
      const conviteData: {
        email: string;
        token: string;
        perfil_id: string;
        expires_at: string;
        usado: boolean;
        criado_por?: string;
      } = {
        email,
        token,
        perfil_id: perfilId,
        expires_at: expiresAt.toISOString(),
        usado: false
      };
      
      // Adicionar criado_por apenas se fornecido
      if (usuarioAtualId) {
        conviteData.criado_por = usuarioAtualId;
      }
      
      const { error: conviteError } = await supabase
        .from('convites_usuario')
        .insert(conviteData);

      if (conviteError) {
        console.error('Erro ao criar convite:', conviteError);
        return {
          sucesso: false,
          erro: 'Erro interno ao criar convite'
        };
      }

      // Buscar informações da farmácia (nome do proprietário)
      let nomeFarmacia = 'Pharma.AI';
      
      if (usuarioAtualId) {
        const { data: proprietarioData } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('id', usuarioAtualId)
          .single();
  
        if (proprietarioData?.nome) {
          nomeFarmacia = `Farmácia de ${proprietarioData.nome}`;
        }
      }

      // Construir URL para aceitação do convite
      const conviteUrl = `${window.location.origin}/aceitar-convite?token=${token}&email=${encodeURIComponent(email)}`;
      
      // Chamar Edge Function para enviar email
      console.log('Enviando convite por email...');
      try {
        const { data, error: emailError } = await supabase.functions.invoke('enviar-convite-usuario', {
          body: {
            email,
            nome: nomeConvidado || '',
            token,
            conviteUrl,
            nomeFarmacia,
            perfil: perfilData.nome
          }
        });

        if (emailError) {
          console.error('Erro ao enviar email:', emailError);
          return {
            sucesso: false,
            erro: 'Erro ao enviar email de convite. Por favor, tente novamente.'
          };
        }
        
        console.log('Resposta da função:', data);
      } catch (funcError) {
        console.error('Exceção ao chamar função:', funcError);
        return {
          sucesso: false,
          erro: 'Erro ao processar envio de convite'
        };
      }

      // Registrar log se houver usuário atual
      if (usuarioAtualId) {
        await this.registrarLogAuditoria(
          usuarioAtualId,
          'ENVIAR_CONVITE',
          ModuloSistema.USUARIOS_PERMISSOES,
          'convites_usuario',
          {},
          { email, perfil_id: perfilId, timestamp: new Date().toISOString() }
        );
      }

      return { 
        sucesso: true
      };

    } catch (error) {
      console.error('Erro ao criar e enviar convite:', error);
      return {
        sucesso: false,
        erro: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Verifica se um token de convite é válido
   * @param token - Token do convite
   * @param email - Email associado ao convite
   * @returns Resposta indicando se o token é válido
   */
  static async verificarConvite(token: string, email: string): Promise<{ 
    sucesso: boolean; 
    erro?: string; 
    perfilId?: string;
    perfilNome?: string;
  }> {
    try {
      // Buscar convite
      const { data: conviteData, error: conviteError } = await supabase
        .from('convites_usuario')
        .select('*, perfis_usuario:perfil_id(nome, tipo)')
        .eq('token', token)
        .eq('email', email)
        .eq('usado', false)
        .single();

      if (conviteError || !conviteData) {
        return {
          sucesso: false,
          erro: 'Convite não encontrado ou já utilizado'
        };
      }

      // Verificar se expirou
      if (new Date(conviteData.expires_at) < new Date()) {
        return {
          sucesso: false,
          erro: 'Este convite expirou'
        };
      }

      return {
        sucesso: true,
        perfilId: conviteData.perfil_id,
        perfilNome: conviteData.perfis_usuario?.nome
      };
    } catch (error) {
      console.error('Erro ao verificar convite:', error);
      return {
        sucesso: false,
        erro: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Aceita um convite e cria um novo usuário
   * @param token - Token do convite
   * @param email - Email associado ao convite
   * @param nome - Nome do novo usuário
   * @param senha - Senha do novo usuário
   * @param telefone - Telefone do novo usuário (opcional)
   * @returns Resposta indicando sucesso ou falha
   */
  static async aceitarConvite(
    token: string,
    email: string,
    nome: string,
    senha: string,
    telefone?: string
  ): Promise<{ sucesso: boolean; erro?: string; usuario?: Usuario }> {
    try {
      // Verificar convite
      const verificacao = await this.verificarConvite(token, email);
      if (!verificacao.sucesso || !verificacao.perfilId) {
        return verificacao;
      }

      // Criar usuário usando a função existente
      const resultado = await this.criarUsuario({
        nome,
        email,
        senha,
        telefone,
        perfil_id: verificacao.perfilId,
        ativo: true
      });

      if (!resultado.sucesso) {
        return resultado;
      }

      // Marcar convite como usado
      await supabase
        .from('convites_usuario')
        .update({ 
          usado: true,
          updated_at: new Date().toISOString() 
        })
        .eq('token', token)
        .eq('email', email);

      return resultado;
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      return {
        sucesso: false,
        erro: 'Erro interno do servidor'
      };
    }
  }
}

// Exportar instância para uso direto
export const authService = AuthService;