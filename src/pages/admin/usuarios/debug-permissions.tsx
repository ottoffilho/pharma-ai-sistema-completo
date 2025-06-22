import React from 'react';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
import { ModuloSistema, AcaoPermissao } from '@/modules/usuarios-permissoes/types';
import { verificarPermissao } from '@/modules/usuarios-permissoes/utils/permissions';

const DebugPermissions: React.FC = () => {
  const { usuario, autenticado } = useAuthSimple();

  const permissaoLer = verificarPermissao(ModuloSistema.USUARIOS_PERMISSOES, AcaoPermissao.LER);
  const permissaoCriar = verificarPermissao(ModuloSistema.USUARIOS_PERMISSOES, AcaoPermissao.CRIAR);
  const permissaoEditar = verificarPermissao(ModuloSistema.USUARIOS_PERMISSOES, AcaoPermissao.EDITAR);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 Debug de Permissões - Usuários</h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Status de Autenticação</h2>
        <p><strong>Autenticado:</strong> {autenticado ? '✅ Sim' : '❌ Não'}</p>
        <p><strong>Usuário ID:</strong> {usuario?.usuario?.id || 'N/A'}</p>
        <p><strong>Nome:</strong> {usuario?.usuario?.nome || 'N/A'}</p>
        <p><strong>Email:</strong> {usuario?.usuario?.email || 'N/A'}</p>
        <p><strong>Perfil:</strong> {usuario?.usuario?.perfil?.nome || 'N/A'}</p>
        <p><strong>Tipo Perfil:</strong> {usuario?.usuario?.perfil?.tipo || 'N/A'}</p>
      </div>

      <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Permissões do Módulo USUARIOS_PERMISSOES</h2>
        <p><strong>LER:</strong> {permissaoLer ? '✅ Permitido' : '❌ Negado'}</p>
        <p><strong>CRIAR:</strong> {permissaoCriar ? '✅ Permitido' : '❌ Negado'}</p>
        <p><strong>EDITAR:</strong> {permissaoEditar ? '✅ Permitido' : '❌ Negado'}</p>
      </div>

      <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Permissões Brutas</h2>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(usuario?.permissoes, null, 2)}
        </pre>
      </div>

      <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px' }}>
        <h2>Dados Completos do Usuário</h2>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '400px' }}>
          {JSON.stringify(usuario, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DebugPermissions; 