// =====================================================
// TIPOS PARA O MÓDULO DE PRODUÇÃO - PHARMA.AI
// =====================================================

export interface OrdemProducao {
  id: string;
  numero_ordem: string;
  status: 'pendente' | 'em_producao' | 'finalizada' | 'cancelada';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  receita_id?: string;
  usuario_responsavel_id?: string;
  farmaceutico_responsavel_id?: string;
  observacoes_gerais?: string;
  data_criacao?: string;
  data_finalizacao?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  proprietario_id?: string;
  farmacia_id?: string;
}

export interface StatisticsData {
  totalOrdens: number;
  ordensEmProducao: number;
  ordensAguardando: number;
  ordensFinalizadasHoje: number;
  proximoPrazo?: string;
  ordensDoMes: number;
  taxaSucesso: number;
  tempoMedio: number;
}

export interface OrdemAndamento extends OrdemProducao {
  progresso?: number;
  tempoRestante?: string;
  produto_nome?: string;
  receitas?: {
    medicamento_nome?: string;
  };
} 