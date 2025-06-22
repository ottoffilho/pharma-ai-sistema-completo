import { test, expect } from '@playwright/test'

test.describe('Simple Test', () => {
  test('should verify playwright is working', async ({ page }) => {
    await page.goto('https://www.google.com')
    await expect(page).toHaveTitle(/Google/)
    console.log('✅ Playwright is working correctly!')
  })
}) 