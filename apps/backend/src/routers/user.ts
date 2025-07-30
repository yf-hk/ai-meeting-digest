import { protectedProcedure } from '../lib/orpc'

export const userRouter = {
  // Get current user profile
  profile: protectedProcedure.handler(({ context }) => {
    return {
      user: context.session?.user,
    }
  }),
}
