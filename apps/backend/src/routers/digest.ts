import { z } from 'zod'
import { meetingService } from '../lib/meeting-service'
import { publicProcedure } from '../lib/orpc'

export const digestRouter = {
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
}
