// Módulo de Usuários e Permissões - Pharma.AI
// Exportações principais do módulo M09-USUARIOS_PERMISSOES

// Tipos
export * from './types';

// Serviços
export { AuthService } from './services/authService';

// Utilitários
export * from './utils/permissions';

// Hooks
export {
  useAuth,
  useAuthState,
  usePermissoes,
  useUsuarios,
  AuthContext
} from './hooks/useAuth';

export { useAuthSimple, useAuthSimpleState, AuthSimpleContext } from './hooks/useAuthSimple';

// Componentes
export { AuthProvider } from './components/AuthProvider';
export { AuthSimpleProvider } from './components/AuthSimpleProvider';
export {
  ProtectedComponent,
  withPermission,
  ProprietarioOnly,
  FarmaceuticoOnly,
  PerfilBased,
  AcessoNegado,
  usePermissionCheck
} from './components/ProtectedComponent';
export { DashboardAdministrativo } from './components/DashboardAdministrativo';
export { DashboardOperacional } from './components/DashboardOperacional';
export { DashboardProducao } from './components/DashboardProducao';
export { DashboardAtendimento } from './components/DashboardAtendimento';
export { DashboardRouter, useDashboardInfo } from './components/DashboardRouter';
export { useIsProprietario, useContextoMultiFarmacia } from './components/DashboardRouter';
export { SeletorFarmacia, useFarmaciaAtual } from './components/SeletorFarmacia';
export { UsuariosList } from './components/UsuariosList';
export { UsuarioForm } from './components/UsuarioForm';
export { PermissoesManager } from './components/PermissoesManager';
export { DashboardProprietario } from './components/DashboardProprietario';
export { TransferenciaEstoque } from './components/TransferenciaEstoque'; 