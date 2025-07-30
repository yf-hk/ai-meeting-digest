import {
  BarChart3,
  Brain,
  Clock,
  MessageCircle,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface MeetingAnalyticsProps {
  meetings: any[]
}

export function MeetingAnalytics({ meetings }: MeetingAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalMeetings = meetings.length
    const completedMeetings = meetings.filter((m) => m.status === 'COMPLETED')
    const totalActionItems = meetings.reduce(
      (sum, m) => sum + (m._count?.actionItems || 0),
      0
    )
    const completedActionItems = meetings.reduce((sum, m) => {
      return (
        sum +
        (m.actionItems?.filter((item: any) => item.status === 'COMPLETED')
          .length || 0)
      )
    }, 0)

    // Calculate average processing time
    const avgProcessingTime =
      completedMeetings.reduce((sum, m) => {
        return sum + (m.summary?.processingTime || 0)
      }, 0) / (completedMeetings.length || 1)

    // Productivity insights
    const actionItemCompletionRate =
      totalActionItems > 0 ? (completedActionItems / totalActionItems) * 100 : 0
    const meetingsThisWeek = meetings.filter((m) => {
      const meetingDate = new Date(m.createdAt)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return meetingDate >= oneWeekAgo
    }).length

    // Advanced metrics
    const averageTopicsPerMeeting =
      meetings.reduce((sum, m) => sum + (m._count?.topics || 0), 0) /
      (totalMeetings || 1)
    const averageCommentsPerMeeting =
      meetings.reduce((sum, m) => sum + (m._count?.comments || 0), 0) /
      (totalMeetings || 1)

    return {
      totalMeetings,
      completedMeetings: completedMeetings.length,
      totalActionItems,
      completedActionItems,
      avgProcessingTime: Math.round(avgProcessingTime),
      actionItemCompletionRate: Math.round(actionItemCompletionRate),
      meetingsThisWeek,
      averageTopicsPerMeeting: Math.round(averageTopicsPerMeeting * 10) / 10,
      averageCommentsPerMeeting:
        Math.round(averageCommentsPerMeeting * 10) / 10,
      engagementScore: Math.min(
        100,
        Math.round(
          averageCommentsPerMeeting * 20 + actionItemCompletionRate * 0.8
        )
      ),
      productivityTrend: meetingsThisWeek > totalMeetings / 4 ? 'up' : 'down',
    }
  }, [meetings])

  const metrics = [
    {
      title: 'Total Meetings',
      value: analytics.totalMeetings,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Processing Speed',
      value: `${analytics.avgProcessingTime}s`,
      icon: Zap,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      title: 'Action Completion',
      value: `${analytics.actionItemCompletionRate}%`,
      icon: Target,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
    {
      title: 'Engagement Score',
      value: analytics.engagementScore,
      icon: MessageCircle,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
  ]

  const insights = [
    {
      title: 'Weekly Activity',
      value: analytics.meetingsThisWeek,
      subtitle: 'meetings this week',
      trend: analytics.productivityTrend,
      icon: TrendingUp,
    },
    {
      title: 'Discussion Depth',
      value: analytics.averageTopicsPerMeeting,
      subtitle: 'topics per meeting',
      icon: Brain,
    },
    {
      title: 'Collaboration',
      value: analytics.averageCommentsPerMeeting,
      subtitle: 'comments per meeting',
      icon: MessageCircle,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            className="border-0 bg-gradient-to-br from-card to-accent/5 shadow-lg backdrop-blur-sm"
            key={metric.title}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    {metric.title}
                  </p>
                  <p className="font-bold text-2xl text-foreground">
                    {metric.value}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${metric.bgColor}`}
                >
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advanced Insights */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Meeting Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {insights.map((insight) => (
              <div className="text-center" key={insight.title}>
                <div className="mb-3 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <insight.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="mb-1 font-semibold text-foreground">
                  {insight.title}
                </h3>
                <p className="mb-1 font-bold text-2xl text-primary">
                  {insight.value}
                </p>
                <p className="text-muted-foreground text-sm">
                  {insight.subtitle}
                  {'trend' in insight && (
                    <span
                      className={`ml-2 ${
                        insight.trend === 'up'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {insight.trend === 'up' ? '↗️' : '↘️'}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Productivity Recommendations */}
      {analytics.actionItemCompletionRate < 50 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Target className="h-5 w-5" />
              Productivity Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              Your action item completion rate is{' '}
              {analytics.actionItemCompletionRate}%. Consider setting clearer
              deadlines and following up on pending items to improve meeting
              effectiveness.
            </p>
          </CardContent>
        </Card>
      )}

      {analytics.engagementScore > 80 && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <MessageCircle className="h-5 w-5" />
              Great Engagement!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">
              Your meetings show excellent engagement with an{' '}
              {analytics.engagementScore}% engagement score. Keep fostering
              collaborative discussions!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
