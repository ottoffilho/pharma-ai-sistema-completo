// Tipos para o Sistema de Usuários e Permissões - Pharma.AI
// Módulo: M09-USUARIOS_PERMISSOES

/**
 * Perfis de usuário disponíveis no sistema
 */
export enum PerfilUsuario {
  PROPRIETARIO = 'PROPRIETARIO',
  FARMACEUTICO = 'FARMACEUTICO', 
  ATENDENTE = 'ATENDENTE',
  MANIPULADOR = 'MANIPULADOR',
  CUSTOMIZADO = 'CUSTOMIZADO'
}

/**
 * Tipos de dashboard disponíveis
 */
export enum TipoDashboard {
  ADMINISTRATIVO = 'administrativo',
  OPERACIONAL = 'operacional', 
  ATENDIMENTO = 'atendimento',
  PRODUCAO = 'producao'
}

/**
 * Módulos do sistema
 */
export enum ModuloSistema {
  CADASTROS_ESSENCIAIS = 'CADASTROS_ESSENCIAIS',
  ATENDIMENTO = 'ATENDIMENTO',
  ORCAMENTACAO = 'ORCAMENTACAO', 
  ESTOQUE = 'ESTOQUE',
  MANIPULACAO = 'MANIPULACAO',
  FINANCEIRO = 'FINANCEIRO',
  FISCAL = 'FISCAL',
  PDV = 'PDV',
  USUARIOS_PERMISSOES = 'USUARIOS_PERMISSOES',
  RELATORIOS = 'RELATORIOS',
  CONFIGURACOES = 'CONFIGURACOES',
  PRODUCAO = 'PRODUCAO',
  IA = 'IA'
}

/**
 * Ações possíveis em cada módulo
 */
export enum AcaoPermissao {
  CRIAR = 'CRIAR',
  LER = 'LER', 
  EDITAR = 'EDITAR',
  DELETAR = 'DELETAR',
  EXCLUIR = 'EXCLUIR',
  APROVAR = 'APROVAR',
  EXPORTAR = 'EXPORTAR',
  ADMINISTRAR = 'ADMINISTRAR'
}

/**
 * Níveis de acesso aos dados
 */
export enum NivelAcesso {
  PROPRIO = 'proprio',     // Apenas dados próprios
  SETOR = 'setor',         // Dados do setor/equipe
  TODOS = 'todos'          // Todos os dados
}

/**
 * Interface para plano de assinatura SaaS
 */
export interface PlanoAssinatura {
  id: string;
  nome: string;
  descricao?: string;
  preco_mensal: number;
  max_farmacias: number;
  max_usuarios_por_farmacia: number;
  recursos_incluidos: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para proprietário (multi-farmácia)
 */
export interface Proprietario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  plano_id: string;
  plano?: PlanoAssinatura;
  status_assinatura: 'ativo' | 'suspenso' | 'cancelado';
  data_vencimento?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para farmácia
 */
export interface Farmacia {
  id: string;
  proprietario_id: string;
  proprietario?: Proprietario;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  telefone?: string;
  email?: string;
  site?: string;
  
  // Endereço
  endereco_cep: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento?: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_uf: string;
  
  // Responsável Técnico
  responsavel_tecnico_nome: string;
  responsavel_tecnico_crf: string;
  responsavel_tecnico_telefone?: string;
  responsavel_tecnico_email?: string;
  
