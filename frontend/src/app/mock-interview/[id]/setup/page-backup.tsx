'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { 
  ArrowLeft,
  FileText,
  Briefcase,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Resume {
  _id: string
  title: string
  personalInfo: {
    firstName: string
    lastName: string
  }
  publication: {
    isPublished: boolean
  }
}

interface MockInterview {
  _id: string
  title: string
  status: string
  resumeId?: string
  jobDescription?: string
  questions: string[]
}

export default function MockInterviewSetupPage() {
  const { apiCall } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  
  const [mockInterview, setMockInterview] = useState<MockInterview | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch mock interview and resumes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch mock interview details
        const interviewData = await apiCall(`/mock-interviews/${interviewId}`)
        const interview = interviewData.data.mockInterview
        setMockInterview(interview)
        
        // Pre-fill form if data exists
        if (interview.resumeId) {
          setSelectedResumeId(interview.resumeId)
        }
        if (interview.jobDescription) {
          setJobDescription(interview.jobDescription)
        }

        // Fetch published resumes
        const resumesData = await apiCall('/resumes')
        const publishedResumes = resumesData.data.resumes.filter(
          (resume: Resume) => resume.publication?.isPublished
        )
        setResumes(publishedResumes)

      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch data',
          variant: 'destructive',
        })
        router.push('/mock-interview')
      } finally {
        setIsLoading(false)
      }
    }

    if (interviewId) {
      fetchData()
    }
  }, [interviewId]) // Only depend on interviewId

  // Generate questions
  const handleGenerateQuestions = async () => {
    if (!selectedResumeId) {
      toast({
        title: 'Error',
        description: 'Please select a resume',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const data = await apiCall(`/mock-interviews/${interviewId}/generate-questions`, {
        method: 'POST',
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobDescription: jobDescription.trim() || undefined
        }),
      })

      toast({
        title: 'Success',
        description: 'Interview questions generated successfully!',
      })

      // Navigate to interview page
      router.push(`/mock-interview/${interviewId}/interview`)

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate questions',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <SimpleSidebar title="Mock Interview Setup">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SimpleSidebar>
    )
  }

  if (!mockInterview) {
    return (
      <SimpleSidebar title="Mock Interview Setup">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Mock Interview Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The mock interview you're looking for doesn't exist or you don't have access to it.
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
    <SimpleSidebar title="Mock Interview Setup">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/mock-interview')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{mockInterview.title}</h1>
            <p className="text-muted-foreground">
              Set up your mock interview by selecting a resume and optionally adding a job description.
            </p>
          </div>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* Resume Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select Resume
              </CardTitle>
              <CardDescription>
                Choose a published resume to base your interview questions on. Only published resumes are available for mock interviews.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Published Resumes</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to publish at least one resume to create mock interviews.
                  </p>
                  <Button onClick={() => router.push('/resume-builder')}>
                    Create & Publish Resume
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="resume-select">Resume</Label>
                  <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resume..." />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((resume) => (
                        <SelectItem key={resume._id} value={resume._id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{resume.title}</span>
                            <span className="text-sm text-muted-foreground">
                              ({resume.personalInfo.firstName} {resume.personalInfo.lastName})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Description (Optional)
              </CardTitle>
              <CardDescription>
                Add a job description to get more targeted interview questions. If left empty, we'll generate general questions based on your resume.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="job-description">Job Description</Label>
                <Textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here to get tailored interview questions..."
                  rows={8}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {jobDescription.length} characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Generate Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Interview Questions</CardTitle>
              <CardDescription>
                Our AI will analyze your resume{jobDescription ? ' and job description' : ''} to create 10 tailored interview questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInterview.questions.length > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {mockInterview.questions.length} questions already generated
                    </span>
                  </div>
                )}
                
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={!selectedResumeId || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Questions...
                    </>
                  ) : mockInterview.questions.length > 0 ? (
                    'Regenerate Questions & Start Interview'
                  ) : (
                    'Generate Questions & Start Interview'
                  )}
                </Button>
                
                {isGenerating && (
                  <p className="text-sm text-muted-foreground text-center">
                    This may take 30-60 seconds. Please don't close this page.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SimpleSidebar>
  )
}
