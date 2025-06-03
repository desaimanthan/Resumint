'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { 
  ArrowLeft,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  Star,
  AlertTriangle,
  Download,
  Share,
  Loader2,
  BarChart3,
  HelpCircle
} from 'lucide-react'

interface MockInterview {
  _id: string
  title: string
  status: string
  questions: string[]
  sessionData: {
    startTime: string
    endTime: string
    duration: number
    transcript: string
  }
  analysis: {
    overallScore: number
    communicationSkills: number
    technicalKnowledge: number
    problemSolving: number
    confidence: number
    strengths: string[]
    areasForImprovement: string[]
    recommendations: string[]
    detailedFeedback: string
  }
  resumeId: {
    title: string
    personalInfo: {
      firstName: string
      lastName: string
    }
  }
}

export default function MockInterviewReportPage() {
  const { apiCall } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  
  const [mockInterview, setMockInterview] = useState<MockInterview | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch interview report
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await apiCall(`/mock-interviews/${interviewId}/report`)
        setMockInterview(data.data.mockInterview)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch interview report',
          variant: 'destructive',
        })
        router.push('/mock-interview')
      } finally {
        setIsLoading(false)
      }
    }

    if (interviewId) {
      fetchReport()
    }
  }, [interviewId]) // Only depend on interviewId

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get score badge variant
  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 8) return 'default'
    if (score >= 6) return 'secondary'
    return 'destructive'
  }

  if (isLoading) {
    return (
      <SimpleSidebar title="Interview Report">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SimpleSidebar>
    )
  }

  if (!mockInterview || mockInterview.status !== 'completed') {
    return (
      <SimpleSidebar title="Interview Report">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Report Not Available</h3>
          <p className="text-muted-foreground mb-4">
            This interview hasn't been completed yet or the analysis is still being generated.
          </p>
          <Button onClick={() => router.push('/mock-interview')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mock Interviews
          </Button>
        </div>
      </SimpleSidebar>
    )
  }

  return (
    <SimpleSidebar title="Interview Report">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="mb-4">
              <div
                onClick={() => router.push('/mock-interview')}
                className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors inline-block"
              >
                <ArrowLeft className="h-6 w-6" />
              </div>
            </div>
            <h1 className="text-xl font-bold">{mockInterview.title}</h1>
            <p className="text-muted-foreground">
              Interview Report • {formatDate(mockInterview.sessionData.endTime)}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Interview Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(mockInterview.analysis.overallScore)}`}>
                    {mockInterview.analysis.overallScore}/10
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">
                    {formatDuration(mockInterview.sessionData.duration)}
                  </div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">
                    {mockInterview.questions.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">
                    {mockInterview.resumeId.personalInfo.firstName} {mockInterview.resumeId.personalInfo.lastName}
                  </div>
                  <p className="text-sm text-muted-foreground">Candidate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Interview Questions
              </CardTitle>
              <CardDescription>
                The questions that were asked during your mock interview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInterview.questions.map((question, index) => (
                  <div key={index} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{question}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Breakdown</CardTitle>
              <CardDescription>
                Detailed analysis of your interview performance across different areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Communication Skills</span>
                    <Badge variant={getScoreBadgeVariant(mockInterview.analysis.communicationSkills)}>
                      {mockInterview.analysis.communicationSkills}/10
                    </Badge>
                  </div>
                  <Progress value={mockInterview.analysis.communicationSkills * 10} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Technical Knowledge</span>
                    <Badge variant={getScoreBadgeVariant(mockInterview.analysis.technicalKnowledge)}>
                      {mockInterview.analysis.technicalKnowledge}/10
                    </Badge>
                  </div>
                  <Progress value={mockInterview.analysis.technicalKnowledge * 10} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Problem Solving</span>
                    <Badge variant={getScoreBadgeVariant(mockInterview.analysis.problemSolving)}>
                      {mockInterview.analysis.problemSolving}/10
                    </Badge>
                  </div>
                  <Progress value={mockInterview.analysis.problemSolving * 10} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Confidence</span>
                    <Badge variant={getScoreBadgeVariant(mockInterview.analysis.confidence)}>
                      {mockInterview.analysis.confidence}/10
                    </Badge>
                  </div>
                  <Progress value={mockInterview.analysis.confidence * 10} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths and Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockInterview.analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <TrendingDown className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockInterview.analysis.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommendations
              </CardTitle>
              <CardDescription>
                Actionable advice to improve your interview performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mockInterview.analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Detailed Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Feedback</CardTitle>
              <CardDescription>
                Comprehensive analysis of your interview performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {mockInterview.analysis.detailedFeedback}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Interview Transcript */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Interview Transcript
              </CardTitle>
              <CardDescription>
                Complete record of your interview session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {mockInterview.sessionData.transcript}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                Continue improving your interview skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => router.push('/mock-interview')}>
                  Practice Another Interview
                </Button>
                <Button variant="outline" onClick={() => router.push('/resume-builder')}>
                  Update Resume
                </Button>
                <Button variant="outline" onClick={() => router.push('/cover-letter')}>
                  Write Cover Letter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SimpleSidebar>
  )
}
