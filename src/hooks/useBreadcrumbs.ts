import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

const routeLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/ia': 'Inteligência Artificial',
  '/admin/ia/processamento-receitas': 'Processamento de Receitas',
  '/admin/ia/previsao-demanda': 'Previsão de Demanda',
  '/admin/ia/otimizacao-compras': 'Otimização de Compras',
  '/admin/ia/analise-clientes': 'Análise de Clientes',
  '/admin/ia/monitoramento': 'Monitoramento IA',
  '/admin/pedidos': 'Pedidos',
  '/admin/pedidos/nova-receita': 'Nova Receita',
  '/admin/estoque': 'Estoque',
  '/admin/estoque/insumos': 'Insumos',
  '/admin/estoque/insumos/novo': 'Novo Insumo',
  '/admin/estoque/embalagens': 'Embalagens',
  '/admin/estoque/embalagens/novo': 'Nova Embalagem',
  '/admin/estoque/lotes/novo': 'Novo Lote',
  '/admin/financeiro': 'Financeiro',
  '/admin/financeiro/categorias': 'Categorias',
  '/admin/financeiro/categorias/novo': 'Nova Categoria',
  '/admin/financeiro/caixa': 'Fluxo de Caixa',
  '/admin/financeiro/contas-a-pagar': 'Contas a Pagar',
  '/admin/financeiro/contas-a-pagar/novo': 'Nova Conta a Pagar',
  '/admin/usuarios': 'Usuários',
  '/admin/usuarios/novo': 'Novo Usuário',
  '/admin/perfil': 'Meu Perfil',
  '/admin/configuracoes': 'Configurações',
  '/admin/cadastros': 'Cadastros',
  '/admin/cadastros/fornecedores': 'Fornecedores',
  '/admin/cadastros/fornecedores/novo': 'Novo Fornecedor',
  // Clientes
  '/admin/clientes': 'Clientes',
  '/admin/clientes/novo': 'Novo Cliente',
};

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Sempre adiciona o Dashboard como primeiro item
    if (pathSegments.length > 0 && pathSegments[0] === 'admin') {
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/admin',
        isCurrentPage: location.pathname === '/admin'
      });

      // Constrói o caminho progressivamente
      let currentPath = '/admin';
      
      for (let i = 1; i < pathSegments.length; i++) {
        currentPath += `/${pathSegments[i]}`;
        
        // Pula segmentos que são IDs (números ou UUIDs)
        if (/^[0-9a-f-]+$/i.test(pathSegments[i])) {
          continue;
        }

        const label = routeLabels[currentPath];
        if (label) {
          const isCurrentPage = currentPath === location.pathname;
          breadcrumbs.push({
            label,
            href: isCurrentPage ? undefined : currentPath,
            isCurrentPage
          });
        }
      }

      // Se a página atual não foi encontrada nas rotas conhecidas, adiciona um breadcrumb genérico
      if (breadcrumbs.length > 0 && !breadcrumbs[breadcrumbs.length - 1].isCurrentPage) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment === 'editar') {
          breadcrumbs.push({
            label: 'Editar',
            isCurrentPage: true
          });
        } else if (lastSegment === 'detalhes') {
          breadcrumbs.push({
            label: 'Detalhes',
            isCurrentPage: true
          });
        }
      }
    }

    return breadcrumbs;
  }, [location.pathname]);
} 