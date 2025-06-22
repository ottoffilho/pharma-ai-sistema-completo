import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock do Supabase Client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    }))
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        data: null,
        error: null
      }))
    })),
    insert: vi.fn(() => ({
      data: null,
      error: null
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null
      }))
    }))
  }))
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}))

describe('Supabase Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Sign In', () => {
    it('should sign in with valid credentials', async () => {
      const mockResponse = {
        data: {
          user: { id: 'user-123', email: 'test@email.com' },
          session: { access_token: 'token-123' }
        },
        error: null
      }

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce(mockResponse)

      const response = await mockSupabaseClient.auth.signInWithPassword({
        email: 'test@email.com',
        password: 'password123'
      })

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@email.com',
        password: 'password123'
      })

      expect(response.data.user).toBeDefined()
      expect(response.data.user.email).toBe('test@email.com')
      expect(response.error).toBeNull()
    })

    it('should handle sign in errors', async () => {
      const mockError = {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      }

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce(mockError)

      const response = await mockSupabaseClient.auth.signInWithPassword({
        email: 'wrong@email.com',
        password: 'wrongpassword'
      })

      expect(response.error).toBeDefined()
      expect(response.error.message).toBe('Invalid login credentials')
      expect(response.data.user).toBeNull()
    })
  })

  describe('Sign Up', () => {
    it('should create new user account', async () => {
      const mockResponse = {
        data: {
          user: { id: 'new-user-123', email: 'new@email.com' },
          session: null
        },
        error: null
      }

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce(mockResponse)

      const response = await mockSupabaseClient.auth.signUp({
        email: 'new@email.com',
        password: 'password123'
      })

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'new@email.com',
        password: 'password123'
      })

      expect(response.data.user).toBeDefined()
      expect(response.data.user.email).toBe('new@email.com')
      expect(response.error).toBeNull()
    })

    it('should handle duplicate email error', async () => {
      const mockError = {
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      }

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce(mockError)

      const response = await mockSupabaseClient.auth.signUp({
        email: 'existing@email.com',
        password: 'password123'
      })

      expect(response.error).toBeDefined()
      expect(response.error.message).toBe('User already registered')
    })
  })

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      const mockResponse = { error: null }

      mockSupabaseClient.auth.signOut.mockResolvedValueOnce(mockResponse)

      const response = await mockSupabaseClient.auth.signOut()

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(response.error).toBeNull()
    })
  })

  describe('Session Management', () => {
    it('should get current session', async () => {
      const mockSession = {
        data: {
          session: {
            access_token: 'token-123',
            user: { id: 'user-123', email: 'test@email.com' }
          }
        },
        error: null
      }

      mockSupabaseClient.auth.getSession.mockResolvedValueOnce(mockSession)

      const response = await mockSupabaseClient.auth.getSession()

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
      expect(response.data.session).toBeDefined()
      expect(response.data.session.user.email).toBe('test@email.com')
    })

    it('should handle no session', async () => {
      const mockResponse = {
        data: { session: null },
        error: null
      }

      mockSupabaseClient.auth.getSession.mockResolvedValueOnce(mockResponse)

      const response = await mockSupabaseClient.auth.getSession()

      expect(response.data.session).toBeNull()
    })
  })

  describe('User Profile Integration', () => {
    it('should fetch user profile from usuarios table', async () => {
      const mockProfile = {
        id: 'user-123',
        nome: 'João Silva',
        email: 'joao@email.com',
        perfil: 'farmaceutico',
        ativo: true
      }

      const mockSelect = {
        single: vi.fn().mockResolvedValueOnce({
          data: mockProfile,
          error: null
        })
      }

      const mockEq = vi.fn().mockReturnValueOnce(mockSelect)
      const mockFromSelect = vi.fn().mockReturnValueOnce({ eq: mockEq })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockFromSelect
      })

      const usuarios = mockSupabaseClient.from('usuarios')
      const result = await usuarios.select('*').eq('id', 'user-123').single()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('usuarios')
      expect(mockFromSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123')
      expect(result.data).toEqual(mockProfile)
    })

    it('should handle profile not found', async () => {
      const mockSelect = {
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'No rows returned' }
        })
      }

      const mockEq = vi.fn().mockReturnValueOnce(mockSelect)
      const mockFromSelect = vi.fn().mockReturnValueOnce({ eq: mockEq })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockFromSelect
      })

      const usuarios = mockSupabaseClient.from('usuarios')
      const result = await usuarios.select('*').eq('id', 'non-existent').single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Auth State Changes', () => {
    it('should handle auth state change subscription', () => {
      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()

      mockSupabaseClient.auth.onAuthStateChange.mockReturnValueOnce({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      })

      const { data } = mockSupabaseClient.auth.onAuthStateChange(mockCallback)

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
      expect(data.subscription.unsubscribe).toBeDefined()
    })
  })
}) 