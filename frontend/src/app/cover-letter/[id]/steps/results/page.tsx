'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { 
  ArrowLeft, 
  Download, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  FileText,
  BarChart3
} from 'lucide-react'

interface CoverLetter {
  _id: string
  title: string
  generatedContent: string
  fitScore: number
  analysis: {
    skillsMatch: number
    experienceRelevance: number
    educationFit: number
    overallStrengths: string[]
    areasForImprovement: string[]
    recommendations: string[]
  }
  resumeId: {
    _id: string
    title: string
  }
  jobDescription: string
  createdAt: string
}

export default function CoverLetterResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { apiCall } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch cover letter
  useEffect(() => {
    const fetchCoverLetter = async () => {
      try {
        const data = await apiCall(`/cover-letters/${resolvedParams.id}`)
        const cl = data.data.coverLetter
        
        // Check if cover letter is generated
        if (!cl.generatedContent) {
          router.push(`/cover-letter/${resolvedParams.id}/steps/input`)
          return
        }
        
        setCoverLetter(cl)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load cover letter',
          variant: 'destructive',
        })
        router.push('/cover-letter')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCoverLetter()
  }, [resolvedParams.id])

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cover-letters/${resolvedParams.id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'cover-letter.pdf'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent'
    if (score >= 6) return 'Good'
    if (score >= 4) return 'Fair'
    return 'Needs Improvement'
  }

  if (isLoading) {
    return (
      <SimpleSidebar title="Cover Letter Builder">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </SimpleSidebar>
    )
  }

  if (!coverLetter) {
    return (
      <SimpleSidebar title="Cover Letter Builder">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cover letter not found</p>
          <Button onClick={() => router.push('/cover-letter')} className="mt-4">
            Back to Cover Letters
          </Button>
        </div>
      </SimpleSidebar>
    )
  }

  return (
    <SimpleSidebar title="Cover Letter Builder">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/cover-letter')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{coverLetter.title}</h1>
              <p className="text-muted-foreground">
                Generated from: {coverLetter.resumeId.title}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={() => router.push('/cover-letter')}>
              Back to Cover Letters
            </Button>
          </div>
        </div>

        {/* Overall Fit Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Overall Fit Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">
                <span className={getScoreColor(coverLetter.fitScore)}>
                  {coverLetter.fitScore}/10
                </span>
              </div>
              <div className="flex-1">
                <Progress value={coverLetter.fitScore * 10} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {getScoreLabel(coverLetter.fitScore)} match for this role
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cover Letter Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Cover Letter
                </CardTitle>
                <CardDescription>
                  AI-generated cover letter tailored to the job description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {coverLetter.generatedContent}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis */}
          <div className="space-y-6">
            {/* Detailed Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Skills Match</span>
                      <span className={`text-sm font-bold ${getScoreColor(coverLetter.analysis.skillsMatch)}`}>
                        {coverLetter.analysis.skillsMatch}/10
                      </span>
                    </div>
                    <Progress value={coverLetter.analysis.skillsMatch * 10} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Experience Relevance</span>
                      <span className={`text-sm font-bold ${getScoreColor(coverLetter.analysis.experienceRelevance)}`}>
                        {coverLetter.analysis.experienceRelevance}/10
                      </span>
                    </div>
                    <Progress value={coverLetter.analysis.experienceRelevance * 10} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Education Fit</span>
                      <span className={`text-sm font-bold ${getScoreColor(coverLetter.analysis.educationFit)}`}>
                        {coverLetter.analysis.educationFit}/10
                      </span>
                    </div>
                    <Progress value={coverLetter.analysis.educationFit * 10} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coverLetter.analysis.overallStrengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coverLetter.analysis.areasForImprovement.map((area, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coverLetter.analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SimpleSidebar>
  )
}
