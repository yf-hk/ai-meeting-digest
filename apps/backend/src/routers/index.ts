import { actionItemsRouter } from './action-items'
import { analyticsRouter } from './analytics'
import { commentsRouter } from './comments'
import { digestRouter } from './digest'
import { healthRouter } from './health'
import { meetingsRouter } from './meetings'
import { tagsRouter } from './tags'
import { userRouter } from './user'
import { workspacesRouter } from './workspaces'

export const appRouter = {
  ...healthRouter,
  meetings: meetingsRouter,
  actionItems: actionItemsRouter,
  comments: commentsRouter,
  tags: tagsRouter,
  user: userRouter,
  digest: digestRouter,
  workspaces: workspacesRouter,
  analytics: analyticsRouter,
}

export type AppRouter = typeof appRouter
