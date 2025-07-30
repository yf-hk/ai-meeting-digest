import type { Hono } from 'hono'
import { createContext } from '../lib/context'
import { meetingService } from '../lib/meeting-service'

export function setupSSERoutes(app: Hono) {
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
}
