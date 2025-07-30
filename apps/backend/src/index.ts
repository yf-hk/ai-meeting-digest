import 'dotenv/config'
import { RPCHandler } from '@orpc/server/fetch'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './lib/auth'
import { createContext } from './lib/context'
import { meetingService } from './lib/meeting-service'
import { appRouter } from './routers/index'

const app = new Hono()

app.use(logger())
app.use(
  '/*',
  cors({
    origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    credentials: true,
  })
)

app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/**', (c) =>
  auth.handler(c.req.raw)
)

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

app.get('/', (c) => {
  return c.text('OK')
})

// SSE endpoint for streaming meeting processing
app.get('/api/meetings/:meetingId/process-stream', async (c) => {
  console.log('SSE endpoint called for meetingId:', c.req.param('meetingId'))
  const meetingId = c.req.param('meetingId')
  const context = await createContext({ context: c })

  console.log('Session check:', !!context.session?.user?.id)
  if (!context.session?.user?.id) {
    console.log('Unauthorized access to SSE endpoint')
    return c.text('Unauthorized', 401)
  }

  const userId = context.session.user.id
  console.log('Starting SSE stream for user:', userId)

  return c.newResponse(
    new ReadableStream({
      start(controller) {
        ;(async () => {
          try {
            for await (const chunk of meetingService.processMeetingStream(
              meetingId,
              userId
            )) {
              controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`))
            }
            controller.close()
          } catch (error) {
            console.error('SSE error:', error)
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ type: 'error', content: 'Stream failed' })}\n\n`
              )
            )
            controller.close()
          }
        })()
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin':
          process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3001',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    }
  )
})

import { serve } from '@hono/node-server'

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
