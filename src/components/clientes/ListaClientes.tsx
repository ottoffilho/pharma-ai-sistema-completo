// =====================================================
// LISTA DE CLIENTES - TABELA COM FILTROS E AÇÕES
// =====================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Eye,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Star,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatarDocumento, formatarTelefone } from '@/lib/utils/validacao';
import { useClientes, useDesativarCliente, useReativarCliente } from '@/hooks/useClientes';
import type { ClienteFilters } from '@/types/cliente';

// =====================================================
// INTERFACE DO COMPONENTE
// =====================================================

interface ListaClientesProps {
  onCriarCliente?: () => void;
  onEditarCliente?: (clienteId: string) => void;
  onVisualizarCliente?: (clienteId: string) => void;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ListaClientes({
  onCriarCliente,
  onEditarCliente,
  onVisualizarCliente
}: ListaClientesProps) {
  const navigate = useNavigate();
  
  // Estados para filtros
  const [filtros, setFiltros] = useState<ClienteFilters>({
    busca: '',
    ativo: 'todos',
    tipo_documento: 'todos',
    ordem: 'nome',
    direcao: 'asc'
  });

  // Hooks para operações
  const { data: clientes = [], isLoading, error } = useClientes(filtros);
  const desativarCliente = useDesativarCliente();
  const reativarCliente = useReativarCliente();

  // =====================================================
  // MANIPULADORES DE EVENTOS
  // =====================================================

  const handleBuscaChange = (busca: string) => {
    setFiltros(prev => ({ ...prev, busca }));
  };

  const handleFiltroChange = (campo: keyof ClienteFilters, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const handleDesativarCliente = async (clienteId: string) => {
    try {
      await desativarCliente.mutateAsync(clienteId);
    } catch (error) {
      console.error('Erro ao desativar cliente:', error);
    }
  };

  const handleReativarCliente = async (clienteId: string) => {
    try {
      await reativarCliente.mutateAsync(clienteId);
    } catch (error) {
      console.error('Erro ao reativar cliente:', error);
    }
  };

  const handleCriarCliente = () => {
    if (onCriarCliente) {
      onCriarCliente();
    } else {
      navigate('/admin/clientes/novo');
    }
  };

  const handleEditarCliente = (clienteId: string) => {
    if (onEditarCliente) {
      onEditarCliente(clienteId);
    } else {
      navigate(`/admin/clientes/${clienteId}/editar`);
    }
  };

  const handleVisualizarCliente = (clienteId: string) => {
    if (onVisualizarCliente) {
      onVisualizarCliente(clienteId);
    } else {
      navigate(`/admin/clientes/${clienteId}`);
    }
  };

  // =====================================================
  // DADOS COMPUTADOS
  // =====================================================

  const estatisticas = useMemo(() => {
    if (!clientes.length) return { total: 0, ativos: 0, inativos: 0 };
    
    const total = clientes.length;
    const ativos = clientes.filter(c => c.ativo).length;
    const inativos = total - ativos;
    
    return { total, ativos, inativos };
  }, [clientes]);

  // =====================================================
  // RENDER - ESTADO DE CARREGAMENTO
  // =====================================================

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // =====================================================
  // RENDER - ESTADO DE ERRO
  // =====================================================

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p>Erro ao carregar clientes: {error.message}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="space-y-6">
      
      {/* Header com Estatísticas */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Gestão de Clientes
              </CardTitle>
              <CardDescription>
                Gerencie todos os clientes da farmácia
              </CardDescription>
            </div>
            
            <Button onClick={handleCriarCliente} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
          
          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{estatisticas.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{estatisticas.ativos}</div>
              <div className="text-sm text-muted-foreground">Ativos</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{estatisticas.inativos}</div>
              <div className="text-sm text-muted-foreground">Inativos</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Campo de Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF, CNPJ, email ou telefone..."
                  value={filtros.busca}
                  onChange={(e) => handleBuscaChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <Select 
                value={filtros.ativo} 
                onValueChange={(value) => handleFiltroChange('ativo', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="true">Ativos</SelectItem>
                  <SelectItem value="false">Inativos</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filtros.tipo_documento} 
                onValueChange={(value) => handleFiltroChange('tipo_documento', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={`${filtros.ordem}-${filtros.direcao}`} 
                onValueChange={(value) => {
                  const [ordem, direcao] = value.split('-');
                  setFiltros(prev => ({ ...prev, ordem, direcao }));
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome-asc">Nome A-Z</SelectItem>
                  <SelectItem value="nome-desc">Nome Z-A</SelectItem>
                  <SelectItem value="created_at-desc">Mais Recentes</SelectItem>
                  <SelectItem value="created_at-asc">Mais Antigos</SelectItem>
                  <SelectItem value="total_compras-desc">Maiores Compras</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Clientes */}
      <Card>
        <CardContent className="p-0">
          {clientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente encontrado</p>
              {filtros.busca && (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Compras</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id} className="group">
                    
                    {/* Dados do Cliente */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{cliente.nome}</div>
                        {cliente.data_nascimento && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(cliente.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                        {cliente.endereco && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cliente.endereco.length > 30 ? `${cliente.endereco.substring(0, 30)}...` : cliente.endereco}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Documento */}
                    <TableCell>
                      <div className="space-y-1">
                        {cliente.cpf && (
                          <div className="text-sm">
                            <Badge variant="outline">CPF</Badge>
                            <span className="ml-2">{formatarDocumento(cliente.cpf)}</span>
                          </div>
                        )}
                        {cliente.cnpj && (
                          <div className="text-sm">
                            <Badge variant="outline">CNPJ</Badge>
                            <span className="ml-2">{formatarDocumento(cliente.cnpj)}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Contato */}
                    <TableCell>
                      <div className="space-y-1">
                        {cliente.telefone && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {formatarTelefone(cliente.telefone)}
                          </div>
                        )}
                        {cliente.email && (
                          <div className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {cliente.email}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Dados de Compras */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {cliente.total_compras ? 
                            `R$ ${cliente.total_compras.toFixed(2)}` : 
                            'Sem compras'
                          }
                        </div>
                        {cliente.pontos_fidelidade && cliente.pontos_fidelidade > 0 && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {cliente.pontos_fidelidade} pontos
                          </div>
                        )}
                        {cliente.ultima_compra && (
                          <div className="text-xs text-muted-foreground">
                            Última: {format(new Date(cliente.ultima_compra), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant={cliente.ativo ? 'default' : 'secondary'}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>

                    {/* Ações */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          
                          <DropdownMenuItem onClick={() => handleVisualizarCliente(cliente.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleEditarCliente(cliente.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {cliente.ativo ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Desativar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Desativar Cliente</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja desativar o cliente <strong>{cliente.nome}</strong>?
                                    O cliente não aparecerá mais nas buscas do sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDesativarCliente(cliente.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Desativar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <DropdownMenuItem onClick={() => handleReativarCliente(cliente.id)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 