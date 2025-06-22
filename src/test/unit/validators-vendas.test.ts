import { describe, expect, it } from 'vitest';
import { validateCriarVenda, validateFinalizarVenda } from '@/lib/edge/validators-vendas';

const criarVendaValida = {
  itens: [
    {
      produto_id: 'prod-1',
      produto_nome: 'Produto Teste',
      quantidade: 2,
      preco_unitario: 10,
      preco_total: 20,
    },
  ],
  subtotal: 20,
  total: 20,
};

describe('validateCriarVenda', () => {
  it('should accept a minimal valid payload', () => {
    expect(() => validateCriarVenda(criarVendaValida)).not.toThrow();
  });

  it('should reject when itens is empty', () => {
    expect(() => validateCriarVenda({ ...criarVendaValida, itens: [] })).toThrow();
  });

  it('should reject negative total', () => {
    expect(() => validateCriarVenda({ ...criarVendaValida, total: -5 })).toThrow();
  });
});

const finalizarVendaValida = {
  venda_id: 'venda-1',
  pagamentos: [
    {
      forma_pagamento: 'DINHEIRO',
      valor: 20,
    },
  ],
};

describe('validateFinalizarVenda', () => {
  it('should accept valid payload', () => {
    expect(() => validateFinalizarVenda(finalizarVendaValida)).not.toThrow();
  });

  it('should reject zero pagamentos', () => {
    expect(() => validateFinalizarVenda({ ...finalizarVendaValida, pagamentos: [] })).toThrow();
  });

  it('should reject missing venda_id', () => {
    const { venda_id, ...rest } = finalizarVendaValida;
    expect(() => validateFinalizarVenda(rest as any)).toThrow();
  });
}); 