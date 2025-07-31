// Meeting-related types for the frontend
export interface Meeting {
  id: string
  title: string
  description?: string
  file_path: string
  file_size: number
  file_type: string
  duration?: number
  status: MeetingStatus
  created_at: Date | string
  updated_at: Date | string
  user_id: string
  user?: User
  participants?: Participant[]
  meeting_tags?: MeetingTag[]
  transcript?: Transcript
  summary?: Summary
  action_items?: ActionItem[]
  processing_job?: ProcessingJob[]
  _count?: {
    action_items?: number
    participants?: number
    meeting_tags?: number
  }
}

export interface User {
  id: string
  name: string
  email: string
  email_verified: boolean
  image?: string
  created_at: Date | string
  updated_at: Date | string
}

export interface ActionItem {
  id: string
  description: string
  assignee?: string
  due_date?: Date | string
  priority: ActionItemPriority
  status: ActionItemStatus
  meeting_id: string
  created_at: Date | string
  updated_at: Date | string
}

export interface Summary {
  id: string
  executive_summary: string
  key_points: unknown // JSON field
  decisions?: unknown // JSON field
  topics?: unknown // JSON field
  sentiment?: string
  meeting_id: string
  created_at: Date | string
  processingTime?: number
}

export interface Transcript {
  id: string
  content: string
  speaker_labels?: unknown // JSON field
  timestamps?: unknown // JSON field
  confidence_score?: number
  meeting_id: string
  created_at: Date | string
}

export interface Participant {
  id: string
  name: string
  email?: string
  role?: string
  meeting_id: string
  created_at: Date | string
}

export interface MeetingTag {
  id: string
  tag_name: string
  meeting_id: string
  created_at: Date | string
}

export interface ProcessingJob {
  id: string
  meeting_id: string
  job_type: string
  status: string
  progress: number
  error_message?: string
  started_at?: Date | string
  completed_at?: Date | string
  created_at: Date | string
}

// Enums
export type MeetingStatus = 'uploaded' | 'processing' | 'completed' | 'failed'
export type ActionItemStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
export type ActionItemPriority = 'low' | 'medium' | 'high' | 'urgent'

// Structured types for AI-processed data
export interface ProcessedDecision {
  decision: string
  rationale?: string
  impact?: string
  owner?: string
}

export interface ProcessedTopic {
  topic: string
  sentimentScore: number
  importanceScore: number
  startTime?: number
  duration?: number
}

export interface ProcessedSummary {
  executiveSummary: string
  keyPoints: string[]
  decisions: ProcessedDecision[]
  nextSteps: string[]
  processingTime?: number
}

// SSE Stream types
export interface StreamChunk {
  type:
    | 'status'
    | 'transcript'
    | 'summary'
    | 'summary_chunk'
    | 'actionItems'
    | 'topics'
    | 'complete'
    | 'error'
    | 'warning'
  content: unknown
}

// Analytics types
export interface MeetingAnalytics {
  totalMeetings: number
  completedMeetings: number
  totalActionItems: number
  completedActionItems: number
  avgProcessingTime: number
  completionRate: number
}

// Export/Share types
export interface ShareableMeeting {
  id: string
  title: string
  description?: string
  summary?: ProcessedSummary
  actionItems?: ActionItem[]
  topics?: ProcessedTopic[]
  participants?: Participant[]
  created_at: Date | string
}

// Digest types for public sharing
export interface PublicDigest {
  publicId: string
  meeting: {
    title: string
    description?: string
    created_at: Date | string
  }
  summary: ProcessedSummary
  actionItems: ActionItem[]
  topics: ProcessedTopic[]
  participants: Participant[]
}
