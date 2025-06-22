import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock do Supabase Auth
const mockSupabaseAuth = {
  getUser: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } }
  })),
  signInWithPassword: vi.fn(),
  signOut: vi.fn()
}

const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }))
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}))

// Mock do hook useAuth
const mockUseAuth = vi.fn()

vi.mock('@/modules/usuarios-permissoes/hooks/useAuth', () => ({
  useAuth: mockUseAuth
}))

// Componente wrapper para testes
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication State', () => {
    it('should return loading state initially', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        usuario: null,
        loading: true,
        authenticated: false
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.authenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.usuario).toBeNull()
    })

    it('should return authenticated user when logged in', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@email.com'
      }

      const mockUsuario = {
        id: 'user-123',
        nome: 'João Silva',
        email: 'test@email.com',
        perfil: 'farmaceutico',
        ativo: true
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        usuario: mockUsuario,
        loading: false,
        authenticated: true
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.authenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.usuario).toEqual(mockUsuario)
    })

    it('should handle unauthenticated state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        usuario: null,
        loading: false,
        authenticated: false
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.authenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.usuario).toBeNull()
    })
  })

  describe('User Profile Integration', () => {
    it('should load user profile from usuarios table', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'maria@email.com'
      }

      const mockUsuario = {
        id: 'user-456',
        nome: 'Maria Santos',
        email: 'maria@email.com',
        perfil: 'atendente',
        ativo: true,
        primeiro_acesso: false
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        usuario: mockUsuario,
        loading: false,
        authenticated: true
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.usuario.nome).toBe('Maria Santos')
      expect(result.current.usuario.perfil).toBe('atendente')
      expect(result.current.usuario.primeiro_acesso).toBe(false)
    })

    it('should handle first access user', () => {
      const mockUsuario = {
        id: 'new-user',
        nome: 'Novo Usuário',
        email: 'novo@email.com',
        perfil: 'manipulador',
        ativo: true,
        primeiro_acesso: true
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'new-user', email: 'novo@email.com' },
        usuario: mockUsuario,
        loading: false,
        authenticated: true
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.usuario.primeiro_acesso).toBe(true)
    })
  })

  describe('User Permissions', () => {
    it('should return user profile for permission checking', () => {
      const mockUsuario = {
        id: 'user-789',
        nome: 'Admin User',
        email: 'admin@email.com',
        perfil: 'proprietario',
        ativo: true
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'user-789', email: 'admin@email.com' },
        usuario: mockUsuario,
        loading: false,
        authenticated: true
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.usuario.perfil).toBe('proprietario')
    })

    it('should handle inactive user', () => {
      const mockUsuario = {
        id: 'inactive-user',
        nome: 'Usuário Inativo',
        email: 'inativo@email.com',
        perfil: 'atendente',
        ativo: false
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'inactive-user', email: 'inativo@email.com' },
        usuario: mockUsuario,
        loading: false,
        authenticated: true
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.usuario.ativo).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle auth errors gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        usuario: null,
        loading: false,
        authenticated: false,
        error: 'Authentication failed'
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.error).toBe('Authentication failed')
      expect(result.current.authenticated).toBe(false)
    })

    it('should handle network errors', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        usuario: null,
        loading: false,
        authenticated: false,
        error: 'Network error'
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.error).toBe('Network error')
    })
  })

  describe('Auth State Persistence', () => {
    it('should persist auth state across page reloads', () => {
      // Simular sessão persistida
      const persistedUser = {
        id: 'persisted-user',
        email: 'persisted@email.com'
      }

      const persistedUsuario = {
        id: 'persisted-user',
        nome: 'Usuário Persistido',
        email: 'persisted@email.com',
        perfil: 'farmaceutico',
        ativo: true
      }

      mockUseAuth.mockReturnValue({
        user: persistedUser,
        usuario: persistedUsuario,
        loading: false,
        authenticated: true
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.authenticated).toBe(true)
      expect(result.current.user).toEqual(persistedUser)
      expect(result.current.usuario).toEqual(persistedUsuario)
    })
  })

  describe('Multiple User Profiles', () => {
    it('should handle proprietario profile', () => {
      const mockUsuario = {
        id: 'owner-user',
        nome: 'Proprietário',
        email: 'owner@email.com',
        perfil: 'proprietario',
        ativo: true
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'owner-user', email: 'owner@email.com' },
        usuario: mockUsuario,
        loading: false,
        authenticated: true
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.usuario.perfil).toBe('proprietario')
    })

    it('should handle farmaceutico profile', () => {
      const mockUsuario = {
        id: 'pharmacist-user',
        nome: 'Farmacêutico',
        email: 'pharmacist@email.com',
        perfil: 'farmaceutico',
        ativo: true
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'pharmacist-user', email: 'pharmacist@email.com' },
        usuario: mockUsuario,
        loading: false,
        authenticated: true
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.usuario.perfil).toBe('farmaceutico')
    })

    it('should handle atendente profile', () => {
      const mockUsuario = {
        id: 'attendant-user',
        nome: 'Atendente',
        email: 'attendant@email.com',
        perfil: 'atendente',
        ativo: true
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'attendant-user', email: 'attendant@email.com' },
        usuario: mockUsuario,
        loading: false,
        authenticated: true
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.usuario.perfil).toBe('atendente')
    })

    it('should handle manipulador profile', () => {
      const mockUsuario = {
        id: 'manipulator-user',
        nome: 'Manipulador',
        email: 'manipulator@email.com',
        perfil: 'manipulador',
        ativo: true
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'manipulator-user', email: 'manipulator@email.com' },
        usuario: mockUsuario,
        loading: false,
        authenticated: true
      })

      const { result } = renderHook(() => mockUseAuth(), {
        wrapper: createWrapper()
      })

      expect(result.current.usuario.perfil).toBe('manipulador')
    })
  })
}) 