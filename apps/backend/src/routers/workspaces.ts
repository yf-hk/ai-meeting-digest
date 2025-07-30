import { z } from 'zod'
import { meetingService } from '../lib/meeting-service'
import { protectedProcedure } from '../lib/orpc'

export const workspacesRouter = {
  // Create a new workspace
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      const workspace = await meetingService.createWorkspace(userId, input)
      return workspace
    }),

  // Get user's workspaces
  list: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id!
    const workspaces = await meetingService.getUserWorkspaces(userId)
    return workspaces
  }),

  // Get workspace by ID
  getById: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      const workspace = await meetingService.getWorkspaceById(
        input.workspaceId,
        userId
      )
      return workspace
    }),

  // Update workspace
  update: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      const { workspaceId, ...updates } = input
      const workspace = await meetingService.updateWorkspace(
        workspaceId,
        userId,
        updates
      )
      return workspace
    }),

  // Delete workspace
  delete: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      await meetingService.deleteWorkspace(input.workspaceId, userId)
      return { success: true }
    }),

  // Add member to workspace
  addMember: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      const member = await meetingService.addWorkspaceMember(
        input.workspaceId,
        userId,
        input.email,
        input.role
      )
      return member
    }),

  // Remove member from workspace
  removeMember: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        memberId: z.string().uuid(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id!
      await meetingService.removeWorkspaceMember(
        input.workspaceId,
        input.memberId,
        userId
      )
      return { success: true }
    }),
}
