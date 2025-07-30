import { z } from 'zod'
import { meetingService } from '../lib/meeting-service'
import { protectedProcedure } from '../lib/orpc'

export const analyticsRouter = {
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
}
