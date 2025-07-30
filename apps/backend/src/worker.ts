import { RPCHandler } from '@orpc/server/fetch'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './lib/auth'
import { createContext } from './lib/context'
import { appRouter } from './routers/index'
import { setupSSERoutes } from './routes/sse'

const app = new Hono()

// CORS middleware
app.use(
  '/*',
  cors({
    origin: (origin) => {
      // In Cloudflare Workers, we need to handle CORS more carefully
      const allowedOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .filter(Boolean)
      if (allowedOrigins.length === 0) {
        // Default to localhost for development
        return origin?.includes('localhost') || origin?.includes('127.0.0.1')
          ? origin
          : null
      }
      return allowedOrigins.includes(origin || '') ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    credentials: true,
  })
)

// Auth routes
app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/**', (c) =>
  auth.handler(c.req.raw)
)

// ORPC routes
const handler = new RPCHandler(appRouter)
app.use('/rpc/*', async (c, next) => {
  const context = await createContext({ context: c })
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: '/rpc',
    context,
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }
  await next()
})

// Health check
app.get('/', (c) => {
  return c.text('OK')
})

// Setup SSE routes
setupSSERoutes(app)

// Export for Cloudflare Workers
export default {
  fetch: app.fetch,
}
