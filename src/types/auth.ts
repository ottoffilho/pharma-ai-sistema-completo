// =====================================================
// TYPES - AUTENTICAÇÃO E PERMISSÕES
// =====================================================
// Re-exporta tipos do módulo usuarios-permissoes para facilitar imports

export { 
  // Enums
  ModuloSistema,
  AcaoPermissao,
  NivelAcesso,
  PerfilUsuario,
  TipoDashboard,
  
  // Interfaces
  type Usuario,
  type PerfilUsuarioInterface,
  type Permissao,
  type SessaoUsuario,
  type LogAuditoria,
  type ConfiguracaoSeguranca,
  type RespostaAuth,
  type CriarEditarUsuario,
  type FiltrosUsuarios,
  type EstatisticasUsuarios,
  type ProtecaoProps,
  type DashboardProps,
  type RespostaOperacao,
  
  // Types
  type VerificarPermissao,
  type TemPermissao
} from '@/modules/usuarios-permissoes/types'; 