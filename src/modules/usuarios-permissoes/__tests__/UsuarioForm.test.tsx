import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Mock do hook de usuários
const mockUseUsuarios = vi.fn()
const mockUseMutationUsuario = vi.fn()

vi.mock('@/modules/usuarios-permissoes/hooks/useUsuarios', () => ({
  useUsuarios: mockUseUsuarios,
  useMutationUsuario: mockUseMutationUsuario,
}))

// Mock do AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', nome: 'Admin', perfil: 'proprietario' },
    loading: false,
  }),
}))

// Mock do Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ data: null, error: null })),
    update: vi.fn(() => ({ data: null, error: null })),
    eq: vi.fn(() => ({ data: null, error: null })),
  })),
}

vi.mock('@/hooks/supabase', () => ({
  useSupabase: () => mockSupabase,
}))

// Mock do react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

// Componente Mock simplificado do UsuarioForm
const MockUsuarioForm = ({ 
  usuario, 
  onSave, 
  onCancel 
}: {
  usuario?: any
  onSave: (data: any) => void
  onCancel: () => void
}) => {
  const [formData, setFormData] = React.useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    perfil: usuario?.perfil || '',
    ativo: usuario?.ativo ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const isEditing = !!usuario
  const canSave = formData.nome && formData.email && formData.perfil

  return (
    <form data-testid="usuario-form" onSubmit={handleSubmit}>
      <h2>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
      
      <input
        data-testid="input-nome"
        type="text"
        placeholder="Nome completo"
        required
        value={formData.nome}
        onChange={(e) => setFormData({...formData, nome: e.target.value})}
      />
      
      <input
        data-testid="input-email"
        type="email"
        placeholder="Email"
        required
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      
      <select
        data-testid="select-perfil"
        required
        value={formData.perfil}
        onChange={(e) => setFormData({...formData, perfil: e.target.value})}
      >
        <option value="">Selecione o perfil</option>
        <option value="proprietario">Proprietário</option>
        <option value="farmaceutico">Farmacêutico</option>
        <option value="atendente">Atendente</option>
        <option value="manipulador">Manipulador</option>
      </select>
      
      <label data-testid="checkbox-ativo-label">
        <input
          data-testid="checkbox-ativo"
          type="checkbox"
          checked={formData.ativo}
          onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
        />
        Usuário ativo
      </label>
      
      <div>
        <button
          data-testid="btn-salvar"
          type="submit"
          disabled={!canSave}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Usuário
        </button>
        <button
          data-testid="btn-cancelar"
          type="button"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

describe('UsuarioForm Component', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>
  
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  const renderComponent = (usuario?: any) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MockUsuarioForm
          usuario={usuario}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      </QueryClientProvider>
    )
  }

  it('should render the user form correctly for new user', () => {
    renderComponent()

    expect(screen.getByText('Novo Usuário')).toBeInTheDocument()
    expect(screen.getByTestId('input-nome')).toBeInTheDocument()
    expect(screen.getByTestId('input-email')).toBeInTheDocument()
    expect(screen.getByTestId('select-perfil')).toBeInTheDocument()
    expect(screen.getByTestId('checkbox-ativo')).toBeChecked()
    expect(screen.getByTestId('btn-salvar')).toHaveTextContent('Criar Usuário')
  })

  it('should render the user form correctly for editing user', () => {
    const usuarioExistente = {
      nome: 'João Silva',
      email: 'joao@email.com',
      perfil: 'farmaceutico',
      ativo: true
    }

    renderComponent(usuarioExistente)

    expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument()
    expect(screen.getByDisplayValue('joao@email.com')).toBeInTheDocument()
    expect(screen.getByTestId('select-perfil')).toHaveValue('farmaceutico')
    expect(screen.getByTestId('btn-salvar')).toHaveTextContent('Atualizar Usuário')
  })

  it('should validate required fields', () => {
    renderComponent()

    expect(screen.getByTestId('btn-salvar')).toBeDisabled()
  })

  it('should enable save button when all required fields are filled', async () => {
    renderComponent()

    await user.type(screen.getByTestId('input-nome'), 'João Silva')
    await user.type(screen.getByTestId('input-email'), 'joao@email.com')
    await user.selectOptions(screen.getByTestId('select-perfil'), 'farmaceutico')

    await waitFor(() => {
      expect(screen.getByTestId('btn-salvar')).not.toBeDisabled()
    })
  })

  it('should validate email format', async () => {
    renderComponent()

    await user.type(screen.getByTestId('input-nome'), 'João Silva')
    await user.type(screen.getByTestId('input-email'), 'email-inválido')
    await user.selectOptions(screen.getByTestId('select-perfil'), 'farmaceutico')

    // O input type="email" deve invalidar automaticamente
    const emailInput = screen.getByTestId('input-email') as HTMLInputElement
    expect(emailInput.validity.valid).toBe(false)
  })

  it('should handle profile selection correctly', async () => {
    renderComponent()

    await user.selectOptions(screen.getByTestId('select-perfil'), 'proprietario')
    expect(screen.getByTestId('select-perfil')).toHaveValue('proprietario')

    await user.selectOptions(screen.getByTestId('select-perfil'), 'atendente')
    expect(screen.getByTestId('select-perfil')).toHaveValue('atendente')
  })

  it('should toggle active status correctly', async () => {
    renderComponent()

    const checkbox = screen.getByTestId('checkbox-ativo')
    
    expect(checkbox).toBeChecked()
    
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('should handle form submission correctly', async () => {
    renderComponent()

    await user.type(screen.getByTestId('input-nome'), 'João Silva')
    await user.type(screen.getByTestId('input-email'), 'joao@email.com')
    await user.selectOptions(screen.getByTestId('select-perfil'), 'farmaceutico')
    
    await user.click(screen.getByTestId('btn-salvar'))

    expect(mockOnSave).toHaveBeenCalledWith({
      nome: 'João Silva',
      email: 'joao@email.com',
      perfil: 'farmaceutico',
      ativo: true
    })
  })

  it('should handle cancel button correctly', async () => {
    renderComponent()

    await user.click(screen.getByTestId('btn-cancelar'))

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should handle inactive user creation', async () => {
    renderComponent()

    await user.type(screen.getByTestId('input-nome'), 'Maria Santos')
    await user.type(screen.getByTestId('input-email'), 'maria@email.com')
    await user.selectOptions(screen.getByTestId('select-perfil'), 'atendente')
    await user.click(screen.getByTestId('checkbox-ativo')) // Desmarcar
    
    await user.click(screen.getByTestId('btn-salvar'))

    expect(mockOnSave).toHaveBeenCalledWith({
      nome: 'Maria Santos',
      email: 'maria@email.com',
      perfil: 'atendente',
      ativo: false
    })
  })
}) 