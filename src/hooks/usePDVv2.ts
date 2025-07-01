// =====================================================
// HOOK: usePDVv2 - Lógica centralizada do PDV 2.0
// Gerencia estado, operações e integrações
// =====================================================

import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ItemCarrinho, 
  CarrinhoCompras, 
  ClienteVenda, 
  FormaPagamento,
  AberturaCaixa
} from '@/types/vendas';
import { UUID, Produto } from '@/types/database';

interface ProdutoPDV extends Partial<Produto> {
  id: UUID;
  nome: string;
  codigo_interno?: string;
  codigo_ean?: string;
  preco_venda: number;
  estoque_atual: number;
  categoria_nome?: string;
  controlado: boolean;
  requer_receita: boolean;
  forma_farmaceutica_nome?: string;
  marca?: string;
  laboratorio?: string;
  principio_ativo?: string;
  descricao?: string;
  imagem_url?: string;
  promocao?: {
    ativo: boolean;
    percentual: number;
    preco_promocional: number;
    validade: string;
  };
  layout_preferido: 'padrao' | 'compacto' | 'expandido';
}

interface PagamentoPDV {
  id?: string;
  forma_pagamento: FormaPagamento;
  valor: number;
  taxa_cartao?: number;
  valor_liquido?: number;
  numero_autorizacao?: string;
  bandeira_cartao?: string;
  codigo_transacao?: string;
  pix_chave?: string;
  pix_comprovante?: string;
  parcelas?: number;
  dias_vencimento?: number;
}

interface ClientePreferencias {
  produtos_favoritos: UUID[];
  marcas_preferidas: string[];
  alergias: string[];
  restricoes_medicas: string[];
  observacoes_especiais: string;
  horario_preferencial: string;
  dia_preferencial: number[];
  forma_pagamento_preferida: string;
  aceita_whatsapp: boolean;
  aceita_sms: boolean;
  aceita_email: boolean;
  pontos_fidelidade: number;
  nivel_fidelidade: 'bronze' | 'prata' | 'ouro' | 'diamante';
}

interface ConfiguracoesPDV {
  tema: 'light' | 'dark' | 'auto';
  tamanho_fonte: 'pequeno' | 'normal' | 'grande';
  som_habilitado: boolean;
  confirmar_antes_finalizar: boolean;
  imprimir_automatico: boolean;
  abrir_gaveta_automatico: boolean;
  atalhos_teclado: Record<string, string>;
  mostrar_produtos_favoritos: boolean;
  mostrar_ultimas_vendas: boolean;
  mostrar_metricas: boolean;
  layout_preferido: 'padrao' | 'compacto' | 'expandido';
}

