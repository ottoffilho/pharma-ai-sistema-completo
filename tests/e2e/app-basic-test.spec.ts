import { test, expect } from '@playwright/test'

test.describe('Pharma.AI Basic Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    
    // Verificar se a página carregou
    await expect(page).toHaveTitle(/Pharma/)
    
    // Verificar se há algum elemento da aplicação
    await page.waitForLoadState('networkidle')
    
    console.log('✅ Homepage loaded successfully!')
  })

  test('should redirect to login when accessing admin without auth', async ({ page }) => {
    await page.goto('/admin')
    
    // Deve ser redirecionado para login
    await page.waitForURL(/login/, { timeout: 10000 })
    
    console.log('✅ Redirect to login working!')
  })

  test('should show login form', async ({ page }) => {
    await page.goto('/login')
    
    // Verificar se elementos básicos de login estão presentes
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    
    console.log('✅ Login form is visible!')
  })
}) 