import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Brain,
  Calendar,
  FileText,
  Mic,
  Plus,
  Upload,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { StreamingProcessor } from '@/components/streaming-processor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-client'
import { orpc, orpcClient } from '@/utils/orpc'

export const Route = createFileRoute('/meeting/new')({
  component: RouteComponent,
})

type CreateMethod = 'text' | 'file' | 'basic'

function RouteComponent() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [createMethod, setCreateMethod] = useState<CreateMethod>('text')
  const [meetingData, setMeetingData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    transcript: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [useStreaming, setUseStreaming] = useState(false)
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null)
  const [isProcessingWithStreaming, setIsProcessingWithStreaming] =
    useState(false)

  const createMeetingMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating meeting with data:', {
        title: meetingData.title,
        description: meetingData.description || undefined,
        scheduledAt: meetingData.scheduledAt || undefined,
      })
      return await orpcClient.meetings.create({
        title: meetingData.title,
        description: meetingData.description || undefined,
        scheduledAt: meetingData.scheduledAt || undefined,
      })
    },
    onSuccess: (meeting) => {
      console.log('Meeting created successfully:', meeting)
      navigate({ to: '/meeting/$meetingId', params: { meetingId: meeting.id } })
    },
    onError: (error) => {
      console.error('Meeting creation error:', error)
    },
  })

  const createWithTranscriptMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating meeting with transcript, data:', {
        title: meetingData.title,
        description: meetingData.description || undefined,
        scheduledAt: meetingData.scheduledAt || undefined,
      })
      // First create the meeting
      const meeting = await orpcClient.meetings.create({
        title: meetingData.title,
        description: meetingData.description || undefined,
        scheduledAt: meetingData.scheduledAt || undefined,
      })
      console.log('Meeting created for transcript processing:', meeting)

      // Then process the content
      if (createMethod === 'text' && meetingData.transcript.trim()) {
        // For text input, create a mock text file
        const fileBufferBase64 = btoa(
          unescape(encodeURIComponent(meetingData.transcript))
        )

        await orpcClient.meetings.uploadFile({
          meetingId: meeting.id,
          fileName: 'pasted-transcript.txt',
          fileType: 'text/plain',
          fileSize: new Blob([meetingData.transcript]).size,
          fileBuffer: fileBufferBase64,
        })

        if (!useStreaming) {
          // Process with AI (non-streaming)
          await orpcClient.meetings.process({ meetingId: meeting.id })
        }
      } else if (createMethod === 'file' && selectedFile) {
        // Handle file upload
        const fileBuffer = await selectedFile.arrayBuffer()
        const fileBufferBase64 = btoa(
          String.fromCharCode(...new Uint8Array(fileBuffer))
        )

        await orpcClient.meetings.uploadFile({
          meetingId: meeting.id,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          fileBuffer: fileBufferBase64,
        })

        if (!useStreaming) {
          // Process with AI (non-streaming)
          await orpcClient.meetings.process({ meetingId: meeting.id })
        }
      }

      return meeting
    },
    onSuccess: (meeting) => {
      console.log('Meeting with transcript created successfully:', meeting)
      if (useStreaming) {
        setCreatedMeetingId(meeting.id)
        setIsProcessingWithStreaming(true)
      } else {
        navigate({
          to: '/meeting/$meetingId',
          params: { meetingId: meeting.id },
        })
      }
    },
    onError: (error) => {
      console.error('Meeting with transcript creation error:', error)
    },
  })

  if (!session) {
    return <div>Please sign in to create a meeting.</div>
  }

  const handleSubmit = (e: React.FormEvent, streaming = false) => {
    e.preventDefault()

    if (!meetingData.title.trim()) {
      return
    }

    setUseStreaming(streaming)

    if (createMethod === 'basic') {
      createMeetingMutation.mutate()
    } else {
      createWithTranscriptMutation.mutate()
    }
  }

  const handleStreamingComplete = () => {
    setIsProcessingWithStreaming(false)
    if (createdMeetingId) {
      navigate({
        to: '/meeting/$meetingId',
        params: { meetingId: createdMeetingId },
      })
    }
  }

  const handleStreamingError = (error: string) => {
    setIsProcessingWithStreaming(false)
    console.error('Streaming processing error:', error)
  }

  const isLoading =
    createMeetingMutation.isPending || createWithTranscriptMutation.isPending

  // Helper function to determine if form submission should be disabled
  const isFormDisabled = () => {
    const baseConditions =
      isLoading || isProcessingWithStreaming || !meetingData.title.trim()

    if (createMethod === 'text') {
      return baseConditions || !meetingData.transcript.trim()
    }

    if (createMethod === 'file') {
      return baseConditions || !selectedFile
    }

    return baseConditions
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/20">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Button
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: '/dashboard' })}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="mb-4 font-bold text-4xl text-foreground">
              Create New Meeting
            </h1>
            <p className="text-lg text-muted-foreground">
              Start your AI-powered meeting analysis journey
            </p>
          </div>

          {/* Creation Method Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                How would you like to add your meeting content?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Paste Transcript Option */}
                <Button
                  className={`h-auto w-full flex-col gap-3 rounded-lg p-6 text-left transition-all duration-200 ${
                    createMethod === 'text'
                      ? '!border-solid !border-2 !border-primary !bg-primary !text-primary-foreground shadow-md'
                      : '!border-2 !border-dashed !border-muted-foreground/25 !bg-card !text-card-foreground hover:!border-muted-foreground/50 hover:!bg-accent'
                  }`}
                  onClick={() => setCreateMethod('text')}
                  type="button"
                >
                  <FileText className="h-8 w-8" />
                  <h3 className="font-semibold">Paste Transcript</h3>
                </Button>

                {/* Upload File Option */}
                <Button
                  className={`h-auto flex-col gap-3 rounded-lg p-6 text-left transition-all duration-200 ${
                    createMethod === 'file'
                      ? '!border-solid !border-2 !border-primary !bg-primary !text-primary-foreground shadow-md'
                      : '!border-2 !border-dashed !border-muted-foreground/25 !bg-card !text-card-foreground hover:!border-muted-foreground/50 hover:!bg-accent'
                  }`}
                  onClick={() => setCreateMethod('file')}
                  type="button"
                >
                  <Mic className="h-8 w-8" />
                  <h3 className="font-semibold">Upload Audio/Video</h3>
                </Button>

                {/* Create Empty Option */}
                <Button
                  className={`h-auto flex-col gap-3 rounded-lg p-6 text-left transition-all duration-200 ${
                    createMethod === 'basic'
                      ? '!border-solid !border-2 !border-primary !bg-primary !text-primary-foreground shadow-md'
                      : '!border-2 !border-dashed !border-muted-foreground/25 !bg-card !text-card-foreground hover:!border-muted-foreground/50 hover:!bg-accent'
                  }`}
                  onClick={() => setCreateMethod('basic')}
                  type="button"
                >
                  <Plus className="h-8 w-8" />
                  <h3 className="font-semibold">Create Empty</h3>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Form */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                onSubmit={(e) => handleSubmit(e, false)}
              >
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title">Meeting Title *</Label>
                    <Input
                      className="mt-1"
                      id="title"
                      onChange={(e) =>
                        setMeetingData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="e.g., Weekly Team Standup"
                      required
                      value={meetingData.title}
                    />
                  </div>

                  <div>
                    <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
                    <Input
                      className="mt-1"
                      id="scheduledAt"
                      onChange={(e) =>
                        setMeetingData((prev) => ({
                          ...prev,
                          scheduledAt: e.target.value,
                        }))
                      }
                      type="datetime-local"
                      value={meetingData.scheduledAt}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    className="mt-1"
                    id="description"
                    onChange={(e) =>
                      setMeetingData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description of the meeting purpose"
                    value={meetingData.description}
                  />
                </div>

                {/* Content Input */}
                {createMethod === 'text' && (
                  <div>
                    <Label htmlFor="transcript">Meeting Transcript *</Label>
                    <textarea
                      className="mt-1 min-h-96 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="transcript"
                      onChange={(e) =>
                        setMeetingData((prev) => ({
                          ...prev,
                          transcript: e.target.value,
                        }))
                      }
                      placeholder={`Paste your meeting transcript here...

Speaker 1: Welcome everyone to today's meeting...
Speaker 2: Thanks for organizing this...
Speaker 1: Let's start with the quarterly review...`}
                      required
                      value={meetingData.transcript}
                    />
                    <p className="mt-2 text-muted-foreground text-sm">
                      The AI will automatically extract summaries, action items,
                      and key insights from your transcript.
                    </p>
                  </div>
                )}

                {createMethod === 'file' && (
                  <div>
                    <Label htmlFor="file">Upload Meeting File *</Label>
                    <div className="mt-1 rounded-lg border-2 border-muted-foreground/25 border-dashed p-6 text-center transition-colors hover:border-muted-foreground/50">
                      <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <Label className="cursor-pointer" htmlFor="file">
                        <span className="font-medium text-foreground">
                          Click to upload or drag and drop
                        </span>
                        <p className="mt-2 text-muted-foreground text-sm">
                          Support for MP3, MP4, WAV, and other audio/video
                          formats
                        </p>
                      </Label>
                      <Input
                        accept="audio/*,video/*"
                        className="hidden"
                        id="file"
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                        required
                        type="file"
                      />
                    </div>

                    {selectedFile && (
                      <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <p className="font-medium text-primary">
                          {selectedFile.name}
                        </p>
                        <p className="text-primary/70 text-sm">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  {createMethod !== 'basic' && (
                    <div className="flex gap-3">
                      {/* Quick Process Button */}
                      <Button
                        className="flex-1"
                        disabled={isFormDisabled()}
                        type="submit"
                        variant="outline"
                      >
                        {isLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                            Quick Processing...
                          </>
                        ) : (
                          <>
                            <Brain className="mr-2 h-4 w-4" />
                            Quick Process
                          </>
                        )}
                      </Button>

                      {/* Stream Process Button */}
                      <Button
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        disabled={isFormDisabled()}
                        onClick={(e) => handleSubmit(e, true)}
                        type="button"
                      >
                        {isProcessingWithStreaming ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
                            Streaming...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Stream Process
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Create Empty Meeting Button */}
                  {createMethod === 'basic' && (
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      disabled={isFormDisabled()}
                      type="submit"
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Meeting
                        </>
                      )}
                    </Button>
                  )}

                  {/* Cancel Button */}
                  <Button
                    className="w-full"
                    onClick={() => navigate({ to: '/dashboard' })}
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>

                {/* AI Processing Info */}
                {createMethod !== 'basic' && (
                  <p className="text-center text-muted-foreground text-sm">
                    AI processing will automatically generate summaries, action
                    items, and insights from your content.
                  </p>
                )}

                {/* Error Display */}
                {(createMeetingMutation.error ||
                  createWithTranscriptMutation.error) && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-destructive">
                    <p className="font-medium">Error creating meeting</p>
                    <p className="mt-1 text-sm">
                      Please check your connection and try again.
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Streaming Processing */}
          {isProcessingWithStreaming && createdMeetingId && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Real-time AI Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StreamingProcessor
                  meetingId={createdMeetingId}
                  onComplete={handleStreamingComplete}
                  onError={handleStreamingError}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
