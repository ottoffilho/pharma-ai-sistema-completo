import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const UsuariosSimplePage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🎯 PÁGINA DE USUÁRIOS SIMPLES CARREGADA!');

  useEffect(() => {
    console.log('🔄 Executando busca de usuários...');
    buscarUsuarios();
  }, []);

  const buscarUsuarios = async () => {
    try {
      console.log('📡 Fazendo query no Supabase...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome');

      if (error) {
        console.error('❌ Erro:', error);
        setError(error.message);
        return;
      }

      console.log('✅ Usuários encontrados:', data?.length);
      console.log('📋 Dados:', data);
      setUsuarios(data || []);
    } catch (err) {
      console.error('💥 Erro inesperado:', err);
      setError('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        
        {/* Header */}
        <div style={{ 
          borderBottom: '2px solid #e5e5e5', 
          paddingBottom: '20px', 
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              color: '#333', 
              margin: '0 0 10px 0',
              fontWeight: 'bold'
            }}>
              👥 Gestão de Usuários (Simples)
            </h1>
            <p style={{ 
              color: '#666', 
              margin: 0,
              fontSize: '16px'
            }}>
              Lista de todos os usuários cadastrados no sistema - SEM PROTEÇÃO DE PERMISSÕES
            </p>
          </div>
          
          <div>
            <Link 
              to="/admin/usuarios/novo"
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                marginRight: '10px'
              }}
            >
              ➕ Novo Usuário
            </Link>
            <Link 
              to="/admin/usuarios/debug-permissions"
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                marginRight: '10px'
              }}
            >
              🔍 Debug Permissões
            </Link>
            <Link 
              to="/admin/usuarios/test-permissions"
              style={{
                backgroundColor: '#9C27B0',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}
            >
              🧪 Teste Correções
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '1px solid #bbdefb'
          }}>
            <div style={{ 
              fontSize: '18px', 
              color: '#1976d2',
              fontWeight: 'bold'
            }}>
              🔄 Carregando usuários...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            border: '1px solid #f44336',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ color: '#c62828', fontWeight: 'bold', fontSize: '16px' }}>
              ❌ Erro ao carregar usuários
            </div>
            <div style={{ color: '#d32f2f', marginTop: '5px' }}>
              {error}
            </div>
            <button 
              onClick={buscarUsuarios}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '15px',
                fontSize: '14px'
              }}
            >
              🔄 Tentar Novamente
            </button>
          </div>
        )}

        {/* Users List */}
        {!loading && !error && (
          <>
            <div style={{ 
              backgroundColor: '#e8f5e8', 
              border: '1px solid #4caf50',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '25px'
            }}>
              <div style={{ 
                color: '#2e7d32', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                ✅ {usuarios.length} usuário(s) encontrado(s)
              </div>
            </div>

            {usuarios.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '50px',
                backgroundColor: '#fff3e0',
                borderRadius: '8px',
                border: '1px solid #ffb74d'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>👤</div>
                <div style={{ fontSize: '18px', color: '#ef6c00', fontWeight: 'bold' }}>
                  Nenhum usuário encontrado
                </div>
              </div>
            ) : (
              <div style={{ 
                overflowX: 'auto',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ 
                        padding: '15px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #ddd',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#555'
                      }}>
                        NOME
                      </th>
                      <th style={{ 
                        padding: '15px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #ddd',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#555'
                      }}>
                        EMAIL
                      </th>
                      <th style={{ 
                        padding: '15px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #ddd',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#555'
                      }}>
                        STATUS
                      </th>
                      <th style={{ 
                        padding: '15px', 
                        textAlign: 'center', 
                        borderBottom: '2px solid #ddd',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#555'
                      }}>
                        AÇÕES
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario, index) => (
                      <tr key={usuario.id} style={{ 
                        backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                        borderBottom: '1px solid #eee'
                      }}>
                        <td style={{ padding: '15px', fontSize: '14px' }}>
                          <div style={{ fontWeight: 'bold', color: '#333' }}>
                            {usuario.nome}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            ID: {usuario.id}
                          </div>
                        </td>
                        <td style={{ padding: '15px', fontSize: '14px', color: '#555' }}>
                          {usuario.email}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: usuario.ativo ? '#e8f5e8' : '#ffebee',
                            color: usuario.ativo ? '#2e7d32' : '#c62828'
                          }}>
                            {usuario.ativo ? '✅ Ativo' : '❌ Inativo'}
                          </span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <Link
                            to={`/admin/usuarios/editar/${usuario.id}`}
                            style={{
                              backgroundColor: '#2196F3',
                              color: 'white',
                              padding: '6px 12px',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            ✏️ Editar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Footer Info */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            <div><strong>Total usuários:</strong> {usuarios.length}</div>
            <div><strong>Última atualização:</strong> {new Date().toLocaleString()}</div>
            <div><strong>Component:</strong> UsuariosSimplePage (Sem Proteção)</div>
          </div>
          <button 
            onClick={buscarUsuarios}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px',
              fontSize: '12px'
            }}
          >
            🔄 Recarregar Lista
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsuariosSimplePage; 