import { expect, test as setup } from '@playwright/test'

setup('prepare test environment', async ({ page }) => {
  // Wait for servers to be ready
  await page.goto('/')

  // Check if the application loads
  await expect(page).toHaveURL('/')

  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle')

  console.log('✅ Test environment is ready')
})

setup('create test user', async ({ page }) => {
  // Navigate to the application
  await page.goto('/')

  // Check if we need to create a test user
  // First try to go to login page
  await page.goto('/login')

  // Wait for the login form to load
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 })

  // Try to sign up a test user first - use button specifically
  const signUpButton = page.locator('button:has-text("Sign Up")').first()

  if (await signUpButton.isVisible()) {
    await signUpButton.click()

    // Wait for signup form to load
    await page.waitForTimeout(1000)

    // Fill signup form if it exists
    const nameInput = page.locator('input[name="name"]')
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User')
    }

    const emailInput = page.locator('input[name="email"]')
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com')
    }

    const passwordInput = page.locator('input[name="password"]')
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('password123')
    }

    const confirmPasswordInput = page.locator('input[name="confirmPassword"]')
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.fill('password123')
    }

    // Submit signup form
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()

      // Wait for either success or error
      await page.waitForTimeout(3000)
    }
  }

  console.log('✅ Test user setup completed')
})
