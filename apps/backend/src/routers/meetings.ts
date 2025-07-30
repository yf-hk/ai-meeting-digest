import { z } from 'zod'
import {
  createMeetingSchema,
  meetingService,
} from '../lib/meeting-service'
import { protectedProcedure } from '../lib/orpc'

export const meetingsRouter = {
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
}
