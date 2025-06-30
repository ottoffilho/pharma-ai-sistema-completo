// Script para verificar estrutura de vendas
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (use suas variáveis reais)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarTabelasVendas() {
  console.log('🔍 Verificando estrutura das tabelas de vendas...\n');

  try {
    // 1. Verificar se a tabela vendas existe
    console.log('1. Verificando tabela "vendas"...');
    const { data: vendas, error: errorVendas } = await supabase
      .from('vendas')
      .select('*')
      .limit(1);
    
    if (errorVendas) {
      console.log(`❌ Erro na tabela vendas: ${errorVendas.message}`);
    } else {
      console.log(`✅ Tabela vendas OK - ${vendas?.length || 0} registro(s) encontrado(s)`);
    }

    // 2. Verificar se a tabela itens_venda existe
    console.log('\n2. Verificando tabela "itens_venda"...');
    const { data: itens, error: errorItens } = await supabase
      .from('itens_venda')
      .select('*')
      .limit(1);
    
    if (errorItens) {
      console.log(`❌ Erro na tabela itens_venda: ${errorItens.message}`);
    } else {
      console.log(`✅ Tabela itens_venda OK - ${itens?.length || 0} registro(s) encontrado(s)`);
    }

    // 3. Testar consulta com relacionamento
    console.log('\n3. Testando consulta com relacionamento...');
    const { data: vendasComItens, error: errorRelacionamento } = await supabase
      .from('vendas')
      .select(`
        id,
        numero_venda,
        total,
        itens_venda (
          id,
          produto_nome,
          quantidade,
          preco_total
        )
      `)
      .limit(5);
    
    if (errorRelacionamento) {
      console.log(`❌ Erro no relacionamento: ${errorRelacionamento.message}`);
    } else {
      console.log(`✅ Relacionamento OK - ${vendasComItens?.length || 0} venda(s) encontrada(s)`);
      
      if (vendasComItens && vendasComItens.length > 0) {
        console.log('\n📊 Exemplo de dados:');
        vendasComItens.forEach((venda, index) => {
          console.log(`   Venda ${index + 1}: ${venda.numero_venda} - Total: R$ ${venda.total} - Itens: ${venda.itens_venda?.length || 0}`);
        });
      }
    }

    // 4. Verificar vendas recentes (últimas 10)
    console.log('\n4. Verificando vendas recentes (últimas 10)...');
    const { data: vendasRecentes, error: errorRecentes } = await supabase
      .from('vendas')
      .select('id, numero_venda, data_venda, total, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (errorRecentes) {
      console.log(`❌ Erro ao buscar vendas recentes: ${errorRecentes.message}`);
    } else {
      console.log(`✅ ${vendasRecentes?.length || 0} vendas recentes encontradas`);
      
      if (vendasRecentes && vendasRecentes.length > 0) {
        console.log('\n📋 Vendas recentes:');
        vendasRecentes.forEach((venda, index) => {
          const data = new Date(venda.data_venda).toLocaleDateString('pt-BR');
          console.log(`   ${index + 1}. ${venda.numero_venda} - ${data} - R$ ${venda.total} (${venda.status})`);
        });
      }
    }

    // 5. Verificar vendas com status 'rascunho' ou 'aberta'
    console.log('\n5. Verificando vendas abertas/rascunho...');
    const { data: vendasAbertas, error: errorAbertas } = await supabase
      .from('vendas')
      .select('id, numero_venda, status')
      .in('status', ['rascunho', 'aberta']);
    
    if (errorAbertas) {
      console.log(`❌ Erro ao buscar vendas abertas: ${errorAbertas.message}`);
    } else {
      console.log(`✅ ${vendasAbertas?.length || 0} vendas abertas/rascunho encontradas`);
      
      if (vendasAbertas && vendasAbertas.length > 0) {
        console.log('\n⚠️  Vendas pendentes:');
        vendasAbertas.forEach((venda, index) => {
          console.log(`   ${index + 1}. ${venda.numero_venda} - Status: ${venda.status}`);
        });
      }
    }

  } catch (error) {
    console.log(`💥 Erro geral: ${error.message}`);
  }

  console.log('\n🏁 Verificação concluída!');
}

// Executar verificação
verificarTabelasVendas();