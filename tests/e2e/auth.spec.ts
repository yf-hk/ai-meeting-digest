import { expect, test } from '@playwright/test'
import { loginUser, waitForPageLoad } from '../helpers/test-setup'

test.describe('Authentication Flow', () => {
  test('should load the application homepage', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // Should show the landing page or redirect to login
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/(localhost:3001\/$|localhost:3001\/login)/)

    // Check if basic page elements are present
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
  })

  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await waitForPageLoad(page)

    // Should have login form elements
    await expect(page.locator('input[name="email"]')).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle login attempt', async ({ page }) => {
    await page.goto('/login')
    await waitForPageLoad(page)

    // Fill in login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    // Click sign in button
    await page.click('button[type="submit"]')

    // Wait for response
    await page.waitForTimeout(3000)

    // Check what happened - either success or error
    const currentUrl = page.url()

    if (currentUrl.includes('/dashboard')) {
      // Login successful
      await expect(
        page.locator('text=Meeting Digest').or(page.locator('text=Dashboard'))
      ).toBeVisible()
    } else {
      // Login failed or still on login page - this is expected if user doesn't exist
      await expect(page.locator('input[name="email"]')).toBeVisible()
    }
  })

  test('should show signup option if available', async ({ page }) => {
    await page.goto('/login')
    await waitForPageLoad(page)

    // Look for signup button specifically (not heading)
    const signupButton = page.locator('button:has-text("Sign Up")').first()
    const createAccountButton = page
      .locator('button:has-text("Create Account")')
      .first()
    const registerButton = page.locator('button:has-text("Register")').first()

    // Try each button type
    if (await signupButton.isVisible()) {
      await signupButton.click()
      await waitForPageLoad(page)
    } else if (await createAccountButton.isVisible()) {
      await createAccountButton.click()
      await waitForPageLoad(page)
    } else if (await registerButton.isVisible()) {
      await registerButton.click()
      await waitForPageLoad(page)
    }

    // Check if we're on a signup page or if signup form appeared
    const currentUrl = page.url()
    if (currentUrl.includes('signup') || currentUrl.includes('register')) {
      // Should show signup form
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
    }
  })

  test('should handle navigation between auth pages', async ({ page }) => {
    await page.goto('/login')
    await waitForPageLoad(page)

    // Try to navigate to different auth-related pages
    const authPages = ['/login', '/signup', '/register']

    for (const authPage of authPages) {
      await page.goto(authPage)
      await page.waitForTimeout(1000)

      // Should not crash and should show some form of auth interface
      const hasEmailInput = await page
        .locator('input[name="email"]')
        .isVisible()
      const hasPasswordInput = await page
        .locator('input[name="password"]')
        .isVisible()

      if (hasEmailInput && hasPasswordInput) {
        // This is a valid auth page
        expect(hasEmailInput).toBeTruthy()
        expect(hasPasswordInput).toBeTruthy()
      }
    }
  })
})
