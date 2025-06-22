import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil_id: string;
  ativo: boolean;
  perfil?: {
    nome: string;
    tipo: string;
  };
}

const UsuariosDebugPage: React.FC = () => {
  const { data: usuarios, isLoading, error } = useQuery({
    queryKey: ['usuarios-debug'],
    queryFn: async () => {
      console.log('🔍 Testando busca de usuários...');
      
      // Primeiro teste: buscar apenas dados básicos
      const { data: basicData, error: basicError } = await supabase
        .from('usuarios')
        .select('id, nome, email, ativo');
        
      console.log('📊 Dados básicos:', basicData);
      console.log('❌ Erro básico:', basicError);
      
      // Segundo teste: buscar com perfis
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          nome,
          email,
          perfil_id,
          ativo,
          perfil:perfis_usuario(nome, tipo)
        `)
        .order('nome', { ascending: true });
        
      console.log('📊 Dados completos:', data);
      console.log('❌ Erro completo:', error);
        
      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw new Error(`Erro ao buscar usuários: ${error.message}`);
      }
      
      return data as Usuario[];
    }
  });

  return (
    <AdminLayout>
      <div className="w-full p-4">
        <h1 className="text-2xl font-bold mb-6">🐛 Debug - Gestão de Usuários</h1>
        
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
            <p>⏳ Carregando usuários...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <p>❌ Erro ao carregar usuários:</p>
            <p className="text-sm mt-2">{(error as Error).message}</p>
          </div>
        )}
        
        {usuarios && usuarios.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
            <p>⚠️ Nenhum usuário encontrado na consulta.</p>
          </div>
        )}
        
        {usuarios && usuarios.length > 0 && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6">
            <p>✅ Sucesso! {usuarios.length} usuários encontrados.</p>
          </div>
        )}
        
        {usuarios && usuarios.map((usuario) => (
          <div key={usuario.id} className="bg-white border border-gray-200 p-4 rounded-md mb-4">
            <h3 className="text-lg font-medium text-gray-900">{usuario.nome}</h3>
            <p className="text-sm text-gray-600">📧 {usuario.email}</p>
            <p className="text-sm text-gray-600">👤 {usuario.perfil?.nome || 'Sem perfil'}</p>
            <p className="text-sm text-gray-600">
              🔘 <span className={usuario.ativo ? 'text-green-600' : 'text-red-600'}>
                {usuario.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </p>
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">Ver dados técnicos</summary>
              <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-x-auto">
                {JSON.stringify(usuario, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default UsuariosDebugPage; 