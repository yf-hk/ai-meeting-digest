import { z } from 'zod'
import { meetingService } from '../lib/meeting-service'
import { protectedProcedure } from '../lib/orpc'

export const commentsRouter = {
  // Add comment to meeting
  add: protectedProcedure
    .input(
      z.object({
        meetingId: z.string().uuid(),
        content: z.string().min(1),
        threadId: z.string().uuid().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      const comment = await meetingService.addComment(
        input.meetingId,
        userId,
        input.content,
        input.threadId
      )
      return comment
    }),
}
