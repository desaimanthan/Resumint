'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  Edit, 
  Trash2, 
  Copy,
  Play,
  FileText,
  MoreHorizontal,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Pause,
  Settings
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface MockInterview {
  _id: string
  title: string
  status: 'setup' | 'ready' | 'in_progress' | 'completed' | 'cancelled'
  resumeId?: {
    _id: string
    title: string
  }
  jobDescription?: string
  questions: string[]
  sessionData?: {
    startTime?: string
    endTime?: string
    duration?: number
    currentQuestionIndex?: number
  }
  analysis?: {
    overallScore: number
    communicationSkills: number
    technicalKnowledge: number
    problemSolving: number
    confidence: number
  }
  isDraft: boolean
  createdAt: string
  updatedAt: string
  lastSaved: string
}

export default function MockInterviewPage() {
  const { apiCall } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [mockInterviews, setMockInterviews] = useState<MockInterview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newInterviewTitle, setNewInterviewTitle] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Fetch user's mock interviews
  const fetchMockInterviews = async () => {
    try {
      const data = await apiCall('/mock-interviews')
      setMockInterviews(data.data.mockInterviews || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch mock interviews',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMockInterviews()
  }, [])

  // Create new mock interview
  const handleCreateMockInterview = async () => {
    if (!newInterviewTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a mock interview title',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const data = await apiCall('/mock-interviews', {
        method: 'POST',
        body: JSON.stringify({ 
          title: newInterviewTitle.trim()
        }),
      })

      toast({
        title: 'Success',
        description: 'Mock interview created successfully',
      })

      // Navigate to setup page
      router.push(`/mock-interview/${data.data.mockInterview._id}/setup`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create mock interview',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
      setShowCreateDialog(false)
      setNewInterviewTitle('')
    }
  }

  // Duplicate mock interview
  const handleDuplicateMockInterview = async (interviewId: string) => {
    try {
      const data = await apiCall(`/mock-interviews/${interviewId}/duplicate`, {
        method: 'POST',
      })

      toast({
        title: 'Success',
        description: 'Mock interview duplicated successfully',
      })

      fetchMockInterviews() // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate mock interview',
        variant: 'destructive',
      })
    }
  }

  // Delete mock interview
  const handleDeleteMockInterview = async (interviewId: string) => {
    try {
      await apiCall(`/mock-interviews/${interviewId}`, {
        method: 'DELETE',
      })

      toast({
        title: 'Success',
        description: 'Mock interview deleted successfully',
      })

      fetchMockInterviews() // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete mock interview',
        variant: 'destructive',
      })
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Convert to Title Case
  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Get status badge
  const getStatusBadge = (interview: MockInterview) => {
    switch (interview.status) {
      case 'setup':
        return (
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Setup Required
          </span>
        )
      case 'ready':
        return (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
            <Play className="h-3 w-3" />
            Ready to Start
          </span>
        )
      case 'in_progress':
        return (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center gap-1">
            <Pause className="h-3 w-3" />
            In Progress
          </span>
        )
      case 'completed':
        return (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        )
      case 'cancelled':
        return (
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Cancelled
          </span>
        )
      default:
        return null
    }
  }

  // Get primary action button
  const getPrimaryAction = (interview: MockInterview) => {
    switch (interview.status) {
      case 'setup':
        return (
          <Button
            size="sm"
            onClick={() => router.push(`/mock-interview/${interview._id}/setup`)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Setup
          </Button>
        )
      case 'ready':
        return (
          <Button
            size="sm"
            onClick={() => router.push(`/mock-interview/${interview._id}/interview`)}
          >
            <Play className="h-4 w-4 mr-1" />
            Start Interview
          </Button>
        )
      case 'in_progress':
        return (
          <Button
            size="sm"
            onClick={() => router.push(`/mock-interview/${interview._id}/interview`)}
          >
            <Play className="h-4 w-4 mr-1" />
            Continue
          </Button>
        )
      case 'completed':
        return (
          <Button
            size="sm"
            onClick={() => router.push(`/mock-interview/${interview._id}/report`)}
          >
            <FileText className="h-4 w-4 mr-1" />
            View Report
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <SimpleSidebar title="Mock Interview">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Mock Interview</h1>
            <p className="text-muted-foreground">
              Practice your interview skills with AI-powered mock interviews tailored to your resume and job requirements.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Mock Interview
          </Button>
        </div>

        {/* Create Mock Interview Dialog */}
        <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Mock Interview</AlertDialogTitle>
              <AlertDialogDescription>
                Give your mock interview a descriptive title to help you organize multiple sessions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interviewTitle">Mock Interview Title</Label>
                <Input
                  id="interviewTitle"
                  value={newInterviewTitle}
                  onChange={(e) => setNewInterviewTitle(e.target.value)}
                  placeholder="e.g., Software Engineer Interview at Google, Marketing Manager Practice"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateMockInterview()
                    }
                  }}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCreateMockInterview}
                disabled={isCreating || !newInterviewTitle.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Mock Interview'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mock Interviews List */}
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : mockInterviews.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No mock interviews yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first mock interview to start practicing with our AI-powered interview coach.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Mock Interview
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {mockInterviews.map((interview) => (
              <div key={interview._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {/* Left side - Icon and Info */}
                <div className="flex items-center gap-4">
                  <img 
                    src="/mock_interview.png" 
                    alt="Mock Interview" 
                    className="h-12 w-12 object-contain"
                  />
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold">{toTitleCase(interview.title)}</h3>
                      {getStatusBadge(interview)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Last saved: {formatDate(interview.lastSaved)} • Created: {formatDate(interview.createdAt)}
                      </p>
                      {interview.resumeId && (
                        <p>Resume: {interview.resumeId.title}</p>
                      )}
                      {interview.questions.length > 0 && (
                        <p>{interview.questions.length} questions prepared</p>
                      )}
                      {interview.sessionData?.duration && (
                        <p>Duration: {formatDuration(interview.sessionData.duration)}</p>
                      )}
                      {interview.analysis?.overallScore && (
                        <p>Overall Score: {interview.analysis.overallScore}/10</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right side - Action Buttons */}
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Mock Interview</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{interview.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteMockInterview(interview._id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateMockInterview(interview._id)}
                  >
                    Duplicate
                  </Button>
                  
                  {getPrimaryAction(interview)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SimpleSidebar>
  )
}
