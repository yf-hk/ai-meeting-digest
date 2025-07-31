import type { Prisma } from '@prisma/client'

// Base Prisma types
export type User = Prisma.UserGetPayload<{}>
export type Meeting = Prisma.MeetingGetPayload<{}>
export type ActionItem = Prisma.ActionItemGetPayload<{}>
export type Summary = Prisma.SummaryGetPayload<{}>
export type Transcript = Prisma.TranscriptGetPayload<{}>
export type Participant = Prisma.ParticipantGetPayload<{}>
export type MeetingTag = Prisma.MeetingTagGetPayload<{}>
export type ProcessingJob = Prisma.ProcessingJobGetPayload<{}>

// Extended types with relations
export type MeetingWithRelations = Prisma.MeetingGetPayload<{
  include: {
    user: true
    participants: true
    meeting_tags: true
    transcript: true
    summary: true
    action_items: true
    processing_job: true
  }
}>

export type MeetingWithUser = Prisma.MeetingGetPayload<{
  include: {
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>

export type MeetingWithCounts = Prisma.MeetingGetPayload<{
  include: {
    _count: {
      select: {
        action_items: true
        participants: true
        meeting_tags: true
      }
    }
  }
}>

// AI-related types
export interface ProcessedSummary {
  executiveSummary: string
  keyPoints: string[]
  decisions: Array<{
    decision: string
    rationale?: string
    impact?: string
  }>
  nextSteps: string[]
  processingTime: number
}

export interface ProcessedActionItem {
  description: string
  assignee?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  context?: string
}

export interface ProcessedTopic {
  topic: string
  sentimentScore: number
  importanceScore: number
  startTime?: number
  duration?: number
}

export interface TranscriptionResult {
  content: string
  confidenceScore: number
  processingTime: number
}

// Meeting status types
export type MeetingStatus = 'uploaded' | 'processing' | 'completed' | 'failed'
export type ActionItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type ActionItemPriority = 'low' | 'medium' | 'high' | 'urgent'

// Query options
export interface MeetingQueryOptions {
  workspaceId?: string
  status?: MeetingStatus
  limit?: number
  offset?: number
}

// Where clause types for Prisma queries
export type MeetingWhereInput = Prisma.MeetingWhereInput
export type ActionItemWhereInput = Prisma.ActionItemWhereInput

// Error types
export interface APIError {
  statusCode?: number
  message: string
  code?: string
}
