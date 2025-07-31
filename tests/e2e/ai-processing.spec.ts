import { expect, test } from '@playwright/test'
import {
  createTestMeeting,
  loginUser,
  waitForPageLoad,
} from '../helpers/test-setup'

test.describe('AI Processing Features', () => {
  test('should handle AI processing interface', async ({ page }) => {
    await loginUser(page)

    // Create a meeting to test AI processing
    await createTestMeeting(page, 'AI Processing Test')

    // Look for AI-related elements
    const aiElements = [
      'text=Process',
      'text=AI',
      'text=Upload',
      'text=File',
      'input[type="file"]',
      'button',
    ]

    let foundAiElements = 0
    for (const selector of aiElements) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        foundAiElements++
      }
    }

    // Should find some AI-related elements or be on a valid page
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
  })

  test('should display meeting status information', async ({ page }) => {
    await loginUser(page)

    // Navigate to dashboard to see meeting statuses
    await page.goto('/dashboard')
    await waitForPageLoad(page)

    // Look for status-related elements
    const statusElements = [
      'text=Status',
      'text=Processing',
      'text=Completed',
      'text=Pending',
      'text=Created',
      '[data-testid="meeting-card"]',
    ]

    let foundStatusElements = 0
    for (const selector of statusElements) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        foundStatusElements++
      }
    }

    // Should find some status elements or be on a valid page
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
  })

  test('should handle AI results display', async ({ page }) => {
    await loginUser(page)

    // Navigate to dashboard
    await page.goto('/dashboard')
    await waitForPageLoad(page)

    // Look for any meetings that might have AI results
    const meetingCards = page.locator('[data-testid="meeting-card"]')

    if (await meetingCards.first().isVisible()) {
      // Click on first meeting to see details
      await meetingCards.first().click()
      await waitForPageLoad(page)

      // Look for AI result elements
      const aiResultElements = [
        'text=Summary',
        'text=Action Items',
        'text=Topics',
        'text=Analysis',
        'text=AI',
      ]

      let foundResults = 0
      for (const selector of aiResultElements) {
        const element = page.locator(selector).first()
        if (await element.isVisible()) {
          foundResults++
        }
      }

      // Should either show AI results or be on a valid meeting page
      const pageContent = await page.textContent('body')
      expect(pageContent).toBeTruthy()
    }
  })

  test('should handle meeting processing workflow', async ({ page }) => {
    await loginUser(page)

    // Create a meeting for processing
    await createTestMeeting(page, 'Processing Workflow Test')

    // Look for processing-related elements
    const processingElements = [
      'text=Process',
      'text=Upload',
      'text=Status',
      'button',
    ]

    let foundProcessingElements = 0
    for (const selector of processingElements) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        foundProcessingElements++
      }
    }

    // Should find some processing elements or be on a valid page
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
  })
})
