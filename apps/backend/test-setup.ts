import { config } from 'dotenv'
import { afterAll, beforeAll } from 'vitest'

// Load environment variables for testing
config({ path: '.env.example' })

// Set up test database URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
}

beforeAll(async () => {
  // Global test setup
  console.log('Setting up tests...')
})

afterAll(async () => {
  // Global test cleanup
  console.log('Cleaning up tests...')
})
