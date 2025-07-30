import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { PrismaClient } from '../../../prisma/generated/client'
import { MeetingService } from '../meeting-service'

describe('MeetingService', () => {
  let prisma: PrismaClient
  let meetingService: MeetingService
  let testUserId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    meetingService = new MeetingService()

    try {
      // Test database connection first
      await prisma.$connect()

      // Create a test user
      const testUser = await prisma.user.create({
        data: {
          id: 'test-user-' + Date.now(),
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      testUserId = testUser.id
    } catch (error) {
      console.log(
        'Database connection failed, skipping tests:',
        (error as Error).message
      )
    }
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.meeting.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.user.delete({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  test('createMeeting should create a new meeting', async () => {
    const meetingData = {
      title: 'Test Meeting',
      description: 'This is a test meeting',
    }

    const meeting = await meetingService.createMeeting(testUserId, meetingData)

    expect(meeting).toBeDefined()
    expect(meeting.title).toBe(meetingData.title)
    expect(meeting.description).toBe(meetingData.description)
    expect(meeting.userId).toBe(testUserId)
    expect(meeting.status).toBe('CREATED')
    expect(meeting.user).toBeDefined()
    expect(meeting.user.id).toBe(testUserId)
  })

  test('getUserMeetings should return user meetings', async () => {
    // Create a few test meetings
    await meetingService.createMeeting(testUserId, { title: 'Meeting 1' })
    await meetingService.createMeeting(testUserId, { title: 'Meeting 2' })

    const result = await meetingService.getUserMeetings(testUserId)

    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThanOrEqual(2)
    expect(result.data.every((m) => m.userId === testUserId)).toBe(true)
    expect(result.pagination.totalCount).toBeGreaterThanOrEqual(2)
  })

  test('getMeetingById should return meeting details', async () => {
    const createdMeeting = await meetingService.createMeeting(testUserId, {
      title: 'Detailed Meeting',
      description: 'Meeting with details',
    })

    const meeting = await meetingService.getMeetingById(
      createdMeeting.id,
      testUserId
    )

    expect(meeting).toBeDefined()
    expect(meeting.id).toBe(createdMeeting.id)
    expect(meeting.title).toBe('Detailed Meeting')
    expect(meeting.description).toBe('Meeting with details')
    expect(meeting.actionItems).toBeDefined()
    expect(meeting.comments).toBeDefined()
    expect(meeting.tags).toBeDefined()
  })

  test('getMeetingById should throw error for non-existent meeting', async () => {
    await expect(
      meetingService.getMeetingById('non-existent-id', testUserId)
    ).rejects.toThrow('Failed to fetch meeting')
  })

  test('getMeetingById should throw error for wrong user', async () => {
    const createdMeeting = await meetingService.createMeeting(testUserId, {
      title: 'Private Meeting',
    })

    await expect(
      meetingService.getMeetingById(createdMeeting.id, 'wrong-user-id')
    ).rejects.toThrow('Failed to fetch meeting')
  })

  test('deleteMeeting should remove meeting', async () => {
    const createdMeeting = await meetingService.createMeeting(testUserId, {
      title: 'Meeting to Delete',
    })

    const result = await meetingService.deleteMeeting(
      createdMeeting.id,
      testUserId
    )
    expect(result.success).toBe(true)

    // Verify meeting is deleted
    await expect(
      meetingService.getMeetingById(createdMeeting.id, testUserId)
    ).rejects.toThrow('Failed to fetch meeting')
  })

  test('updateActionItem should update action item status', async () => {
    // Create meeting and action item
    const meeting = await meetingService.createMeeting(testUserId, {
      title: 'Meeting with Actions',
    })

    const actionItem = await prisma.actionItem.create({
      data: {
        meetingId: meeting.id,
        description: 'Test action item',
        status: 'PENDING',
        priority: 'MEDIUM',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    const updatedItem = await meetingService.updateActionItem(
      actionItem.id,
      testUserId,
      { status: 'COMPLETED' }
    )

    expect(updatedItem.status).toBe('COMPLETED')
    expect(updatedItem.id).toBe(actionItem.id)
  })

  test('addComment should add comment to meeting', async () => {
    const meeting = await meetingService.createMeeting(testUserId, {
      title: 'Meeting with Comments',
    })

    const comment = await meetingService.addComment(
      meeting.id,
      testUserId,
      'This is a test comment'
    )

    expect(comment).toBeDefined()
    expect(comment.content).toBe('This is a test comment')
    expect(comment.meetingId).toBe(meeting.id)
    expect(comment.userId).toBe(testUserId)
    expect(comment.user).toBeDefined()
  })

  test('service should handle validation errors gracefully', async () => {
    // Test invalid meeting ID for comment
    await expect(
      meetingService.addComment('invalid-meeting-id', testUserId, 'comment')
    ).rejects.toThrow()

    // Test invalid action item ID
    await expect(
      meetingService.updateActionItem('invalid-id', testUserId, {
        status: 'COMPLETED',
      })
    ).rejects.toThrow()
  })
})
