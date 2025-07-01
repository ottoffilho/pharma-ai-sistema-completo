import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  FileText, 
  Truck, 
  Calculator, 
  Calendar, 
  Building2, 
  Hash, 
  Download, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Receipt,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  BarChart3,
  Shield,
  Loader2,
  AlertTriangle,
  FileCheck,
  History
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { NotaFiscalCompleta, ItemNotaFiscalCompleto } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { NotaFiscalHeader } from '@/components/notaFiscal/NotaFiscalHeader';
import { NotaFiscalCards } from '@/components/notaFiscal/NotaFiscalCards';
import { baixarXMLNotaFiscal, visualizarDANFE } from '@/services/notaFiscal';

export default function DetalhesNotaFiscal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notaFiscal, setNotaFiscal] = useState<NotaFiscalCompleta | null>(null);

  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id) {
      carregarNotaFiscal();
    }
  }, [id]);

  const carregarNotaFiscal = async () => {
    try {
      setLoading(true);

      // Buscar nota fiscal com fornecedor
      const { data: nfData, error: nfError } = await supabase
        .from('notas_fiscais')
        .select(`
          *,
          fornecedor:fornecedores(*)
        `)
        .eq('id', id)
        .single();

      if (nfError) throw nfError;

      // Buscar itens da nota fiscal - usando select simples
      const { data: itensData, error: itensError } = await supabase
        .from('itens_nota_fiscal')
        .select('*')
        .eq('nota_fiscal_id', id)
        .order('numero_item');

      if (itensError) throw itensError;

      // Buscar produtos relacionados aos itens
      const produtoIds = itensData?.map(item => item.produto_id).filter(Boolean) || [];
      let produtosData = [];
      
      if (produtoIds.length > 0) {
        const { data: produtos, error: produtosError } = await supabase
          .from('produtos')
          .select('*')
          .in('id', produtoIds);
        
        if (!produtosError) {
          produtosData = produtos || [];
        }
      }

      // Combinar itens com produtos
      const itensCompletos = itensData?.map(item => ({
        ...item,
        produto: produtosData.find(p => p.id === item.produto_id) || null
      })) || [];

      setNotaFiscal({
        ...nfData,
        itens: itensCompletos
      } as NotaFiscalCompleta);
    } catch (error) {
      console.error('Erro ao carregar nota fiscal:', error);
      toast.error('Erro ao carregar dados da nota fiscal');
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarXML = async () => {
    if (!notaFiscal) return;
    
    try {
      await baixarXMLNotaFiscal(notaFiscal.id);
      toast.success('XML baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao baixar XML');
    }
  };

  const handleVisualizarDANFE = async () => {
    if (!notaFiscal) return;
    
    try {
      await visualizarDANFE(notaFiscal.id);
      toast.success('DANFE aberto em nova janela');
    } catch (error) {
      console.error('Erro ao visualizar DANFE:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao visualizar DANFE');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <FileText className="h-16 w-16 text-primary/20" />
              </div>
              <FileText className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Carregando informações da nota fiscal...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state - nota não encontrada
  if (!notaFiscal) {
    return (
      <AdminLayout>
        <div className="w-full py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 mb-6">
              <AlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Nota Fiscal não encontrada
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              A nota fiscal que você está procurando não existe ou foi removida do sistema.
            </p>
            <Button
              onClick={() => navigate('/admin/estoque/importacao-nf')}
              className="gap-2 bg-gradient-to-r from-orange-500 to-red-500"
            >
              Voltar para Importação
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const impostosTotais = (notaFiscal.valor_icms || 0) + 
                        (notaFiscal.valor_ipi || 0) + 
                        (notaFiscal.valor_pis || 0) + 
                        (notaFiscal.valor_cofins || 0);

  const percentualImpostos = notaFiscal.valor_total_nota > 0 
    ? (impostosTotais / notaFiscal.valor_total_nota) * 100 
    : 0;

  return (
    <AdminLayout>
      <div className="w-full py-6 space-y-8">
        {/* Header Hero Section */}
        <NotaFiscalHeader 
          notaFiscal={notaFiscal}
        />

        {/* Métricas Cards */}
        <NotaFiscalCards notaFiscal={notaFiscal} />

        {/* Tabs de Conteúdo com Estilo Moderno */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="itens" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <Package className="h-4 w-4" />
              Itens
            </TabsTrigger>
            <TabsTrigger 
              value="documentos" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger 
              value="historico" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Aba Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dados Gerais e Fornecedor */}
              <div className="lg:col-span-2 space-y-6">
                {/* Dados Gerais */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Dados Gerais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <label className="text-sm font-medium text-muted-foreground">Número</label>
                        <p className="font-semibold text-lg mt-1">{notaFiscal.numero_nf}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <label className="text-sm font-medium text-muted-foreground">Série</label>
                        <p className="font-semibold text-lg mt-1">{notaFiscal.serie}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <label className="text-sm font-medium text-muted-foreground">Data de Emissão</label>
                      </div>
                      <p className="font-medium mt-1">
                        {format(new Date(notaFiscal.data_emissao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Fornecedor */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30">
                        <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Dados do Fornecedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                        <p className="font-medium">{notaFiscal.fornecedor.razao_social}</p>
                        {notaFiscal.fornecedor.nome_fantasia && (
                          <p className="text-sm text-muted-foreground mt-1">{notaFiscal.fornecedor.nome_fantasia}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Hash className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                        <p className="font-mono font-medium">{notaFiscal.fornecedor.cnpj}</p>
                      </div>
                    </div>

                    {(notaFiscal.fornecedor.logradouro || notaFiscal.fornecedor.cidade) && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                          <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                          <p className="font-medium">
                            {notaFiscal.fornecedor.logradouro}, {notaFiscal.fornecedor.numero}
                            {notaFiscal.fornecedor.complemento && ` - ${notaFiscal.fornecedor.complemento}`}
                          </p>
                          <p className="text-sm">
                            {notaFiscal.fornecedor.bairro} - {notaFiscal.fornecedor.cidade}/{notaFiscal.fornecedor.uf}
                          </p>
                          <p className="text-sm">CEP: {notaFiscal.fornecedor.cep}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Card de Impostos */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Resumo de Impostos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {notaFiscal.valor_icms && notaFiscal.valor_icms > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">ICMS</span>
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                              {formatCurrency(notaFiscal.valor_icms)}
                            </Badge>
                          </div>
                          <Progress value={(notaFiscal.valor_icms / impostosTotais) * 100} className="h-2" />
                        </div>
                      )}
                      
                      {notaFiscal.valor_ipi && notaFiscal.valor_ipi > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">IPI</span>
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                              {formatCurrency(notaFiscal.valor_ipi)}
                            </Badge>
                          </div>
                          <Progress value={(notaFiscal.valor_ipi / impostosTotais) * 100} className="h-2" />
                        </div>
                      )}
                      
                      {notaFiscal.valor_pis && notaFiscal.valor_pis > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">PIS</span>
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
                              {formatCurrency(notaFiscal.valor_pis)}
                            </Badge>
                          </div>
                          <Progress value={(notaFiscal.valor_pis / impostosTotais) * 100} className="h-2" />
                        </div>
                      )}
                      
                      {notaFiscal.valor_cofins && notaFiscal.valor_cofins > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">COFINS</span>
                            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0">
                              {formatCurrency(notaFiscal.valor_cofins)}
                            </Badge>
                          </div>
                          <Progress value={(notaFiscal.valor_cofins / impostosTotais) * 100} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total de Impostos</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(impostosTotais)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPercentage(percentualImpostos)} do valor total
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Transporte */}
                {notaFiscal.transportadora_nome && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Transporte
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Transportadora</p>
                          <p className="font-medium">{notaFiscal.transportadora_nome}</p>
                        </div>
                        {notaFiscal.transportadora_cnpj && (
                          <div>
                            <p className="text-sm text-muted-foreground">CNPJ</p>
                            <p className="font-mono text-sm">{notaFiscal.transportadora_cnpj}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Modalidade</p>
                          <p className="text-sm">
                            {notaFiscal.modalidade_frete === 0 ? 'Por conta do emitente' : 'Por conta do destinatário'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Aba Itens */}
          <TabsContent value="itens" className="space-y-6 mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30">
                    <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Produtos da Nota Fiscal
                </CardTitle>
                <CardDescription>
                  Lista detalhada de todos os produtos incluídos nesta nota
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>NCM</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Valor Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notaFiscal.itens.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.numero_item}</TableCell>
                          <TableCell className="font-mono text-sm">{item.codigo_produto}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.descricao_produto}</p>
                              {item.produto && (
                                <p className="text-sm text-muted-foreground">
                                  Produto cadastrado: {item.produto.nome}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.ncm}</TableCell>
                          <TableCell className="text-right">
                            {item.quantidade_comercial} {item.unidade_comercial}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.valor_unitario_comercial)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.valor_total_produto)}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.produto_criado ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-xs">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Processado
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 text-xs">
                                <Clock className="mr-1 h-3 w-3" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Resumo dos Valores */}
                <div className="mt-6 space-y-2">
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Subtotal Produtos</span>
                    <span className="font-medium">{formatCurrency(notaFiscal.valor_produtos)}</span>
                  </div>
                  {notaFiscal.valor_frete > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Frete</span>
                      <span className="font-medium">{formatCurrency(notaFiscal.valor_frete)}</span>
                    </div>
                  )}
                  {notaFiscal.valor_seguro > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Seguro</span>
                      <span className="font-medium">{formatCurrency(notaFiscal.valor_seguro)}</span>
                    </div>
                  )}
                  {notaFiscal.valor_desconto > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Desconto</span>
                      <span className="font-medium text-red-600">-{formatCurrency(notaFiscal.valor_desconto)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-lg font-semibold">Total da Nota</span>
                    <span className="text-lg font-bold">{formatCurrency(notaFiscal.valor_total_nota)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Documentos */}
          <TabsContent value="documentos" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      XML da Nota Fiscal
                    </CardTitle>
                    <Download className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Arquivo XML original da nota fiscal eletrônica
                  </p>
                  <Button className="w-full" variant="outline" onClick={handleBaixarXML}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar XML
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                        <FileCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      DANFE
                    </CardTitle>
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Documento Auxiliar da Nota Fiscal Eletrônica
                  </p>
                  <Button className="w-full" variant="outline" onClick={handleVisualizarDANFE}>
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar DANFE
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Histórico */}
          <TabsContent value="historico" className="space-y-6 mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                    <History className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  Linha do Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">Nota Fiscal Recebida</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(notaFiscal.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  {notaFiscal.status === 'PROCESSADA' && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">Processada com Sucesso</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notaFiscal.updated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notaFiscal.itens.length} produtos importados
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {notaFiscal.data_saida_entrada && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Entrada no Estoque</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notaFiscal.data_saida_entrada), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

                 {/* Footer com informações adicionais */}
         <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
           <div className="flex items-center gap-2">
             <FileText className="h-4 w-4" />
             <span>ID: {notaFiscal.id}</span>
           </div>
           <div className="h-4 w-px bg-border" />
           <div className="flex items-center gap-2">
             <CheckCircle2 className="h-4 w-4 text-emerald-500" />
             <span>Última atualização: {format(new Date(notaFiscal.updated_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
           </div>
         </div>
      </div>
    </AdminLayout>
  );
} 