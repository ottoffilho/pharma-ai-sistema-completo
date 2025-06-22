import { z } from 'zod';

// Schema de validação para a Edge Function criar-usuario
export const createUserRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  userData: z.object({
    nome: z.string().min(2, 'Nome muito curto'),
    telefone: z.string().optional(),
    perfil_id: z.string().uuid('perfil_id deve ser um UUID válido'),
    ativo: z.boolean()
  })
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

/**
 * Lança uma exceção se o payload não estiver no formato correto
 */
export function validateCreateUserRequest(payload: unknown): asserts payload is CreateUserRequest {
  createUserRequestSchema.parse(payload);
} 