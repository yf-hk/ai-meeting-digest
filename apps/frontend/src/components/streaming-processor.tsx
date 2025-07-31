import {
  AlertCircle,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { type StreamChunk, useSSEStream } from '@/lib/use-sse-stream'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface StreamingProcessorProps {
  meetingId: string
  onComplete: () => void
  onError?: (error: string) => void
}

export function StreamingProcessor({
  meetingId,
  onComplete,
  onError,
}: StreamingProcessorProps) {
  const [summary, setSummary] = useState<any>(null)
  const [actionItems, setActionItems] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [transcript, setTranscript] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const {
    isStreaming,
    chunks,
    currentStatus,
    streamingText,
    startStream,
    stopStream,
  } = useSSEStream({
    onChunk: (chunk: StreamChunk) => {
      switch (chunk.type) {
        case 'transcript':
          setTranscript(chunk.content)
          break
        case 'summary':
          setSummary(chunk.content)
          break
        case 'actionItems':
          setActionItems(chunk.content)
          break
        case 'topics':
          setTopics(chunk.content)
          break
      }
    },
    onComplete: () => {
      setProcessing(false)
      onComplete()
    },
    onError: (error) => {
      setProcessing(false)
      onError?.(error)
    },
  })

  const handleStartProcessing = useCallback(() => {
    setProcessing(true)
    startStream(`/api/meetings/${meetingId}/process-stream`)
  }, [meetingId, startStream])

  const handleStopProcessing = useCallback(() => {
    setProcessing(false)
    stopStream()
  }, [stopStream])

  // Auto-start processing when component mounts
  useEffect(() => {
    handleStartProcessing()
  }, [meetingId, handleStartProcessing])

  return (
    <div className="space-y-6">
      {/* Processing Status */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Processing Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isStreaming || processing ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <span className="font-medium">
                {currentStatus || 'Ready to process'}
              </span>
            </div>

            {processing && (
              <Button
                onClick={handleStopProcessing}
                size="sm"
                variant="outline"
              >
                Stop Processing
              </Button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mt-4 space-y-2">
            {chunks.map((chunk, index) => (
              <div
                className="flex items-center gap-2 text-muted-foreground text-sm"
                key={index}
              >
                {chunk.type === 'status' && (
                  <>
                    <Clock className="h-3 w-3" />
                    {chunk.content}
                  </>
                )}
                {chunk.type === 'error' && (
                  <>
                    <AlertCircle className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">{chunk.content}</span>
                  </>
                )}
                {chunk.type === 'complete' && (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">
                      Processing completed!
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Summary Generation */}
      {streamingText && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 animate-pulse text-primary" />
              Generating Summary...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-24 whitespace-pre-wrap rounded-lg bg-muted/50 p-4 font-mono text-sm">
              {streamingText}
              <span className="animate-pulse">|</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results as they become available */}
      {transcript && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-chart-2" />
              Transcript Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              Confidence Score:{' '}
              {((transcript.confidenceScore || 0) * 100).toFixed(1)}% •
              Processing Time: {transcript.processingTime}s
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
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
                  {summary.executiveSummary}
                </p>
              </div>

              {summary.keyPoints && Array.isArray(summary.keyPoints) && (
                <div>
                  <h4 className="mb-2 font-medium">Key Points</h4>
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
                    {summary.keyPoints.map((point: string, index: number) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {actionItems.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-chart-4" />
              Action Items Extracted ({actionItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionItems.slice(0, 3).map((item, index) => (
                <div className="flex items-start gap-2 text-sm" key={index}>
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-chart-4" />
                  <span>{item.description}</span>
                </div>
              ))}
              {actionItems.length > 3 && (
                <p className="text-muted-foreground text-sm">
                  +{actionItems.length - 3} more action items
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {topics.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-chart-3" />
              Topics Identified ({topics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topics.slice(0, 3).map((topic, index) => (
                <div
                  className="flex items-center justify-between text-sm"
                  key={index}
                >
                  <span>{topic.topic}</span>
                  <span className="text-muted-foreground">
                    {Math.round((topic.importanceScore || 0) * 100)}% importance
                  </span>
                </div>
              ))}
              {topics.length > 3 && (
                <p className="text-muted-foreground text-sm">
                  +{topics.length - 3} more topics
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
