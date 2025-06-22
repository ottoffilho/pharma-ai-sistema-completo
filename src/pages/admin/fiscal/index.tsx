import { FileText, Upload, Search, TrendingUp, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FiscalOverview() {
  const cards = [
    {
      title: 'Importar Notas Fiscais',
      description: 'Importe XMLs de notas fiscais de entrada',
      icon: Upload,
      href: '/admin/estoque/importacao-nf',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Consultar Notas',
      description: 'Visualize e gerencie notas fiscais importadas',
      icon: Search,
      href: '/admin/fiscal/consultar',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Relatórios Fiscais',
      description: 'Gere relatórios e análises fiscais',
      icon: TrendingUp,
      href: '/admin/fiscal/relatorios',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Configurações',
      description: 'Configure parâmetros fiscais e tributários',
      icon: FileText,
      href: '/admin/fiscal/configuracoes',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Diagnóstico XML',
      description: 'Diagnóstica problemas com downloads de XMLs',
      icon: Wrench,
      href: '/admin/fiscal/diagnostico-xml',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header da Página */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Módulo Fiscal</h1>
          <p className="text-muted-foreground">
            Gerencie notas fiscais, impostos e obrigações tributárias
          </p>
        </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.href} to={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-4`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Seção de Resumo */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Resumo Fiscal</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Notas do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Aguardando implementação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Impostos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <p className="text-xs text-muted-foreground">ICMS, PIS, COFINS</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Notas para processar</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
} 