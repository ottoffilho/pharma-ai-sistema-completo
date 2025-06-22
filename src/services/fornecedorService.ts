import { supabase } from '@/integrations/supabase/client';
import type { Fornecedor, FornecedorInsert, FornecedorUpdate } from '@/integrations/supabase/types';

/**
 * Serviço para gerenciar operações CRUD de fornecedores
 * Encapsula todas as chamadas ao Supabase relacionadas a fornecedores
 */
export class FornecedorService {
  /**
   * Busca todos os fornecedores ordenados por nome
   */
  static async getFornecedores(): Promise<Fornecedor[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome');

    if (error) {
      throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca um fornecedor específico pelo ID
   */
  static async getFornecedorById(id: string): Promise<Fornecedor> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar fornecedor: ${error.message}`);
    }

    if (!data) {
      throw new Error('Fornecedor não encontrado');
    }

    return data;
  }

  /**
   * Cria um novo fornecedor
   */
  static async createFornecedor(fornecedorData: FornecedorInsert): Promise<Fornecedor> {
    // Sanitizar dados antes de enviar
    const sanitizedData = this.sanitizeData(fornecedorData);

    const { data, error } = await supabase
      .from('fornecedores')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar fornecedor: ${error.message}`);
    }

    return data;
  }

  /**
   * Atualiza um fornecedor existente
   */
  static async updateFornecedor(id: string, fornecedorData: FornecedorUpdate): Promise<Fornecedor> {
    // Sanitizar dados antes de enviar
    const sanitizedData = this.sanitizeData(fornecedorData);

    const { data, error } = await supabase
      .from('fornecedores')
      .update(sanitizedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar fornecedor: ${error.message}`);
    }

    return data;
  }

  /**
   * Exclui um fornecedor
   */
  static async deleteFornecedor(id: string): Promise<void> {
    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir fornecedor: ${error.message}`);
    }
  }

  /**
   * Busca fornecedores por termo de pesquisa
   */
  static async searchFornecedores(searchTerm: string): Promise<Fornecedor[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%`)
      .order('nome');

    if (error) {
      throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Verifica se um fornecedor está sendo usado em outros registros
   */
  static async isFornecedorInUse(id: string): Promise<boolean> {
    // Verificar se o fornecedor está sendo usado em produtos
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('id')
      .eq('fornecedor_id', id)
      .limit(1);

    if (produtosError) {
      throw new Error(`Erro ao verificar uso do fornecedor: ${produtosError.message}`);
    }

    if (produtos && produtos.length > 0) {
      return true;
    }

    // Verificar se o fornecedor está sendo usado em embalagens
    const { data: embalagens, error: embalagensError } = await supabase
      .from('embalagens')
      .select('id')
      .eq('fornecedor_id', id)
      .limit(1);

    if (embalagensError) {
      throw new Error(`Erro ao verificar uso do fornecedor: ${embalagensError.message}`);
    }

    if (embalagens && embalagens.length > 0) {
      return true;
    }

    // Verificar se o fornecedor está sendo usado em lotes
    const { data: lotes, error: lotesError } = await supabase
      .from('lotes_insumos')
      .select('id')
      .eq('fornecedor_id', id)
      .limit(1);

    if (lotesError) {
      throw new Error(`Erro ao verificar uso do fornecedor: ${lotesError.message}`);
    }

    if (lotes && lotes.length > 0) {
      return true;
    }

    // Verificar se o fornecedor está sendo usado em contas a pagar
    const { data: contas, error: contasError } = await supabase
      .from('contas_a_pagar')
      .select('id')
      .eq('fornecedor_id', id)
      .limit(1);

    if (contasError) {
      throw new Error(`Erro ao verificar uso do fornecedor: ${contasError.message}`);
    }

    return contas && contas.length > 0;
  }

  /**
   * Sanitiza os dados de entrada removendo caracteres perigosos
   */
  private static sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Remove caracteres potencialmente perigosos
        sanitized[key] = value.trim().replace(/['";<>]/g, '');
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Valida os dados de um fornecedor
   */
  static validateFornecedor(data: Partial<FornecedorInsert>): string[] {
    const errors: string[] = [];

    // Nome é obrigatório
    if (!data.nome || data.nome.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }

    if (data.nome && data.nome.length > 255) {
      errors.push('Nome deve ter no máximo 255 caracteres');
    }

    // Validar email se fornecido
    if (data.email && data.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Email deve ter um formato válido');
      }
    }

    // Validar telefone se fornecido
    if (data.telefone && data.telefone.trim().length > 0) {
      if (data.telefone.length < 10) {
        errors.push('Telefone deve ter pelo menos 10 dígitos');
      }
    }

    return errors;
  }

  /**
   * Busca fornecedor por CNPJ/documento
   */
  static async getFornecedorByCNPJ(cnpj: string): Promise<Fornecedor | null> {
    try {
      console.log('🔍 Buscando fornecedor por CNPJ:', cnpj);

      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('documento', cnpj)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar fornecedor por CNPJ:', error);
        // Em caso de erro, retornar null para permitir continuar
        return null;
      }

      if (data) {
        console.log('✅ Fornecedor encontrado:', data.nome);
      } else {
        console.log('ℹ️ Fornecedor não encontrado');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro no serviço de busca por CNPJ:', error);
      // Em caso de erro, retornar null para permitir continuar
      return null;
    }
  }

  /**
   * Busca ou cria fornecedor baseado nos dados do XML da NF-e
   */
  static async buscarOuCriarFornecedor(dadosXML: {
    cnpj?: string;
    razaoSocial?: string;
    nomeFantasia?: string;
    inscricaoEstadual?: string;
    telefone?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  }): Promise<string> {
    if (!dadosXML.cnpj) {
      throw new Error('CNPJ é obrigatório para importar fornecedor');
    }

    // Primeiro, tentar buscar fornecedor existente
    const fornecedorExistente = await this.getFornecedorByCNPJ(dadosXML.cnpj);
    
    if (fornecedorExistente) {
      return fornecedorExistente.id;
    }

    // Se não existe, criar novo fornecedor
    const novoFornecedor: FornecedorInsert = {
      nome: dadosXML.razaoSocial || 'Fornecedor Importado',
      nome_fantasia: dadosXML.nomeFantasia,
      documento: dadosXML.cnpj,
      tipo_pessoa: 'JURIDICA',
      telefone: dadosXML.telefone,
      inscricao_estadual: dadosXML.inscricaoEstadual,
      endereco: this.formatarEndereco(dadosXML),
      cidade: dadosXML.cidade,
      estado: dadosXML.uf,
      cep: dadosXML.cep,
      tipo_fornecedor: 'MEDICAMENTOS'
    };

    const fornecedorCriado = await this.createFornecedor(novoFornecedor);
    return fornecedorCriado.id;
  }

  /**
   * Formata endereço a partir dos dados do XML
   */
  private static formatarEndereco(dados: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
  }): string {
    const partes = [];
    
    if (dados.logradouro) partes.push(dados.logradouro);
    if (dados.numero) partes.push(dados.numero);
    if (dados.complemento) partes.push(dados.complemento);
    if (dados.bairro) partes.push(dados.bairro);
    
    return partes.join(', ');
  }
} 