import { describe, expect, test } from 'vitest'
import {
  extractActionItems,
  extractTopics,
  generateMeetingSummary,
  generateTranscription,
  processMeetingContent,
} from '../ai'

describe('AI Service', () => {
  const mockTranscript = `
[Meeting Transcript]

Speaker 1: Welcome everyone to today's meeting. Let's start by reviewing our quarterly goals.

Speaker 2: Thanks for organizing this. I'd like to discuss the marketing campaign progress first.

Speaker 1: Great idea. Can you give us an update on the current status?

Speaker 2: We've completed the initial research phase and identified our target demographics. The creative team is working on the campaign materials, and we should have the first drafts ready by next Friday.

Speaker 3: That sounds promising. What about the budget allocation?

Speaker 2: We're currently within budget. I'll send a detailed breakdown to everyone after this meeting.

Speaker 1: Perfect. Let's also discuss the product launch timeline.

Speaker 3: The development team is on track. We should be ready for the beta release by the end of this month. However, we need to coordinate with marketing for the launch announcement.

Speaker 2: I can handle that coordination. Let's schedule a follow-up meeting next week to align our timelines.

Speaker 1: Excellent. Any other items to discuss before we wrap up?

Speaker 3: Just a quick reminder about the team building event next month. Please confirm your attendance.

Speaker 1: Thanks everyone. Let's reconvene next Tuesday at the same time.

[End of Transcript]
  `.trim()

  test('generateMeetingSummary should return structured summary', async () => {
    const result = await generateMeetingSummary(mockTranscript)

    expect(result).toBeDefined()
    expect(result.executiveSummary).toBeDefined()
    expect(typeof result.executiveSummary).toBe('string')
    expect(result.executiveSummary.length).toBeGreaterThan(50)

    expect(Array.isArray(result.keyPoints)).toBe(true)
    expect(result.keyPoints.length).toBeGreaterThan(0)

    expect(Array.isArray(result.decisions)).toBe(true)
    expect(Array.isArray(result.nextSteps)).toBe(true)
    expect(result.nextSteps.length).toBeGreaterThan(0)

    expect(typeof result.processingTime).toBe('number')
    expect(result.processingTime).toBeGreaterThan(0)
  })

  test('extractActionItems should return action items array', async () => {
    const result = await extractActionItems(mockTranscript)

    expect(result).toBeDefined()
    expect(Array.isArray(result.actionItems)).toBe(true)
    expect(result.actionItems.length).toBeGreaterThan(0)

    const firstItem = result.actionItems[0]
    expect(firstItem.description).toBeDefined()
    expect(typeof firstItem.description).toBe('string')
    expect(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).toContain(firstItem.priority)
  })

  test('extractTopics should return topics with scores', async () => {
    const result = await extractTopics(mockTranscript)

    expect(result).toBeDefined()
    expect(Array.isArray(result.topics)).toBe(true)
    expect(result.topics.length).toBeGreaterThan(0)

    const firstTopic = result.topics[0]
    expect(firstTopic.topic).toBeDefined()
    expect(typeof firstTopic.topic).toBe('string')
    expect(typeof firstTopic.sentimentScore).toBe('number')
    expect(firstTopic.sentimentScore).toBeGreaterThanOrEqual(-1)
    expect(firstTopic.sentimentScore).toBeLessThanOrEqual(1)
    expect(typeof firstTopic.importanceScore).toBe('number')
    expect(firstTopic.importanceScore).toBeGreaterThanOrEqual(0)
    expect(firstTopic.importanceScore).toBeLessThanOrEqual(1)
  })

  test('generateTranscription should return mock transcript', async () => {
    const mockBuffer = Buffer.from('mock audio data')
    const fileName = 'test-meeting.mp3'

    const result = await generateTranscription(mockBuffer, fileName)

    expect(result).toBeDefined()
    expect(result.content).toBeDefined()
    expect(typeof result.content).toBe('string')
    expect(result.content).toContain(fileName)
    expect(typeof result.confidenceScore).toBe('number')
    expect(result.confidenceScore).toBeGreaterThan(0)
    expect(result.confidenceScore).toBeLessThanOrEqual(1)
    expect(typeof result.processingTime).toBe('number')
    expect(result.processingTime).toBeGreaterThan(0)
  })

  test('processMeetingContent should return all analysis results', async () => {
    const result = await processMeetingContent(mockTranscript)

    expect(result).toBeDefined()
    expect(result.summary).toBeDefined()
    expect(result.actionItems).toBeDefined()
    expect(result.topics).toBeDefined()

    expect(Array.isArray(result.actionItems)).toBe(true)
    expect(Array.isArray(result.topics)).toBe(true)
    expect(typeof result.summary.executiveSummary).toBe('string')
  })

  test('AI processing should complete within reasonable time', async () => {
    const startTime = Date.now()
    const result = await processMeetingContent(mockTranscript)
    const totalTime = Date.now() - startTime

    // Should complete within 10 seconds (generous for demo purposes)
    expect(totalTime).toBeLessThan(10_000)
    expect(result).toBeDefined()
  })
})
