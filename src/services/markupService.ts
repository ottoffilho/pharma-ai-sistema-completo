import { supabase } from '@/integrations/supabase/client';
import type { 
  ConfiguracaoMarkup, 
  CategoriaMarkup, 
  HistoricoPreco, 
  MarkupCalculationResult,
  CalcularPrecoParams,
  ValidarMarkupParams
} from '@/types/markup';

class MarkupService {
  // =====================================================
  // CONFIGURAÇÃO GLOBAL
  // =====================================================
  
  async getConfiguracaoGlobal(): Promise<ConfiguracaoMarkup | null> {
    console.log('🔧 Buscando configuração global de markup...');
    
    const { data, error } = await supabase
      .from('configuracao_markup')
      .select('*')
      .single();

    if (error) {
      console.error('❌ Erro ao buscar configuração de markup:', error);
      return null;
    }

    console.log('✅ Configuração global encontrada:', data);
    return data;
  }

  async updateConfiguracaoGlobal(configuracao: Partial<ConfiguracaoMarkup>): Promise<boolean> {
    // Log para debug
    console.log('Dados sendo enviados para atualização:', configuracao);
    
    // Limpar campos que não existem na tabela
    const dadosLimpos = {
      ...(configuracao.markup_global_padrao !== undefined && { markup_global_padrao: configuracao.markup_global_padrao }),
      ...(configuracao.markup_minimo !== undefined && { markup_minimo: configuracao.markup_minimo }),
      ...(configuracao.markup_maximo !== undefined && { markup_maximo: configuracao.markup_maximo }),
      ...(configuracao.permitir_markup_zero !== undefined && { permitir_markup_zero: configuracao.permitir_markup_zero }),
      ...(configuracao.aplicar_automatico_importacao !== undefined && { aplicar_automatico_importacao: configuracao.aplicar_automatico_importacao })
    };
    
    console.log('Dados limpos para envio:', dadosLimpos);
    
    const { error } = await supabase
      .from('configuracao_markup')
      .update(dadosLimpos)
      .eq('id', 1);

    if (error) {
      console.error('Erro ao atualizar configuração de markup:', error);
      return false;
    }

    return true;
  }

  async buscarConfiguracaoGeral(): Promise<ConfiguracaoMarkup | null> {
    return this.getConfiguracaoGlobal();
  }

  async atualizarConfiguracaoGeral(configuracao: Partial<ConfiguracaoMarkup>): Promise<ConfiguracaoMarkup> {
    const sucesso = await this.updateConfiguracaoGlobal(configuracao);
    if (!sucesso) {
      throw new Error('Erro ao atualizar configuração de markup');
    }
    const config = await this.getConfiguracaoGlobal();
    if (!config) {
      throw new Error('Erro ao buscar configuração atualizada');
    }
    return config;
  }

  // =====================================================
  // CATEGORIAS DE MARKUP
  // =====================================================

  async getCategorias(): Promise<CategoriaMarkup[]> {
    const { data, error } = await supabase
      .from('categoria_markup')
      .select('*')
      .eq('ativo', true)
      .order('categoria_nome');

    if (error) {
      console.error('Erro ao buscar categorias de markup:', error);
      return [];
    }

    return data || [];
  }

  async getCategoriaPorNome(categoria: string): Promise<CategoriaMarkup | null> {
    console.log('🔍 Buscando categoria por nome:', categoria);
    
    if (!categoria) {
      console.error('❌ Nome da categoria não fornecido');
      return null;
    }

    const { data, error } = await supabase
      .from('categoria_markup')
      .select('*')
      .eq('categoria_nome', categoria)
      .eq('ativo', true)
      .single();

    if (error) {
      console.error(`❌ Erro ao buscar categoria de markup '${categoria}':`, error);
      return null;
    }

    console.log('✅ Categoria encontrada:', data);
    return data;
  }

  async createCategoria(categoria: Omit<CategoriaMarkup, 'id' | 'created_at' | 'updated_at'>): Promise<CategoriaMarkup | null> {
    const { data, error } = await supabase
      .from('categoria_markup')
      .insert(categoria)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria de markup:', error);
      return null;
    }

