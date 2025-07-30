import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from '../../prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  emailAndPassword: {
    enabled: true,
  },
})
