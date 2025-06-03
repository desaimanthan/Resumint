'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ArrowLeft, Sparkles, FileText, Briefcase } from 'lucide-react'

interface Resume {
  _id: string
  title: string
  isDraft: boolean
  createdAt: string
}

interface CoverLetter {
  _id: string
  title: string
  isDraft: boolean
}

export default function CoverLetterInputPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { apiCall } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch cover letter and resumes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cover letter details
        const coverLetterData = await apiCall(`/cover-letters/${resolvedParams.id}`)
        setCoverLetter(coverLetterData.data.coverLetter)

        // Fetch user's resumes (only published ones)
        const resumesData = await apiCall('/resumes')
        const allResumes = resumesData.data.resumes || []
        // Filter to only show published resumes
        const publishedResumes = allResumes.filter((resume: Resume) => !resume.isDraft)
        setResumes(publishedResumes)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        })
        router.push('/cover-letter')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      toast({
        title: 'Error',
        description: 'Please select a resume',
        variant: 'destructive',
      })
      return
    }

    if (!jobDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a job description',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      await apiCall(`/cover-letters/${resolvedParams.id}/generate`, {
        method: 'POST',
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobDescription: jobDescription.trim()
        }),
      })

      toast({
        title: 'Success',
        description: 'Cover letter generated successfully!',
      })

      // Navigate to results page
      router.push(`/cover-letter/${resolvedParams.id}/steps/results`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate cover letter',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <SimpleSidebar title="Cover Letter Builder">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
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
              Select your resume and provide the job description to generate a tailored cover letter
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Generate Cover Letter
              </CardTitle>
              <CardDescription>
                We'll analyze your resume against the job description and create a personalized cover letter with fit analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resume Selection */}
              <div className="space-y-2">
                <Label htmlFor="resume-select" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Select Resume
                </Label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a published resume to use for this cover letter" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.length === 0 ? (
                      <SelectItem value="no-resumes" disabled>
                        No published resumes available - complete and publish a resume first
                      </SelectItem>
                    ) : (
                      resumes.map((resume) => (
                        <SelectItem key={resume._id} value={resume._id}>
                          <span>{resume.title}</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {resumes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    You need to complete and publish a resume first. Only published resumes can be used for cover letter generation.{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => router.push('/resume-builder')}
                    >
                      Create Resume
                    </Button>
                  </p>
                )}
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="job-description" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Job Description
                </Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the complete job description here. Include requirements, responsibilities, qualifications, and any other relevant details..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  The more detailed the job description, the better we can tailor your cover letter and provide accurate fit analysis.
                </p>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedResumeId || !jobDescription.trim() || resumes.length === 0}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SimpleSidebar>
  )
}
