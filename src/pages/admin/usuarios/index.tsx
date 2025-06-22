import React, { useState, useEffect, useCallback } from 'react';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
import { ModuloSistema, AcaoPermissao, Usuario, PerfilUsuario } from '@/modules/usuarios-permissoes/types';
import { AuthService } from '@/modules/usuarios-permissoes/services/authService';
import { supabase } from '@/services/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Download,
  Upload,
  BarChart3,
  Shield,
  UserCheck,
  UserX,
  Crown,
  MoreHorizontal,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  Activity,
  UserPlus,
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface PerfilUsuarioData {
  id: string;
  nome: string;
  tipo: string;
}

export const UsuariosPage: React.FC = () => {
  const { usuario, autenticado } = useAuthSimple();
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfis, setPerfis] = useState<PerfilUsuarioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPerfil, setFilterPerfil] = useState('todos');
  const [filterAtivo, setFilterAtivo] = useState('todos');
  const [showPassword, setShowPassword] = useState(false);
  const [showConviteModal, setShowConviteModal] = useState(false);
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [conviteFormData, setConviteFormData] = useState({
    email: '',
    nome: '',
    perfil_id: ''
  });

  // Formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    perfil_id: '',
    ativo: true,
    senha: ''
  });

  const isProprietario = usuario?.usuario.perfil?.tipo === PerfilUsuario.PROPRIETARIO;

  // Permissões
  const canRead = isProprietario || (autenticado && usuario.permissoes.some(
    (p) => p.modulo === ModuloSistema.USUARIOS_PERMISSOES && p.acao === AcaoPermissao.LER && (p.permitido ?? true)
  ));
  const canCreate = isProprietario || (autenticado && usuario.permissoes.some(
    (p) => p.modulo === ModuloSistema.USUARIOS_PERMISSOES && p.acao === AcaoPermissao.CRIAR && (p.permitido ?? true)
  ));
  const canEdit = isProprietario || (autenticado && usuario.permissoes.some(
    (p) => p.modulo === ModuloSistema.USUARIOS_PERMISSOES && p.acao === AcaoPermissao.EDITAR && (p.permitido ?? true)
  ));
  const canDelete = isProprietario || (autenticado && usuario.permissoes.some(
    (p) => p.modulo === ModuloSistema.USUARIOS_PERMISSOES && p.acao === AcaoPermissao.DELETAR && (p.permitido ?? true)
  ));

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Carregar usuários
      const usuariosData = await AuthService.listarUsuarios();
      setUsuarios(usuariosData);

      // Carregar perfis
      const { data: perfisData, error } = await supabase
        .from('perfis_usuario')
        .select('id, nome, tipo')
        .eq('ativo', true)
        .order('nome');

      if (!error && perfisData) {
        setPerfis(perfisData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (canRead) {
      loadData();
    }
  }, [canRead, loadData]);

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchSearch = !searchTerm || 
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchPerfil = filterPerfil === 'todos' || usuario.perfil?.tipo === filterPerfil;
    const matchAtivo = filterAtivo === 'todos' || usuario.ativo.toString() === filterAtivo;

    return matchSearch && matchPerfil && matchAtivo;
  });

  // Calcular métricas
  const totalUsuarios = usuarios.length;
  const usuariosAtivos = usuarios.filter(u => u.ativo).length;
  const usuariosInativos = usuarios.filter(u => !u.ativo).length;
  const proprietarios = usuarios.filter(u => u.perfil?.tipo === 'proprietario').length;

  // Abrir modal para criar/editar
  const openModal = (user?: Usuario) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nome: user.nome,
        email: user.email,
        telefone: user.telefone || '',
        perfil_id: user.perfil_id,
        ativo: user.ativo,
        senha: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        perfil_id: '',
        ativo: true,
        senha: ''
      });
    }
    setShowModal(true);
  };

  // Salvar usuário
  const handleSave = async () => {
    try {
      if (editingUser) {
        // Editar usuário existente
        const resultado = await AuthService.atualizarUsuario(editingUser.id, {
          nome: formData.nome,
          telefone: formData.telefone,
          perfil_id: formData.perfil_id,
          ativo: formData.ativo
        });

        if (!resultado.sucesso) {
          throw new Error(resultado.erro || 'Erro ao atualizar usuário');
        }

        toast({
          title: "Usuário atualizado",
          description: "O usuário foi atualizado com sucesso.",
        });
      } else {
        // Criar novo usuário
        const resultado = await AuthService.criarUsuario({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          perfil_id: formData.perfil_id,
          ativo: formData.ativo,
          senha: formData.senha
        });

        if (!resultado.sucesso) {
          throw new Error(resultado.erro || 'Erro ao criar usuário');
        }

        toast({
          title: "Usuário criado",
          description: "O usuário foi criado com sucesso.",
        });
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro ao salvar",
        description: `Erro ao salvar usuário: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Enviar convite para usuário
  const handleSendInvite = async () => {
    if (!conviteFormData.email || !conviteFormData.perfil_id) {
      toast({
        title: "Dados incompletos",
        description: "Preencha o email e selecione um perfil para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setEnviandoConvite(true);
      
      // Enviar convite usando o AuthService
      const resultado = await AuthService.criarEnviarConvite(
        conviteFormData.email,
        conviteFormData.perfil_id,
        usuario?.id,
        conviteFormData.nome || undefined
      );

      if (!resultado.sucesso) {
        throw new Error(resultado.erro || 'Erro ao enviar convite');
      }

      toast({
        title: "Convite enviado",
        description: "O convite foi enviado para o email informado.",
      });
      
      setShowConviteModal(false);
      setConviteFormData({
        email: '',
        nome: '',
        perfil_id: ''
      });
      
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: "Erro ao enviar convite",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setEnviandoConvite(false);
    }
  };

  // Abrir modal de confirmação de exclusão
  const openDeleteModal = (user: Usuario) => {
    if (!canDelete) return;
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Excluir usuário
  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      // Buscar o supabase_auth_id antes de excluir
      const usuarioParaExcluir = usuarios.find(u => u.id === userToDelete.id);
      const supabaseAuthId = usuarioParaExcluir?.supabase_auth_id || userToDelete.supabase_auth_id;
      
      if (!supabaseAuthId) {
        console.warn('Não foi possível encontrar o ID de autenticação do usuário');
      }

      // Usar Edge Function para exclusão completa e segura
      const resultado = await AuthService.excluirUsuarioCompleto(userToDelete.id, supabaseAuthId || '');
      
      if (!resultado.sucesso) {
        console.error('Erro ao excluir usuário:', resultado.erro);
        throw new Error(resultado.erro || 'Erro ao excluir usuário');
      }

      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });

      setShowDeleteModal(false);
      setUserToDelete(null);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o usuário.",
        variant: "destructive",
      });
    }
  };

  // Alternar status ativo
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const resultado = await AuthService.atualizarUsuario(userId, {
        ativo: !currentStatus
      });

      if (!resultado.sucesso) {
        throw new Error(resultado.erro || 'Erro ao alterar status');
      }

      toast({
        title: "Status alterado",
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });

      loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Ocorreu um erro ao alterar o status do usuário.",
        variant: "destructive",
      });
    }
  };

  // Função para obter ícone do perfil
  const getPerfilIcon = (tipo: string) => {
    switch (tipo) {
      case 'proprietario':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'farmaceutico':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'atendente':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'manipulador':
        return <Activity className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  // Função para obter cor do perfil
  const getPerfilColor = (tipo: string) => {
    switch (tipo) {
      case 'proprietario':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'farmaceutico':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'atendente':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'manipulador':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!canRead) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle>Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para visualizar esta página.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
          <div className="relative px-6 py-12">
            <div className="flex items-center justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Gestão de Usuários
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Controle completo de usuários e permissões do sistema
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur-3xl opacity-20" />
                  <Shield className="h-32 w-32 text-blue-600/20" />
                </div>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                      <p className="text-2xl font-bold">{totalUsuarios}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                      <p className="text-2xl font-bold text-green-600">{usuariosAtivos}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Usuários Inativos</p>
                      <p className="text-2xl font-bold text-red-600">{usuariosInativos}</p>
                    </div>
                    <UserX className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Proprietários</p>
                      <p className="text-2xl font-bold text-yellow-600">{proprietarios}</p>
                    </div>
                    <Crown className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Controles e Filtros */}
        <div className="px-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filterPerfil} onValueChange={setFilterPerfil}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os perfis</SelectItem>
                      <SelectItem value="proprietario">Proprietário</SelectItem>
                      <SelectItem value="farmaceutico">Farmacêutico</SelectItem>
                      <SelectItem value="atendente">Atendente</SelectItem>
                      <SelectItem value="manipulador">Manipulador</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterAtivo} onValueChange={setFilterAtivo}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="true">Ativos</SelectItem>
                      <SelectItem value="false">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  {canCreate && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="px-3 flex items-center gap-1 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow"
                        onClick={() => openModal()}
                      >
                        <UserPlus size={16} />
                        <span>Novo usuário</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 flex items-center gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                        onClick={() => setShowConviteModal(true)}
                      >
                        <Mail size={16} />
                        <span>Enviar convite</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Usuários */}
        <div className="px-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Lista de Usuários
                  </CardTitle>
                  <CardDescription>
                    {usuariosFiltrados.length} usuário(s) encontrado(s)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  {usuariosFiltrados.length} itens
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(5).fill(null).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || (filterPerfil !== 'todos') || (filterAtivo !== 'todos')
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando seu primeiro usuário'
                    }
                  </p>
                  {canCreate && (
                    <Button onClick={() => openModal()} className="bg-gradient-to-r from-blue-500 to-indigo-500">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Usuário
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuariosFiltrados.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                                <Users className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{user.nome}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getPerfilColor(user.perfil?.tipo || '')}>
                              <div className="flex items-center gap-1">
                                {getPerfilIcon(user.perfil?.tipo || '')}
                                {user.perfil?.nome || 'Sem perfil'}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.telefone && (
                                <p className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {user.telefone}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={user.ativo ? 'default' : 'secondary'}
                                className={user.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                              >
                                {user.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                              {canEdit && (
                                <Switch
                                  checked={user.ativo}
                                  onCheckedChange={() => toggleUserStatus(user.id, user.ativo)}
                                  size="sm"
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEdit && (
                                  <DropdownMenuItem onClick={() => openModal(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                {canDelete && user.id !== usuario.id && (
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteModal(user)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Criação/Edição */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'Atualize as informações do usuário abaixo.'
                  : 'Preencha as informações para criar um novo usuário.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="perfil">Perfil</Label>
                <Select value={formData.perfil_id} onValueChange={(value) => setFormData({ ...formData, perfil_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis
                      .filter(perfil => perfil.id && perfil.id.trim() !== '')
                      .map((perfil) => (
                        <SelectItem key={perfil.id} value={perfil.id}>
                          <div className="flex items-center gap-2">
                            {getPerfilIcon(perfil.tipo)}
                            {perfil.nome}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="senha">Senha</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Senha do usuário"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Usuário ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingUser ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário "{userToDelete?.nome}"?
                Esta ação não poderá ser desfeita e removerá o usuário permanentemente do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal para enviar convite */}
        <Dialog open={showConviteModal} onOpenChange={setShowConviteModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>Enviar Convite</span>
                </div>
              </DialogTitle>
              <DialogDescription>
                Envie um convite por email para um novo usuário se cadastrar no sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="convite_email">Email</Label>
                <Input
                  id="convite_email"
                  type="email"
                  value={conviteFormData.email}
                  onChange={(e) => setConviteFormData({ ...conviteFormData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="convite_nome">Nome (opcional)</Label>
                <Input
                  id="convite_nome"
                  value={conviteFormData.nome}
                  onChange={(e) => setConviteFormData({ ...conviteFormData, nome: e.target.value })}
                  placeholder="Nome do usuário (opcional)"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="convite_perfil">Perfil</Label>
                <Select 
                  value={conviteFormData.perfil_id} 
                  onValueChange={(value) => setConviteFormData({ ...conviteFormData, perfil_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((perfil) => (
                      <SelectItem key={perfil.id} value={perfil.id}>
                        {perfil.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConviteModal(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                onClick={handleSendInvite}
                disabled={enviandoConvite || !conviteFormData.email || !conviteFormData.perfil_id}
              >
                {enviandoConvite ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Convite
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default UsuariosPage; 