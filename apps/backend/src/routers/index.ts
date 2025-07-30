import { z } from 'zod'
import type {
  ActionPriority,
  ActionStatus,
  WorkspaceRole,
} from '../../prisma/generated/enums'
import {
  createMeetingSchema,
  meetingService,
  uploadFileSchema,
} from '../lib/meeting-service'
import { protectedProcedure, publicProcedure } from '../lib/orpc'

export const appRouter = {
  // Health check
  healthCheck: publicProcedure.handler(() => {
    return 'OK'
  }),

  // Meeting management routes
  meetings: {
    // Create a new meeting
    create: protectedProcedure
      .input(createMeetingSchema)
      .handler(async ({ input, context }) => {
        const userId = context.session?.user?.id!
        const meeting = await meetingService.createMeeting(userId, input)
        return meeting
      }),

    // Get user's meetings
    list: protectedProcedure
      .input(
        z
          .object({
            workspaceId: z.string().uuid().optional(),
            status: z.string().optional(),
            limit: z.number().min(1).max(100).default(50).optional(),
            offset: z.number().min(0).default(0).optional(),
          })
          .optional()
      )
      .handler(async ({ input, context }) => {
        const userId = context.session?.user?.id!
        const result = await meetingService.getUserMeetings(
          userId,
          input || {}
        )
        return result
      }),

    // Get meeting by ID
    getById: protectedProcedure
      .input(
        z.object({
          meetingId: z.string().uuid(),
        })
      )
      .handler(async ({ input, context }) => {
        const userId = context.session?.user?.id!
        const meeting = await meetingService.getMeetingById(
          input.meetingId,
          userId
        )
        return meeting
      }),

    // Upload meeting file
    uploadFile: protectedProcedure
      .input(
        z.object({
          meetingId: z.string().uuid(),
          fileName: z.string().min(1),
          fileType: z.string().min(1),
          fileSize: z.number().positive(),
          fileBuffer: z.string(), // base64 encoded file data
        })
      )
      .handler(async ({ input, context }) => {
        const userId = context.session?.user?.id!
        const fileBuffer = Buffer.from(input.fileBuffer, 'base64')

        const meetingFile = await meetingService.uploadMeetingFile(
          input.meetingId,
          userId,
          {
            fileName: input.fileName,
            fileType: input.fileType,
            fileSize: input.fileSize,
            fileBuffer,
          }
        )
        return meetingFile
      }),

    // Update meeting
    update: protectedProcedure
      .input(
        z.object({
          meetingId: z.string().uuid(),
          title: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          scheduledAt: z.string().datetime().optional(),
          duration: z.number().positive().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const userId = context.session?.user?.id!
        const { meetingId, ...updates } = input
        const meeting = await meetingService.updateMeeting(
          meetingId,
          userId,
          updates
        )
        return meeting
      }),

    // Process meeting (transcription + AI analysis)
    process: protectedProcedure
      .input(
        z.object({
          meetingId: z.string().uuid(),
        })
      )
      .handler(async ({ input, context }) => {
        const userId = context.session?.user?.id!
        const result = await meetingService.processMeeting(
          input.meetingId,
          userId
        )
        return result
      }),

    // Delete meeting file
    deleteFile: protectedProcedure
      .input(
        z.object({
          meetingId: z.string().uuid(),
          fileId: z.string().uuid(),
        })
      )
      .handler(async ({ input, context }) => {
        const userId = context.session?.user?.id!
        const result = await meetingService.deleteMeetingFile(
          input.meetingId,
          input.fileId,
          userId
        )
        return result
      }),

    // Delete meeting
    delete: protectedProcedure
      .input(
        z.object({
          meetingId: z.string().uuid(),
        })
      )
      .handler(async ({ input, context }) => {
        const userId = context.session?.user?.id!
        const result = await meetingService.deleteMeeting(
          input.meetingId,
          userId
        )
        return result
      }),
  },

  // Action items management
  actionItems: {
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
  },

  // Comments management
  comments: {
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
  },

  // Tag management
  tags: {
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
  },

  // User profile and settings
  user: {
    // Get current user profile
    profile: protectedProcedure.handler(({ context }) => {
      return {
        user: context.session?.user,
      }
    }),
  },

  // Public digest sharing routes
  digest: {
    // Get public digest by public ID (no authentication required)
    getByPublicId: publicProcedure
      .input(
        z.object({
          publicId: z.string(),
        })
      )
      .handler(async ({ input }) => {
        const digest = await meetingService.getPublicDigest(input.publicId)
        return digest
      }),
  },

  // Workspace management
  workspaces: {
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
  },

  // Analytics and insights
  analytics: {
    // Get meeting analytics
    overview: protectedProcedure
      .input(
        z
          .object({
            timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
            workspaceId: z.string().uuid().optional(),
          })
          .optional()
      )
      .handler(async ({ input, context }) => {
        const userId = context.session?.user?.id!
        const timeRange = input?.timeRange || '30d'

        // Calculate date range
        const now = new Date()
        const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
        const startDate = new Date(
          now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000
        )

        // Get meetings with related data
        const meetingsResult = await meetingService.getUserMeetings(userId, {
          workspaceId: input?.workspaceId,
          limit: 1000, // Get all for analytics
        })

        // Filter by date range
        const filteredMeetings = meetingsResult.data.filter(
          (m) => new Date(m.createdAt) >= startDate
        )

        // Calculate analytics
        const totalMeetings = filteredMeetings.length
        const completedMeetings = filteredMeetings.filter(
          (m) => m.status === 'COMPLETED'
        )
        const totalDuration = filteredMeetings.reduce(
          (sum, m) => sum + (m.duration || 0),
          0
        )

        // Action items analytics
        const allActionItems = filteredMeetings.reduce(
          (acc, m) => [...acc, ...(m.actionItems || [])],
          [] as any[]
        )
        const actionItemsCompleted = allActionItems.filter(
          (item) => item.status === 'COMPLETED'
        ).length
        const actionItemsPending = allActionItems.filter(
          (item) => item.status === 'PENDING'
        ).length

        // Processing time analytics
        const summariesWithTime = completedMeetings.filter(
          (m) => m.summary?.processingTime
        )
        const averageProcessingTime =
          summariesWithTime.length > 0
            ? summariesWithTime.reduce(
                (sum, m) => sum + (m.summary?.processingTime || 0),
                0
              ) / summariesWithTime.length
            : 0

        // Additional metrics
        const totalTopics = filteredMeetings.reduce(
          (sum, m) => sum + (m._count?.topics || 0),
          0
        )
        const totalComments = filteredMeetings.reduce(
          (sum, m) => sum + (m._count?.comments || 0),
          0
        )
        const averageTopicsPerMeeting =
          totalMeetings > 0 ? totalTopics / totalMeetings : 0
        const averageCommentsPerMeeting =
          totalMeetings > 0 ? totalComments / totalMeetings : 0

        // Engagement metrics
        const highPriorityActions = allActionItems.filter(
          (item) => item.priority === 'HIGH' || item.priority === 'URGENT'
        ).length

        const completionRate =
          allActionItems.length > 0
            ? (actionItemsCompleted / allActionItems.length) * 100
            : 0

        return {
          totalMeetings,
          completedMeetings: completedMeetings.length,
          totalDuration,
          actionItemsCompleted,
          actionItemsPending,
          averageProcessingTime: Math.round(averageProcessingTime),
          totalActionItems: allActionItems.length,
          completionRate: Math.round(completionRate),
          totalTopics,
          totalComments,
          averageTopicsPerMeeting:
            Math.round(averageTopicsPerMeeting * 10) / 10,
          averageCommentsPerMeeting:
            Math.round(averageCommentsPerMeeting * 10) / 10,
          highPriorityActions,
          processingSuccessRate:
            totalMeetings > 0
              ? Math.round((completedMeetings.length / totalMeetings) * 100)
              : 0,
        }
      }),
  },
}

export type AppRouter = typeof appRouter
