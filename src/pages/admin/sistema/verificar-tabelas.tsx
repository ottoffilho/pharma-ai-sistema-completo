import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Database, Check, RefreshCw, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function VerificarTabelasPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<'verificando' | 'criando' | 'completo' | 'erro'>('verificando');
  const [progresso, setProgresso] = useState(0);
  const [mensagem, setMensagem] = useState('Verificando tabelas...');
  const [tabelasFaltantes, setTabelasFaltantes] = useState<string[]>([]);
  const [tabelasExistentes, setTabelasExistentes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Lista de tabelas essenciais que devem existir
  const tabelasEssenciais = useMemo(() => [
    'usuarios',
    'perfis_usuario',
    'permissoes',
    'fornecedores',
    'produtos',
    'insumos',
    'lotes_insumos',
    'embalagens',
    'receitas_processadas',
    'ordens_producao',
    'categorias_financeiras',
    'contas_a_pagar',
    'movimentacoes_caixa'
  ], []);

  const verificarTabelas = useCallback(async () => {
    setStatus('verificando');
    setMensagem('Verificando tabelas no banco de dados...');
    setProgresso(0);
    setTabelasFaltantes([]);
    setTabelasExistentes([]);
    
    try {
      const faltantes: string[] = [];
      const existentes: string[] = [];
      
      for (let i = 0; i < tabelasEssenciais.length; i++) {
        const tabela = tabelasEssenciais[i];
        
        try {
          const { data, error } = await supabase
            .from(tabela)
            .select('*')
            .limit(1);
          
          if (error && error.code === 'PGRST116') {
            // Tabela não existe
            faltantes.push(tabela);
          } else {
            // Tabela existe
            existentes.push(tabela);
          }
        } catch (err) {
          console.error(`Erro ao verificar tabela ${tabela}:`, err);
          faltantes.push(tabela);
        }
        
        setProgresso(Math.round((i + 1) / tabelasEssenciais.length * 100));
      }
      
      setTabelasFaltantes(faltantes);
      setTabelasExistentes(existentes);
      
      if (faltantes.length === 0) {
        setMensagem('Todas as tabelas estão presentes no banco de dados!');
        setStatus('completo');
        toast({
          title: "Verificação concluída",
          description: "Todas as tabelas necessárias foram encontradas.",
        });
      } else {
        setMensagem(`Encontradas ${faltantes.length} tabelas faltantes. Use os botões "Criar Tabela" para criá-las individualmente.`);
        setStatus('erro');
        toast({
          title: "Tabelas faltantes encontradas",
          description: `${faltantes.length} tabelas precisam ser criadas.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao verificar tabelas:', error);
      setMensagem('Erro ao verificar tabelas no banco de dados');
      setStatus('erro');
      toast({
        title: "Erro na verificação",
        description: "Ocorreu um erro ao verificar as tabelas.",
        variant: "destructive",
      });
    }
  }, [tabelasEssenciais, toast]);
  
  // Criar tabela específica
  const criarTabela = async (tabela: string) => {
    setIsLoading(true);
    setMensagem(`Criando tabela: ${tabela}...`);
    
    try {
      let sqlCode = '';
      
      // SQL para cada tabela
      if (tabela === 'ordens_producao') {
        sqlCode = `
          CREATE TABLE IF NOT EXISTS public.ordens_producao (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            numero_ordem TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_preparacao', 'em_manipulacao', 'controle_qualidade', 'finalizada', 'cancelada')),
            prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
            receita_id UUID REFERENCES public.receitas_processadas(id),
            usuario_responsavel_id UUID REFERENCES public.usuarios_internos(id),
            farmaceutico_responsavel_id UUID REFERENCES public.usuarios_internos(id),
            observacoes_gerais TEXT,
            data_criacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
            data_finalizacao TIMESTAMP WITH TIME ZONE,
            is_deleted BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Índices
          CREATE INDEX IF NOT EXISTS idx_ordens_producao_status ON public.ordens_producao(status);
          CREATE INDEX IF NOT EXISTS idx_ordens_producao_prioridade ON public.ordens_producao(prioridade);
          CREATE INDEX IF NOT EXISTS idx_ordens_producao_data_criacao ON public.ordens_producao(data_criacao);
          
          -- RLS
          ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
          
          -- Políticas
          CREATE POLICY "Usuários autenticados podem visualizar ordens" 
            ON public.ordens_producao FOR SELECT 
            TO authenticated 
            USING (true);
          
          CREATE POLICY "Usuários autenticados podem inserir ordens" 
            ON public.ordens_producao FOR INSERT 
            TO authenticated 
            WITH CHECK (true);
          
          CREATE POLICY "Usuários autenticados podem atualizar ordens" 
            ON public.ordens_producao FOR UPDATE 
            TO authenticated 
            USING (true);
        `;
      } else if (tabela === 'usuarios_internos') {
        sqlCode = `
          CREATE TABLE IF NOT EXISTS public.usuarios_internos (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome_completo TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            cargo_perfil TEXT NOT NULL,
            data_admissao TIMESTAMP WITH TIME ZONE DEFAULT now(),
            telefone TEXT,
            endereco TEXT,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- RLS
          ALTER TABLE public.usuarios_internos ENABLE ROW LEVEL SECURITY;
          
          -- Políticas
          CREATE POLICY "Usuários autenticados podem visualizar" 
            ON public.usuarios_internos FOR SELECT 
            TO authenticated 
            USING (true);
        `;
      } else if (tabela === 'receitas_processadas') {
        sqlCode = `
          CREATE TABLE IF NOT EXISTS public.receitas_processadas (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            patient_name TEXT NOT NULL,
            medications JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- RLS
          ALTER TABLE public.receitas_processadas ENABLE ROW LEVEL SECURITY;
          
          -- Políticas
          CREATE POLICY "Usuários autenticados podem visualizar receitas" 
            ON public.receitas_processadas FOR SELECT 
            TO authenticated 
            USING (true);
        `;
      } else {
        setMensagem(`SQL não definido para a tabela ${tabela}`);
        toast({
          title: "Configuração não encontrada",
          description: `Não há configuração SQL para a tabela ${tabela}.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Executar SQL
      try {
        // Primeiro tenta usar a função exec_sql
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlCode });
        
        if (error) {
          console.log('Erro na função RPC, tentando executar via API REST');
          
          // Se falhar, tenta executar via SQL no painel admin do Supabase
          toast({
            title: "Ação manual necessária",
            description: "Copie o SQL gerado e execute no painel do Supabase SQL Editor",
            variant: "default",
          });
          
          // Copiar para área de transferência
          await navigator.clipboard.writeText(sqlCode);
          toast({
            title: "SQL copiado para a área de transferência",
            description: "Cole o código no SQL Editor do Supabase",
          });
          
          // Exibir o SQL para o usuário
          setMensagem(`Para criar a tabela ${tabela} manualmente, use o SQL gerado (já copiado para sua área de transferência).`);
        } else {
          // Sucesso
          toast({
            title: "Tabela criada",
            description: `A tabela ${tabela} foi criada com sucesso.`,
            variant: "default",
          });
          
          // Atualizar listas de tabelas
          setTabelasFaltantes(prev => prev.filter(t => t !== tabela));
          setTabelasExistentes(prev => [...prev, tabela]);
        }
      } catch (error) {
        console.error(`Erro ao criar tabela ${tabela}:`, error);
        setMensagem(`Erro ao criar tabela ${tabela}`);
        toast({
          title: "Erro ao criar tabela",
          description: `Ocorreu um erro ao criar a tabela ${tabela}.`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Iniciar verificação ao montar o componente
  useEffect(() => {
    verificarTabelas();
  }, [verificarTabelas]);
  
  return (
    <AdminLayout>
      <div className="container px-6 py-8">
        <Card className="shadow-md">
          <CardHeader className={status === 'erro' ? 'bg-red-50 dark:bg-red-900/20' : status === 'completo' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}>
            <div className="flex items-center gap-2">
              {status === 'erro' ? (
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : status === 'completo' ? (
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
              <CardTitle>Verificação de Tabelas do Sistema</CardTitle>
            </div>
            <CardDescription>
              {status === 'erro' ? 'Erro ao verificar ou criar tabelas' : 
               status === 'completo' ? 'Tabelas verificadas com sucesso' : 
               'Verificando e gerenciando tabelas do banco de dados'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-6">
              <Alert variant={status === 'erro' ? "destructive" : "default"} className="mb-4">
                <AlertTitle>
                  {status === 'verificando' ? 'Verificando tabelas' : 
                   status === 'criando' ? 'Criando tabelas' :
                   status === 'completo' ? 'Operação concluída' : 'Erro'}
                </AlertTitle>
                <AlertDescription>
                  {mensagem}
                </AlertDescription>
              </Alert>
              
              {status === 'verificando' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Progresso da verificação</p>
                  <Progress value={progresso} className="h-2" />
                </div>
              )}
              
              {/* Tabelas faltantes */}
              {tabelasFaltantes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Tabelas Faltantes</h3>
                  <Table>
                    <TableCaption>Lista de tabelas que precisam ser criadas</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome da Tabela</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabelasFaltantes.map((tabela) => (
                        <TableRow key={tabela}>
                          <TableCell className="font-medium">{tabela}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">Não Encontrada</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => criarTabela(tabela)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Criando...
                                </>
                              ) : (
                                <>Criar Tabela</>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Tabelas existentes */}
              {tabelasExistentes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Tabelas Existentes</h3>
                  <Table>
                    <TableCaption>Lista de tabelas encontradas no banco de dados</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome da Tabela</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabelasExistentes.map((tabela) => (
                        <TableRow key={tabela}>
                          <TableCell className="font-medium">{tabela}</TableCell>
                          <TableCell>
                            <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">Encontrada</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-6">
            <Button 
              variant="outline" 
              onClick={verificarTabelas}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Novamente
                </>
              )}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Total: {tabelasEssenciais.length} | 
              Encontradas: {tabelasExistentes.length} | 
              Faltantes: {tabelasFaltantes.length}
            </div>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
} 