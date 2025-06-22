import { describe, it, expect } from 'vitest';
import { validateCreateUserRequest } from '@/lib/edge/validators';

const validPayload = {
  email: 'user@example.com',
  password: '123456',
  userData: {
    nome: 'Usuário Teste',
    telefone: '+5511999999999',
    perfil_id: '550e8400-e29b-41d4-a716-446655440000',
    ativo: true
  }
};

describe('validateCreateUserRequest', () => {
  it('should not throw for a valid payload', () => {
    expect(() => validateCreateUserRequest(validPayload)).not.toThrow();
  });

  it('should throw if email is invalid', () => {
    const payload = { ...validPayload, email: 'invalid-email' };
    expect(() => validateCreateUserRequest(payload)).toThrow();
  });

  it('should throw if password is too short', () => {
    const payload = { ...validPayload, password: '123' };
    expect(() => validateCreateUserRequest(payload)).toThrow();
  });

  it('should throw if userData.nome is missing', () => {
    const payload = {
      ...validPayload,
      userData: { ...validPayload.userData, nome: undefined as unknown as string }
    };
    expect(() => validateCreateUserRequest(payload)).toThrow();
  });

  it('should throw if perfil_id is not a UUID', () => {
    const payload = {
      ...validPayload,
      userData: { ...validPayload.userData, perfil_id: '123' }
    };
    expect(() => validateCreateUserRequest(payload)).toThrow();
  });
}); 