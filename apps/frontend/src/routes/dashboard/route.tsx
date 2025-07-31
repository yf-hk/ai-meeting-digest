import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  FileText,
  Plus,
  Share,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { DeleteMeeting } from '@/components/delete-meeting'
import { ExportMeeting } from '@/components/export-meeting'
import { MeetingAnalytics } from '@/components/meeting-analytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import type { Meeting } from '@/types/meeting'
import { orpc } from '@/utils/orpc'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = Route.useNavigate()
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  const meetings = useQuery({
    ...orpc.meetings.list.queryOptions({
      input: {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      },
    }),
    enabled: !!session,
  }) as { data?: { data?: Meeting[] } }

  const handleShare = async (meeting: Meeting) => {
    if (!meeting.summary?.publicId) return

    try {
      const shareUrl = `${window.location.origin}/digest/${meeting.summary.publicId}`
      await navigator.clipboard.writeText(shareUrl)
      setCopiedMeetingId(meeting.id)
      setTimeout(() => setCopiedMeetingId(null), 2000)
    } catch (error) {
      console.error('Failed to copy share URL:', error)
    }
  }

  useEffect(() => {
    if (!(session || isPending)) {
      navigate({ to: '/login' })
    }
  }, [session, isPending])

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl text-foreground">
                Meeting Digest
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {session.user.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="flex items-center gap-2"
                onClick={() => setShowAnalytics(!showAnalytics)}
                variant={showAnalytics ? 'default' : 'outline'}
              >
                <BarChart3 className="h-4 w-4" />
                {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </Button>
              <Link to="/meeting/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Meeting
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Total Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-foreground">
                {meetings.data?.pagination?.totalCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-chart-4">
                {meetings.data?.data?.filter(
                  (m: Meeting) => m.status === 'completed'
                ).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-chart-2">
                {meetings.data?.data?.filter(
                  (m: Meeting) => m.status === 'processing'
                ).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-primary">
                {meetings.data?.data?.reduce(
                  (sum: number, m: Meeting) =>
                    sum + (m._count?.action_items || 0),
                  0
                ) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        {showAnalytics && meetings.data?.data && (
          <div className="mb-8">
            <h2 className="mb-6 font-semibold text-2xl text-foreground">
              Meeting Analytics & Insights
            </h2>
            <MeetingAnalytics meetings={meetings.data.data} />
          </div>
        )}

        <div className="space-y-4">
          {meetings.data?.data && meetings.data.data.length > 0 ? (
            meetings.data.data.map((meeting) => (
              <Card
                className="border-border/50 bg-card/60 backdrop-blur-sm transition-all hover:shadow-lg"
                data-testid="meeting-card"
                key={meeting.id}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-lg">
                          {meeting.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 font-medium text-xs ${
                            meeting.status === 'COMPLETED'
                              ? 'bg-chart-4/20 text-chart-4'
                              : meeting.status === 'PROCESSING'
                                ? 'bg-chart-2/20 text-chart-2'
                                : meeting.status === 'FAILED'
                                  ? 'bg-destructive/20 text-destructive'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {meeting.status === 'COMPLETED' && (
                            <CheckCircle className="mr-1 inline h-3 w-3" />
                          )}
                          {meeting.status === 'PROCESSING' && (
                            <Clock className="mr-1 inline h-3 w-3" />
                          )}
                          {meeting.status === 'FAILED' && (
                            <AlertCircle className="mr-1 inline h-3 w-3" />
                          )}
                          {meeting.status.toLowerCase()}
                        </span>
                      </div>
                      {meeting.description && (
                        <p className="mb-3 text-muted-foreground">
                          {meeting.description}
                        </p>
                      )}
                      <div className="mb-3 flex items-center gap-4 text-muted-foreground text-sm">
                        <span>
                          Created:{' '}
                          {new Date(meeting.createdAt).toLocaleDateString()}
                        </span>
                        {meeting._count && (
                          <>
                            <span>•</span>
                            <span>
                              {meeting._count.actionItems || 0} action items
                            </span>
                            <span>•</span>
                            <span>{meeting._count.topics || 0} topics</span>
                            <span>•</span>
                            <span>{meeting._count.comments || 0} comments</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      {meeting.summary && <ExportMeeting meeting={meeting} />}
                      {meeting.summary?.publicId && (
                        <Button
                          className="flex items-center gap-2"
                          onClick={() => handleShare(meeting)}
                          size="sm"
                          variant="outline"
                        >
                          {copiedMeetingId === meeting.id ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Share className="h-4 w-4" />
                              Share
                            </>
                          )}
                        </Button>
                      )}
                      <Link
                        params={{ meetingId: meeting.id }}
                        to="/meeting/$meetingId"
                      >
                        <Button
                          className="flex items-center gap-2"
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <DeleteMeeting
                        meetingId={meeting.id}
                        meetingTitle={meeting.title}
                        onDelete={() => {
                          meetings.refetch()
                          // If we're on the last page and only one item, go back to previous page
                          if (
                            meetings.data?.data.length === 1 &&
                            currentPage > 1
                          ) {
                            setCurrentPage(currentPage - 1)
                          }
                        }}
                        variant="icon"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-border/50 bg-gradient-to-br from-card to-accent/10 py-16 text-center shadow-lg backdrop-blur-sm">
              <CardContent>
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-chart-3/20">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground text-xl">
                  No meetings found
                </h3>
                <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                  Start your AI-powered meeting analysis journey by creating
                  your first meeting.
                </p>
                <Link to="/meeting/new">
                  <Button
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    size="lg"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Meeting
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {meetings.data?.data && meetings.data.pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="rounded-lg border bg-card p-2 shadow-sm">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      className={cn(
                        meetings.data.pagination.hasPreviousPage
                          ? 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
                          : 'pointer-events-none cursor-not-allowed opacity-50'
                      )}
                      onClick={
                        meetings.data.pagination.hasPreviousPage
                          ? () =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                          : undefined
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: meetings.data.pagination.totalPages },
                    (_, i) => i + 1
                  )
                    .filter((page) => {
                      const current = meetings.data.pagination.currentPage
                      return (
                        page === 1 ||
                        page === meetings.data.pagination.totalPages ||
                        Math.abs(page - current) <= 1
                      )
                    })
                    .map((page, index, array) => {
                      const showEllipsis =
                        index > 0 && array[index - 1] < page - 1
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <PaginationItem>
                              <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                                ...
                              </span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                              isActive={
                                page === meetings.data.pagination.currentPage
                              }
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      )
                    })}

                  <PaginationItem>
                    <PaginationNext
                      className={cn(
                        meetings.data.pagination.hasNextPage
                          ? 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
                          : 'pointer-events-none cursor-not-allowed opacity-50'
                      )}
                      onClick={
                        meetings.data.pagination.hasNextPage
                          ? () =>
                              setCurrentPage((prev) =>
                                Math.min(
                                  meetings.data.pagination.totalPages,
                                  prev + 1
                                )
                              )
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
