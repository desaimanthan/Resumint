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
  FileText, 
  Clock, 
  Edit, 
  Trash2, 
  Copy,
  Download,
  Globe,
  MoreHorizontal,
  BarChart3,
  Settings,

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

interface Resume {
  _id: string
  title: string
  isDraft: boolean
  lastSaved: string
  createdAt: string
  updatedAt: string
  publication?: {
    isPublished: boolean
    subdomain?: string
  }
}

export default function ResumeBuilderPage() {
  const { apiCall } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newResumeTitle, setNewResumeTitle] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creationMethod, setCreationMethod] = useState<'scratch' | 'pdf_upload'>('pdf_upload')

  // Fetch user's resumes
  const fetchResumes = async () => {
    try {
      const data = await apiCall('/resumes')
      setResumes(data.data.resumes || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch resumes',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  // Create new resume
  const handleCreateResume = async () => {
    if (!newResumeTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a resume title',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const data = await apiCall('/resumes', {
        method: 'POST',
        body: JSON.stringify({ 
          title: newResumeTitle.trim(),
          creationMethod: creationMethod
        }),
      })

      toast({
        title: 'Success',
        description: 'Resume created successfully',
      })

      // Navigate based on creation method
      if (creationMethod === 'pdf_upload') {
        router.push(`/resume-builder/${data.data.resume._id}/steps/file-upload`)
      } else {
        router.push(`/resume-builder/${data.data.resume._id}/steps/personal-info`)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create resume',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
      setShowCreateDialog(false)
      setNewResumeTitle('')
      setCreationMethod('pdf_upload')
    }
  }

  // Duplicate resume
  const handleDuplicateResume = async (resumeId: string) => {
    try {
      const data = await apiCall(`/resumes/${resumeId}/duplicate`, {
        method: 'POST',
      })

      toast({
        title: 'Success',
        description: 'Resume duplicated successfully',
      })

      fetchResumes() // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate resume',
        variant: 'destructive',
      })
    }
  }

  // Delete resume
  const handleDeleteResume = async (resumeId: string) => {
    try {
      await apiCall(`/resumes/${resumeId}`, {
        method: 'DELETE',
      })

      toast({
        title: 'Success',
        description: 'Resume deleted successfully',
      })

      fetchResumes() // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete resume',
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

  // Convert to Camel Case
  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }



  return (
    <SimpleSidebar title="Resume Builder">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Resume Builder</h1>
            <p className="text-muted-foreground">
              Create and manage your professional resumes with our AI-powered builder.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Resume
          </Button>
        </div>

        {/* Create Resume Dialog */}
        <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Resume</AlertDialogTitle>
              <AlertDialogDescription>
                Give your resume a descriptive title to help you organize multiple versions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resumeTitle">Resume Title</Label>
                <Input
                  id="resumeTitle"
                  value={newResumeTitle}
                  onChange={(e) => setNewResumeTitle(e.target.value)}
                  placeholder="e.g., Software Engineer Resume, Marketing Manager CV"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateResume()
                    }
                  }}
                />
              </div>
              
              <div className="space-y-3">
                <Label>How would you like to create your resume?</Label>
                <div className="grid grid-cols-1 gap-3">
                  {/* PDF Upload Option */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      creationMethod === 'pdf_upload' 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setCreationMethod('pdf_upload')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <img src="/resume_upload.png" alt="Upload resume" className="h-15 w-15" style={{width: '60px', height: '60px'}} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">I have a PDF resume - use that</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload your existing resume and we'll extract the information using AI
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            creationMethod === 'pdf_upload'
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          }`}>
                            {creationMethod === 'pdf_upload' && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* From Scratch Option */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      creationMethod === 'scratch' 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setCreationMethod('scratch')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <img src="/resume_create.png" alt="Create resume" className="h-15 w-15" style={{width: '60px', height: '60px'}} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">I want to create from scratch</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Start with a blank resume and fill in your information step by step
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            creationMethod === 'scratch'
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          }`}>
                            {creationMethod === 'scratch' && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCreateResume}
                disabled={isCreating || !newResumeTitle.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Resume'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Resumes List */}
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
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first resume to get started with our AI-powered builder.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <div key={resume._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {/* Left side - Icon and Info */}
                <div className="flex items-center gap-4">
                  <img src="/resume.png" alt="Resume" className="h-12 w-12" />
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{toTitleCase(resume.title)}</h3>
                      {resume.publication?.isPublished ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last saved: {formatDate(resume.lastSaved)} • Created: {formatDate(resume.createdAt)}
                    </p>
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
                        <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{resume.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteResume(resume._id)}
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
                    onClick={() => handleDuplicateResume(resume._id)}
                  >
                    Duplicate
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/resume-builder/${resume._id}/steps/analytics`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/resume-builder/${resume._id}/steps/publish`)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Web Setting
                  </Button>
                  
                  {resume.publication?.isPublished && resume.publication?.subdomain && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`http://${resume.publication?.subdomain}.localhost:8080`, '_blank')}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      View Live
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={() => router.push(`/resume-builder/${resume._id}/steps/personal-info`)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SimpleSidebar>
  )
}
