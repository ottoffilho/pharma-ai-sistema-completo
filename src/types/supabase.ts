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
      abertura_caixa: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_abertura: string | null
          data_fechamento: string | null
          diferenca: number | null
          farmacia_id: string | null
          id: string
          observacoes: string | null
          observacoes_fechamento: string | null
          proprietario_id: string | null
          total_sangrias: number | null
          total_suprimentos: number | null
          total_vendas: number | null
          updated_at: string | null
          usuario_fechamento: string | null
          usuario_id: string
          valor_esperado: number | null
          valor_final: number | null
          valor_inicial: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          diferenca?: number | null
          farmacia_id?: string | null
          id?: string
          observacoes?: string | null
          observacoes_fechamento?: string | null
          proprietario_id?: string | null
          total_sangrias?: number | null
          total_suprimentos?: number | null
          total_vendas?: number | null
          updated_at?: string | null
          usuario_fechamento?: string | null
          usuario_id: string
          valor_esperado?: number | null
          valor_final?: number | null
          valor_inicial?: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          diferenca?: number | null
          farmacia_id?: string | null
          id?: string
          observacoes?: string | null
          observacoes_fechamento?: string | null
          proprietario_id?: string | null
          total_sangrias?: number | null
          total_suprimentos?: number | null
          total_vendas?: number | null
          updated_at?: string | null
          usuario_fechamento?: string | null
          usuario_id?: string
          valor_esperado?: number | null
          valor_final?: number | null
          valor_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "abertura_caixa_farmacia_id_fkey"
            columns: ["farmacia_id"]
            isOneToOne: false
            referencedRelation: "farmacias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abertura_caixa_proprietario_id_fkey"
            columns: ["proprietario_id"]
            isOneToOne: false
            referencedRelation: "proprietarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abertura_caixa_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas_atendimento: {
        Row: {
          atendente_id: string | null
          atendente_nome: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_telefone: string
          created_at: string | null
          departamento: string | null
          id: string
          observacoes_internas: string | null
          prioridade: string | null
          status: string | null
          tags: string[] | null
          ultima_mensagem_at: string | null
          updated_at: string | null
        }
        Insert: {
          atendente_id?: string | null
          atendente_nome?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          cliente_telefone: string
          created_at?: string | null
          departamento?: string | null
          id?: string
          observacoes_internas?: string | null
          prioridade?: string | null
          status?: string | null
          tags?: string[] | null
          ultima_mensagem_at?: string | null
          updated_at?: string | null
        }
        Update: {
          atendente_id?: string | null
          atendente_nome?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string
          created_at?: string | null
          departamento?: string | null
          id?: string
          observacoes_internas?: string | null
          prioridade?: string | null
          status?: string | null
          tags?: string[] | null
          ultima_mensagem_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_atendimento_atendente_id_fkey"
            columns: ["atendente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_atendimento_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_atendimento: {
        Row: {
          arquivo_nome: string | null
          arquivo_tamanho: number | null
          arquivo_url: string | null
          conteudo: string
          conversa_id: string
          created_at: string | null
          enviada_em: string | null
          id: string
          lida_em: string | null
          mensagem_original_id: string | null
          metadata: Json | null
          remetente_id: string | null
          remetente_nome: string | null
          remetente_tipo: string
          status_leitura: string | null
          tipo_mensagem: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          conteudo: string
          conversa_id: string
          created_at?: string | null
          enviada_em?: string | null
          id?: string
          lida_em?: string | null
          mensagem_original_id?: string | null
          metadata?: Json | null
          remetente_id?: string | null
          remetente_nome?: string | null
          remetente_tipo: string
          status_leitura?: string | null
          tipo_mensagem?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          conteudo?: string
          conversa_id?: string
          created_at?: string | null
          enviada_em?: string | null
          id?: string
          lida_em?: string | null
          mensagem_original_id?: string | null
          metadata?: Json | null
          remetente_id?: string | null
          remetente_nome?: string | null
          remetente_tipo?: string
          status_leitura?: string | null
          tipo_mensagem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_atendimento_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas_atendimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_atendimento_mensagem_original_id_fkey"
            columns: ["mensagem_original_id"]
            isOneToOne: false
            referencedRelation: "mensagens_atendimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_atendimento_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_resposta: {
        Row: {
          atalho: string | null
          ativo: boolean | null
          categoria: string | null
          conteudo: string
          created_at: string | null
          created_by: string | null
          departamento: string | null
          id: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          atalho?: string | null
          ativo?: boolean | null
          categoria?: string | null
          conteudo: string
          created_at?: string | null
          created_by?: string | null
          departamento?: string | null
          id?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          atalho?: string | null
          ativo?: boolean | null
          categoria?: string | null
          conteudo?: string
          created_at?: string | null
          created_by?: string | null
          departamento?: string | null
          id?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_resposta_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_conversas_whatsapp: {
        Args: {
          p_status?: string
          p_busca?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          cliente_id: string
          cliente_nome: string
          cliente_telefone: string
          status: string
          prioridade: string
          atendente_id: string
          atendente_nome: string
          departamento: string
          tags: string[]
          observacoes_internas: string
          ultima_mensagem_at: string
          ultima_mensagem_conteudo: string
          mensagens_nao_lidas: number
          created_at: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
 