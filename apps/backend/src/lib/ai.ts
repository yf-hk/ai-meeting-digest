import { openrouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import { z } from 'zod'
import type { ActionPriority } from '../../prisma/generated/enums'

// Utility function to add delays between API calls
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Model fallback configuration
const PRIMARY_MODEL = 'google/gemini-2.5-flash'
const FALLBACK_MODEL = 'meta-llama/llama-3.2-3b-instruct:free'

// Helper function to try primary model first, then fallback
async function generateTextWithFallback(prompt: string, temperature = 0.1) {
  try {
    return await generateText({
      model: openrouter(PRIMARY_MODEL),
      prompt,
      temperature,
      maxRetries: 3,
    })
  } catch (error: any) {
    // If rate limited, try fallback model
    if (error?.statusCode === 429 || error?.message?.includes('rate limit')) {
      console.log('Primary model rate limited, trying fallback model...')
      return await generateText({
        model: openrouter(FALLBACK_MODEL),
        prompt,
        temperature,
        maxRetries: 3,
      })
    }
    throw error
  }
}

// Zod schemas for structured data generation
const summarySchema = z.object({
  executiveSummary: z
    .string()
    .describe('A 2-3 sentence executive summary of the meeting'),
  keyPoints: z
    .array(z.string())
    .describe('Key points discussed in the meeting'),
  decisions: z
    .array(
      z.object({
        decision: z.string().describe('What was decided'),
        rationale: z.string().describe('Why this decision was made'),
        owner: z
          .string()
          .optional()
          .describe('Who is responsible for this decision'),
      })
    )
    .describe('Decisions made during the meeting'),
  nextSteps: z
    .array(z.string())
    .describe('Action items and next steps from the meeting'),
})

const actionItemSchema = z.object({
  description: z.string().describe('What needs to be done'),
  assignee: z
    .string()
    .nullable()
    .optional()
    .describe('Person responsible for this action'),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .describe('Due date in YYYY-MM-DD format'),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'])
    .describe('Priority level of this action item'),
  context: z
    .string()
    .nullable()
    .optional()
    .describe('Additional context or details'),
})

const topicSchema = z.object({
  topic: z.string().describe('Name of the discussion topic'),
  sentimentScore: z
    .number()
    .min(-1)
    .max(1)
    .describe('Sentiment score from -1 (negative) to 1 (positive)'),
  importanceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('Importance score from 0 to 1'),
  startTime: z
    .number()
    .optional()
    .describe('Start time in seconds from meeting beginning'),
  duration: z
    .number()
    .optional()
    .describe('Duration of topic discussion in seconds'),
})

// Export types derived from schemas
export type ProcessedSummary = z.infer<typeof summarySchema> & {
  processingTime: number
}
export type ProcessedActionItem = z.infer<typeof actionItemSchema>
export type ProcessedTopic = z.infer<typeof topicSchema>

export async function generateMeetingSummary(
  transcript: string
): Promise<ProcessedSummary> {
  const startTime = Date.now()

  // Only proceed with AI processing if we have an API key
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not found - cannot generate AI summary')
  }

  try {
    console.log('Calling OpenRouter API for summary generation...')
    const { text } = await generateTextWithFallback(
      `Analyze this meeting transcript and extract key information. Return ONLY valid JSON in the exact format specified:

${transcript.slice(0, 4000)}${transcript.length > 4000 ? '...' : ''}

Return exactly this JSON structure:
{
  "executiveSummary": "[2-3 sentence executive summary]",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "decisions": [{"decision": "what was decided", "rationale": "why this decision was made", "owner": "who is responsible"}],
  "nextSteps": ["next step 1", "next step 2"]
}`,
      0.1
    )

    console.log('OpenRouter API response received, processing...')
    const processingTime = Math.round((Date.now() - startTime) / 1000)

    // Parse and validate the JSON response
    try {
      // Clean the response by removing markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      console.log('Cleaned AI response:', cleanedText.substring(0, 200) + '...')

      const jsonData = JSON.parse(cleanedText)
      const validatedData = summarySchema.parse(jsonData)

      console.log('Summary validation successful')
      return {
        ...validatedData,
        processingTime,
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw AI response:', text)
      throw new Error(
        `AI returned invalid response format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`
      )
    }
  } catch (apiError) {
    console.error('OpenRouter API call failed:', apiError)
    throw new Error(
      `Failed to generate AI summary: ${apiError instanceof Error ? apiError.message : 'Unknown API error'}`
    )
  }
}

export async function extractActionItems(transcript: string): Promise<{
  actionItems: ProcessedActionItem[]
}> {
  // Only proceed with AI processing if we have an API key
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      'OPENROUTER_API_KEY not found - cannot extract action items'
    )
  }

  try {
    console.log('Calling OpenRouter API for action items extraction...')
    const { text } = await generateTextWithFallback(
      `Extract action items from this meeting transcript. Return ONLY valid JSON in the exact format specified:

${transcript.slice(0, 3000)}${transcript.length > 3000 ? '...' : ''}

Identify specific tasks, assignments, and follow-up actions mentioned in the meeting. Return exactly this JSON structure:
{
  "actionItems": [
    {
      "description": "what needs to be done",
      "assignee": "person responsible (optional)",
      "priority": "LOW|MEDIUM|HIGH",
      "dueDate": "YYYY-MM-DD (optional)",
      "context": "additional context (optional)"
    }
  ]
}`,
      0.1
    )

    console.log('Action items API response received, processing...')
    // Parse and validate the JSON response
    try {
      // Clean the response by removing markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      console.log(
        'Cleaned action items response:',
        cleanedText.substring(0, 200) + '...'
      )

      const jsonData = JSON.parse(cleanedText)
      const actionItemsSchema = z.object({
        actionItems: z.array(actionItemSchema),
      })
      const validatedData = actionItemsSchema.parse(jsonData)

      console.log('Action items validation successful')
      return { actionItems: validatedData.actionItems }
    } catch (parseError) {
      console.error('Failed to parse action items response:', parseError)
      console.error('Raw action items response:', text)
      throw new Error(
        `AI returned invalid action items format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`
      )
    }
  } catch (apiError) {
    console.error('Action items API call failed:', apiError)
    throw new Error(
      `Failed to extract action items: ${apiError instanceof Error ? apiError.message : 'Unknown API error'}`
    )
  }
}

