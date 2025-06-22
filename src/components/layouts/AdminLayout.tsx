import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronsLeft, 
  ChevronDown,
  Home, 
  LayoutDashboard, 
  ListFilter, 
  Package, 
  PanelLeft, 
  PanelLeftClose,
  Users, 
  FileText, 
  Box,
  BadgePercent,
  DollarSign,
  PieChart,
  Receipt,
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  BarChart3,
  Monitor,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  RefreshCw,
  ShoppingCart,
  Stethoscope,
  Factory,
  Building2,
  CreditCard,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
import { AdminHeader } from '@/components/layouts/AdminHeader';
import AdminChatbotWidget from '@/components/chatbot/AdminChatbotWidget';
import { useResizeObserver, useWindowSize } from '@/hooks/use-resize-observer';

// Importando as imagens do logo
import logoImagem from '@/assets/logo/pharma-image2.png';
import logoTexto from '@/assets/logo/pharma-texto2.png';
import logoHorizontal from '@/assets/logo/phama-horizon.png';
import logoIcon from '@/assets/logo/Sem nome (500 x 500 px).png';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarDropdown,
  SidebarProvider
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Definição dos tipos para melhor organização
interface NavigationLink {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  badge?: string | number;
  submenu?: {
    title: string;
    href: string;
    description?: string;
    badge?: string | number;
  }[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Recuperar estado salvo do localStorage
    const saved = localStorage.getItem('pharma-sidebar-state');
    return saved ? JSON.parse(saved) : true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mainContentRef, mainContentSize] = useResizeObserver<HTMLDivElement>();
  const [databaseError, setDatabaseError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const windowSize = useWindowSize();
  
  const { usuario, logout, carregando } = useAuthSimple();
  const isProprietario = usuario?.usuario?.perfil?.tipo === 'PROPRIETARIO';

  // Detectar se é mobile baseado no tamanho da janela
  const isMobile = windowSize.width < 768;

  // Salvar estado do sidebar no localStorage
  useEffect(() => {
    localStorage.setItem('pharma-sidebar-state', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // Verificar se as tabelas essenciais existem - REMOVIDO para evitar erro 500
  // Não é necessário verificar tabelas aqui pois o sistema de autenticação já garante
  // que o usuário tem acesso ao banco de dados quando chega no AdminLayout
  useEffect(() => {
    // Verificação removida para evitar consultas não autenticadas que causam erro 500
    // O sistema de autenticação já valida o acesso ao banco antes de chegar aqui
    setDatabaseError(false);
  }, [usuario, carregando]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout. Redirecionando...",
        variant: "destructive",
      });
      // Forçar redirecionamento mesmo com erro
      window.location.href = '/login';
    }
  };

  // Navigation links antes de filtragem por perfil
  const baseNavLinks: NavigationLink[] = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5 text-blue-600" />,
      description: 'Visão geral do sistema',
    },
    {
      title: 'Atendimento',
      href: '/admin/pedidos',
      icon: <Stethoscope className="h-5 w-5 text-emerald-600" />,
      description: 'Gestão de atendimento e receitas',
    },
    {
      title: 'Estoque',
      href: '/admin/estoque',
      icon: <Box className="h-5 w-5 text-orange-600" />,
      description: 'Controle de produtos e lotes',
    },
    {
      title: 'Produção',
      href: '/admin/producao/overview',
      icon: <Factory className="h-5 w-5 text-purple-600" />,
      description: 'Gestão da produção farmacêutica',
    },
    {
      title: 'Vendas',
      href: '/admin/vendas',
      icon: <ShoppingCart className="h-5 w-5 text-green-700" />,
      description: 'Ponto de venda e histórico',
    },
    {
      title: 'Clientes',
      href: '/admin/clientes',
      icon: <Users className="h-5 w-5 text-blue-700" />,
      description: 'Gestão de clientes',
    },
    {
      title: 'Financeiro',
      href: '/admin/financeiro',
      icon: <CreditCard className="h-5 w-5 text-amber-600" />,
      description: 'Gestão financeira',
    },
    {
      title: 'Fiscal',
      href: '/admin/fiscal',
      icon: <FileText className="h-5 w-5 text-red-600" />,
      description: 'Notas fiscais e impostos',
    },
    {
      title: 'Inteligência Artificial',
      href: '/admin/ia',
      icon: <Brain className="h-5 w-5 text-pink-600" />,
      description: 'Recursos de IA do sistema',
    },
    {
      title: 'Cadastros',
      href: '/admin/cadastros',
      icon: <Building2 className="h-5 w-5 text-slate-600" />,
      description: 'Dados mestres do sistema',
    },
    {
      title: 'Usuários',
      href: '/admin/usuarios',
      icon: <Shield className="h-5 w-5 text-indigo-600" />,
      description: 'Gestão de usuários e permissões',
    },
    {
      title: 'Configurações',
      href: '/admin/configuracoes',
      icon: <Settings className="h-5 w-5 text-gray-600" />,
      description: 'Configurações gerais do sistema',
    },
  ];

  // Filtragem por perfil: manipulador vê apenas Estoque e Produção
  const navLinks: NavigationLink[] = React.useMemo(() => {
    if (usuario?.usuario.perfil?.tipo === 'MANIPULADOR') {
      const allowedTitles = new Set(['Estoque', 'Produção']);
      return baseNavLinks.filter(link => allowedTitles.has(link.title));
    }
    return baseNavLinks;
  }, [usuario]);

  // Função para renderizar item de menu com tooltip no modo colapsado
  const renderMenuItemWithTooltip = (link: NavigationLink, index: number) => {
    const isActive = link.href === '/admin'
      ? location.pathname === '/admin'
      : (location.pathname === link.href || location.pathname.startsWith(link.href));

    const menuButton = (
      <SidebarMenuButton 
        asChild
        isActive={isActive}
        className="sidebar-item sidebar-item-hover sidebar-menu-button"
        aria-current={isActive ? "page" : undefined}
      >
        <Link to={link.href} className="flex items-center gap-3">
          <span className="flex-shrink-0">{link.icon}</span>
          {isSidebarOpen && (
            <>
              <span className="flex-1 truncate">{link.title}</span>
              {link.badge && (
                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full sidebar-badge">
                  {link.badge}
                </span>
              )}
            </>
          )}
        </Link>
      </SidebarMenuButton>
    );

    // Se sidebar está colapsado, envolver com tooltip
    if (!isSidebarOpen) {
      return (
        <SidebarMenuItem key={index}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {menuButton}
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2 sidebar-tooltip">
                <div className="text-sm font-medium">{link.title}</div>
                {link.description && (
                  <div className="text-xs text-muted-foreground mt-1">{link.description}</div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={index}>
        {menuButton}
      </SidebarMenuItem>
    );
  };

  // Se encontrou erro no banco de dados, mostrar alerta
  if (databaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-[450px] shadow-lg">
          <CardHeader className="bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <CardTitle>Problema no Sistema</CardTitle>
            </div>
            <CardDescription>
              Foi detectado um problema no banco de dados do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro de Conexão</AlertTitle>
              <AlertDescription>
                {errorMessage || 'Tabelas necessárias não encontradas no banco de dados.'}
              </AlertDescription>
            </Alert>
            
            <p className="text-sm text-gray-600 mb-4">
              O sistema não consegue acessar as tabelas necessárias para o funcionamento
              correto. Isso pode ser causado por uma manutenção no banco de dados
              ou por problemas na conexão.
            </p>
            
            <div className="p-4 bg-amber-50 rounded-md border border-amber-200 mb-4">
              <h3 className="font-medium text-amber-800 mb-1">Instruções para resolver:</h3>
              <ol className="text-sm text-amber-700 space-y-1 pl-4 list-decimal">
                <li>Faça logout utilizando o botão abaixo</li>
                <li>Limpe o cache do navegador (Ctrl+F5)</li> 
                <li>Tente acessar novamente o sistema</li>
                <li>Se o problema persistir, entre em contato com o suporte</li>
              </ol>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <a 
              href="/login"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair do Sistema
            </a>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <div 
        className="min-h-screen flex relative w-full overflow-hidden"
        style={{ 
          "--current-sidebar-width": isSidebarOpen ? "16rem" : "4rem" 
        } as React.CSSProperties}
      >
        {/* Botão de expandir/recolher FORA do sidebar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Recolher sidebar" : "Expandir sidebar"}
          title={isSidebarOpen ? "Recolher sidebar" : "Expandir sidebar"}
          style={{
            position: 'fixed',
            top: '1rem',
            left: 'var(--current-sidebar-width)',
            zIndex: 999,
          }}
          className="border-0 shadow-none hover:bg-accent/50 focus:outline-none focus:ring-0"
        >
          {isSidebarOpen ? (
            <ChevronsLeft className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          )}
        </Button>

        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:block border-r bg-sidebar backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 transition-all duration-300 ease-in-out fixed top-0 h-full z-10 shadow-sm sidebar-glass",
            isSidebarOpen ? "w-64" : "w-16"
          )}
        >
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between border-b h-16 bg-sidebar user-section relative">
            <div className={cn("flex items-center logo-transition", !isSidebarOpen && "justify-center w-full")}>
              {isSidebarOpen ? (
                <Link to="/admin" className="flex items-center transition-opacity hover:opacity-80 logo-transition">
                  <img src={logoHorizontal} alt="Pharma.AI" className="h-10" />
                </Link>
              ) : (
                <Link to="/admin" className="transition-transform hover:scale-105 logo-transition">
                  <img src={logoIcon} alt="Logo" className="h-10 w-10 object-contain" />
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Links - VERSÃO DESKTOP */}
          <nav 
            className="flex-1 overflow-y-auto py-4 h-[calc(100%-8rem)] scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent"
            role="navigation"
            aria-label="Menu principal"
          >
            <SidebarMenu className="px-2 space-y-1">
              {navLinks.map((link, index) => renderMenuItemWithTooltip(link, index))}
            </SidebarMenu>
          </nav>

          {/* Separator */}
          <div className="sidebar-separator h-px mx-4"></div>

          {/* User Section */}
          <div className="border-t p-4 absolute bottom-0 w-full bg-sidebar user-section">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 hover:bg-sidebar-accent transition-colors rounded-md sidebar-item-hover",
                    !isSidebarOpen && "justify-center px-0"
                  )}
                  aria-label="Menu do usuário"
                >
                  <Avatar className="h-8 w-8 border-2 border-sidebar-border shadow-sm">
                    <AvatarImage src="/avatar-placeholder.png" alt={usuario?.usuario?.nome} />
                    <AvatarFallback className="text-sm font-medium">
                      {usuario?.usuario?.nome?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isSidebarOpen && (
                    <div className="flex flex-col items-start text-left flex-1 min-w-0">
                      <span className="text-sm font-medium truncate max-w-full">
                        {usuario?.usuario?.nome}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-full">
                        {usuario?.usuario?.perfil?.nome}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                <DropdownMenuItem asChild>
                  <Link to="/admin/perfil" className="flex items-center gap-2 cursor-pointer sidebar-item-hover">
                    <User className="h-4 w-4" />
                    <span>Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                {isProprietario && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/configuracoes" className="flex items-center gap-2 cursor-pointer sidebar-item-hover">
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="sidebar-separator" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer sidebar-item-hover"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-[300px] sm:max-w-sm p-0 bg-sidebar mobile-sidebar">
            <SheetHeader className="p-4 border-b bg-sidebar">
              <div className="flex items-center">
                <img src={logoHorizontal} alt="Pharma.AI" className="h-10 logo-transition" />
              </div>
            </SheetHeader>
            <nav 
              className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent"
              role="navigation"
              aria-label="Menu principal móvel"
            >
              <SidebarMenu className="px-4 space-y-1">
                {navLinks.map((link, index) => 
                  link.submenu ? (
                    <SidebarDropdown 
                      key={index}
                      icon={link.icon}
                      label={link.title}
                      isActive={link.submenu.some(sublink => location.pathname === sublink.href)}
                      href={link.href}
                      className="sidebar-item"
                    >
                      {link.submenu.map((sublink, subIndex) => (
                        <SidebarMenuSubButton
                          key={subIndex}
                          asChild
                          isActive={location.pathname === sublink.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="sidebar-item sidebar-item-hover"
                        >
                          <Link to={sublink.href} title={sublink.description}>
                            {sublink.title}
                            {sublink.badge && (
                              <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full sidebar-badge">
                                {sublink.badge}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuSubButton>
                      ))}
                    </SidebarDropdown>
                  ) : (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton 
                        asChild
                        isActive={link.href === '/admin' ? location.pathname === '/admin' : (location.pathname === link.href || location.pathname.startsWith(link.href))}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="sidebar-item sidebar-item-hover sidebar-menu-button"
                        aria-current={(link.href === '/admin' ? location.pathname === '/admin' : (location.pathname === link.href || location.pathname.startsWith(link.href))) ? "page" : undefined}
                      >
                        <Link to={link.href} className="flex items-center gap-3" title={link.description}>
                          <span className="flex-shrink-0">{link.icon}</span>
                          <span className="flex-1 truncate">{link.title}</span>
                          {link.badge && (
                            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full sidebar-badge">
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                )}
              </SidebarMenu>
            </nav>
            
            {/* Separator */}
            <div className="sidebar-separator h-px mx-4"></div>
            
            {/* User Section Mobile */}
            <div className="border-t p-4 bg-sidebar user-section">
              <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-sidebar-accent/50">
                <Avatar className="h-10 w-10 border-2 border-sidebar-border shadow-sm">
                  <AvatarImage src="/avatar-placeholder.png" alt={usuario?.usuario?.nome} />
                  <AvatarFallback className="text-sm font-medium">
                    {usuario?.usuario?.nome?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{usuario?.usuario?.nome}</span>
                  <span className="text-xs text-muted-foreground truncate">{usuario?.usuario?.perfil?.nome}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button variant="outline" asChild className="justify-start sidebar-item-hover">
                  <Link 
                    to="/admin/perfil" 
                    className="flex items-center gap-2" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Meu Perfil</span>
                  </Link>
                </Button>
                {isProprietario && (
                  <Button variant="outline" asChild className="justify-start sidebar-item-hover">
                    <Link 
                      to="/admin/configuracoes" 
                      className="flex items-center gap-2" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  onClick={handleLogout} 
                  className="justify-start sidebar-item-hover"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sair</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div 
          ref={mainContentRef}
          className="flex-1 flex flex-col h-screen transition-all duration-300 ease-in-out"
          style={{ 
            marginLeft: !isMobile ? "var(--current-sidebar-width)" : "0",
            width: !isMobile ? "calc(100% - var(--current-sidebar-width))" : "100%"
          }}
        >
          {/* Top Bar */}
          <AdminHeader 
            onMenuClick={() => setIsMobileMenuOpen(true)}
            user={usuario?.usuario || null}
            onLogout={handleLogout}
          />
          
          {/* Main Content Area - Única área com scroll */}
          <main className="flex-1 w-full overflow-y-auto bg-background/50">
            <div className="w-full max-w-none py-6 px-4 md:px-6 pb-16">
              {children}
            </div>
          </main>
          
          {/* Chatbot */}
          <AdminChatbotWidget />
        </div>
      </div>
    </SidebarProvider>
  );
}