  // Configurações
  matriz: boolean;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para contexto multi-farmácia
 */
export interface ContextoMultiFarmacia {
  proprietario: Proprietario;
  farmacia_atual: Farmacia;
  farmacias_disponiveis: Farmacia[];
  pode_trocar_farmacia: boolean;
  pode_criar_farmacia: boolean;
  limite_farmacias_atingido: boolean;
}

/**
 * Interface para uma permissão específica
 */
export interface Permissao {
  id: string;
  modulo: ModuloSistema;
  acao: AcaoPermissao;
  nivel: NivelAcesso;
  condicoes?: Record<string, unknown>; // Condições específicas (ex: horário, IP)
}

/**
 * Interface para perfil de usuário
 */
export interface PerfilUsuarioInterface {
  id: string;
  nome: string;
  tipo: PerfilUsuario;
  dashboard: TipoDashboard;
  descricao?: string;
  permissoes: Permissao[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para usuário do sistema (adaptada para multi-farmácia)
 */
export interface Usuario {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
  perfil_id: string;
  perfil?: PerfilUsuarioInterface;
  
  // Multi-farmácia
  proprietario_id: string;
  farmacia_id: string;
  proprietario?: Proprietario;
  farmacia?: Farmacia;
  
  ativo: boolean;
  ultimo_acesso?: string;
  created_at: string;
  updated_at: string;
  
  // Campos específicos do Supabase Auth
  auth_id?: string;
  email_confirmado?: boolean;
}

/**
 * Interface para sessão do usuário (adaptada para multi-farmácia)
 */
export interface SessaoUsuario {
  usuario: Usuario;
  permissoes: Permissao[];
  dashboard: TipoDashboard;
  contexto_multi_farmacia?: ContextoMultiFarmacia;
  token?: string;
  expires_at?: string;
}

/**
 * Interface para seleção de farmácia
 */
export interface SelecaoFarmacia {
  farmacia_id: string;
  farmacia: Farmacia;
  pode_acessar: boolean;
  motivo_bloqueio?: string;
}

/**
 * Interface para dados de transferência de estoque
 */
export interface TransferenciaEstoque {
  produto_id: string;
  farmacia_origem_id: string;
  farmacia_destino_id: string;
  quantidade: number;
  observacoes?: string;
}

/**
 * Interface para estatísticas consolidadas do proprietário
 */
export interface EstatisticasProprietario {
  total_farmacias: number;
  total_usuarios: number;
  total_produtos: number;
  vendas_30_dias: {
    farmacia_id: string;
    farmacia_nome: string;
    total_vendas: number;
    quantidade_vendas: number;
    ticket_medio?: number;
  }[];
  estoque_consolidado: {
    produto_id: string;
    produto_nome: string;
    estoque_total: number;
    farmacias_com_estoque: number;
    tipo_produto?: string;
  }[];
  
  // Novos campos implementados
  comparacao_periodo_anterior?: {
    total_vendas_atual: number;
    total_vendas_anterior: number;
    variacao_percentual: number;
    quantidade_vendas_atual: number;
    quantidade_vendas_anterior: number;
    ticket_medio_atual: number;
    ticket_medio_anterior: number;
  };
  
  usuarios_detalhados?: {
    total_usuarios: number;
    usuarios_por_perfil: any;
    usuarios_por_farmacia: any;
  };
  
  metadata?: {
    data_atualizacao: string;
    proprietario_id: string;
    periodo_customizado: boolean;
    periodo: {
      inicio: string;
      fim: string;
    };
    status: string;
    cached: boolean;
    cache_key: string;
  };
}

/**
 * Interface para log de auditoria
 */
export interface LogAuditoria {
  id: string;
  usuario_id: string;
  usuario?: Usuario;
  acao: string;
  modulo: ModuloSistema;
  recurso: string;
  dados_anteriores?: Record<string, unknown>;
  dados_novos?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Interface para configurações de segurança
 */
export interface ConfiguracaoSeguranca {
  id: string;
  max_tentativas_login: number;
  tempo_bloqueio_minutos: number;
  tempo_sessao_horas: number;
  exigir_2fa: boolean;
  ips_permitidos?: string[];
  horarios_permitidos?: {
    inicio: string;
    fim: string;
    dias_semana: number[];
  };
  created_at: string;
  updated_at: string;
}

/**
 * Interface para resposta de autenticação
 */
export interface RespostaAuth {
  sucesso: boolean;
  erro?: string;
  usuario?: SessaoUsuario | null;
  dados?: Record<string, unknown>;
}

/**
 * Interface para criação/edição de usuário (adaptada para multi-farmácia)
 */
export interface CriarEditarUsuario {
  email: string;
  nome: string;
  telefone?: string;
  perfil_id: string;
  proprietario_id: string;
  farmacia_id: string;
  senha?: string;
  ativo: boolean;
}

/**
 * Interface para criação de farmácia
 */
export interface CriarFarmacia {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  telefone?: string;
  email?: string;
  site?: string;
  
  // Endereço
  endereco_cep: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento?: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_uf: string;
  
  // Responsável Técnico
  responsavel_tecnico_nome: string;
  responsavel_tecnico_crf: string;
  responsavel_tecnico_telefone?: string;
  responsavel_tecnico_email?: string;
  
  matriz: boolean;
}

/**
 * Interface para filtros de usuários
 */
export interface FiltrosUsuarios {
  perfil?: PerfilUsuario;
  ativo?: boolean;
  busca?: string;
  data_inicio?: string;
  data_fim?: string;
  farmacia_id?: string; // Filtro por farmácia
}

/**
 * Interface para estatísticas de usuários
 */
export interface EstatisticasUsuarios {
  total: number;
  ativos: number;
  por_perfil: Record<PerfilUsuario, number>;
  por_farmacia: Record<string, number>; // Estatísticas por farmácia
  ultimos_acessos: {
    hoje: number;
    semana: number;
    mes: number;
  };
}

/**
 * Função para verificar permissão
 */
export type VerificarPermissao = (
  modulo: ModuloSistema,
  acao: AcaoPermissao,
  nivel?: NivelAcesso
) => boolean;

/**
 * Função para verificar se tem permissão (alias)
 */
export type TemPermissao = (permissao: string) => boolean;

/**
 * Props para componentes protegidos
 */
export interface ProtecaoProps {
  children: React.ReactNode;
  modulo: ModuloSistema;
  acao: AcaoPermissao;
  nivel?: NivelAcesso;
  fallback?: React.ReactNode;
}

/**
 * Props para dashboards
 */
export interface DashboardProps {
  usuario: Usuario;
  permissoes: Permissao[];
}

/**
 * Interface para resposta de operação
 */
export interface RespostaOperacao {
  sucesso: boolean;
  erro?: string;
  dados?: Record<string, unknown>;
} 