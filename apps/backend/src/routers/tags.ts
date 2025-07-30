import { z } from 'zod'
import { meetingService } from '../lib/meeting-service'
import { protectedProcedure } from '../lib/orpc'

export const tagsRouter = {
  // Create a new tag
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .default('#3B82F6'),
        workspaceId: z.string().uuid(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      const tag = await meetingService.createTag(userId, input)
      return tag
    }),

  // Get tags for workspace
  list: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      const tags = await meetingService.getWorkspaceTags(
        input.workspaceId,
        userId
      )
      return tags
    }),

  // Update tag
  update: protectedProcedure
    .input(
      z.object({
        tagId: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      const { tagId, ...updates } = input
      const tag = await meetingService.updateTag(tagId, userId, updates)
      return tag
    }),

  // Delete tag
  delete: protectedProcedure
    .input(
      z.object({
        tagId: z.string().uuid(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      await meetingService.deleteTag(input.tagId, userId)
      return { success: true }
    }),

  // Add tag to meeting
  addToMeeting: protectedProcedure
    .input(
      z.object({
        meetingId: z.string().uuid(),
        tagId: z.string().uuid(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      const result = await meetingService.addTagToMeeting(
        input.meetingId,
        input.tagId,
        userId
      )
      return result
    }),

  // Remove tag from meeting
  removeFromMeeting: protectedProcedure
    .input(
      z.object({
        meetingId: z.string().uuid(),
        tagId: z.string().uuid(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      await meetingService.removeTagFromMeeting(
        input.meetingId,
        input.tagId,
        userId
      )
      return { success: true }
    }),
}