    return data;
  }

  async updateCategoria(id: number, updates: Partial<CategoriaMarkup>): Promise<boolean> {
    const { error } = await supabase
      .from('categoria_markup')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar categoria de markup:', error);
      return false;
    }

    return true;
  }

  async buscarCategorias(): Promise<CategoriaMarkup[]> {
    return this.getCategorias();
  }

  async atualizarCategoria(categoria: string, dados: Partial<CategoriaMarkup>): Promise<CategoriaMarkup> {
    // Validar parâmetros
    if (!categoria) {
      throw new Error('Nome da categoria não fornecido');
    }

    if (!dados || Object.keys(dados).length === 0) {
      throw new Error('Nenhum dado fornecido para atualização');
    }

    // Buscar categoria atual
    const categoriaAtual = await this.getCategoriaPorNome(categoria);
    if (!categoriaAtual) {
      throw new Error(`Categoria ${categoria} não encontrada`);
    }

    // Atualizar categoria
    const sucesso = await this.updateCategoria(categoriaAtual.id, dados);
    if (!sucesso) {
      throw new Error('Erro ao atualizar categoria');
    }

    // Retornar categoria atualizada
    const categoriaAtualizada = await this.getCategoriaPorNome(categoria);
    if (!categoriaAtualizada) {
      throw new Error('Erro ao buscar categoria atualizada');
    }
    
    return categoriaAtualizada;
  }

  // =====================================================
  // CÁLCULOS DE MARKUP
  // =====================================================

  async calcularMarkup(precoCusto: number, categoria: string): Promise<MarkupCalculationResult> {
    console.log('💹 Calculando markup para:', { precoCusto, categoria });
    
    // Buscar markup padrão da categoria
    const markupPadrao = await this.obterMarkupPadrao(categoria);
    console.log('💹 Markup padrão obtido:', markupPadrao);
    
    // Calcular preço de venda
    console.log('💰 Calculando preço de venda...');
    const resultado = this.calcularPrecoVenda({
      preco_custo: precoCusto,
      markup: markupPadrao
    });

    console.log('✅ Cálculo concluído:', resultado);
    return {
      ...resultado,
      markup: markupPadrao
    };
  }

  calcularPrecoVenda({ preco_custo, markup }: CalcularPrecoParams): MarkupCalculationResult {
    const preco_venda = Math.round(preco_custo * markup * 100) / 100;
    const margem_lucro = ((preco_venda - preco_custo) / preco_venda) * 100;

    return {
      preco_venda,
      margem_lucro: Math.round(margem_lucro * 100) / 100,
      markup_aplicado: markup
    };
  }

  calcularMarkupPorMargem(preco_custo: number, margem_desejada: number): number {
    // Margem = (Preço Venda - Preço Custo) / Preço Venda
    // Resolvendo para markup: Markup = 1 / (1 - margem)
    const markup = 1 / (1 - margem_desejada / 100);
    return Math.round(markup * 100) / 100;
  }

  async validarMarkup({ markup, categoria, configuracao }: ValidarMarkupParams): Promise<{
    valido: boolean;
    mensagem?: string;
  }> {
    let config = configuracao;
    
    if (!config) {
      config = await this.getConfiguracaoGlobal();
    }

    if (!config) {
      return { valido: false, mensagem: 'Configuração de markup não encontrada' };
    }

    // Verificar se markup zero é permitido
    if (markup === 0 && !config.permitir_markup_zero) {
      return { valido: false, mensagem: 'Markup zero não é permitido' };
    }

    // Verificar limites mínimo e máximo
    if (markup < config.markup_minimo) {
      return { 
        valido: false, 
        mensagem: `Markup deve ser pelo menos ${config.markup_minimo}` 
      };
    }

    if (markup > config.markup_maximo) {
      return { 
        valido: false, 
        mensagem: `Markup não pode exceder ${config.markup_maximo}` 
      };
    }

    return { valido: true };
  }

  async obterMarkupPadrao(categoria?: string): Promise<number> {
    console.log('💹 Obtendo markup padrão para categoria:', categoria);
    
    if (categoria) {
      console.log('🔍 Buscando categoria específica...');
      const categoriaDados = await this.getCategoriaPorNome(categoria);
      if (categoriaDados) {
        console.log('✅ Categoria encontrada, markup:', categoriaDados.markup_padrao);
        return categoriaDados.markup_padrao;
      } else {
        console.log('⚠️ Categoria não encontrada, usando configuração global');
      }
    }

    console.log('🔍 Buscando configuração global...');
    const config = await this.getConfiguracaoGlobal();
    const markupPadrao = config?.markup_global_padrao || 6.00;
    console.log('✅ Markup padrão obtido:', markupPadrao);
    return markupPadrao;
  }

  // =====================================================
  // HISTÓRICO DE PREÇOS
  // =====================================================

  async getHistoricoPrecos(entidade_tipo?: string, entidade_id?: string): Promise<HistoricoPreco[]> {
    let query = supabase
      .from('historico_precos')
      .select(`
        *,
        usuarios!historico_precos_usuario_id_fkey(nome, email)
      `)
      .order('created_at', { ascending: false });

    if (entidade_tipo) {
      query = query.eq('entidade_tipo', entidade_tipo);
    }

    if (entidade_id) {
      query = query.eq('entidade_id', entidade_id);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('Erro ao buscar histórico de preços:', error);
      return [];
    }

    return data || [];
  }

  // =====================================================
  // APLICAÇÃO EM LOTE
  // =====================================================

  async aplicarMarkupEmLote(
    entidades: Array<{ id: string; tipo: 'insumo' | 'embalagem' }>,
    markup: number,
    motivo?: string
  ): Promise<{ sucesso: number; erro: number; detalhes: string[] }> {
    const resultado = { sucesso: 0, erro: 0, detalhes: [] as string[] };

    for (const entidade of entidades) {
      try {
        const tabela = entidade.tipo === 'insumo' ? 'insumos' : 'embalagens';
        
        const { error } = await supabase
          .from(tabela)
          .update({ 
            markup,
            markup_personalizado: true,
            data_ultima_atualizacao_preco: new Date().toISOString()
          })
          .eq('id', entidade.id);

        if (error) {
          resultado.erro++;
          resultado.detalhes.push(`Erro em ${entidade.tipo} ${entidade.id}: ${error.message}`);
        } else {
          resultado.sucesso++;
        }
      } catch (error) {
        resultado.erro++;
        resultado.detalhes.push(`Erro em ${entidade.tipo} ${entidade.id}: ${error}`);
      }
    }

    return resultado;
  }

  // =====================================================
  // RELATÓRIOS E ESTATÍSTICAS
  // =====================================================

  async getEstatisticasMarkup(): Promise<{
    markup_medio: number;
    markup_minimo: number;
    markup_maximo: number;
    total_itens: number;
    itens_com_markup_personalizado: number;
  }> {
    try {
      // Buscar estatísticas de produtos (antiga tabela insumos)
      const { data: produtosStats } = await supabase
        .from('produtos')
        .select('id, custo_unitario, preco_venda, markup')
        .eq('is_deleted', false);

      // Buscar estatísticas de embalagens
      const { data: embalagenssStats } = await supabase
        .from('embalagens')
        .select('markup, markup_personalizado')
        .not('markup', 'is', null);

      const todosItens = [...(produtosStats || []), ...(embalagenssStats || [])];
      
      if (todosItens.length === 0) {
        return {
          markup_medio: 0,
          markup_minimo: 0,
          markup_maximo: 0,
          total_itens: 0,
          itens_com_markup_personalizado: 0
        };
      }

      const markups = todosItens.map(item => item.markup);
      const markup_medio = markups.reduce((sum, markup) => sum + markup, 0) / markups.length;
      const markup_minimo = Math.min(...markups);
      const markup_maximo = Math.max(...markups);
      const itens_com_markup_personalizado = todosItens.filter(item => item.markup_personalizado).length;

      return {
        markup_medio: Math.round(markup_medio * 100) / 100,
        markup_minimo,
        markup_maximo,
        total_itens: todosItens.length,
        itens_com_markup_personalizado
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de markup:', error);
      return {
        markup_medio: 0,
        markup_minimo: 0,
        markup_maximo: 0,
        total_itens: 0,
        itens_com_markup_personalizado: 0
      };
    }
  }
}

export { MarkupService };
export const markupService = new MarkupService(); 