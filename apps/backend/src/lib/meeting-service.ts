import type { Prisma } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import type {
  ProcessedActionItem,
  ProcessedSummary,
  ProcessedTopic,
} from './ai'
import { processMeetingContent, processMeetingContentStream } from './ai'
import { prisma } from './prisma'

// Input validation schemas
export const createMeetingSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  workspaceId: z.string().uuid().optional(),
})

export const uploadFileSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
})

export class MeetingService {
  async createMeeting(
    userId: string,
    data: z.infer<typeof createMeetingSchema>
  ) {
    try {
      const meeting = await prisma.meeting.create({
        data: {
          title: data.title,
          description: data.description,
          file_path: '/tmp/placeholder.txt', // Required field - placeholder for tests
          file_size: 0, // Required field - placeholder for tests
          file_type: 'text/plain', // Required field - placeholder for tests
          status: 'uploaded',
          user_id: userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return meeting
    } catch (error) {
      console.error('Error creating meeting:', error)
      throw error
    }
  }

  async getUserMeetings(
    userId: string,
    options: {
      workspaceId?: string
      status?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    try {
      const where: Prisma.MeetingWhereInput = { user_id: userId }

      if (options.workspaceId) {
        where.workspaceId = options.workspaceId
      }

      if (options.status) {
        where.status = options.status
      }

      const [meetings, totalCount] = await Promise.all([
        prisma.meeting.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: options.limit || 50,
          skip: options.offset || 0,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
            files: true,
            transcript: true,
            summary: true,
            actionItems: true,
            topics: true,
            _count: {
              select: {
                actionItems: true,
                topics: true,
                comments: true,
              },
            },
          },
        }),
        prisma.meeting.count({ where }),
      ])

      const limit = options.limit || 50
      const offset = options.offset || 0
      const totalPages = Math.ceil(totalCount / limit)
      const currentPage = Math.floor(offset / limit) + 1

      return {
        data: meetings,
        pagination: {
          totalCount,
          totalPages,
          currentPage,
          limit,
          offset,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      }
    } catch (error) {
      console.error('Error fetching user meetings:', error)
      throw new Error('Failed to fetch meetings')
    }
  }

  async getMeetingById(meetingId: string, userId: string) {
    try {
      const meeting = await prisma.meeting.findFirst({
        where: {
          id: meetingId,
          userId, // Ensure user can only access their own meetings
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
          files: true,
          transcript: true,
          summary: true,
          actionItems: {
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          topics: true,
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      })

      if (!meeting) {
        throw new Error('Meeting not found')
      }

      return meeting
    } catch (error) {
      console.error('Error fetching meeting:', error)
      throw new Error('Failed to fetch meeting')
    }
  }

  async uploadMeetingFile(
    meetingId: string,
    userId: string,
    fileData: {
      fileName: string
      fileType: string
      fileSize: number
      fileBuffer: Buffer
    }
  ) {
    try {
      // Verify meeting ownership
      const meeting = await prisma.meeting.findFirst({
        where: { id: meetingId, userId },
      })

      if (!meeting) {
        throw new Error('Meeting not found or access denied')
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads')
      await fs.mkdir(uploadsDir, { recursive: true })

      // Generate unique filename
      const fileExtension = path.extname(fileData.fileName)
      const uniqueFileName = `${meetingId}-${Date.now()}${fileExtension}`
      const filePath = path.join(uploadsDir, uniqueFileName)

      // Save file to disk
      await fs.writeFile(filePath, fileData.fileBuffer)

      // Save file record to database
      const meetingFile = await prisma.meetingFile.create({
        data: {
          meetingId,
          fileName: fileData.fileName,
          filePath,
          fileType: fileData.fileType,
          fileSize: BigInt(fileData.fileSize),
        },
      })

      // Update meeting status to processing
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'PROCESSING' },
      })

      return meetingFile
    } catch (error) {
      console.error('Error uploading meeting file:', error)
      throw new Error('Failed to upload meeting file')
    }
  }

  async processMeeting(meetingId: string, userId: string) {
    try {
      // Verify meeting ownership
      const meeting = await prisma.meeting.findFirst({
        where: { id: meetingId, userId },
        include: { files: true },
      })

      if (!meeting) {
        throw new Error('Meeting not found or access denied')
      }

      if (meeting.files.length === 0) {
        throw new Error('No files uploaded for this meeting')
      }

      // Update status to processing
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'PROCESSING' },
      })

      // Process the first uploaded file
      const file = meeting.files[0]

      try {
        // Read file buffer
        const fileBuffer = await fs.readFile(file.filePath)

        let transcriptionResult

        // Check if it's a text file (pasted transcript)
        if (file.fileType === 'text/plain' || file.fileName.endsWith('.txt')) {
          // For text files, use the content directly as transcript
          const textContent = fileBuffer.toString('utf-8')
          transcriptionResult = {
            content: textContent,
            confidenceScore: 1.0, // Perfect confidence for direct text
            processingTime: 0,
          }
        } else {
          // For audio/video files, transcription is not supported
          throw new Error(
            'Audio/video transcription not supported - please upload a text transcript instead'
          )
        }

        // Save transcript
        const transcript = await prisma.meetingTranscript.create({
          data: {
            meetingId,
            content: transcriptionResult.content,
            confidenceScore: transcriptionResult.confidenceScore,
            processingTime: transcriptionResult.processingTime,
          },
        })

        // Try to process meeting content with AI (summary, action items, topics)
        let summary = null
        let actionItems: unknown[] = []
        let topics: unknown[] = []

        try {
          const processedContent = await processMeetingContent(
            transcriptionResult.content
          )

          // Save summary
          summary = await prisma.summary.create({
            data: {
              meetingId,
              executiveSummary: processedContent.summary.executiveSummary,
              keyPoints: processedContent.summary.keyPoints,
              decisions: processedContent.summary.decisions,
              nextSteps: processedContent.summary.nextSteps,
              processingTime: processedContent.summary.processingTime,
            },
          })

          // Save action items
          actionItems = await Promise.all(
            processedContent.actionItems.map((item) => {
              // Parse and validate due date
              let parsedDueDate: Date | null = null
              if (item.dueDate) {
                try {
                  const date = new Date(item.dueDate)
                  // Check if the date is valid
                  if (isNaN(date.getTime())) {
                    console.warn(`Invalid due date format: ${item.dueDate}`)
                  } else {
                    parsedDueDate = date
                  }
                } catch (error) {
                  console.warn(
                    `Failed to parse due date: ${item.dueDate}`,
                    error
                  )
                }
              }

              return prisma.actionItem.create({
                data: {
                  meetingId,
                  description: item.description,
                  // assigneeId would need to be resolved from the assignee name
                  dueDate: parsedDueDate,
                  priority: item.priority,
                  status: 'PENDING',
                },
              })
            })
          )

          // Save topics
          topics = await Promise.all(
            processedContent.topics.map((topic) =>
              prisma.topic.create({
                data: {
                  meetingId,
                  topic: topic.topic,
                  sentimentScore: topic.sentimentScore,
                  importanceScore: topic.importanceScore,
                  startTime: topic.startTime,
                  endTime:
                    topic.startTime && topic.duration
                      ? topic.startTime + topic.duration
                      : null,
                },
              })
            )
          )

          // Update meeting status to completed
          await prisma.meeting.update({
            where: { id: meetingId },
            data: { status: 'COMPLETED' },
          })
        } catch (aiError) {
          console.warn(
            'AI processing failed, transcript saved without analysis:',
            aiError
          )

          // Update meeting status to completed (transcript is saved, AI analysis failed)
          await prisma.meeting.update({
            where: { id: meetingId },
            data: { status: 'COMPLETED' },
          })
        }

        return {
          transcript,
          summary,
          actionItems,
          topics,
        }
      } catch (processingError) {
        // Update meeting status to failed
        await prisma.meeting.update({
          where: { id: meetingId },
          data: { status: 'FAILED' },
        })
        throw processingError
      }
    } catch (error) {
      console.error('Error processing meeting:', error)
      throw new Error('Failed to process meeting')
    }
  }

  async updateActionItem(
    actionItemId: string,
    userId: string,
    updates: {
      status?: ActionStatus
      assigneeId?: string
      dueDate?: string
      description?: string
    }
  ) {
    try {
      // Verify the action item belongs to the user's meeting
      const actionItem = await prisma.actionItem.findFirst({
        where: {
          id: actionItemId,
          meeting: { userId },
        },
      })

      if (!actionItem) {
        throw new Error('Action item not found or access denied')
      }

      const updatedActionItem = await prisma.actionItem.update({
        where: { id: actionItemId },
        data: {
          ...(updates.status && { status: updates.status }),
          ...(updates.assigneeId && { assigneeId: updates.assigneeId }),
          ...(updates.dueDate && { dueDate: new Date(updates.dueDate) }),
          ...(updates.description && { description: updates.description }),
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return updatedActionItem
    } catch (error) {
      console.error('Error updating action item:', error)
      throw new Error('Failed to update action item')
    }
  }

  async addComment(
    meetingId: string,
    userId: string,
    content: string,
    threadId?: string
  ) {
    try {
      // Verify meeting ownership
      const meeting = await prisma.meeting.findFirst({
        where: { id: meetingId, userId },
      })

      if (!meeting) {
        throw new Error('Meeting not found or access denied')
      }

      const comment = await prisma.comment.create({
        data: {
          meetingId,
          userId,
          content,
          threadId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return comment
    } catch (error) {
      console.error('Error adding comment:', error)
      throw new Error('Failed to add comment')
    }
  }

  async deleteMeetingFile(meetingId: string, fileId: string, userId: string) {
    try {
      // Verify meeting ownership
      const meeting = await prisma.meeting.findFirst({
        where: { id: meetingId, userId },
        include: { files: true },
      })

      if (!meeting) {
        throw new Error('Meeting not found or access denied')
      }

      // Find the specific file
      const file = meeting.files.find((f) => f.id === fileId)
      if (!file) {
        throw new Error('File not found')
      }

      // Delete file from filesystem
      try {
        await fs.unlink(file.filePath)
      } catch (error) {
        console.warn(`Failed to delete file from filesystem: ${file.filePath}`)
      }

      // Delete file record from database
      await prisma.meetingFile.delete({
        where: { id: fileId },
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting meeting file:', error)
      throw new Error('Failed to delete meeting file')
    }
  }

  async deleteMeeting(meetingId: string, userId: string) {
    try {
      // Verify meeting ownership
      const meeting = await prisma.meeting.findFirst({
        where: { id: meetingId, userId },
        include: { files: true },
      })

      if (!meeting) {
        throw new Error('Meeting not found or access denied')
      }

      // Clean up uploaded files
      await Promise.all(
        meeting.files.map(async (file) => {
          try {
            await fs.unlink(file.filePath)
          } catch (error) {
            console.warn(`Failed to delete file: ${file.filePath}`)
          }
        })
      )

      // Delete meeting (cascade will handle related records)
      await prisma.meeting.delete({
        where: { id: meetingId },
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting meeting:', error)
      throw new Error('Failed to delete meeting')
    }
  }

  async getPublicDigest(publicId: string) {
    try {
      const summary = await prisma.summary.findUnique({
        where: { publicId },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              description: true,
              scheduledAt: true,
              createdAt: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

      if (!summary) {
        throw new Error('Public digest not found')
      }

      // Return anonymized public data
      return {
        publicId: summary.publicId,
        meeting: {
          title: summary.meeting.title,
          description: summary.meeting.description,
          scheduledAt: summary.meeting.scheduledAt,
          createdAt: summary.meeting.createdAt,
          organizer: summary.meeting.user.name,
        },
        summary: {
          executiveSummary: summary.executiveSummary,
          keyPoints: summary.keyPoints,
          decisions: summary.decisions,
          nextSteps: summary.nextSteps,
          createdAt: summary.createdAt,
        },
      }
    } catch (error) {
      console.error('Error fetching public digest:', error)
      throw new Error('Failed to fetch public digest')
    }
  }

  // Streaming version of meeting processing
  async *processMeetingStream(meetingId: string, userId: string) {
    try {
      console.log('Starting processMeetingStream for:', meetingId, userId)

      // Verify meeting ownership
      const meeting = await prisma.meeting.findFirst({
        where: { id: meetingId, userId },
        include: { files: true },
      })

      console.log(
        'Meeting found:',
        !!meeting,
        'Files count:',
        meeting?.files.length || 0
      )

      if (!meeting) {
        throw new Error('Meeting not found or access denied')
      }

      if (meeting.files.length === 0) {
        throw new Error('No files uploaded for this meeting')
      }

      // Update status to processing
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'PROCESSING' },
      })

      yield JSON.stringify({
        type: 'status',
        content: 'Reading uploaded files...',
      }) + '\n'

      // Process the first uploaded file
      const file = meeting.files[0]
      const fileBuffer = await fs.readFile(file.filePath)

      let transcriptionResult

      // Check if it's a text file (pasted transcript)
      if (file.fileType === 'text/plain' || file.fileName.endsWith('.txt')) {
        // For text files, use the content directly as transcript
        yield JSON.stringify({
          type: 'status',
          content: 'Processing pasted transcript...',
        }) + '\n'

        const textContent = fileBuffer.toString('utf-8')
        transcriptionResult = {
          content: textContent,
          confidenceScore: 1.0, // Perfect confidence for direct text
          processingTime: 0,
        }
      } else {
        // For audio/video files, transcription is not supported
        yield JSON.stringify({
          type: 'error',
          content:
            'Audio/video transcription not supported - please upload a text transcript instead',
        }) + '\n'

        throw new Error('Audio/video transcription not supported')
      }

      // Save transcript
      const transcript = await prisma.meetingTranscript.create({
        data: {
          meetingId,
          content: transcriptionResult.content,
          confidenceScore: transcriptionResult.confidenceScore,
          processingTime: transcriptionResult.processingTime,
        },
      })

      yield JSON.stringify({ type: 'transcript', content: transcript }) + '\n'

      // Stream the AI processing
      for await (const chunk of processMeetingContentStream(
        transcriptionResult.content
      )) {
        yield JSON.stringify(chunk) + '\n'

        // Save results as they become available
        if (chunk.type === 'summary' && chunk.content) {
          const summaryContent = chunk.content as ProcessedSummary
          await prisma.summary.create({
            data: {
              meetingId,
              executiveSummary: summaryContent.executiveSummary,
              keyPoints: summaryContent.keyPoints,
              decisions: summaryContent.decisions,
              nextSteps: summaryContent.nextSteps,
              processingTime: summaryContent.processingTime,
            },
          })
        }

        if (chunk.type === 'actionItems' && chunk.content) {
          const actionItemsContent = chunk.content as ProcessedActionItem[]
          await Promise.all(
            actionItemsContent.map((item) => {
              // Parse and validate due date
              let parsedDueDate: Date | null = null
              if (item.dueDate) {
                try {
                  const date = new Date(item.dueDate)
                  // Check if the date is valid
                  if (isNaN(date.getTime())) {
                    console.warn(`Invalid due date format: ${item.dueDate}`)
                  } else {
                    parsedDueDate = date
                  }
                } catch (error) {
                  console.warn(
                    `Failed to parse due date: ${item.dueDate}`,
                    error
                  )
                }
              }

              return prisma.actionItem.create({
                data: {
                  meetingId,
                  description: item.description,
                  dueDate: parsedDueDate,
                  priority: item.priority,
                  status: 'PENDING',
                },
              })
            })
          )
        }

        if (chunk.type === 'topics' && chunk.content) {
          const topicsContent = chunk.content as ProcessedTopic[]
          await Promise.all(
            topicsContent.map((topic) =>
              prisma.topic.create({
                data: {
                  meetingId,
                  topic: topic.topic,
                  sentimentScore: topic.sentimentScore,
                  importanceScore: topic.importanceScore,
                  startTime: topic.startTime,
                  endTime:
                    topic.startTime && topic.duration
                      ? topic.startTime + topic.duration
                      : null,
                },
              })
            )
          )
        }

        if (chunk.type === 'complete') {
          // Update meeting status to completed
          await prisma.meeting.update({
            where: { id: meetingId },
            data: { status: 'COMPLETED' },
          })
        }

        if (chunk.type === 'error') {
          // AI processing failed, but transcript is saved - mark as completed
          await prisma.meeting.update({
            where: { id: meetingId },
            data: { status: 'COMPLETED' },
          })

          yield JSON.stringify({
            type: 'warning',
            content:
              'AI analysis failed, but transcript was saved successfully',
          }) + '\n'
        }
      }
    } catch (error) {
      console.error('Error in streaming processing:', error)

      // Update meeting status to failed
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'FAILED' },
      })

      yield JSON.stringify({
        type: 'error',
        content: 'Failed to process meeting',
      }) + '\n'
    }
  }

  // Workspace management methods
  async createWorkspace(
    userId: string,
    data: { name: string; description?: string }
  ) {
    try {
      const workspace = await prisma.workspace.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: userId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
              meetings: true,
            },
          },
        },
      })

      // Add creator as owner member
      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: 'OWNER',
        },
      })

      return workspace
    } catch (error) {
      console.error('Error creating workspace:', error)
      throw new Error('Failed to create workspace')
    }
  }

  async getUserWorkspaces(userId: string) {
    try {
      const memberships = await prisma.workspaceMember.findMany({
        where: { userId },
        include: {
          workspace: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  members: true,
                  meetings: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      })

      return memberships.map((m) => ({
        ...m.workspace,
        role: m.role,
        joinedAt: m.joinedAt,
      }))
    } catch (error) {
      console.error('Error fetching user workspaces:', error)
      throw new Error('Failed to fetch workspaces')
    }
  }

  async getWorkspaceById(workspaceId: string, userId: string) {
    try {
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId,
        },
        include: {
          workspace: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: { joinedAt: 'asc' },
              },
              meetings: {
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
              tags: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      })

      if (!membership) {
        throw new Error('Workspace not found or access denied')
      }

      return {
        ...membership.workspace,
        role: membership.role,
        joinedAt: membership.joinedAt,
      }
    } catch (error) {
      console.error('Error fetching workspace:', error)
      throw new Error('Failed to fetch workspace')
    }
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    updates: { name?: string; description?: string }
  ) {
    try {
      // Check if user has permission to update
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      })

      if (!membership) {
        throw new Error('Workspace not found or insufficient permissions')
      }

      const workspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: updates,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
              meetings: true,
            },
          },
        },
      })

      return workspace
    } catch (error) {
      console.error('Error updating workspace:', error)
      throw new Error('Failed to update workspace')
    }
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    try {
      // Check if user is the owner
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          ownerId: userId,
        },
      })

      if (!workspace) {
        throw new Error('Workspace not found or insufficient permissions')
      }

      await prisma.workspace.delete({
        where: { id: workspaceId },
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting workspace:', error)
      throw new Error('Failed to delete workspace')
    }
  }

  async addWorkspaceMember(
    workspaceId: string,
    requesterId: string,
    email: string,
    role: Exclude<WorkspaceRole, 'OWNER'>
  ) {
    try {
      // Check if requester has permission
      const requesterMembership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: requesterId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      })

      if (!requesterMembership) {
        throw new Error('Insufficient permissions')
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if already a member
      const existing = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: user.id,
        },
      })

      if (existing) {
        throw new Error('User is already a member of this workspace')
      }

      const member = await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: user.id,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return member
    } catch (error) {
      console.error('Error adding workspace member:', error)
      throw new Error('Failed to add workspace member')
    }
  }

  async removeWorkspaceMember(
    workspaceId: string,
    memberId: string,
    requesterId: string
  ) {
    try {
      // Check if requester has permission
      const requesterMembership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: requesterId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      })

      if (!requesterMembership) {
        throw new Error('Insufficient permissions')
      }

      // Cannot remove the owner
      const targetMembership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: memberId,
        },
      })

      if (targetMembership?.role === 'OWNER') {
        throw new Error('Cannot remove workspace owner')
      }

      await prisma.workspaceMember.deleteMany({
        where: {
          workspaceId,
          userId: memberId,
        },
      })

      return { success: true }
    } catch (error) {
      console.error('Error removing workspace member:', error)
      throw new Error('Failed to remove workspace member')
    }
  }

  // Meeting update method
  async updateMeeting(
    meetingId: string,
    userId: string,
    updates: {
      title?: string
      description?: string
      scheduledAt?: string
      duration?: number
    }
  ) {
    try {
      // Verify ownership
      const existing = await prisma.meeting.findFirst({
        where: { id: meetingId, userId },
      })

      if (!existing) {
        throw new Error('Meeting not found or access denied')
      }

      const updateData: {
        title?: string
        description?: string | null
        scheduledAt?: Date
        duration?: number
      } = {}
      if (updates.title) updateData.title = updates.title
      if (updates.description !== undefined)
        updateData.description = updates.description
      if (updates.scheduledAt)
        updateData.scheduledAt = new Date(updates.scheduledAt)
      if (updates.duration) updateData.duration = updates.duration

      const meeting = await prisma.meeting.update({
        where: { id: meetingId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return meeting
    } catch (error) {
      console.error('Error updating meeting:', error)
      throw new Error('Failed to update meeting')
    }
  }

  // Tag management methods
  async createTag(
    userId: string,
    data: { name: string; color: string; workspaceId: string }
  ) {
    try {
      // Verify workspace access
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: data.workspaceId,
          userId,
        },
      })

      if (!membership) {
        throw new Error('Workspace not found or access denied')
      }

      const tag = await prisma.tag.create({
        data: {
          name: data.name,
          color: data.color,
          workspaceId: data.workspaceId,
        },
      })

      return tag
    } catch (error) {
      console.error('Error creating tag:', error)
      throw new Error('Failed to create tag')
    }
  }

  async getWorkspaceTags(workspaceId: string, userId: string) {
    try {
      // Verify workspace access
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId,
        },
      })

      if (!membership) {
        throw new Error('Workspace not found or access denied')
      }

      const tags = await prisma.tag.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              meetings: true,
            },
          },
        },
      })

      return tags
    } catch (error) {
      console.error('Error fetching workspace tags:', error)
      throw new Error('Failed to fetch tags')
    }
  }

  async updateTag(
    tagId: string,
    userId: string,
    updates: { name?: string; color?: string }
  ) {
    try {
      // Verify access through workspace membership
      const tag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          workspace: {
            members: {
              some: {
                userId,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        },
      })

      if (!tag) {
        throw new Error('Tag not found or access denied')
      }

      const updatedTag = await prisma.tag.update({
        where: { id: tagId },
        data: updates,
      })

      return updatedTag
    } catch (error) {
      console.error('Error updating tag:', error)
      throw new Error('Failed to update tag')
    }
  }

  async deleteTag(tagId: string, userId: string) {
    try {
      // Verify access through workspace membership
      const tag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          workspace: {
            members: {
              some: {
                userId,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        },
      })

      if (!tag) {
        throw new Error('Tag not found or access denied')
      }

      await prisma.tag.delete({
        where: { id: tagId },
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting tag:', error)
      throw new Error('Failed to delete tag')
    }
  }

  async addTagToMeeting(meetingId: string, tagId: string, userId: string) {
    try {
      // Verify meeting ownership
      const meeting = await prisma.meeting.findFirst({
        where: { id: meetingId, userId },
      })

      if (!meeting) {
        throw new Error('Meeting not found or access denied')
      }

      // Verify tag access
      const tag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          workspace: {
            members: {
              some: { userId },
            },
          },
        },
      })

      if (!tag) {
        throw new Error('Tag not found or access denied')
      }

      // Check if already tagged
      const existing = await prisma.meetingTag.findFirst({
        where: {
          meetingId,
          tagId,
        },
      })

      if (existing) {
        return existing
      }

      const meetingTag = await prisma.meetingTag.create({
        data: {
          meetingId,
          tagId,
        },
        include: {
          tag: true,
        },
      })

      return meetingTag
    } catch (error) {
      console.error('Error adding tag to meeting:', error)
      throw new Error('Failed to add tag to meeting')
    }
  }

  async removeTagFromMeeting(meetingId: string, tagId: string, userId: string) {
    try {
      // Verify meeting ownership
      const meeting = await prisma.meeting.findFirst({
        where: { id: meetingId, userId },
      })

      if (!meeting) {
        throw new Error('Meeting not found or access denied')
      }

      await prisma.meetingTag.deleteMany({
        where: {
          meetingId,
          tagId,
        },
      })

      return { success: true }
    } catch (error) {
      console.error('Error removing tag from meeting:', error)
      throw new Error('Failed to remove tag from meeting')
    }
  }
}

export const meetingService = new MeetingService()
