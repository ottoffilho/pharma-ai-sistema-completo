import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ShoppingCart, FlaskConical, Box } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardProps } from '../types';

/**
 * Dashboard mínimo – sem gráficos, animações ou queries pesadas.
 * Foca apenas em métricas essenciais e ações rápidas.
 */
const DashboardMinimo: React.FC<DashboardProps> = ({ usuario }) => {
  /* ========================================================================
   * Consultas extremamente leves – apenas contagem de registros                
   * ====================================================================== */
  const { data: medicamentos = 0 } = useQuery({
    queryKey: ['count_medicamentos'],
    queryFn: async () => {
      const { count } = await supabase
        .from('produtos')
        .select('*', { head: true, count: 'exact' })
        .eq('tipo', 'MEDICAMENTO')
        .eq('ativo', true)
        .eq('is_deleted', false);
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: pedidos = 0 } = useQuery({
    queryKey: ['count_pedidos'],
    queryFn: async () => {
      const { count } = await supabase
        .from('pedidos')
        .select('*', { head: true, count: 'exact' });
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: insumos = 0 } = useQuery({
    queryKey: ['count_insumos'],
    queryFn: async () => {
      const { count } = await supabase
        .from('produtos')
        .select('*', { head: true, count: 'exact' })
        .eq('tipo', 'INSUMO')
        .eq('ativo', true)
        .eq('is_deleted', false);
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: embalagens = 0 } = useQuery({
    queryKey: ['count_embalagens'],
    queryFn: async () => {
      const { count } = await supabase
        .from('produtos')
        .select('*', { head: true, count: 'exact' })
        .eq('tipo', 'EMBALAGEM')
        .eq('ativo', true)
        .eq('is_deleted', false);
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const metrics = useMemo(() => [
    { label: 'Medicamentos', value: medicamentos, icon: FileText, color: 'text-green-600' },
    { label: 'Pedidos', value: pedidos, icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Insumos', value: insumos, icon: FlaskConical, color: 'text-orange-600' },
    { label: 'Embalagens', value: embalagens, icon: Box, color: 'text-purple-600' },
  ], [medicamentos, pedidos, insumos, embalagens]);

  return (
    <AdminLayout>
      <div className="container-section py-8 space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Dashboard Rápido</h1>
          <p className="text-muted-foreground">Bem-vindo{usuario?.nome ? `, ${usuario.nome}` : ''}! Aqui estão as métricas principais.</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ações rápidas */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            Ações Rápidas
            <Badge variant="outline">Atalho</Badge>
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/pedidos/nova-receita">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Nova Receita
              </Button>
            </Link>
            <Link to="/admin/pedidos/listar">
              <Button variant="outline" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Pedidos
              </Button>
            </Link>
            <Link to="/admin/estoque/insumos">
              <Button variant="outline" className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" /> Insumos
              </Button>
            </Link>
            <Link to="/admin/estoque/produtos">
              <Button variant="outline" className="flex items-center gap-2">
                <Box className="h-4 w-4" /> Produtos
              </Button>
            </Link>
          </div>
        </div>

        {/* Bloco de histórico removido após teste de desempenho */}
      </div>
    </AdminLayout>
  );
};

export default DashboardMinimo; 