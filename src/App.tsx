import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import React, { useEffect, ErrorInfo, ReactNode } from "react"; // Explicitly import React
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/index";
import DiagnosticoSistemaPage from "./pages/admin/diagnostico-sistema";
import PedidosPage from "./pages/admin/pedidos/index";
import NovaReceitaPage from "./pages/admin/pedidos/nova-receita";
import PrescriptionDetailsPage from "./pages/admin/pedidos/detalhes";
import EditarReceitaPage from "./pages/admin/pedidos/[id]/editar";
import UsuariosPage from "./pages/admin/usuarios/index";
import UsuariosDebugPage from "./pages/admin/usuarios/debug";
import DebugPermissions from "./pages/admin/usuarios/debug-permissions";
import UsuariosSimplePage from "./pages/admin/usuarios/simple";
import { TestPermissionsPage } from "./pages/admin/usuarios/test-permissions";
import NovoUsuarioPage from "./pages/admin/usuarios/novo";
import EditarUsuarioPage from "./pages/admin/usuarios/editar";
import NovoLoteInsumoPage from "./pages/admin/estoque/lotes/novo";
import EditarLoteInsumoPage from "./pages/admin/estoque/lotes/editar/[id]";
import DetalhesLotePage from "./pages/admin/estoque/lotes/[id]";
import LotesPage from "./pages/admin/estoque/lotes/index";
import ImportacaoNFPage from "./pages/admin/estoque/importacao-nf";
import InsumosPage from "./pages/admin/estoque/insumos/index";
import NovoInsumoPage from "./pages/admin/estoque/insumos/novo";
import EditarInsumoPage from "./pages/admin/estoque/insumos/editar";
import FornecedoresPage from "./pages/admin/cadastros/fornecedores/index";
import NovoFornecedorPage from "./pages/admin/cadastros/fornecedores/novo";
import EditarFornecedorPage from "./pages/admin/cadastros/fornecedores/[id]";
import VisualizarFornecedorPage from "./pages/admin/cadastros/fornecedores/visualizar";
import ListaFormasFarmaceuticas from "./pages/admin/cadastros/formas-farmaceuticas/index";
import NovaFormaFarmaceutica from "./pages/admin/cadastros/formas-farmaceuticas/nova";
import EditarFormaFarmaceutica from "./pages/admin/cadastros/formas-farmaceuticas/[id]/editar";
import CategoriasFinanceirasPage from "./pages/admin/financeiro/categorias/index";
import NovaCategoriaPage from "./pages/admin/financeiro/categorias/novo";
import EditarCategoriaPage from "./pages/admin/financeiro/categorias/editar";
import FluxoCaixaPage from "./pages/admin/financeiro/caixa/index";
import ContasAPagarPage from "./pages/admin/financeiro/contas-a-pagar/index";
import NovaContaPagarPage from "./pages/admin/financeiro/contas-a-pagar/novo";
import EditarContaPagarPage from "./pages/admin/financeiro/contas-a-pagar/editar/[id]";
import PerfilPage from "./pages/admin/perfil";
import ConfiguracoesPage from "./pages/admin/configuracoes";
import ConfiguracaoMarkupPage from "./pages/admin/configuracoes/markup";
import ProcessamentoReceitasPage from "./pages/admin/ia/processamento-receitas";
import PrevisaoDemandaPage from "./pages/admin/ia/previsao-demanda";
import OtimizacaoComprasPage from "./pages/admin/ia/otimizacao-compras";
import AnaliseClientesPage from "./pages/admin/ia/analise-clientes";
import MonitoramentoPage from "./pages/admin/ia/monitoramento";
import IAOverview from "./pages/admin/ia/index";
import ChatbotPage from "./pages/admin/ia/chatbot";
import EstoqueOverview from "./pages/admin/estoque/index";
import FinanceiroOverview from "./pages/admin/financeiro/index";
import CadastrosOverview from "./pages/admin/cadastros/index";
import ProducaoOverview from "./pages/admin/producao/overview";
import OrdensProducaoPage from "./pages/admin/producao/index";
import NovaOrdemProducaoPage from "./pages/admin/producao/nova";
import DetalhesOrdemProducaoPage from "./pages/admin/producao/detalhes";
import EditarOrdemProducaoPage from "./pages/admin/producao/editar";
import ControleQualidadePage from "./pages/admin/producao/controle-qualidade";
import RelatoriosProducaoPage from "./pages/admin/producao/relatorios";
import PrivateRoute from "./components/Auth/PrivateRoute";
import FloatingChatbotWidget from "@/components/chatbot/FloatingChatbotWidget";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import { useLocation } from "react-router-dom";
import { AuthProvider } from '@/modules/usuarios-permissoes/components/AuthProvider';
import { AuthSimpleProvider } from '@/modules/usuarios-permissoes/components/AuthSimpleProvider';
import PrivateRouteDebug from './components/Auth/PrivateRouteDebug';
import PrivateRouteSimple from './components/Auth/PrivateRouteSimple';
import ForceAuth from './components/Auth/ForceAuth';
import { DashboardRouter } from '@/modules/usuarios-permissoes/components/DashboardRouter';
import { ProtectedComponent } from '@/modules/usuarios-permissoes/components/ProtectedComponent';
import { ModuloSistema, AcaoPermissao } from '@/modules/usuarios-permissoes/types';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import PrimeiroAcesso from './pages/PrimeiroAcesso';
import PrimeiroAcessoGuard from './components/PrimeiroAcessoGuard';
import { supabase } from '@/lib/supabase';
import ListarPedidosPage from "./pages/admin/pedidos/listar";
import VerificarTabelasPage from "./pages/admin/sistema/verificar-tabelas";
import AceitarConvite from './pages/AceitarConvite';
import ProdutosPage from "./pages/admin/estoque/produtos/index";
import NovoProdutoPage from "./pages/admin/estoque/produtos/novo";
import EditarProdutoPage from "./pages/admin/estoque/produtos/editar";
import DetalhesProdutoPage from "./pages/admin/estoque/produtos/detalhes";

