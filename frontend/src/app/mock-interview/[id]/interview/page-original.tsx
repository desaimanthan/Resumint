'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { VoiceInterviewAgent } from '@/components/voice-interview-agent-transcript-fix'
import { 
  ArrowLeft,
  Loader2,
  MessageSquare
} from 'lucide-react'

interface MockInterview {
  _id: string
  title: string
  status: string
  questions: string[]
  sessionData?: {
    startTime?: string
    currentQuestionIndex?: number
    transcript?: string
  }
}

export default function MockInterviewPage() {
  const { apiCall } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  
  const [mockInterview, setMockInterview] = useState<MockInterview | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch mock interview
  useEffect(() => {
    const fetchMockInterview = async () => {
      try {
        const data = await apiCall(`/mock-interviews/${interviewId}`)
        const interview = data.data.mockInterview
        setMockInterview(interview)
        
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch mock interview',
          variant: 'destructive',
        })
        router.push('/mock-interview')
      } finally {
        setIsLoading(false)
      }
    }

    if (interviewId) {
      fetchMockInterview()
    }
  }, [interviewId])

  // Start interview session when voice agent connects
  const handleInterviewStart = async () => {
    try {
      await apiCall(`/mock-interviews/${interviewId}/start-session`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to start interview session:', error)
    }
  }

  // Handle transcript updates from voice agent
  const handleTranscriptUpdate = async (transcript: string) => {
    try {
      await apiCall(`/mock-interviews/${interviewId}/update-transcript`, {
        method: 'PATCH',
        body: JSON.stringify({
          transcript
        }),
      })
    } catch (error) {
      console.error('Failed to update transcript:', error)
    }
  }

  // Handle interview completion from voice agent
  const handleInterviewComplete = async (finalTranscript: string) => {
    try {
      console.log('Starting interview completion process...')
      console.log('Final transcript length:', finalTranscript?.length || 0)
      
      if (!finalTranscript || finalTranscript.trim().length === 0) {
        toast({
          title: 'No Interview Content',
          description: 'No conversation was recorded. Please try the interview again.',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Processing Interview',
        description: 'Analyzing your interview responses... This may take a moment.',
      })

      const response = await apiCall(`/mock-interviews/${interviewId}/end-session`, {
        method: 'POST',
        body: JSON.stringify({
          finalTranscript
        }),
      })

      console.log('End session response:', response)

      if (response.success) {
        toast({
          title: 'Interview Completed',
          description: 'Your interview has been analyzed. Redirecting to your report...',
        })

        // Small delay to ensure backend processing is complete
        setTimeout(() => {
          router.push(`/mock-interview/${interviewId}/report`)
        }, 1000)
      } else {
        throw new Error(response.message || 'Failed to complete interview')
      }

    } catch (error) {
      console.error('Interview completion error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete interview session',
        variant: 'destructive',
      })
    }
  }

  // Handle voice agent errors
  const handleVoiceError = (error: string) => {
    toast({
      title: 'Voice Service Error',
      description: error,
      variant: 'destructive',
    })
  }

  if (isLoading) {
    return (
      <SimpleSidebar title="Mock Interview">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SimpleSidebar>
    )
  }

  if (!mockInterview || mockInterview.questions.length === 0) {
    return (
      <SimpleSidebar title="Mock Interview">
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Interview Not Ready</h3>
          <p className="text-muted-foreground mb-4">
            This mock interview hasn't been set up yet or doesn't have questions generated.
          </p>
          <Button onClick={() => router.push(`/mock-interview/${interviewId}/setup`)}>
            Go to Setup
          </Button>
        </div>
      </SimpleSidebar>
    )
  }

  return (
    <SimpleSidebar title="Voice Mock Interview">
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
              AI-powered voice interview with {mockInterview.questions.length} questions
            </p>
          </div>
        </div>

        {/* Voice Interview Agent */}
        <VoiceInterviewAgent
          questions={mockInterview.questions}
          interviewTitle={mockInterview.title}
          onTranscriptUpdate={handleTranscriptUpdate}
          onInterviewComplete={handleInterviewComplete}
          onError={handleVoiceError}
          onInterviewStart={handleInterviewStart}
          apiCall={apiCall}
        />
      </div>
    </SimpleSidebar>
  )
}
