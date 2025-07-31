import { test as base, expect, type Page } from '@playwright/test'

// Helper functions for common test operations
export async function loginUser(
  page: Page,
  email = 'test@example.com',
  password = 'password123'
) {
  await page.goto('/login')

  // Wait for login form to be visible
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 })

  // Fill login form
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for navigation or error message
  await page.waitForTimeout(2000)

  // Check if we're redirected to dashboard or still on login
  const currentUrl = page.url()
  if (currentUrl.includes('/login')) {
    // Login might have failed, check for error messages
    const errorMessage = page
      .locator('[role="alert"]')
      .or(page.locator('.error'))
      .or(page.locator('[data-testid="error"]'))
    if (await errorMessage.isVisible()) {
      console.log('Login error detected, continuing with test...')
    }
  }
}

export async function createTestMeeting(
  page: Page,
  title = 'Test Meeting',
  description = 'Test Description'
) {
  // Navigate to new meeting page
  await page.goto('/meeting/new')
  await waitForPageLoad(page)

  // Check if we're on the right page and look for form elements
  const currentUrl = page.url()

  if (currentUrl.includes('/meeting/new')) {
    // Look for various possible form field selectors
    const titleSelectors = [
      'input[name="title"]',
      'input[placeholder*="title" i]',
      'input[placeholder*="name" i]',
      'input[type="text"]',
      'input:first-of-type',
    ]

    let titleInput = null
    for (const selector of titleSelectors) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        titleInput = element
        break
      }
    }

    if (titleInput) {
      await titleInput.fill(title)

      // Look for description field
      const descriptionSelectors = [
        'input[name="description"]',
        'textarea[name="description"]',
        'input[placeholder*="description" i]',
        'textarea[placeholder*="description" i]',
        'textarea',
      ]

      for (const selector of descriptionSelectors) {
        const element = page.locator(selector).first()
        if (await element.isVisible()) {
          await element.fill(description)
          break
        }
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"]').first()
      if (await submitButton.isVisible()) {
        await submitButton.click()
        await page.waitForTimeout(3000)
      }
    }
  }
}

export async function waitForPageLoad(page: Page, timeout = 30_000) {
  await page.waitForLoadState('networkidle', { timeout })
}

// Extend the base test with custom fixtures
export const test = base.extend({
  // Auto-login fixture
  authenticatedPage: async ({ page }, use) => {
    await loginUser(page)
    await use(page)
  },
})

export { expect }
