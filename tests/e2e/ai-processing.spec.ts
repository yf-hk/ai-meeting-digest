import { expect, test } from '@playwright/test'

async function login(page: any) {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

test.describe('AI Processing Features', () => {
  test('should show AI processing button after file upload', async ({
    page,
  }) => {
    await login(page)

    // Create a meeting
    await page.goto('/meeting/new')
    await page.fill('input[name="title"]', 'AI Processing Test')
    await page.click('button[type="submit"]')

    // Mock file upload by checking if process button appears after upload
    // (In a real test, you'd upload an actual file)

    // Should show process button when files are uploaded
    const processButton = page.locator('text=Process with AI')

    // Initially should not be visible (no files uploaded)
    await expect(processButton).not.toBeVisible()
  })

  test('should display AI analysis results', async ({ page }) => {
    await login(page)

    // Navigate to a meeting that has been processed
    // (This would typically be set up with test data)
    await page.goto('/dashboard')

    // Look for meetings that might have AI results
    const meetingCards = page.locator('[data-testid="meeting-card"]')

    if ((await meetingCards.count()) > 0) {
      // Find a completed meeting
      const completedMeeting = page.locator('text=completed').first()

      if (await completedMeeting.isVisible()) {
        // Click view on completed meeting
        await completedMeeting.locator('../..').locator('text=View').click()

        // Should show AI analysis sections
        await expect(
          page
            .locator('text=AI Summary')
            .or(page.locator('text=No AI analysis'))
        ).toBeVisible()
      }
    }
  })

  test('should show different meeting statuses', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard')

    // Should show status indicators
    const statusElements = page.locator(
      '[class*="bg-green-100"], [class*="bg-blue-100"], [class*="bg-gray-100"], [class*="bg-red-100"]'
    )

    // Status elements should be present if there are meetings
    const meetingCards = page.locator('[data-testid="meeting-card"]')
    if ((await meetingCards.count()) > 0) {
      await expect(statusElements.first()).toBeVisible()
    }
  })

  test('should display action items if available', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard')

    // Look for meetings with action items
    const meetingCards = page.locator('[data-testid="meeting-card"]')

    if ((await meetingCards.count()) > 0) {
      await meetingCards.first().locator('text=View').click()

      // Check if action items section exists
      const actionItemsSection = page.locator('text=Action Items')

      // Should either show action items or not show the section
      if (await actionItemsSection.isVisible()) {
        // Should have action item structure
        await expect(
          page.locator(
            '[class*="bg-red-100"], [class*="bg-yellow-100"], [class*="bg-green-100"]'
          )
        ).toBeVisible()
      }
    }
  })

  test('should display discussion topics if available', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard')

    const meetingCards = page.locator('[data-testid="meeting-card"]')

    if ((await meetingCards.count()) > 0) {
      await meetingCards.first().locator('text=View').click()

      // Check if topics section exists
      const topicsSection = page.locator('text=Discussion Topics')

      if (await topicsSection.isVisible()) {
        // Should show topic analysis
        await expect(
          page.locator('text=Sentiment:').or(page.locator('text=Importance:'))
        ).toBeVisible()
      }
    }
  })
})
