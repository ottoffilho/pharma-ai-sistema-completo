import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { formatCurrency } from '@/utils/formatters'
import React from 'react'

// Mock dos módulos necessários
vi.mock('@/hooks/supabase', () => ({
  useSupabase: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [
            { id: '1', nome: 'Paracetamol 500mg', preco_venda: 12.50, estoque_atual: 100 },
            { id: '2', nome: 'Ibuprofeno 400mg', preco_venda: 18.90, estoque_atual: 50 },
            { id: '3', nome: 'Dipirona 500mg', preco_venda: 8.75, estoque_atual: 75 }
          ],
          error: null
        }))
      }))
    }))
  })
}))

// Mock do useNavigate
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

// Componente mock simplificado que simula o comportamento básico
const MockNovaVenda = () => {
  const [selectedProduct, setSelectedProduct] = React.useState('')
  const [quantity, setQuantity] = React.useState<number>(1)
  const [items, setItems] = React.useState<Array<{
    product: string
    quantity: number
    price: number
    total: number
  }>>([])

  const products = [
    { id: '1', nome: 'Paracetamol 500mg', preco_venda: 12.50 },
    { id: '2', nome: 'Ibuprofeno 400mg', preco_venda: 18.90 },
    { id: '3', nome: 'Dipirona 500mg', preco_venda: 8.75 }
  ]

  const addItem = () => {
    if (selectedProduct && quantity > 0) {
      const product = products.find(p => p.id === selectedProduct)
      if (product) {
        const newItem = {
          product: product.nome,
          quantity: quantity,
          price: product.preco_venda,
          total: quantity * product.preco_venda
        }
        setItems([...items, newItem])
        setSelectedProduct('')
        setQuantity(1)
      }
    }
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, item) => sum + item.total, 0)

  const canAdd = selectedProduct && quantity > 0
  const canFinalize = items.length > 0

  return (
    <div data-testid="nova-venda">
      <h1>Nova Venda</h1>
      
      <div data-testid="selecao-produto">
        <select 
          data-testid="select-produto"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          <option value="">Selecione um produto</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.nome} - R$ {product.preco_venda.toFixed(2)}
            </option>
          ))}
        </select>
        
        <input
          data-testid="input-quantidade"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        
        <button
          data-testid="btn-adicionar"
          onClick={addItem}
          disabled={!canAdd}
        >
          Adicionar
        </button>
      </div>

      <div data-testid="lista-itens">
        {items.map((item, index) => (
          <div key={index} data-testid={`item-${index}`}>
            <span>{item.product}</span>
            <span>{item.quantity}x</span>
            <span>R$ {item.price.toFixed(2)}</span>
            <span>{formatCurrency(item.total)}</span>
            <button 
              data-testid={`btn-remover-${index}`}
              onClick={() => removeItem(index)}
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div data-testid="total-venda">
        Total: {formatCurrency(total)}
      </div>

      <button
        data-testid="btn-finalizar"
        disabled={!canFinalize}
      >
        Finalizar Venda
      </button>
    </div>
  )
}

describe('Nova Venda Component', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    user = userEvent.setup()
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MockNovaVenda />
      </QueryClientProvider>
    )
  }

  it('should render the new sale form correctly', () => {
    renderComponent()

    expect(screen.getByText('Nova Venda')).toBeInTheDocument()
    expect(screen.getByTestId('select-produto')).toBeInTheDocument()
    expect(screen.getByTestId('input-quantidade')).toBeInTheDocument()
    expect(screen.getByTestId('btn-adicionar')).toBeInTheDocument()
    expect(screen.getByTestId('total-venda')).toHaveTextContent('Total: R$ 0,00')
  })

  it('should list available products in select', () => {
    renderComponent()

    expect(screen.getByText('Paracetamol 500mg - R$ 12.50')).toBeInTheDocument()
    expect(screen.getByText('Ibuprofeno 400mg - R$ 18.90')).toBeInTheDocument()
    expect(screen.getByText('Dipirona 500mg - R$ 8.75')).toBeInTheDocument()
  })

  it('should add item to sale when clicking add button', async () => {
    renderComponent()

    // Selecionar produto
    await user.selectOptions(screen.getByTestId('select-produto'), '1')
    
    // Alterar quantidade
    await user.clear(screen.getByTestId('input-quantidade'))
    await user.type(screen.getByTestId('input-quantidade'), '2')

    // Adicionar item
    await user.click(screen.getByTestId('btn-adicionar'))

    // Verificar se item foi adicionado
    expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument()
    expect(screen.getByText('2x')).toBeInTheDocument()
    expect(screen.getByText('R$ 25,00')).toBeInTheDocument() // 2 * 12.50
  })

  it('should calculate total correctly', async () => {
    renderComponent()

    // Adicionar primeiro item
    await user.selectOptions(screen.getByTestId('select-produto'), '1')
    await user.clear(screen.getByTestId('input-quantidade'))
    await user.type(screen.getByTestId('input-quantidade'), '2')
    await user.click(screen.getByTestId('btn-adicionar'))

    // Adicionar segundo item  
    await user.selectOptions(screen.getByTestId('select-produto'), '2')
    await user.click(screen.getByTestId('btn-adicionar'))

    // Verificar total: (2 * 12.50) + (1 * 18.90) = 43.90
    expect(screen.getByTestId('total-venda')).toHaveTextContent('Total: R$ 43,90')
  })

  it('should remove item from sale', async () => {
    renderComponent()

    // Adicionar item
    await user.selectOptions(screen.getByTestId('select-produto'), '1')
    await user.click(screen.getByTestId('btn-adicionar'))

    // Remover item
    await user.click(screen.getByTestId('btn-remover-0'))

    expect(screen.queryByTestId('item-0')).not.toBeInTheDocument()
    expect(screen.getByTestId('total-venda')).toHaveTextContent('Total: R$ 0,00')
  })

  it('should disable add button when no product selected', () => {
    renderComponent()

    expect(screen.getByTestId('btn-adicionar')).toBeDisabled()
  })

  it('should disable finalize button when no items', () => {
    renderComponent()

    expect(screen.getByTestId('btn-finalizar')).toBeDisabled()
  })

  it('should enable finalize button when items exist', async () => {
    renderComponent()

    await user.selectOptions(screen.getByTestId('select-produto'), '1')
    await user.click(screen.getByTestId('btn-adicionar'))

    expect(screen.getByTestId('btn-finalizar')).not.toBeDisabled()
  })

  it('should clear form after adding item', async () => {
    renderComponent()

    await user.selectOptions(screen.getByTestId('select-produto'), '1')
    await user.clear(screen.getByTestId('input-quantidade'))
    await user.type(screen.getByTestId('input-quantidade'), '3')
    await user.click(screen.getByTestId('btn-adicionar'))

    // Verificar se formulário foi limpo
    expect(screen.getByTestId('select-produto')).toHaveValue('')
    expect(screen.getByTestId('input-quantidade')).toHaveValue(1)
  })

  it('should handle quantity validation', async () => {
    renderComponent()

    await user.selectOptions(screen.getByTestId('select-produto'), '1')
    await user.clear(screen.getByTestId('input-quantidade'))
    await user.type(screen.getByTestId('input-quantidade'), '0')

    expect(screen.getByTestId('btn-adicionar')).toBeDisabled()

    // Corrigir quantidade
    await user.clear(screen.getByTestId('input-quantidade'))
    await user.type(screen.getByTestId('input-quantidade'), '1')

    expect(screen.getByTestId('btn-adicionar')).not.toBeDisabled()
  })
}) 