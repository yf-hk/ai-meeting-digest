import { test as base } from '@playwright/test'

// Extend the base test with custom fixtures
export const test = base.extend({
  // Auto-login fixture
  authenticatedPage: async ({ page }, use) => {
    // Mock authentication for testing
    await page.goto('/login')

    // Mock the authentication process
    await page.route('**/api/auth/**', async (route) => {
      if (route.request().method() === 'POST') {
        // Mock successful login
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
            },
            session: {
              id: 'test-session-id',
              userId: 'test-user-id',
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
            },
          }),
        })
      } else {
        // Mock session check
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
            },
          }),
        })
      }
    })

    // Mock API endpoints
    await page.route('**/rpc/**', async (route) => {
      const url = route.request().url()

      if (url.includes('meetings.list')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'test-meeting-1',
              title: 'Test Meeting 1',
              description: 'Test meeting description',
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
              _count: {
                actionItems: 3,
                topics: 2,
                comments: 1,
              },
            },
          ]),
        })
      } else if (url.includes('meetings.create')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-meeting-id',
            title: 'New Test Meeting',
            description: 'New meeting description',
            status: 'CREATED',
            createdAt: new Date().toISOString(),
          }),
        })
      } else {
        // Default mock response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      }
    })

    await use(page)
  },
})

export { expect } from '@playwright/test'
