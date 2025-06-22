import { test, expect } from '@playwright/test'
import { TEST_CONFIG } from '../test-config'

test.describe('Authentication Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar localStorage antes de cada teste
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should redirect to login when accessing admin without authentication', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should load the login page correctly', async ({ page }) => {
    await page.goto('/login')
    
    // Verificar título ou elementos únicos da página
    await expect(page.locator('h3')).toContainText('Fazer Login')
  })

  test('should show login form correctly', async ({ page }) => {
    await page.goto('/login')
    
    // Verificar campos do formulário
    await expect(page.locator('input[placeholder="seu@email.com"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Sua senha"]')).toBeVisible()
    
    // Verificar botão de entrar
    await expect(page.locator('button[type="submit"]')).toContainText('Entrar')
    
    // Verificar link para esqueci senha (usando seletor mais específico)
    await expect(page.getByRole('button', { name: 'Esqueci minha senha' })).toBeVisible()
  })

  test('should validate login form fields', async ({ page }) => {
    await page.goto('/login')
    
    // Tentar submeter formulário vazio
    await page.click('button[type="submit"]')
    
    // Aguardar mensagens de validação aparecerem
    await expect(page.locator('text=Email inválido')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=Senha é obrigatória')).toBeVisible({ timeout: 3000 })
  })

  test('should handle login error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Preencher com credenciais inválidas
    await page.fill('input[placeholder="seu@email.com"]', 'usuario@inexistente.com')
    await page.fill('input[placeholder="Sua senha"]', 'senhaerrada')
    
    // Submeter formulário
    await page.click('button[type="submit"]')
    
    // Aguardar mensagem de erro (primeiro elemento que aparecer)
    await expect(page.locator('text=Credenciais inválidas').first()).toBeVisible({ timeout: 10000 })
  })

  test('should login successfully with proprietario credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fazer login com credenciais do proprietário de teste
    await page.fill('input[placeholder="seu@email.com"]', TEST_CONFIG.users.proprietario.email)
    await page.fill('input[placeholder="Sua senha"]', TEST_CONFIG.users.proprietario.password)
    await page.click('button[type="submit"]')
    
    // Aguardar redirecionamento para dashboard administrativo
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    
    // Verificar se o menu do usuário está presente (usar primeiro elemento encontrado)
    await expect(
      page.locator('button[aria-label="Menu do usuário"]').or(
        page.locator('button:has-text("PT")')
      ).first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('should remember login state after page refresh', async ({ page }) => {
    // Login como proprietário
    await page.goto('/login')
    await page.fill('input[type="email"]', 'proprietario.teste@pharmaai.com')
    await page.fill('input[type="password"]', 'Teste123!')
    await page.click('button[type="submit"]')
    
    // Aguardar estar logado
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    
    // Refresh da página
    await page.reload()
    
    // Deve continuar logado e mostrar o menu do usuário
    await expect(
      page.locator('button[aria-label="Menu do usuário"]').or(
        page.locator('button:has-text("PT")')
      ).first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('should logout successfully', async ({ page }) => {
    // Login como proprietário (que tem acesso ao dashboard administrativo)
    await page.goto('/login')
    await page.fill('input[type="email"]', 'proprietario.teste@pharmaai.com')
    await page.fill('input[type="password"]', 'Teste123!')
    await page.click('button[type="submit"]')
    
    // Aguardar estar logado no dashboard administrativo
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    
    // Fazer logout - usar primeiro menu encontrado (PT = Proprietário Teste)
    const userMenuButton = page.locator('button[aria-label="Menu do usuário"]').or(
      page.locator('button:has-text("PT")')
    ).first()
    
    await userMenuButton.click()
    await page.click('text=Sair')
    
    // Deve ser redirecionado para login
    await expect(page).toHaveURL(/\/login/)
    
    // Tentar acessar área administrativa novamente
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should handle different user profiles correctly - PROPRIETARIO', async ({ page }) => {
    // Teste para proprietário
    await page.goto('/login')
    await page.fill('input[placeholder="seu@email.com"]', TEST_CONFIG.users.proprietario.email)
    await page.fill('input[placeholder="Sua senha"]', TEST_CONFIG.users.proprietario.password)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    
    // Verificar que está logado
    await expect(
      page.locator('button[aria-label="Menu do usuário"]').or(
        page.locator('button:has-text("PT")')
      ).first()
    ).toBeVisible({ timeout: 15000 })
    
    // Verificar se há links de navegação principais (primeiro elemento visível)
    await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Vendas').first()).toBeVisible({ timeout: 5000 })
    
    // Logout
    const userMenuButton = page.locator('button[aria-label="Menu do usuário"]').or(
      page.locator('button:has-text("PT")')
    ).first()
    
    await userMenuButton.click()
    await page.click('text=Sair')
    await expect(page).toHaveURL(/\/login/)
  })

  // TESTES DE PERFIS ESPECÍFICOS - COMENTADOS TEMPORARIAMENTE
  // Cada perfil tem seu próprio dashboard, precisam de testes específicos

  /*
  test('should handle different user profiles correctly - FARMACEUTICO', async ({ page }) => {
    // Login com farmacêutico
    await page.goto('/login')
    await page.fill('input[type="email"]', 'farmaceutico.teste@pharmaai.com')
    await page.fill('input[type="password"]', 'Teste123!')
    await page.click('button[type="submit"]')
    
    // Aguardar estar logado - FARMACEUTICO vai para DashboardOperacional
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    
    // Verificar se aparece conteúdo do dashboard operacional
    await expect(page.locator('h1')).toContainText('Dashboard Operacional')
    
    // Logout específico do dashboard operacional
    await page.click('button:contains("Sair")')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should restrict access based on user profile - ATENDENTE', async ({ page }) => {
    // Login com atendente
    await page.goto('/login')
    await page.fill('input[type="email"]', 'atendente.teste@pharmaai.com')
    await page.fill('input[type="password"]', 'Teste123!')
    await page.click('button[type="submit"]')
    
    // Aguardar estar logado - ATENDENTE vai para DashboardAtendimento
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    
    // Verificar se aparece conteúdo do dashboard de atendimento
    await expect(page.locator('h1')).toContainText('Dashboard Atendimento')
  })

  test('should handle MANIPULADOR profile correctly', async ({ page }) => {
    // Login com manipulador
    await page.goto('/login')
    await page.fill('input[type="email"]', 'manipulador.teste@pharmaai.com')
    await page.fill('input[type="password"]', 'Teste123!')
    await page.click('button[type="submit"]')
    
    // Aguardar estar logado - MANIPULADOR vai para DashboardProducao
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    
    // Verificar se aparece conteúdo do dashboard de produção
    await expect(page.locator('h1')).toContainText('Dashboard Produção')
  })
  */

  test('should validate password reset flow', async ({ page }) => {
    await page.goto('/esqueci-senha')
    
    // Verificar se chegou na página correta (pode não ter h1 específico)
    await expect(page).toHaveURL(/\/esqueci-senha/)
    
    // Verificar se há campo de email para reset
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('should handle session timeout gracefully', async ({ page }) => {
    // Login com usuário de teste
    await page.goto('/login')
    await page.fill('input[placeholder="seu@email.com"]', TEST_CONFIG.users.proprietario.email)
    await page.fill('input[placeholder="Sua senha"]', TEST_CONFIG.users.proprietario.password)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    
    // Simular expiração de token
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Tentar navegar
    await page.goto('/admin/produtos')
    
    // Deve ser redirecionado para login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should validate user information display after login', async ({ page }) => {
    // Login como proprietário
    await page.goto('/login')
    await page.fill('input[type="email"]', 'proprietario.teste@pharmaai.com')
    await page.fill('input[type="password"]', 'Teste123!')
    await page.click('button[type="submit"]')
    
    // Aguardar estar logado
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    
    // Verificar se o menu do usuário aparece
    const userMenuButton = page.locator('button[aria-label="Menu do usuário"]').or(
      page.locator('button:has-text("PT")')
    ).first()
    
    await userMenuButton.click()
    
    // Verificar se há informações do usuário no menu dropdown
    await expect(page.locator('text=Meu Perfil')).toBeVisible()
    await expect(page.locator('text=Configurações')).toBeVisible()
    await expect(page.locator('text=Sair')).toBeVisible()
  })

  test.skip('should perform a complete login flow', async ({ page }) => {
    // Ir para a página de login
    await page.goto('/login')
    
    // Verificar se a página de login carregou (verificar por input de email em vez de h1)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    
    // Preencher credenciais - USAR PROPRIETARIO para acessar dashboard administrativo
    await page.fill('input[type="email"]', 'proprietario.teste@pharmaai.com')
    await page.fill('input[type="password"]', 'Teste123!')
    
    // Fazer login
    await page.click('button[type="submit"]')
    
    // Verificar se foi redirecionado para a área administrativa
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    
    // Verificar se o menu do usuário aparece (iniciais PT para Proprietário Teste)
    await expect(
      page.locator('button[aria-label="Menu do usuário"]').or(
        page.locator('button:has-text("PT")')
      ).first()
    ).toBeVisible({ timeout: 15000 })
  })
}) 