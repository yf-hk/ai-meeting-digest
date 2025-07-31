import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ExternalLink,
  FileText,
  Share,
  User,
} from 'lucide-react'
import { useState } from 'react'
import Loader from '@/components/loader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { ProcessedDecision } from '@/types/meeting'
import { orpc } from '@/utils/orpc'

export const Route = createFileRoute('/digest/$publicId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { publicId } = Route.useParams()
  const [copied, setCopied] = useState(false)

  const digestQuery = useQuery({
    ...orpc.digest.getByPublicId.queryOptions({ input: { publicId } }),
    retry: 1,
  })

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL to clipboard:', error)
    }
  }

  if (digestQuery.isLoading) {
    return <Loader />
  }

  if (digestQuery.error || !digestQuery.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/20">
        <div className="container mx-auto max-w-4xl py-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
              <FileText className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="mb-4 font-bold text-3xl text-foreground">
              Digest Not Found
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              The meeting digest you're looking for doesn't exist or may have
              been removed.
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const digest = digestQuery.data

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/20">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Share className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="mb-2 font-bold text-3xl text-foreground">
            Shared Meeting Digest
          </h1>
          <p className="text-muted-foreground">
            This digest has been shared publicly for your review
          </p>
        </div>

        <div className="space-y-8">
          {/* Meeting Header */}
          <Card className="border-0 bg-gradient-to-r from-primary/5 to-chart-3/5 shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-2 font-bold text-2xl text-foreground">
                    {digest.meeting.title}
                  </CardTitle>
                  {digest.meeting.description && (
                    <p className="text-lg text-muted-foreground">
                      {digest.meeting.description}
                    </p>
                  )}
                </div>
                <Button
                  className="shrink-0"
                  onClick={copyToClipboard}
                  size="sm"
                  variant="outline"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-card p-4 text-center shadow-sm">
                  <Label className="font-medium text-muted-foreground text-sm">
                    Organized by
                  </Label>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-foreground">
                      {digest.meeting.organizer}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-card p-4 text-center shadow-sm">
                  <Label className="font-medium text-muted-foreground text-sm">
                    Meeting Date
                  </Label>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-foreground">
                      {digest.meeting.scheduledAt
                        ? new Date(
                            digest.meeting.scheduledAt
                          ).toLocaleDateString()
                        : new Date(
                            digest.meeting.createdAt
                          ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-card p-4 text-center shadow-sm">
                  <Label className="font-medium text-muted-foreground text-sm">
                    Generated
                  </Label>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-foreground">
                      {new Date(digest.summary.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {digest.summary.executiveSummary}
              </p>
            </CardContent>
          </Card>

          {/* Key Points */}
          {digest.summary.keyPoints &&
            Array.isArray(digest.summary.keyPoints) &&
            digest.summary.keyPoints.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-chart-4" />
                    Key Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {digest.summary.keyPoints.map(
                      (point: unknown, index: number) => (
                        <li className="flex items-start gap-3" key={index}>
                          <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-chart-4" />
                          <span className="text-foreground">
                            {String(point)}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Decisions */}
          {digest.summary.decisions &&
            Array.isArray(digest.summary.decisions) &&
            digest.summary.decisions.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-chart-2" />
                    Key Decisions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {digest.summary.decisions.map(
                      (decision: ProcessedDecision, index: number) => (
                        <div
                          className="rounded-lg border border-border bg-card/50 p-4"
                          key={index}
                        >
                          <h4 className="mb-2 font-semibold text-foreground">
                            {decision.decision}
                          </h4>
                          {decision.rationale && (
                            <p className="mb-2 text-muted-foreground text-sm">
                              <strong>Rationale:</strong> {decision.rationale}
                            </p>
                          )}
                          {decision.owner && (
                            <p className="text-muted-foreground text-sm">
                              <strong>Owner:</strong> {decision.owner}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Next Steps */}
          {digest.summary.nextSteps &&
            Array.isArray(digest.summary.nextSteps) &&
            digest.summary.nextSteps.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5 text-chart-3" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {digest.summary.nextSteps.map(
                      (step: unknown, index: number) => (
                        <li className="flex items-start gap-3" key={index}>
                          <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-chart-3" />
                          <span className="text-foreground">
                            {String(step)}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Footer */}
          <div className="text-center">
            <div className="mb-4 text-muted-foreground text-sm">
              Generated by AI Meeting Digest • Shared on{' '}
              {new Date().toLocaleDateString()}
            </div>
            <Link to="/">
              <Button size="sm" variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Create Your Own Meeting Digest
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
