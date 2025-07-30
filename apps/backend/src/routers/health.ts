import { publicProcedure } from '../lib/orpc'

export const healthRouter = {
  // Health check
  healthCheck: publicProcedure.handler(() => {
    return 'OK'
  }),
}
