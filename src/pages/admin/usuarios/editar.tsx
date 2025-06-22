import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import AdminLayout from '@/components/layouts/AdminLayout';
import UsuarioInternoForm from '@/components/usuarios/UsuarioInternoForm';

const EditarUsuarioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Buscar dados do usuário específico
  const { data: usuario, isLoading, error } = useQuery({
    queryKey: ['usuario', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('ID do usuário não fornecido');
      }
      
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          nome,
          email,
          perfil_id,
          telefone,
          ativo,
          perfil:perfis_usuario(nome, tipo)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Erro ao buscar usuário: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Usuário não encontrado');
      }
      
      return data;
    },
    enabled: !!id,
    retry: 1
  });

  // Lidar com erro na busca dos dados
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar usuário",
        description: (error as Error).message || "Não foi possível carregar os dados do usuário",
        variant: "destructive"
      });
      navigate('/admin/usuarios');
    }
  }, [error, toast, navigate]);

  return (
    <AdminLayout>
      <div className="w-full p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Editar Usuário</h1>
          <p className="text-muted-foreground">Edite as informações do usuário interno do sistema</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-homeo-green" />
          </div>
        ) : usuario ? (
          <div className="bg-white p-6 rounded-md shadow">
            <UsuarioInternoForm 
              isEditing={true} 
              usuarioId={id} 
              usuarioData={{
                nome_completo: usuario.nome,
                email_contato: usuario.email,
                cargo_perfil: usuario.perfil?.nome || '',
                telefone_contato: usuario.telefone || '',
                ativo: usuario.ativo
              }} 
            />
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default EditarUsuarioPage;
