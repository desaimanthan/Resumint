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
  Mail, 
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

interface CoverLetter {
  _id: string
  title: string
  isDraft: boolean
  generatedContent?: string
  lastSaved: string
  createdAt: string
  updatedAt: string
  publication?: {
    isPublished: boolean
    subdomain?: string
  }
}

export default function CoverLetterPage() {
  const { apiCall } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newCoverLetterTitle, setNewCoverLetterTitle] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Fetch user's cover letters
  const fetchCoverLetters = async () => {
    try {
      const data = await apiCall('/cover-letters')
      setCoverLetters(data.data.coverLetters || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch cover letters',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCoverLetters()
  }, [])

  // Create new cover letter
  const handleCreateCoverLetter = async () => {
    if (!newCoverLetterTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a cover letter title',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const data = await apiCall('/cover-letters', {
        method: 'POST',
        body: JSON.stringify({ 
          title: newCoverLetterTitle.trim()
        }),
      })

      toast({
        title: 'Success',
        description: 'Cover letter created successfully',
      })

      // Navigate to input step
      router.push(`/cover-letter/${data.data.coverLetter._id}/steps/input`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create cover letter',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
      setShowCreateDialog(false)
      setNewCoverLetterTitle('')
    }
  }

  // Duplicate cover letter
  const handleDuplicateCoverLetter = async (coverLetterId: string) => {
    try {
      const data = await apiCall(`/cover-letters/${coverLetterId}/duplicate`, {
        method: 'POST',
      })

      toast({
        title: 'Success',
        description: 'Cover letter duplicated successfully',
      })

      fetchCoverLetters() // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate cover letter',
        variant: 'destructive',
      })
    }
  }

  // Delete cover letter
  const handleDeleteCoverLetter = async (coverLetterId: string) => {
    try {
      await apiCall(`/cover-letters/${coverLetterId}`, {
        method: 'DELETE',
      })

      toast({
        title: 'Success',
        description: 'Cover letter deleted successfully',
      })

      fetchCoverLetters() // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete cover letter',
        variant: 'destructive',
      })
    }
  }

  // Download cover letter as PDF
  const handleDownloadPDF = async (coverLetterId: string, title: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cover-letters/${coverLetterId}/download`, {
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
      let filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
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
    <SimpleSidebar title="Cover Letter Builder">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Cover Letter Builder</h1>
            <p className="text-muted-foreground">
              Create compelling cover letters tailored to specific job applications with AI assistance.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Cover Letter
          </Button>
        </div>

        {/* Create Cover Letter Dialog */}
        <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Cover Letter</AlertDialogTitle>
              <AlertDialogDescription>
                Give your cover letter a descriptive title to help you organize multiple versions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coverLetterTitle">Cover Letter Title</Label>
                <Input
                  id="coverLetterTitle"
                  value={newCoverLetterTitle}
                  onChange={(e) => setNewCoverLetterTitle(e.target.value)}
                  placeholder="e.g., Software Engineer at Google, Marketing Manager Application"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCoverLetter()
                    }
                  }}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCreateCoverLetter}
                disabled={isCreating || !newCoverLetterTitle.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Cover Letter'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cover Letters List */}
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
        ) : coverLetters.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cover letters yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first cover letter to get started with our AI-powered builder.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Cover Letter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {coverLetters.map((coverLetter) => (
              <div key={coverLetter._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {/* Left side - Icon and Info */}
                <div className="flex items-center gap-4">
                  <img src="/cover_letter.png" alt="Cover Letter" className="h-12 w-12" />
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{toTitleCase(coverLetter.title)}</h3>
                      {!coverLetter.isDraft && coverLetter.generatedContent ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Generated
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last saved: {formatDate(coverLetter.lastSaved)} • Created: {formatDate(coverLetter.createdAt)}
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
                        <AlertDialogTitle>Delete Cover Letter</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{coverLetter.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCoverLetter(coverLetter._id)}
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
                    onClick={() => handleDuplicateCoverLetter(coverLetter._id)}
                  >
                    Duplicate
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/cover-letter/${coverLetter._id}/analytics`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/cover-letter/${coverLetter._id}/publish`)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Web Setting
                  </Button>
                  
                  {coverLetter.publication?.isPublished && coverLetter.publication?.subdomain && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`http://${coverLetter.publication?.subdomain}.localhost:8080`, '_blank')}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      View Live
                    </Button>
                  )}
                  
                  {!coverLetter.isDraft && coverLetter.generatedContent && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPDF(coverLetter._id, coverLetter.title)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={() => {
                      if (coverLetter.isDraft) {
                        router.push(`/cover-letter/${coverLetter._id}/steps/input`)
                      } else {
                        router.push(`/cover-letter/${coverLetter._id}/steps/results`)
                      }
                    }}
                  >
                    {coverLetter.isDraft ? 'Continue' : 'View'}
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
