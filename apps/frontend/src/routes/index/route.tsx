import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  Brain,
  FileText,
  MessageSquare,
  Mic,
  Upload,
  Zap,
} from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  component: LandingComponent,
})

function LandingComponent() {
  const { session, isPending } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session && !isPending) {
      navigate({ to: '/dashboard' })
    }
  }, [session, isPending, navigate])

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/20">
      {/* Header */}
      <header className="border-border border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="font-bold text-foreground text-xl">
              AI Meeting Digest
            </span>
          </div>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-foreground tracking-tight">
            Transform Your Meetings with
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {' '}
              AI Intelligence
            </span>
          </h1>
          <p className="mb-8 text-muted-foreground text-xl leading-relaxed">
            Automatically transcribe, summarize, and extract actionable insights
            from your meetings. Never miss important decisions or action items
            again.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/login">
              <Button className="flex items-center gap-2" size="lg">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/50 bg-card/60 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mic className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Smart Transcription</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced AI automatically converts speech to text with high
                accuracy and speaker identification.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/20">
                  <FileText className="h-5 w-5 text-chart-3" />
                </div>
                <CardTitle>AI Summaries</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get concise, intelligent summaries highlighting key points,
                decisions, and outcomes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/20">
                  <Zap className="h-5 w-5 text-chart-4" />
                </div>
                <CardTitle>Action Items</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automatically extract and track action items with assigned
                owners and due dates.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/20">
                  <Upload className="h-5 w-5 text-chart-5" />
                </div>
                <CardTitle>Easy Upload</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Simple drag-and-drop interface for audio and video files.
                Support for all major formats.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Collaboration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Comment, discuss, and collaborate on meeting insights with your
                team members.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/20">
                  <BarChart3 className="h-5 w-5 text-chart-2" />
                </div>
                <CardTitle>Analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track meeting patterns, participation, and productivity metrics
                over time.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-24 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-12 text-center text-primary-foreground">
          <h2 className="mb-4 font-bold text-3xl">
            Ready to revolutionize your meetings?
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/80">
            Join thousands of teams who have transformed their meeting
            productivity with AI.
          </p>
          <Link to="/login">
            <Button
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              size="lg"
            >
              Start Free Trial
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-border border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 AI Meeting Digest. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
