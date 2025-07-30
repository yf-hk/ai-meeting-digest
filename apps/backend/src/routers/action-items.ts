import { z } from 'zod'
import { meetingService } from '../lib/meeting-service'
import { protectedProcedure } from '../lib/orpc'

export const actionItemsRouter = {
  // Update action item
  update: protectedProcedure
    .input(
      z.object({
        actionItemId: z.string().uuid(),
        status: z
          .enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const)
          .optional(),
        assigneeId: z.string().uuid().optional(),
        dueDate: z.string().datetime().optional(),
        description: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      const { actionItemId, ...updates } = input
      const actionItem = await meetingService.updateActionItem(
        actionItemId,
        userId,
        updates
      )
      return actionItem
    }),
}