// Sistema de Vendas
import VendasPage from "./pages/admin/vendas";
import PDVUnificado from "./pages/admin/vendas/pdv"; // PDV unificado e inteligente
import CaixaPage from "./pages/admin/vendas/caixa";
import FechamentoVendasPage from "./pages/admin/vendas/fechamento";
import HistoricoVendasPage from "./pages/admin/vendas/historico";

// Importações do sistema de clientes
import GestaoClientes from "./pages/admin/clientes/index";
import NovoClientePage from "./pages/admin/clientes/novo";
import EditarCliente from "./pages/admin/clientes/[id]/editar";
import DetalhesClientePage from "./pages/admin/clientes/[id]/index";

import EmbalagensListPage from "./pages/admin/estoque/embalagens/index";
import NovoEmbalagemPage from "./pages/admin/estoque/embalagens/novo";
import EditarEmbalagemPage from "./pages/admin/estoque/embalagens/editar";
import DetalhesNotaFiscalPage from "./pages/admin/fiscal/nota-fiscal/[id]";
import FiscalOverviewPage from "./pages/admin/fiscal/index";
import DiagnosticoXMLPage from "./pages/admin/fiscal/diagnostico-xml";
import WhatsAppDashboard from "./pages/admin/whatsapp/index";

const queryClient = new QueryClient();

// Componente para controlar qual chatbot mostrar
const ChatbotController = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Não exibir em rotas específicas públicas (ex.: /login)
  const pathsSemWidget = ['/login'];

  const deveMostrarWidget = !isAdminRoute && !pathsSemWidget.includes(location.pathname);

  return deveMostrarWidget ? <FloatingChatbotWidget /> : null;
};

