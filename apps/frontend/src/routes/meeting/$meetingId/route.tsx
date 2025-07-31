import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  CheckCircle,
  Clock,
  MessageSquare,
  Share,
  Upload,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { DeleteMeeting } from '@/components/delete-meeting'
import { ExportMeeting } from '@/components/export-meeting'
import Loader from '@/components/loader'
import { StreamingProcessor } from '@/components/streaming-processor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-client'
import type { Meeting, ProcessedTopic } from '@/types/meeting'
import { orpc, orpcClient } from '@/utils/orpc'
import type {
  ActionPriority,
  ActionStatus,
} from '../../../../../backend/prisma/generated/enums'

export const Route = createFileRoute('/meeting/$meetingId')({
  component: RouteComponent,
})

type ActionItemCardProps = {
  item: {
    id: string
    description: string
    status: ActionStatus
    priority: ActionPriority
    assignee?: {
      id: string
      name: string
      email: string
    } | null
    dueDate?: Date | null
    createdAt: Date
    updatedAt: Date
    meetingId: string
    assigneeId: string | null
  }
  onUpdate: () => void
}

function ActionItemCard({ item, onUpdate }: ActionItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [status, setStatus] = useState<ActionStatus>(item.status)

  const updateActionItemMutation = useMutation({
    mutationFn: async (updates: { status?: ActionStatus }) => {
      return await orpcClient.actionItems.update({
        actionItemId: item.id,
        ...updates,
      })
    },
    onSuccess: () => {
      setIsEditing(false)
      onUpdate()
    },
  })

  const handleStatusChange = (newStatus: ActionStatus) => {
    setStatus(newStatus)
    updateActionItemMutation.mutate({ status: newStatus })
  }

  return (
    <div className="rounded border p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-sm">{item.description}</p>
          <div className="mt-2 flex items-center gap-4 text-muted-foreground text-xs">
            <span
              className={`rounded px-2 py-1 ${
                item.priority === 'HIGH' || item.priority === 'URGENT'
                  ? 'bg-red-100 text-red-700'
                  : item.priority === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
              }`}
            >
              {item.priority}
            </span>

            {isEditing ? (
              <select
                className="rounded border px-2 py-1 text-xs"
                disabled={updateActionItemMutation.isPending}
                onChange={(e) =>
                  handleStatusChange(e.target.value as ActionStatus)
                }
                value={status}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            ) : (
              <span
                className={`cursor-pointer rounded px-2 py-1 hover:bg-opacity-80 ${
                  status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-700'
                      : status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setIsEditing(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsEditing(true)
                  }
                }}
                role="button"
                tabIndex={0}
                title="Click to edit status"
              >
                {status.replace('_', ' ')}
              </span>
            )}

            {item.assignee && <span>Assigned to: {item.assignee.name}</span>}
            {item.dueDate && (
              <span>Due: {item.dueDate.toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div className="ml-4 flex items-center gap-2">
          {isEditing && (
            <Button
              onClick={() => setIsEditing(false)}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          )}
          {updateActionItemMutation.isPending && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          )}
        </div>
      </div>
    </div>
  )
}

function RouteComponent() {
  const { meetingId } = useParams({ from: '/meeting/$meetingId' })
  const { session } = useAuth()
  const [comment, setComment] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [shareUrlCopied, setShareUrlCopied] = useState(false)
  const [useStreaming, setUseStreaming] = useState(false)
  const [isProcessingWithStreaming, setIsProcessingWithStreaming] =
    useState(false)

  const meetingQuery = useQuery({
    ...orpc.meetings.getById.queryOptions({ input: { meetingId } }),
    enabled: !!session,
  })

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await orpcClient.comments.add({ meetingId, content })
    },
    onSuccess: () => {
      setComment('')
      meetingQuery.refetch()
    },
  })

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileBuffer = await file.arrayBuffer()
      const fileBufferBase64 = btoa(
        String.fromCharCode(...new Uint8Array(fileBuffer))
      )
      return await orpcClient.meetings.uploadFile({
        meetingId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileBuffer: fileBufferBase64,
      })
    },
    onSuccess: () => {
      setSelectedFile(null)
      meetingQuery.refetch()
    },
  })

  const processAIMutation = useMutation({
    mutationFn: async () => {
      return await orpcClient.meetings.process({ meetingId })
    },
    onSuccess: () => {
      meetingQuery.refetch()
    },
  })

  const handleShare = async () => {
    if (!meeting?.summary?.publicId) {
      return
    }

    try {
      const shareUrl = `${window.location.origin}/digest/${meeting.summary.publicId}`
      await navigator.clipboard.writeText(shareUrl)
      setShareUrlCopied(true)
      setTimeout(() => setShareUrlCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy share URL:', error)
    }
  }

  const handleStreamingComplete = () => {
    setIsProcessingWithStreaming(false)
    meetingQuery.refetch()
  }

  const handleStreamingError = (error: string) => {
    setIsProcessingWithStreaming(false)
    console.error('Streaming processing error:', error)
  }

  if (!session) {
    return <div>Please sign in to view this meeting.</div>
  }

  if (meetingQuery.isLoading) {
    return <Loader />
  }

  if (meetingQuery.error || !meetingQuery.data) {
    return <div>Meeting not found or access denied.</div>
  }

  const meeting = meetingQuery.data as Meeting & {
    topics?: ProcessedTopic[]
    comments?: Array<{ id: string; content: string; author: { name: string } }>
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
      <div className="container mx-auto py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Button
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            onClick={() => window.history.back()}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-8">
          {/* Meeting Header */}
          <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-3xl text-transparent">
                    {meeting.title}
                  </CardTitle>
                  {meeting.description && (
                    <p className="mt-2 text-gray-600 text-lg">
                      {meeting.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {meeting.summary && <ExportMeeting meeting={meeting} />}
                  {meeting.summary?.publicId && (
                    <Button
                      className="flex items-center gap-2 border-gray-300 hover:border-blue-500"
                      onClick={handleShare}
                      size="sm"
                      variant="outline"
                    >
                      {shareUrlCopied ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Share className="h-4 w-4" />
                          Share Digest
                        </>
                      )}
                    </Button>
                  )}
                  <DeleteMeeting
                    meetingId={meetingId}
                    meetingTitle={meeting.title}
                    variant="icon"
                  />
                  <div
                    className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium text-sm ${
                      meeting.status === 'COMPLETED'
                        ? 'border border-green-200 bg-green-100 text-green-700'
                        : meeting.status === 'PROCESSING'
                          ? 'border border-blue-200 bg-blue-100 text-blue-700'
                          : meeting.status === 'FAILED'
                            ? 'border border-red-200 bg-red-100 text-red-700'
                            : 'border border-gray-200 bg-gray-100 text-gray-700'
                    }`}
                  >
                    {meeting.status === 'COMPLETED' && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {meeting.status === 'PROCESSING' && (
                      <Clock className="h-4 w-4" />
                    )}
                    {meeting.status === 'FAILED' && (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {meeting.status.toLowerCase()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                  <Label className="font-medium text-gray-500 text-sm">
                    Created
                  </Label>
                  <p className="mt-1 font-semibold text-gray-900">
                    {new Date(meeting.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                  <Label className="font-medium text-gray-500 text-sm">
                    Duration
                  </Label>
                  <p className="mt-1 font-semibold text-gray-900">
                    {meeting.duration ? `${meeting.duration} min` : 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                  <Label className="font-medium text-gray-500 text-sm">
                    Files
                  </Label>
                  <p className="mt-1 font-semibold text-gray-900">
                    {meeting.files?.length || 0} file(s)
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                  <Label className="font-medium text-gray-500 text-sm">
                    Owner
                  </Label>
                  <p className="mt-1 font-semibold text-gray-900">
                    {meeting.user?.name || 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Upload className="h-5 w-5 text-blue-600" />
                Upload Meeting File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border-2 border-gray-300 border-dashed p-8 text-center transition-colors hover:border-blue-400">
                <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <Label className="cursor-pointer" htmlFor="file">
                  <span className="font-medium text-gray-900 text-lg">
                    Drop files here or click to browse
                  </span>
                  <p className="mt-2 text-gray-600">
                    Supports audio and video files (MP3, MP4, WAV, etc.)
                  </p>
                </Label>
                <Input
                  accept="audio/*,video/*"
                  className="hidden"
                  id="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  type="file"
                />
              </div>

              {selectedFile && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="font-medium text-blue-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-blue-700 text-sm">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={!selectedFile || uploadFileMutation.isPending}
                  onClick={() =>
                    selectedFile && uploadFileMutation.mutate(selectedFile)
                  }
                >
                  {uploadFileMutation.isPending
                    ? 'Uploading...'
                    : 'Upload File'}
                </Button>

                {meeting.files &&
                  meeting.files.length > 0 &&
                  meeting.status === 'CREATED' && (
                    <div className="flex gap-2">
                      <Button
                        className="flex items-center gap-2"
                        disabled={
                          processAIMutation.isPending ||
                          isProcessingWithStreaming
                        }
                        onClick={() => {
                          setUseStreaming(false)
                          processAIMutation.mutate()
                        }}
                        variant="outline"
                      >
                        <Brain className="h-4 w-4" />
                        {processAIMutation.isPending
                          ? 'Processing...'
                          : 'Quick Process'}
                      </Button>

                      <Button
                        className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80"
                        disabled={
                          processAIMutation.isPending ||
                          isProcessingWithStreaming
                        }
                        onClick={() => {
                          setUseStreaming(true)
                          setIsProcessingWithStreaming(true)
                        }}
                      >
                        <Zap className="h-4 w-4" />
                        {isProcessingWithStreaming
                          ? 'Streaming...'
                          : 'Stream Process'}
                      </Button>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Streaming Processing */}
          {isProcessingWithStreaming && (
            <div>
              <h2 className="mb-4 font-semibold text-foreground text-xl">
                Real-time AI Processing
              </h2>
              <StreamingProcessor
                meetingId={meetingId}
                onComplete={handleStreamingComplete}
                onError={handleStreamingError}
              />
            </div>
          )}

          {/* AI Analysis Results */}
          {meeting.summary ? (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Summary Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium">Executive Summary</h4>
                    <p className="text-muted-foreground text-sm">
                      {meeting.summary.executiveSummary}
                    </p>
                  </div>

                  {meeting.summary.keyPoints &&
                    Array.isArray(meeting.summary.keyPoints) &&
                    meeting.summary.keyPoints.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-medium">Key Points</h4>
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
                          {meeting.summary.keyPoints.map(
                            (point, index: number) => (
                              <li key={index}>{String(point)}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {meeting.summary.nextSteps &&
                    Array.isArray(meeting.summary.nextSteps) &&
                    meeting.summary.nextSteps.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-medium">Next Steps</h4>
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
                          {meeting.summary.nextSteps.map(
                            (step, index: number) => (
                              <li key={index}>{String(step)}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ) : meeting.status === 'COMPLETED' && meeting.transcript ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-5 w-5" />
                  AI Analysis Unavailable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-700 text-sm">
                  This meeting has been processed and the transcript is
                  available, but AI analysis (summary, action items, and topics)
                  could not be generated. This may be due to API limitations or
                  processing errors.
                </p>
                <div className="mt-4">
                  <Button
                    className="flex items-center gap-2"
                    onClick={() => {
                      // Trigger reprocessing
                      window.location.reload()
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Brain className="h-4 w-4" />
                    Try Processing Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Action Items */}
          {meeting.action_items && meeting.action_items.length > 0 ? (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-chart-4" />
                  Action Items Extracted ({meeting.action_items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {meeting.action_items.map((item) => (
                    <ActionItemCard
                      item={item}
                      key={item.id}
                      onUpdate={() => meetingQuery.refetch()}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : meeting.status === 'COMPLETED' &&
            meeting.transcript &&
            !meeting.summary ? (
            <Card className="border-gray-200 bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-5 w-5" />
                  No Action Items Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  AI analysis was not available for this meeting, so no action
                  items could be extracted.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Topics */}
          {meeting.topics && meeting.topics.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Discussion Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {meeting.topics.map((topic) => (
                    <div className="rounded border p-3" key={topic.id}>
                      <h4 className="font-medium">{topic.topic}</h4>
                      <div className="mt-2 flex items-center gap-4 text-muted-foreground text-xs">
                        <span>
                          Sentiment:{' '}
                          {(topic.sentimentScore || 0) > 0.5
                            ? '😊 Positive'
                            : (topic.sentimentScore || 0) < -0.5
                              ? '😞 Negative'
                              : '😐 Neutral'}
                        </span>
                        <span>
                          Importance:{' '}
                          {Math.round((topic.importanceScore || 0) * 100)}%
                        </span>
                        {topic.startTime && (
                          <span>
                            Time: {Math.round(topic.startTime / 60)}min
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : meeting.status === 'COMPLETED' &&
            meeting.transcript &&
            !meeting.summary ? (
            <Card className="border-gray-200 bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <MessageSquare className="h-5 w-5" />
                  No Discussion Topics Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  AI analysis was not available for this meeting, so no
                  discussion topics could be identified.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Comments */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <Input
                  className="flex-1"
                  onChange={(e) => setComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && comment.trim()) {
                      addCommentMutation.mutate(comment.trim())
                    }
                  }}
                  placeholder="Add a comment..."
                  value={comment}
                />
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={!comment.trim() || addCommentMutation.isPending}
                  onClick={() =>
                    comment.trim() && addCommentMutation.mutate(comment.trim())
                  }
                >
                  {addCommentMutation.isPending ? 'Adding...' : 'Add'}
                </Button>
              </div>

              {meeting.comments && meeting.comments.length > 0 && (
                <div className="space-y-3">
                  {meeting.comments.map((comment) => (
                    <div className="rounded border p-3" key={comment.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm">{comment.content}</p>
                          <p className="mt-1 text-muted-foreground text-xs">
                            By {comment.user.name} on{' '}
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
