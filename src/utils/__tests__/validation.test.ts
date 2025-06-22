import { describe, it, expect } from 'vitest'

// Utilitários de validação mock (baseados no que seria comum no sistema)
export const validationUtils = {
  // Validação de CPF
  validateCPF: (cpf: string): boolean => {
    if (!cpf) return false
    
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '')
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false
    
    // Validação simples dos dígitos verificadores
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let rev = 11 - (sum % 11)
    if (rev === 10 || rev === 11) rev = 0
    if (rev !== parseInt(cleanCPF.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    rev = 11 - (sum % 11)
    if (rev === 10 || rev === 11) rev = 0
    if (rev !== parseInt(cleanCPF.charAt(10))) return false
    
    return true
  },

  // Validação de CNPJ
  validateCNPJ: (cnpj: string): boolean => {
    if (!cnpj) return false
    
    const cleanCNPJ = cnpj.replace(/\D/g, '')
    
    if (cleanCNPJ.length !== 14) return false
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
    
    // Validação simplificada
    return true
  },

  // Validação de email
  validateEmail: (email: string): boolean => {
    if (!email) return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Validação de telefone
  validatePhone: (phone: string): boolean => {
    if (!phone) return false
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length >= 10 && cleanPhone.length <= 11
  },

  // Validação de preço
  validatePrice: (price: number | string): boolean => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return !isNaN(numPrice) && numPrice >= 0
  },

  // Validação de quantidade em estoque
  validateStock: (stock: number | string): boolean => {
    const numStock = typeof stock === 'string' ? parseInt(stock) : stock
    return Number.isInteger(numStock) && numStock >= 0
  },

  // Validação de código de produto
  validateProductCode: (code: string): boolean => {
    if (!code) return false
    // Código deve ter entre 3 e 20 caracteres alfanuméricos
    return /^[A-Za-z0-9]{3,20}$/.test(code)
  },

  // Validação de data
  validateDate: (date: string): boolean => {
    if (!date) return false
    const dateObj = new Date(date)
    return dateObj instanceof Date && !isNaN(dateObj.getTime())
  },

  // Validação de markup percentual
  validateMarkup: (markup: number | string): boolean => {
    const numMarkup = typeof markup === 'string' ? parseFloat(markup) : markup
    return !isNaN(numMarkup) && numMarkup >= 0 && numMarkup <= 1000 // 0 a 1000%
  },

  // Validação de desconto
  validateDiscount: (discount: number | string): boolean => {
    const numDiscount = typeof discount === 'string' ? parseFloat(discount) : discount
    return !isNaN(numDiscount) && numDiscount >= 0 && numDiscount <= 100 // 0 a 100%
  },

  // Validação de senha
  validatePassword: (password: string): boolean => {
    if (!password) return false
    // Mínimo 6 caracteres
    return password.length >= 6
  },

  // Validação de nome
  validateName: (name: string): boolean => {
    if (!name) return false
    // Nome deve ter pelo menos 2 caracteres e apenas letras e espaços
    return /^[A-Za-zÀ-ÿ\s]{2,}$/.test(name.trim())
  }
}

describe('Validation Utils', () => {
  describe('validateCPF', () => {
    it('should validate correct CPF', () => {
      expect(validationUtils.validateCPF('11144477735')).toBe(true)
      expect(validationUtils.validateCPF('111.444.777-35')).toBe(true)
    })

    it('should reject invalid CPF', () => {
      expect(validationUtils.validateCPF('11111111111')).toBe(false)
      expect(validationUtils.validateCPF('123456789')).toBe(false)
      expect(validationUtils.validateCPF('12345678901')).toBe(false)
      expect(validationUtils.validateCPF('')).toBe(false)
    })
  })

  describe('validateCNPJ', () => {
    it('should validate correct CNPJ format', () => {
      expect(validationUtils.validateCNPJ('11222333000181')).toBe(true)
      expect(validationUtils.validateCNPJ('11.222.333/0001-81')).toBe(true)
    })

    it('should reject invalid CNPJ format', () => {
      expect(validationUtils.validateCNPJ('123456789')).toBe(false)
      expect(validationUtils.validateCNPJ('11111111111111')).toBe(false)
      expect(validationUtils.validateCNPJ('')).toBe(false)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validationUtils.validateEmail('test@example.com')).toBe(true)
      expect(validationUtils.validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validationUtils.validateEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid email', () => {
      expect(validationUtils.validateEmail('invalid-email')).toBe(false)
      expect(validationUtils.validateEmail('test@')).toBe(false)
      expect(validationUtils.validateEmail('@domain.com')).toBe(false)
      expect(validationUtils.validateEmail('')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validationUtils.validatePhone('11999887766')).toBe(true)
      expect(validationUtils.validatePhone('1199887766')).toBe(true)
      expect(validationUtils.validatePhone('(11) 99988-7766')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validationUtils.validatePhone('123')).toBe(false)
      expect(validationUtils.validatePhone('123456789012')).toBe(false)
      expect(validationUtils.validatePhone('')).toBe(false)
    })
  })

  describe('validatePrice', () => {
    it('should validate correct prices', () => {
      expect(validationUtils.validatePrice(0)).toBe(true)
      expect(validationUtils.validatePrice(10.99)).toBe(true)
      expect(validationUtils.validatePrice('25.50')).toBe(true)
      expect(validationUtils.validatePrice('0')).toBe(true)
    })

    it('should reject invalid prices', () => {
      expect(validationUtils.validatePrice(-1)).toBe(false)
      expect(validationUtils.validatePrice('abc')).toBe(false)
      expect(validationUtils.validatePrice('-10')).toBe(false)
    })
  })

  describe('validateStock', () => {
    it('should validate correct stock quantities', () => {
      expect(validationUtils.validateStock(0)).toBe(true)
      expect(validationUtils.validateStock(100)).toBe(true)
      expect(validationUtils.validateStock('50')).toBe(true)
    })

    it('should reject invalid stock quantities', () => {
      expect(validationUtils.validateStock(-1)).toBe(false)
      expect(validationUtils.validateStock(10.5)).toBe(false)
      expect(validationUtils.validateStock('abc')).toBe(false)
    })
  })

  describe('validateProductCode', () => {
    it('should validate correct product codes', () => {
      expect(validationUtils.validateProductCode('PROD001')).toBe(true)
      expect(validationUtils.validateProductCode('ABC123')).toBe(true)
      expect(validationUtils.validateProductCode('MED001')).toBe(true)
    })

    it('should reject invalid product codes', () => {
      expect(validationUtils.validateProductCode('AB')).toBe(false) // muito curto
      expect(validationUtils.validateProductCode('PROD-001')).toBe(false) // caractere especial
      expect(validationUtils.validateProductCode('')).toBe(false)
      expect(validationUtils.validateProductCode('A'.repeat(25))).toBe(false) // muito longo
    })
  })

  describe('validateDate', () => {
    it('should validate correct dates', () => {
      expect(validationUtils.validateDate('2025-01-30')).toBe(true)
      expect(validationUtils.validateDate('2025-12-31')).toBe(true)
    })

    it('should reject invalid dates', () => {
      expect(validationUtils.validateDate('invalid-date')).toBe(false)
      expect(validationUtils.validateDate('')).toBe(false)
      expect(validationUtils.validateDate('2025-13-01')).toBe(false)
    })
  })

  describe('validateMarkup', () => {
    it('should validate correct markup percentages', () => {
      expect(validationUtils.validateMarkup(0)).toBe(true)
      expect(validationUtils.validateMarkup(50)).toBe(true)
      expect(validationUtils.validateMarkup('100')).toBe(true)
      expect(validationUtils.validateMarkup(500)).toBe(true)
    })

    it('should reject invalid markup percentages', () => {
      expect(validationUtils.validateMarkup(-1)).toBe(false)
      expect(validationUtils.validateMarkup(1001)).toBe(false)
      expect(validationUtils.validateMarkup('abc')).toBe(false)
    })
  })

  describe('validateDiscount', () => {
    it('should validate correct discount percentages', () => {
      expect(validationUtils.validateDiscount(0)).toBe(true)
      expect(validationUtils.validateDiscount(10)).toBe(true)
      expect(validationUtils.validateDiscount('50')).toBe(true)
      expect(validationUtils.validateDiscount(100)).toBe(true)
    })

    it('should reject invalid discount percentages', () => {
      expect(validationUtils.validateDiscount(-1)).toBe(false)
      expect(validationUtils.validateDiscount(101)).toBe(false)
      expect(validationUtils.validateDiscount('abc')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate correct passwords', () => {
      expect(validationUtils.validatePassword('123456')).toBe(true)
      expect(validationUtils.validatePassword('password123')).toBe(true)
      expect(validationUtils.validatePassword('P@ssw0rd!')).toBe(true)
    })

    it('should reject invalid passwords', () => {
      expect(validationUtils.validatePassword('12345')).toBe(false) // muito curto
      expect(validationUtils.validatePassword('')).toBe(false)
    })
  })

  describe('validateName', () => {
    it('should validate correct names', () => {
      expect(validationUtils.validateName('João Silva')).toBe(true)
      expect(validationUtils.validateName('Maria José')).toBe(true)
      expect(validationUtils.validateName('José')).toBe(true)
      expect(validationUtils.validateName('Ana Cristina')).toBe(true)
    })

    it('should reject invalid names', () => {
      expect(validationUtils.validateName('A')).toBe(false) // muito curto
      expect(validationUtils.validateName('João123')).toBe(false) // números
      expect(validationUtils.validateName('')).toBe(false)
      expect(validationUtils.validateName('João@Silva')).toBe(false) // caracteres especiais
    })
  })
}) 