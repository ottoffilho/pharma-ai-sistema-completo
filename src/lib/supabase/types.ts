export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categoria_markup: {
        Row: {
          ativo: boolean | null
          categoria_nome: string
          created_at: string | null
          id: number
          markup_padrao: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_nome: string
          created_at?: string | null
          id?: number
          markup_padrao: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria_nome?: string
          created_at?: string | null
          id?: number
          markup_padrao?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      categoria_produto: {
        Row: {
          ativo: boolean | null
          codigo: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_financeiras: {
        Row: {
          descricao: string | null
          id: string
          is_deleted: boolean
          nome: string
          tipo: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          is_deleted?: boolean
          nome: string
          tipo: string
        }
        Update: {
          descricao?: string | null
          id?: string
          is_deleted?: boolean
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      lote: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_fabricacao: string | null
          data_validade: string | null
          fornecedor_id: string | null
          id: string
          numero_lote: string
          observacoes: string | null
          preco_custo_unitario: number | null
          produto_id: string
          quantidade_atual: number
          quantidade_inicial: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_fabricacao?: string | null
          data_validade?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_lote: string
          observacoes?: string | null
          preco_custo_unitario?: number | null
          produto_id: string
          quantidade_atual?: number
          quantidade_inicial?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_fabricacao?: string | null
          data_validade?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_lote?: string
          observacoes?: string | null
          preco_custo_unitario?: number | null
          produto_id?: string
          quantidade_atual?: number
          quantidade_inicial?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lote_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lote_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          aliquota_cofins: number | null
          aliquota_icms: number | null
          aliquota_ipi: number | null
          aliquota_pis: number | null
          ativo: boolean | null
          categoria: string | null
          categoria_produto_id: string | null
          cfop: string | null
          codigo_ean: string | null
          codigo_interno: string | null
          controlado: boolean | null
          created_at: string | null
          cst_cofins: string | null
          cst_icms: string | null
          cst_ipi: string | null
          cst_pis: string | null
          custo_efetivo: number | null
          custo_unitario: number
          data_ultima_atualizacao_preco: string | null
          descricao: string | null
          estoque_atual: number | null
          estoque_maximo: number | null
          estoque_minimo: number | null
          forma_farmaceutica_id: string | null
          fornecedor_id: string | null
          frete_unitario: number | null
          id: string
          is_deleted: boolean | null
          margem_lucro: number | null
          markup: number | null
          markup_personalizado: boolean | null
          ncm: string | null
          nome: string
          observacoes_custo: string | null
          origem: number | null
          preco_custo: number | null
          preco_venda: number | null
          produto_manipulado: boolean | null
          produto_revenda: boolean | null
          requer_receita: boolean | null
          tipo: string
          unidade_comercial: string | null
          unidade_medida: string
          unidade_tributaria: string | null
          updated_at: string | null
          volume_capacidade: string | null
        }
        Insert: {
          aliquota_cofins?: number | null
          aliquota_icms?: number | null
          aliquota_ipi?: number | null
          aliquota_pis?: number | null
          ativo?: boolean | null
          categoria?: string | null
          categoria_produto_id?: string | null
          cfop?: string | null
          codigo_ean?: string | null
          codigo_interno?: string | null
          controlado?: boolean | null
          created_at?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_ipi?: string | null
          cst_pis?: string | null
          custo_efetivo?: number | null
          custo_unitario?: number
          data_ultima_atualizacao_preco?: string | null
          descricao?: string | null
          estoque_atual?: number | null
          estoque_maximo?: number | null
          estoque_minimo?: number | null
          forma_farmaceutica_id?: string | null
          fornecedor_id?: string | null
          frete_unitario?: number | null
          id?: string
          is_deleted?: boolean | null
          margem_lucro?: number | null
          markup?: number | null
          markup_personalizado?: boolean | null
          ncm?: string | null
          nome: string
          observacoes_custo?: string | null
          origem?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          produto_manipulado?: boolean | null
          produto_revenda?: boolean | null
          requer_receita?: boolean | null
          tipo?: string
          unidade_comercial?: string | null
          unidade_medida?: string
          unidade_tributaria?: string | null
          updated_at?: string | null
          volume_capacidade?: string | null
        }
        Update: {
          aliquota_cofins?: number | null
          aliquota_icms?: number | null
          aliquota_ipi?: number | null
          aliquota_pis?: number | null
          ativo?: boolean | null
          categoria?: string | null
          categoria_produto_id?: string | null
          cfop?: string | null
          codigo_ean?: string | null
          codigo_interno?: string | null
          controlado?: boolean | null
          created_at?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_ipi?: string | null
          cst_pis?: string | null
          custo_efetivo?: number | null
          custo_unitario?: number
          data_ultima_atualizacao_preco?: string | null
          descricao?: string | null
          estoque_atual?: number | null
          estoque_maximo?: number | null
          estoque_minimo?: number | null
          forma_farmaceutica_id?: string | null
          fornecedor_id?: string | null
          frete_unitario?: number | null
          id?: string
          is_deleted?: boolean | null
          margem_lucro?: number | null
          markup?: number | null
          markup_personalizado?: boolean | null
          ncm?: string | null
          nome?: string
          observacoes_custo?: string | null
          origem?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          produto_manipulado?: boolean | null
          produto_revenda?: boolean | null
          requer_receita?: boolean | null
          tipo?: string
          unidade_comercial?: string | null
          unidade_medida?: string
          unidade_tributaria?: string | null
          updated_at?: string | null
          volume_capacidade?: string | null
        }
        Relationships: []
      }
      // ... outras tabelas conforme necessário
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// Tipos específicos para Lote
export type Lote = Tables<'lote'>
export type LoteInsert = TablesInsert<'lote'>
export type LoteUpdate = TablesUpdate<'lote'>

// Tipos específicos para Produto
export type Produto = Tables<'produtos'>
export type ProdutoInsert = TablesInsert<'produtos'>
export type ProdutoUpdate = TablesUpdate<'produtos'> 