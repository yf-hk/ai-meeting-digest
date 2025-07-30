import { expect, test } from '../helpers/test-setup'

// Helper function to login
async function login(page: any) {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

test.describe('Meeting Management', () => {
  test('should display dashboard with meeting stats', async ({ page }) => {
    await login(page)

    // Should show dashboard header
    await expect(page.locator('text=Meeting Digest')).toBeVisible()

    // Should show stats cards
    await expect(page.locator('text=Total Meetings')).toBeVisible()
    await expect(page.locator('text=Completed')).toBeVisible()
    await expect(page.locator('text=Processing')).toBeVisible()
    await expect(page.locator('text=Action Items')).toBeVisible()
  })

  test('should navigate to new meeting page', async ({ page }) => {
    await login(page)

    // Click New Meeting button
    await page.click('text=New Meeting')

    // Should navigate to new meeting page
    await expect(page).toHaveURL('/meeting/new')
    await expect(page.locator('text=Create New Meeting')).toBeVisible()
  })

  test('should create a new meeting', async ({ page }) => {
    await login(page)
    await page.goto('/meeting/new')

    // Fill in meeting details
    await page.fill('input[name="title"]', 'Test Meeting E2E')
    await page.fill(
      'input[name="description"]',
      'This is a test meeting created via E2E test'
    )

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to meeting detail page
    await expect(page.locator('text=Test Meeting E2E')).toBeVisible()
    await expect(
      page.locator('text=This is a test meeting created via E2E test')
    ).toBeVisible()
  })

  test('should show meeting list with created meeting', async ({ page }) => {
    await login(page)

    // Go to dashboard
    await page.goto('/dashboard')

    // Should see meetings in the list
    const meetingCards = page.locator('[data-testid="meeting-card"]')

    // If no meetings exist, should show empty state
    if ((await meetingCards.count()) === 0) {
      await expect(page.locator('text=No meetings found')).toBeVisible()
      await expect(page.locator('text=Create Your First Meeting')).toBeVisible()
    } else {
      // Should show meeting cards
      await expect(meetingCards.first()).toBeVisible()
    }
  })

  test('should be able to view meeting details', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard')

    // Look for meeting cards
    const meetingCards = page.locator('[data-testid="meeting-card"]')

    if ((await meetingCards.count()) > 0) {
      // Click view button on first meeting
      await meetingCards.first().locator('text=View').click()

      // Should navigate to meeting detail page
      await expect(page.url()).toMatch(/\/meeting\/[a-zA-Z0-9-]+/)

      // Should show meeting details
      await expect(page.locator('text=Upload Meeting File')).toBeVisible()
      await expect(page.locator('text=Comments')).toBeVisible()
    }
  })

  test('should show file upload functionality', async ({ page }) => {
    await login(page)

    // Create a meeting first
    await page.goto('/meeting/new')
    await page.fill('input[name="title"]', 'File Upload Test Meeting')
    await page.click('button[type="submit"]')

    // Should be on meeting detail page
    await expect(page.locator('text=Upload Meeting File')).toBeVisible()

    // Should have file input
    await expect(page.locator('input[type="file"]')).toBeVisible()

    // Should have upload button (disabled without file)
    const uploadButton = page.locator('text=Upload File')
    await expect(uploadButton).toBeVisible()
    await expect(uploadButton).toBeDisabled()
  })

  test('should allow adding comments', async ({ page }) => {
    await login(page)

    // Create a meeting first
    await page.goto('/meeting/new')
    await page.fill('input[name="title"]', 'Comment Test Meeting')
    await page.click('button[type="submit"]')

    // Add a comment
    const commentInput = page.locator('input[placeholder="Add a comment..."]')
    await commentInput.fill('This is a test comment')
    await page.click('text=Add')

    // Comment should appear
    await expect(page.locator('text=This is a test comment')).toBeVisible()
  })
})