export async function extractTopics(transcript: string): Promise<{
  topics: ProcessedTopic[]
}> {
  // Only proceed with AI processing if we have an API key
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not found - cannot extract topics')
  }

  try {
    const { text } = await generateTextWithFallback(
      `Identify and analyze discussion topics from this meeting transcript. Return ONLY valid JSON in the exact format specified:

${transcript.slice(0, 3000)}${transcript.length > 3000 ? '...' : ''}

For each topic discussed, analyze sentiment and importance. Return exactly this JSON structure:
{
  "topics": [
    {
      "topic": "topic name",
      "sentimentScore": 0.7,
      "importanceScore": 0.8,
      "startTime": 0,
      "duration": 120
    }
  ]
}

Sentiment score: -1 (negative) to 1 (positive)
Importance score: 0 (low) to 1 (high)
Times in seconds (optional if not determinable)`,
      0.1
    )

    // Parse and validate the JSON response
    try {
      // Clean the response by removing markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      const jsonData = JSON.parse(cleanedText)
      const topicsSchema = z.object({
        topics: z.array(topicSchema),
      })
      const validatedData = topicsSchema.parse(jsonData)

      return { topics: validatedData.topics }
    } catch {
      throw new Error('AI returned invalid topics format')
    }
  } catch {
    throw new Error('Failed to extract topics')
  }
}

export function generateTranscription(
  _audioBuffer: Buffer,
  _fileName: string
): Promise<{
  content: string
  confidenceScore?: number
  processingTime: number
}> {
  // For audio transcription, we'd typically use OpenAI Whisper or similar
  // Since OpenRouter doesn't support audio directly, we'll throw an error
  // In a real implementation, you'd use a dedicated speech-to-text service
  throw new Error(
    'Audio transcription not implemented - please upload a text transcript instead'
  )
}

// Helper function to process entire meeting
export async function processMeetingContent(transcript: string) {
  try {
    const [summary, actionItems, topics] = await Promise.all([
      generateMeetingSummary(transcript),
      extractActionItems(transcript),
      extractTopics(transcript),
    ])

    return {
      summary,
      actionItems: actionItems.actionItems,
      topics: topics.topics,
    }
  } catch (error) {
    console.error('AI processing failed:', error)
    throw new Error(
      `Failed to process meeting content: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// Streaming version for real-time processing
export async function* processMeetingContentStream(transcript: string) {
  // Check if API key is available
  if (!process.env.OPENROUTER_API_KEY) {
    yield {
      type: 'error',
      content: 'OPENROUTER_API_KEY not found - cannot process meeting content',
    }
    return
  }

  try {
    yield { type: 'status', content: 'Starting AI analysis...' }

    // Generate summary
    yield { type: 'status', content: 'Generating executive summary...' }
    try {
      const summary = await generateMeetingSummary(transcript)
      yield { type: 'summary', content: summary }
    } catch (error) {
      console.error('Summary generation failed:', error)
      yield {
        type: 'warning',
        content: 'Failed to generate summary - continuing with other analysis',
      }
    }

    // Add delay to avoid rate limiting
    await delay(2000) // 2 second delay

    // Process action items
    yield { type: 'status', content: 'Extracting action items...' }
    try {
      const actionItems = await extractActionItems(transcript)
      yield { type: 'actionItems', content: actionItems.actionItems }
    } catch (error) {
      console.error('Action items extraction failed:', error)
      yield {
        type: 'warning',
        content:
          'Failed to extract action items - continuing with other analysis',
      }
    }

    // Add delay to avoid rate limiting
    await delay(2000) // 2 second delay

    // Process topics
    yield { type: 'status', content: 'Identifying discussion topics...' }
    try {
      const topics = await extractTopics(transcript)
      yield { type: 'topics', content: topics.topics }
    } catch (error) {
      console.error('Topics extraction failed:', error)
      yield {
        type: 'warning',
        content: 'Failed to extract topics - continuing with other analysis',
      }
    }

    yield { type: 'status', content: 'Analysis complete!' }
    yield { type: 'complete', content: null }
  } catch {
    yield {
      type: 'error',
      content: 'Failed to process meeting content with AI',
    }
  }
}
