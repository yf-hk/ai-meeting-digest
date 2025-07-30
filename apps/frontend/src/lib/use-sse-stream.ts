import { useCallback, useEffect, useRef, useState } from 'react'

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
  content: any
}

export interface UseSSEStreamOptions {
  onChunk?: (chunk: StreamChunk) => void
  onComplete?: () => void
  onError?: (error: string) => void
}

export function useSSEStream(options: UseSSEStreamOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [chunks, setChunks] = useState<StreamChunk[]>([])
  const [currentStatus, setCurrentStatus] = useState<string>('')
  const [streamingText, setStreamingText] = useState<string>('')
  const eventSourceRef = useRef<EventSource | null>(null)

  const startStream = useCallback(
    (url: string) => {
      if (isStreaming) return

      setIsStreaming(true)
      setChunks([])
      setCurrentStatus('')
      setStreamingText('')

      const eventSource = new EventSource(url, {
        withCredentials: true,
      })

      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const chunk: StreamChunk = JSON.parse(event.data)

          setChunks((prev) => [...prev, chunk])

          // Handle different chunk types
          switch (chunk.type) {
            case 'status':
              setCurrentStatus(chunk.content)
              break
            case 'summary_chunk':
              setStreamingText((prev) => prev + chunk.content)
              break
            case 'complete':
              setIsStreaming(false)
              setCurrentStatus('Complete!')
              options.onComplete?.()
              break
            case 'error':
              setIsStreaming(false)
              setCurrentStatus(`Error: ${chunk.content}`)
              options.onError?.(chunk.content)
              break
          }

          options.onChunk?.(chunk)
        } catch (error) {
          console.error('Failed to parse SSE data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        setIsStreaming(false)
        setCurrentStatus('Connection error')
        options.onError?.('Connection failed')
        eventSource.close()
      }

      eventSource.onopen = () => {
        console.log('SSE connection opened')
      }
    },
    [isStreaming, options]
  )

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsStreaming(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [stopStream])

  return {
    isStreaming,
    chunks,
    currentStatus,
    streamingText,
    startStream,
    stopStream,
  }
}
