import { z } from 'https://esm.sh/zod@3.23.8';

const criarItemVendaSchema = z.object({
  produto_id: z.string(),
  produto_codigo: z.string().optional(),
  produto_nome: z.string(),
  quantidade: z.number().positive(),
  preco_unitario: z.number().nonnegative(),
  preco_total: z.number().nonnegative(),
  lote_id: z.string().optional(),
});

export const criarVendaRequestSchema = z.object({
  cliente_id: z.string().optional(),
  cliente_nome: z.string().optional(),
  cliente_documento: z.string().optional(),
  cliente_telefone: z.string().optional(),
  itens: z.array(criarItemVendaSchema).min(1),
  subtotal: z.number().nonnegative(),
  desconto_valor: z.number().nonnegative().optional(),
  desconto_percentual: z.number().nonnegative().optional(),
  total: z.number().nonnegative(),
  observacoes: z.string().optional(),
});

export type CriarVendaRequest = z.infer<typeof criarVendaRequestSchema>;

const pagamentoSchema = z.object({
  forma_pagamento: z.string(),
  valor: z.number().nonnegative(),
  bandeira_cartao: z.string().optional(),
  numero_autorizacao: z.string().optional(),
  codigo_transacao: z.string().optional(),
  observacoes: z.string().optional(),
});

export const finalizarVendaRequestSchema = z.object({
  venda_id: z.string(),
  pagamentos: z.array(pagamentoSchema).min(1),
  troco: z.number().nonnegative().optional(),
});

export type FinalizarVendaRequest = z.infer<typeof finalizarVendaRequestSchema>;

export function validateCriarVenda(payload: unknown): asserts payload is CriarVendaRequest {
  criarVendaRequestSchema.parse(payload);
}

export function validateFinalizarVenda(payload: unknown): asserts payload is FinalizarVendaRequest {
  finalizarVendaRequestSchema.parse(payload);
} 