// Adicionar esta função de emergência antes do componente App
function EmergencyLogout() {
  useEffect(() => {
    // Limpar dados de autenticação
    try {
      console.log('🚨 LOGOUT DE EMERGÊNCIA ACIONADO');
      // Limpar qualquer cache do Supabase
      supabase.auth.signOut();
      
      // Limpar dados de sessão locais
      sessionStorage.clear();
      localStorage.removeItem('supabase.auth.token');
      
      // Redirecionar para login após pequeno delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (e) {
      console.error('Erro no logout forçado:', e);
      // Redirecionar mesmo com erro
      window.location.href = '/login';
    }
    
    return () => {};
  }, []);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Logout de Emergência</h1>
        <p className="mb-4">Limpando dados de sessão...</p>
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
}

// Error Boundary para capturar erros não tratados
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 ErrorBoundary capturou erro:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary - Detalhes do erro:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Ops! Algo deu errado
            </h1>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap the entire app with React.StrictMode
const App = (): JSX.Element => {
  // Capturar erros de Promise rejeitadas globalmente
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Promise rejeitada não tratada:', event.reason);
      
      // Evitar que o erro apareça no console como "Uncaught"
      event.preventDefault();
      
      // Se for um erro vazio ou sem informação útil, ignorar
      if (!event.reason || event.reason === '' || typeof event.reason === 'object' && Object.keys(event.reason).length === 0) {
        console.log('⚠️ Erro vazio ignorado');
        return;
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Erro global capturado:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <AuthSimpleProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <ChatbotProvider>
                <Toaster />
                <Sonner />
                <ChatbotController />
                <Routes>
                  {/* Rotas Públicas - SEM alternância de tema, sempre light */}
                  <Route
                    path="/emergency-logout"
                    element={
                      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                        <EmergencyLogout />
                      </ThemeProvider>
                    }
                  />
                  <Route 
                    path="/"
                    element={
                      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                        <PrimeiroAcessoGuard>
                          <Index />
                        </PrimeiroAcessoGuard>
                      </ThemeProvider>
                    }
                  />
                  <Route 
                    path="/login"
                    element={
                      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                        <PrimeiroAcessoGuard>
                          <Login />
                        </PrimeiroAcessoGuard>
                      </ThemeProvider>
                    }
                  />
                  <Route 
                    path="/primeiro-acesso"
                    element={
                      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                        <PrimeiroAcesso />
                      </ThemeProvider>
                    }
                  />
                  <Route 
                    path="/esqueci-senha"
                    element={
                      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                        <EsqueciSenha />
                      </ThemeProvider>
                    }
                  />
                  <Route 
                    path="/redefinir-senha"
                    element={
                      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                        <RedefinirSenha />
                      </ThemeProvider>
                    }
                  />
                  <Route 
                    path="/aceitar-convite"
                    element={
                      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                        <AceitarConvite />
                      </ThemeProvider>
                    }
                  />
                  <Route path="/debug" element={<Navigate to="/" replace />} />
                  <Route path="/debug-auth" element={<Navigate to="/" replace />} />
                  
                  {/* Rota de debug para acessar admin sem autenticação */}
                  <Route element={<PrivateRouteDebug />}>
                    <Route 
                      path="/admin-debug/*"
                      element={
                        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                          <Routes>
                            <Route path="" element={<AdminDashboard />} />
                            <Route path="usuarios" element={<UsuariosPage />} />
                          </Routes>
                        </ThemeProvider>
                      }
                    />
                  </Route>
                  {/* Rotas Protegidas - Dashboard/Admin, COM alternância de tema */}
                  <Route element={<ForceAuth />}>
                    <Route 
                      path="/admin/*"
                      element={
                        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                          <Routes>
                            {/* Todas as rotas internas do dashboard/admin */}
                            <Route path="" element={<DashboardRouter />} />
                            <Route path="diagnostico-sistema" element={<DiagnosticoSistemaPage />} />
                            
                            <Route path="pedidos" element={<PedidosPage />} />
                            <Route path="pedidos/listar" element={<ListarPedidosPage />} />
                            <Route path="pedidos/nova-receita" element={<NovaReceitaPage />} />
                            <Route path="pedidos/:id" element={<PrescriptionDetailsPage />} />
                            <Route path="pedidos/:id/editar" element={<EditarReceitaPage />} />
                            <Route path="estoque/produtos" element={<ProdutosPage />} />
                            <Route path="estoque/produtos/novo" element={<NovoProdutoPage />} />
                            <Route path="estoque/produtos/editar/:id" element={<EditarProdutoPage />} />
                            <Route path="estoque/produtos/:id" element={<DetalhesProdutoPage />} />
                            <Route path="estoque/insumos" element={<InsumosPage />} />
                            <Route path="estoque/insumos/novo" element={<NovoInsumoPage />} />
                            <Route path="estoque/insumos/editar/:id" element={<EditarInsumoPage />} />
                            <Route path="estoque/lotes" element={<LotesPage />} />
                            <Route path="estoque/lotes/novo" element={<NovoLoteInsumoPage />} />
                            <Route path="estoque/lotes/editar/:id" element={<EditarLoteInsumoPage />} />
                            <Route path="estoque/lotes/:id" element={<DetalhesLotePage />} />
                            <Route path="estoque/importacao-nf" element={<ImportacaoNFPage />} />
                            <Route path="estoque" element={<EstoqueOverview />} />
                            <Route path="financeiro/categorias" element={<CategoriasFinanceirasPage />} />
                            <Route path="financeiro/categorias/novo" element={<NovaCategoriaPage />} />
                            <Route path="financeiro/categorias/editar/:id" element={<EditarCategoriaPage />} />
                            <Route path="financeiro/caixa" element={<FluxoCaixaPage />} />
                            <Route path="financeiro/contas-a-pagar" element={<ContasAPagarPage />} />
                            <Route path="financeiro/contas-a-pagar/novo" element={<NovaContaPagarPage />} />
                            <Route path="financeiro/contas-a-pagar/editar/:id" element={<EditarContaPagarPage />} />
                            <Route path="cadastros/fornecedores" element={<FornecedoresPage />} />
                            <Route path="cadastros/fornecedores/novo" element={<NovoFornecedorPage />} />
                            <Route path="cadastros/fornecedores/:id" element={<VisualizarFornecedorPage />} />
                            <Route path="cadastros/fornecedores/editar/:id" element={<EditarFornecedorPage />} />
                            <Route path="cadastros/formas-farmaceuticas" element={<ListaFormasFarmaceuticas />} />
                            <Route path="cadastros/formas-farmaceuticas/nova" element={<NovaFormaFarmaceutica />} />
                            <Route path="cadastros/formas-farmaceuticas/:id/editar" element={<EditarFormaFarmaceutica />} />
                            <Route path="producao" element={<OrdensProducaoPage />} />
                            <Route path="producao/nova" element={<NovaOrdemProducaoPage />} />
                            <Route path="producao/relatorios" element={<RelatoriosProducaoPage />} />
                            <Route path="producao/:id" element={<DetalhesOrdemProducaoPage />} />
                            <Route path="producao/:id/editar" element={<EditarOrdemProducaoPage />} />
                            <Route path="producao/controle-qualidade" element={<ControleQualidadePage />} />
                            <Route path="ia/chatbot" element={<ChatbotPage />} />
                            <Route path="ia/processamento-receitas" element={<ProcessamentoReceitasPage />} />
                            <Route path="ia/previsao-demanda" element={<PrevisaoDemandaPage />} />
                            <Route path="ia/otimizacao-compras" element={<OtimizacaoComprasPage />} />
                            <Route path="ia/analise-clientes" element={<AnaliseClientesPage />} />
                            <Route path="ia/monitoramento" element={<MonitoramentoPage />} />
                            <Route path="ia" element={<IAOverview />} />
                            <Route path="perfil" element={<PerfilPage />} />
                            <Route path="configuracoes" element={<ConfiguracoesPage />} />
                            <Route path="configuracoes/markup" element={<ConfiguracaoMarkupPage />} />
                            <Route path="usuarios" element={<UsuariosPage />} />
                            <Route path="usuarios/debug" element={<UsuariosDebugPage />} />
                            <Route path="usuarios/debug-permissions" element={<DebugPermissions />} />
                            <Route path="usuarios/simple" element={<UsuariosSimplePage />} />
                            <Route path="usuarios/backup" element={<UsuariosSimplePage />} />
                            <Route path="usuarios/test-permissions" element={<TestPermissionsPage />} />
                            <Route path="usuarios/novo" element={<ProtectedComponent modulo={ModuloSistema.USUARIOS_PERMISSOES} acao={AcaoPermissao.CRIAR} fallback={<Navigate to='/admin' replace />}><NovoUsuarioPage /></ProtectedComponent>} />
                            <Route path="usuarios/editar/:id" element={<ProtectedComponent modulo={ModuloSistema.USUARIOS_PERMISSOES} acao={AcaoPermissao.EDITAR} fallback={<Navigate to='/admin' replace />}><EditarUsuarioPage /></ProtectedComponent>} />
                            
                            {/* Rotas de Clientes */}
                            <Route path="clientes" element={<GestaoClientes />} />
                            <Route path="clientes/novo" element={<NovoClientePage />} />
                            <Route path="clientes/:id" element={<DetalhesClientePage />} />
                            <Route path="clientes/:id/editar" element={<EditarCliente />} />
                            
                            <Route path="financeiro" element={<FinanceiroOverview />} />
                            <Route path="cadastros" element={<CadastrosOverview />} />
                            <Route path="producao/overview" element={<ProducaoOverview />} />
                            <Route path="sistema/verificar-tabelas" element={<VerificarTabelasPage />} />
                            <Route path="ia/processamento-receitas" element={<ProcessamentoReceitasPage />} />
                            <Route path="ia/previsao-demanda" element={<PrevisaoDemandaPage />} />
                            <Route path="estoque/produtos" element={<ProdutosPage />} />
                            <Route path="estoque/produtos/novo" element={<NovoProdutoPage />} />
                            <Route path="estoque/produtos/editar/:id" element={<EditarProdutoPage />} />
                            <Route path="estoque/produtos/:id" element={<DetalhesProdutoPage />} />
                            
                            {/* Rotas do Sistema de Vendas */}
                            <Route path="vendas" element={<VendasPage />} />
                            <Route path="vendas/pdv" element={<PDVUnificado />} />
                            <Route path="vendas/caixa" element={<CaixaPage />} />
                            <Route path="vendas/fechamento" element={<FechamentoVendasPage />} />
                            <Route path="vendas/historico" element={<HistoricoVendasPage />} />
                            
                            {/* Rotas de Embalagens */}
                            <Route path="estoque/embalagens" element={<EmbalagensListPage />} />
                            <Route path="estoque/embalagens/novo" element={<NovoEmbalagemPage />} />
                            <Route path="estoque/embalagens/editar/:id" element={<EditarEmbalagemPage />} />
                            
                            {/* Rotas Fiscais */}
                            <Route path="fiscal" element={<FiscalOverviewPage />} />
                            <Route path="fiscal/nota-fiscal/:id" element={<DetalhesNotaFiscalPage />} />
                            <Route path="fiscal/diagnostico-xml" element={<DiagnosticoXMLPage />} />
                            
                            {/* Rota do WhatsApp */}
                            <Route path="whatsapp" element={<WhatsAppDashboard />} />
                            
                            {/* Dashboard principal (roteamento automático) */}
                            <Route path="" element={<DashboardRouter />} />
                          </Routes>
                        </ThemeProvider>
                      }
                    />
                  </Route>
                  {/* Páginas de Erro */}
                  <Route path="/acesso-negado" element={<div>Acesso Negado</div>} />
                  <Route path="/404" element={<div>Página não encontrada</div>} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </ChatbotProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </AuthSimpleProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

export default App;