export function usePDVv2() {
  // QueryClient para invalidação de cache
  const queryClient = useQueryClient();
  
  // Estados principais
  const [carrinho, setCarrinho] = useState<CarrinhoCompras>({
    itens: [],
    subtotal: 0,
    desconto_total: 0,
    total: 0
  });
  
  const [produtos, setProdutos] = useState<ProdutoPDV[]>([]);
  const [produtosFavoritos, setProdutosFavoritos] = useState<ProdutoPDV[]>([]);
  const [produtosSugeridos, setProdutosSugeridos] = useState<ProdutoPDV[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteVenda | null>(null);
  const [clientePreferencias, setClientePreferencias] = useState<ClientePreferencias | null>(null);
  
  const [pagamentos, setPagamentos] = useState<PagamentoPDV[]>([]);
  const [descontoGeral, setDescontoGeral] = useState({ valor: 0, percentual: 0 });
  
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesPDV>({
    tema: 'light',
    tamanho_fonte: 'normal',
    som_habilitado: true,
    confirmar_antes_finalizar: true,
    imprimir_automatico: false,
    abrir_gaveta_automatico: true,
    atalhos_teclado: {},
    mostrar_produtos_favoritos: true,
    mostrar_ultimas_vendas: true,
    mostrar_metricas: true,
    layout_preferido: 'padrao'
  });
  
  const [caixaAberto, setCaixaAberto] = useState<AberturaCaixa | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);
  
  const [tipoVenda, setTipoVenda] = useState<'MANIPULADO' | 'ALOPATICO' | 'DELIVERY' | 'PBM'>('ALOPATICO');
  const [ordemSelecionada, setOrdemSelecionada] = useState<{ id: string; numero: string } | null>(null);
  
  // Variáveis do ambiente
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // =====================================================
  // FUNÇÕES DE BUSCA
  // =====================================================
  
  const buscarProdutos = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) {
      setProdutos([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categoria_produto:categoria_produto_id(nome),
          forma_farmaceutica:forma_farmaceutica_id(nome)
        `)
        .or(`nome.ilike.%${termo}%,codigo_interno.ilike.%${termo}%,codigo_ean.ilike.%${termo}%`)
        .eq('ativo', true)
        .gt('estoque_atual', 0)
        .order('nome')
        .limit(20);
      
      if (error) throw error;
      
      const produtosFormatados = data?.map(produto => ({
        id: produto.id,
        nome: produto.nome,
        codigo_interno: produto.codigo_interno,
        codigo_ean: produto.codigo_ean,
        preco_venda: parseFloat(produto.preco_venda?.toString() || '0'),
        estoque_atual: parseFloat(produto.estoque_atual?.toString() || '0'),
        categoria_nome: produto.categoria_produto?.nome || '',
        controlado: produto.controlado || false,
        requer_receita: produto.requer_receita || false,
        forma_farmaceutica_nome: produto.forma_farmaceutica?.nome || '',
        marca: produto.marca,
        laboratorio: produto.laboratorio,
        principio_ativo: produto.principio_ativo,
        descricao: produto.descricao,
        imagem_url: produto.imagem_url
      })) || [];
      
      setProdutos(produtosFormatados);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar produtos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  const buscarSugestoes = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Busca direta por produtos populares até Edge Function ser corrigida
      const { data: produtosPopulares, error } = await supabase
        .from('produtos')
        .select(`
          id, nome, preco_venda, categoria_produto_id,
          categoria_produto:categoria_produto_id(nome)
        `)
        .eq('ativo', true)
        .gt('estoque_atual', 0)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erro ao buscar sugestões:', error);
        return;
      }

      const sugestoesFormatadas = produtosPopulares?.map(produto => ({
        id: produto.id,
        nome: produto.nome,
        codigo_interno: '',
        codigo_ean: '',
        preco_venda: parseFloat(produto.preco_venda?.toString() || '0'),
        estoque_atual: 100, // valor padrão
        categoria_nome: produto.categoria_produto?.nome || '',
        controlado: false,
        requer_receita: false
      })) || [];
      
      setProdutosSugeridos(sugestoesFormatadas);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    }
  }, [clienteSelecionado, carrinho.itens]);
  
  // =====================================================
  // FUNÇÕES DO CARRINHO
  // =====================================================
  
  const calcularTotais = useCallback((itens: ItemCarrinho[]): CarrinhoCompras => {
    const subtotal = itens.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
    const desconto_total = itens.reduce((acc, item) => acc + (item.desconto_valor || 0), 0) + descontoGeral.valor;
    const total = subtotal - desconto_total;
    
    return {
      itens,
      subtotal,
      desconto_total,
      total: Math.max(0, total)
    };
  }, [descontoGeral.valor]);
  
  const adicionarProduto = useCallback((produto: ProdutoPDV, quantidade: number = 1) => {
    if (tipoVenda === 'MANIPULADO') {
      toast({ title: 'Venda MANIPULADO', description: 'Itens são definidos pela Ordem de Produção', variant: 'destructive' });
      return;
    }
    
    const itemExistente = carrinho.itens.find(item => item.produto_id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade + quantidade > produto.estoque_atual) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${produto.estoque_atual} unidades disponíveis`,
          variant: "destructive"
        });
        return;
      }
      
      atualizarQuantidade(produto.id, itemExistente.quantidade + quantidade);
    } else {
      if (produto.estoque_atual === 0) {
        toast({
          title: "Produto sem estoque",
          description: "Este produto não possui estoque disponível",
          variant: "destructive"
        });
        return;
      }
      
      const novoItem: ItemCarrinho = {
        produto_id: produto.id,
        produto_nome: produto.nome,
        produto_codigo: produto.codigo_interno,
        quantidade: quantidade,
        preco_unitario: produto.preco_venda,
        preco_total: produto.preco_venda * quantidade,
        estoque_disponivel: produto.estoque_atual,
        desconto_valor: 0,
        desconto_percentual: 0
      };
      
      setCarrinho(prev => {
        const novosItens = [...prev.itens, novoItem];
        return calcularTotais(novosItens);
      });
      
      toast({
        title: "Produto adicionado",
        description: `${produto.nome} foi adicionado ao carrinho`,
      });
      
      // Atualizar produto favorito
      atualizarFavorito(produto.id);
    }
  }, [tipoVenda, carrinho.itens, calcularTotais]);
  
  const atualizarQuantidade = useCallback((produtoId: UUID, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItem(produtoId);
      return;
    }
    
    setCarrinho(prev => {
      const itemAtual = prev.itens.find(item => item.produto_id === produtoId);
      if (!itemAtual) return prev;
      
      if (novaQuantidade > itemAtual.estoque_disponivel) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${itemAtual.estoque_disponivel} unidades disponíveis`,
          variant: "destructive"
        });
        return prev;
      }
      
      const novosItens = prev.itens.map(item => {
        if (item.produto_id === produtoId) {
          const novoPrecoTotal = item.preco_unitario * novaQuantidade - (item.desconto_valor || 0);
          return {
            ...item,
            quantidade: novaQuantidade,
            preco_total: novoPrecoTotal
          };
        }
        return item;
      });
      return calcularTotais(novosItens);
    });
  }, [calcularTotais]);
  
  const removerItem = useCallback((produtoId: UUID) => {
    setCarrinho(prev => {
      const novosItens = prev.itens.filter(item => item.produto_id !== produtoId);
      return calcularTotais(novosItens);
    });
    
    toast({
      title: "Produto removido",
      description: "Produto foi removido do carrinho",
    });
  }, [calcularTotais]);
  
  const limparCarrinho = useCallback(() => {
    setCarrinho({
      itens: [],
      subtotal: 0,
      desconto_total: 0,
      total: 0
    });
    setPagamentos([]);
    setClienteSelecionado(null);
    setClientePreferencias(null);
    setDescontoGeral({ valor: 0, percentual: 0 });
    setOrdemSelecionada(null);
    
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos"
    });
  }, []);
  
  // =====================================================
  // FUNÇÕES DE CLIENTE
  // =====================================================
  
  const selecionarCliente = useCallback(async (cliente: ClienteVenda) => {
    setClienteSelecionado(cliente);
    
    // Buscar preferências do cliente
    await buscarPreferenciasCliente(cliente.id);
    
    // Calcular desconto inteligente
    await calcularDescontoInteligente(cliente.id);
    
    toast({
      title: "Cliente selecionado",
      description: `${cliente.nome} foi selecionado para a venda`,
    });
  }, []);
  
  const buscarPreferenciasCliente = useCallback(async (clienteId: string) => {
    try {
      // Busca direta na tabela até Edge Function ser corrigida
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (error) {
        console.error('Erro ao buscar preferências:', error);
        return;
      }

      // Preferências básicas baseadas nos dados do cliente
      const preferenciasBasicas: ClientePreferencias = {
        produtos_favoritos: [],
        marcas_preferidas: [],
        alergias: [],
        restricoes_medicas: [],
        observacoes_especiais: '',
        horario_preferencial: '',
        dia_preferencial: [],
        forma_pagamento_preferida: 'dinheiro',
        aceita_whatsapp: true,
        aceita_sms: true,
        aceita_email: !!data.email,
        pontos_fidelidade: 0,
        nivel_fidelidade: 'bronze'
      };
      
      setClientePreferencias(preferenciasBasicas);
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
    }
  }, []);
  
  const calcularDescontoInteligente = useCallback(async (clienteId: string) => {
    if (carrinho.total === 0) return;
    
    try {
      // Lógica simples de desconto até Edge Function ser corrigida
      const { data: cliente, error } = await supabase
        .from('clientes')
        .select('created_at')
        .eq('id', clienteId)
        .single();

      if (error) return;

      // Desconto básico por volume da compra
      let descontoPercentual = 0;
      let motivo = '';

      if (carrinho.subtotal > 200) {
        descontoPercentual = 5;
        motivo = 'Desconto por volume de compra (acima de R$ 200)';
      } else if (carrinho.subtotal > 100) {
        descontoPercentual = 3;
        motivo = 'Desconto por volume de compra (acima de R$ 100)';
      }

      if (descontoPercentual > 0) {
        const valorDesconto = (carrinho.subtotal * descontoPercentual) / 100;
        setDescontoGeral({
          valor: valorDesconto,
          percentual: descontoPercentual
        });
        
        toast({
          title: "Desconto aplicado!",
          description: motivo,
        });
      }
    } catch (error) {
      console.error('Erro ao calcular desconto:', error);
    }
  }, [carrinho]);
  
  // =====================================================
  // FUNÇÕES DE PAGAMENTO
  // =====================================================
  
  const adicionarPagamento = useCallback((pagamento: PagamentoPDV) => {
    setPagamentos(prev => [...prev, pagamento]);
    
    toast({
      title: "Pagamento adicionado",
      description: `Pagamento de R$ ${pagamento.valor.toFixed(2)} adicionado`,
    });
  }, []);
  
  const removerPagamento = useCallback((index: number) => {
    setPagamentos(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const totalPago = pagamentos.reduce((acc, pag) => acc + pag.valor, 0);
  const restante = carrinho.total - totalPago;
  const troco = totalPago > carrinho.total ? totalPago - carrinho.total : 0;
  
  // =====================================================
  // FUNÇÕES AUXILIARES
  // =====================================================
  
  const atualizarFavorito = useCallback(async (produtoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Buscar o ID correto na tabela usuarios
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .single();

      if (usuarioError || !usuario) {
        console.error('Usuário não encontrado na tabela usuarios:', usuarioError);
        return;
      }
      
      // Implementação direta até Edge Function ser corrigida
      const { error } = await supabase
        .from('produtos_favoritos')
        .upsert({
          usuario_id: usuario.id, // Usar o ID da tabela usuarios
          produto_id: produtoId,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'usuario_id,produto_id'
        });

      if (error) {
        console.error('Erro ao favoritar produto:', error);
      }
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
    }
  }, []);
  
  const carregarConfiguracoes = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Usar configurações padrão até Edge Function ser corrigida
      const configuracaoPadrao: ConfiguracoesPDV = {
        tema: 'light',
        tamanho_fonte: 'normal',
        som_habilitado: true,
        confirmar_antes_finalizar: true,
        imprimir_automatico: false,
        abrir_gaveta_automatico: true,
        atalhos_teclado: {},
        mostrar_produtos_favoritos: true,
        mostrar_ultimas_vendas: true,
        mostrar_metricas: true,
        layout_preferido: 'padrao'
      };
      
      setConfiguracoes(configuracaoPadrao);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, []);
  
  const salvarConfiguracoes = useCallback(async (novasConfiguracoes: ConfiguracoesPDV) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Salvar localmente até Edge Function ser corrigida
      setConfiguracoes(novasConfiguracoes);
      
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas (sessão atual)",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    }
  }, []);
  
  const verificarCaixaAberto = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('abertura_caixa')
        .select('*')
        .eq('ativo', true)
        .order('data_abertura', { ascending: false })
        .limit(1)
        .maybeSingle(); // Usar maybeSingle em vez de single para evitar erro se não encontrar
      
      if (error) {
        console.error('Erro na consulta de caixa:', error);
        return false;
      }
      
      if (data) {
        setCaixaAberto(data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar caixa:', error);
      return false;
    }
  }, []);
  
  const selecionarTipoVenda = useCallback((tipo: 'MANIPULADO' | 'ALOPATICO' | 'DELIVERY' | 'PBM') => {
    setTipoVenda(tipo);
    // Sempre limpar carrinho ao trocar tipo de venda
    limparCarrinho();
    setOrdemSelecionada(null);
  }, [limparCarrinho]);
  
  /**
   * Carrega itens de uma Ordem de Produção finalizada e bloqueia adições manuais
   */
  const carregarOrdemProducao = useCallback(async (ordemId: string) => {
    try {
      const { data: ordem, error } = await supabase
        .from('ordens_producao')
        .select('id, numero_ordem, status')
        .eq('id', ordemId)
        .eq('status', 'finalizada')
        .single();
      if (error || !ordem) {
        toast({ title: 'OP não encontrada ou não finalizada', variant: 'destructive' });
        return;
      }

      const { data: itens, error: itensError } = await supabase
        .from('ordem_producao_itens')
        .select('produto_id, quantidade, preco_unitario, produto:produto_id(nome, preco_venda, estoque_atual)')
        .eq('ordem_producao_id', ordemId);
      if (itensError) throw itensError;

      type OrdemProducaoItem = {
        produto_id: string;
        quantidade: number;
        preco_unitario: number;
        produto: {
          nome: string;
          preco_venda: number;
          estoque_atual: number;
        } | null;
      };

      // Monta carrinho read-only
      const itensCarrinho = (itens as OrdemProducaoItem[] || []).map((it) => ({
        produto_id: it.produto_id,
        produto_nome: it.produto?.nome || 'Produto',
        produto_codigo: '',
        quantidade: parseFloat(it.quantidade?.toString() || '1'),
        preco_unitario: parseFloat(it.preco_unitario?.toString() || it.produto?.preco_venda || '0'),
        preco_total: parseFloat(it.preco_unitario?.toString() || it.produto?.preco_venda || '0') * parseFloat(it.quantidade?.toString() || '1'),
        estoque_disponivel: it.produto?.estoque_atual || 0,
        desconto_valor: 0,
        desconto_percentual: 0
      }));
      setCarrinho(calcularTotais(itensCarrinho));
      setOrdemSelecionada({ id: ordem.id, numero: ordem.numero_ordem });
      toast({ title: 'OP carregada', description: `Itens da OP ${ordem.numero_ordem} carregados` });
    } catch (error) {
      const e = error as Error;
      console.error(e);
      toast({ title: 'Erro', description: e.message || 'Falha ao carregar OP', variant: 'destructive' });
    }
  }, [calcularTotais, toast]);
  
  // =====================================================
  // FUNÇÃO PRINCIPAL - FINALIZAR VENDA
  // =====================================================
  
  const finalizarVenda = useCallback(async () => {
    if (carrinho.itens.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos antes de finalizar a venda",
        variant: "destructive"
      });
      return false;
    }
    
    if (restante > 0.01) {
      toast({
        title: "Pagamento incompleto",
        description: `Faltam R$ ${restante.toFixed(2)} para completar o pagamento`,
        variant: "destructive"
      });
      return false;
    }
    
    if (pagamentos.length === 0) {
      toast({
        title: "Pagamento necessário",
        description: "Adicione pelo menos uma forma de pagamento",
        variant: "destructive"
      });
      return false;
    }
    
    if (configuracoes.confirmar_antes_finalizar) {
      const confirmado = confirm(`Finalizar venda de R$ ${carrinho.total.toFixed(2)}?`);
      if (!confirmado) return false;
    }
    
    let timeoutId: number | undefined;
    try {
      setIsProcessando(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data: session } = await supabase.auth.getSession();
      const userToken = session.session?.access_token;
      if (!userToken) throw new Error('Token de autenticação não encontrado');
      
      const vendaPayload = {
        cliente_id: clienteSelecionado?.id,
        cliente_nome: clienteSelecionado?.nome,
        cliente_documento: clienteSelecionado?.documento,
        cliente_telefone: clienteSelecionado?.telefone,
        tipo_venda: tipoVenda,
        origem_id: ordemSelecionada?.id,
        subtotal: carrinho.subtotal,
        desconto_valor: descontoGeral.valor,
        desconto_percentual: descontoGeral.percentual,
        total: carrinho.total,
        observacoes: '',
        itens: carrinho.itens.map(item => ({
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          produto_codigo: item.produto_codigo,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          preco_total: item.preco_total,
          desconto_valor: item.desconto_valor,
          desconto_percentual: item.desconto_percentual
        }))
      };
      
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000);

      const criarResponse = await fetch(`${supabaseUrl}/functions/v1/vendas-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ ...vendaPayload, action: 'CRIAR_VENDA_PDV' }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!criarResponse.ok) {
        const errorData = await criarResponse.json().catch(() => ({ error: `HTTP ${criarResponse.status} - ${criarResponse.statusText}` }));
        throw new Error(errorData.error || 'Erro ao criar a venda no backend.');
      }

      const criarResponseData = await criarResponse.json();
      const { venda_id } = criarResponseData;

      if (!venda_id) {
        throw new Error('API de criação não retornou o ID da venda.');
      }

      const finalizarResponse = await fetch(`${supabaseUrl}/functions/v1/vendas-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          action: 'FINALIZAR_VENDA',
          venda_id: venda_id,
          pagamentos: pagamentos.map(pag => ({
            forma_pagamento: pag.forma_pagamento,
            valor: pag.valor,
            bandeira_cartao: pag.bandeira_cartao,
            numero_autorizacao: pag.numero_autorizacao,
            codigo_transacao: pag.codigo_transacao,
            observacoes: pag.observacoes,
          })),
          troco: troco
        })
      });

      if (!finalizarResponse.ok) {
        const errorData = await finalizarResponse.json().catch(() => ({}));
        // A venda foi criada, mas a finalização falhou.
        // O usuário deve ser notificado para tentar finalizar manualmente.
        throw new Error(errorData.error || 'Venda criada, mas falhou ao finalizar. Verifique o histórico de vendas.');
      }
      
      toast({
        title: "✅ Venda finalizada!",
        description: `Venda #${criarResponseData?.numero_venda || venda_id} processada.`,
        duration: 3000,
      });
      
      await queryClient.invalidateQueries({ queryKey: ['vendas', 'caixa', 'produtos', 'estoque', 'financeiro'] });
      
      limparCarrinho();
      return true;

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
      
      toast({
        title: "❌ Erro ao Finalizar Venda",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      return false;
    } finally {
      setIsProcessando(false);
    }
  }, [carrinho, restante, pagamentos, configuracoes, clienteSelecionado, descontoGeral, caixaAberto, troco, totalPago, supabaseUrl, supabaseAnonKey, limparCarrinho, queryClient, tipoVenda, ordemSelecionada]);
  
  // =====================================================
  // EFEITOS
  // =====================================================
  
  useEffect(() => {
    carregarConfiguracoes();
    verificarCaixaAberto();
  }, [carregarConfiguracoes, verificarCaixaAberto]);
  
  useEffect(() => {
    if (clienteSelecionado || carrinho.itens.length > 0) {
      buscarSugestoes();
    }
  }, [clienteSelecionado, carrinho.itens, buscarSugestoes]);
  
  return {
    // Estados
    carrinho,
    produtos,
    produtosFavoritos,
    produtosSugeridos,
    loading,
    clienteSelecionado,
    clientePreferencias,
    pagamentos,
    descontoGeral,
    configuracoes,
    caixaAberto,
    isProcessando,
    totalPago,
    restante,
    troco,
    tipoVenda,
    ordemSelecionada,
    
    // Funções
    buscarProdutos,
    adicionarProduto,
    atualizarQuantidade,
    removerItem,
    limparCarrinho,
    selecionarCliente,
    adicionarPagamento,
    removerPagamento,
    setDescontoGeral,
    salvarConfiguracoes,
    finalizarVenda,
    selecionarTipoVenda,
    carregarOrdemProducao
  };
} 