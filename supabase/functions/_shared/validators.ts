import { z } from 'https://esm.sh/zod@3.23.8';

export const createUserRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  userData: z.object({
    nome: z.string().min(2),
    telefone: z.string().optional(),
    perfil_id: z.string(),
    ativo: z.boolean()
  })
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export function validateCreateUserRequest(payload: unknown): asserts payload is CreateUserRequest {
  createUserRequestSchema.parse(payload);
} 