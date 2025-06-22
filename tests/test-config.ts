export const TEST_CONFIG = {
  // Base URL da aplicação
  baseURL: 'http://localhost:5173',
  
  // Credenciais de teste para cada perfil
  users: {
    proprietario: {
      email: 'proprietario.teste@pharmaai.com',
      password: 'Teste123!',
      nome: 'Proprietário Teste',
      dashboard: 'administrativo'
    },
    farmaceutico: {
      email: 'farmaceutico.teste@pharmaai.com',
      password: 'Teste123!',
      nome: 'Farmacêutico Teste',
      dashboard: 'operacional'
    },
    atendente: {
      email: 'atendente.teste@pharmaai.com',
      password: 'Teste123!',
      nome: 'Atendente Teste',
      dashboard: 'atendimento'
    },
    manipulador: {
      email: 'manipulador.teste@pharmaai.com',
      password: 'Teste123!',
      nome: 'Manipulador Teste',
      dashboard: 'producao'
    }
  },

  // Timeouts e delays para testes
  timeouts: {
    navigation: 5000,
    authentication: 10000,
    pageLoad: 8000,
    apiCall: 5000
  },

  // Seletores comuns
  selectors: {
    loginForm: {
      emailInput: 'input[type="email"]',
      passwordInput: 'input[type="password"]',
      loginButton: 'button[type="submit"]',
      errorMessage: '[data-testid="error-message"]'
    },
    navigation: {
      sidebar: '[data-testid="sidebar"]',
      userMenu: '[data-testid="user-menu"]',
      logo: '[data-testid="logo"]'
    },
    common: {
      loadingSpinner: '[data-testid="loading"]',
      modal: '[data-testid="modal"]',
      confirmButton: '[data-testid="confirm-button"]',
      cancelButton: '[data-testid="cancel-button"]'
    }
  }
};

export const TEST_DATA = {
  // Dados para teste de cadastro de cliente
  cliente: {
    nome: 'Cliente Teste',
    cpf: '12345678901',
    telefone: '(11) 99999-9999',
    email: 'cliente.teste@example.com',
    endereco: 'Rua Teste, 123'
  },

  // Dados para teste de produto
  produto: {
    nome: 'Produto Teste',
    codigo: 'PROD001',
    categoria: 'revenda',
    preco: '29.99',
    estoque: '100'
  },

  // Dados para teste de venda
  venda: {
    observacoes: 'Venda de teste',
    desconto: '5.00',
    formaPagamento: 'dinheiro'
  }
}; 