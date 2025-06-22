import React from 'react';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
import { ModuloSistema, AcaoPermissao } from '@/modules/usuarios-permissoes/types';

export const TestPermissionsPage: React.FC = () => {
  const { usuario, autenticado } = useAuthSimple();

  if (!autenticado) {
    return <div>Não autenticado</div>;
  }

  const permissoesUsuarios = {
    ler: verificarPermissao(ModuloSistema.USUARIOS_PERMISSOES, AcaoPermissao.LER),
    criar: verificarPermissao(ModuloSistema.USUARIOS_PERMISSOES, AcaoPermissao.CRIAR),
    editar: verificarPermissao(ModuloSistema.USUARIOS_PERMISSOES, AcaoPermissao.EDITAR),
    deletar: verificarPermissao(ModuloSistema.USUARIOS_PERMISSOES, AcaoPermissao.DELETAR),
    administrar: verificarPermissao(ModuloSistema.USUARIOS_PERMISSOES, AcaoPermissao.ADMINISTRAR)
  };

  console.log('🔍 Debug verificação de permissões:');
  console.log('ModuloSistema.USUARIOS_PERMISSOES:', ModuloSistema.USUARIOS_PERMISSOES);
  console.log('AcaoPermissao.LER:', AcaoPermissao.LER);
  console.log('Permissões do usuário:', usuario?.permissoes);
  console.log('Resultado verificação LER:', permissoesUsuarios.ler);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Teste de Permissões - Após Correções</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Dados do Usuário</h2>
        <div className="space-y-2">
          <p><strong>Nome:</strong> {usuario?.usuario.nome}</p>
          <p><strong>Email:</strong> {usuario?.usuario.email}</p>
          <p><strong>Perfil:</strong> {usuario?.usuario.perfil?.nome}</p>
          <p><strong>Tipo:</strong> {usuario?.usuario.perfil?.tipo}</p>
          <p><strong>Perfil ID:</strong> {usuario?.usuario.perfil?.id}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Permissões Carregadas</h2>
        <div className="space-y-2">
          <p><strong>Total de permissões:</strong> {usuario?.permissoes?.length || 0}</p>
          {usuario?.permissoes && usuario.permissoes.length > 0 ? (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Lista de Permissões:</h3>
              <div className="max-h-40 overflow-y-auto">
                {usuario.permissoes.map((perm: {
                  modulo: string;
                  acao: string;
                  permitido: boolean;
                }, index: number) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded mb-1">
                    <strong>{perm.modulo}</strong> - {perm.acao} 
                    {perm.permitido ? ' ✅' : ' ❌'}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-red-600">❌ Nenhuma permissão carregada!</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Verificação de Permissões - Usuários</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded ${permissoesUsuarios.ler ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>LER:</strong> {permissoesUsuarios.ler ? '✅ Permitido' : '❌ Negado'}
          </div>
          <div className={`p-3 rounded ${permissoesUsuarios.criar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>CRIAR:</strong> {permissoesUsuarios.criar ? '✅ Permitido' : '❌ Negado'}
          </div>
          <div className={`p-3 rounded ${permissoesUsuarios.editar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>EDITAR:</strong> {permissoesUsuarios.editar ? '✅ Permitido' : '❌ Negado'}
          </div>
          <div className={`p-3 rounded ${permissoesUsuarios.deletar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>DELETAR:</strong> {permissoesUsuarios.deletar ? '✅ Permitido' : '❌ Negado'}
          </div>
          <div className={`p-3 rounded ${permissoesUsuarios.administrar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>ADMINISTRAR:</strong> {permissoesUsuarios.administrar ? '✅ Permitido' : '❌ Negado'}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Recarregar Página
        </button>
      </div>
    </div>
  );
}; 