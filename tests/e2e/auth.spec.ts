import { expect, test } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('text=Sign In')).toBeVisible()
  })

  test('should redirect to dashboard after login', async ({ page }) => {
    await page.goto('/login')

    // Fill in login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    // Click sign in button
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
    await expect(page.locator('text=Meeting Digest')).toBeVisible()
  })

  test('should show user menu when authenticated', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Check user menu is visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should be able to sign out', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Click user menu and sign out
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Sign out')

    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})
