'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeNavigation } from '@/components/resume-navigation'
import { ResumeProvider, useResume } from '@/contexts/ResumeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { TemplateSelector } from '@/components/portfolio-templates/template-selector'
import { 
  Globe, 
  Lock, 
  Eye, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Settings,
  Loader2,
  ArrowRight,
  Save,
  ArrowLeft
} from 'lucide-react'

interface PublicationData {
  isPublished: boolean
  subdomain: string | null
  isPasswordProtected: boolean
  publishedAt: string | null
  seoMetadata: {
    title: string
    description: string
    keywords: string[]
  }
  analytics: {
    totalViews: number
    uniqueVisitors: number
    lastViewed: string | null
  }
}

function PublishForm() {
  const { id } = useParams()
  const router = useRouter()
  const { resumeData, isLoading, isDirty, lastSaved, saveResume, loadResume } = useResume()
  const { apiCall } = useAuth()
  const { toast } = useToast()

  const [publicationData, setPublicationData] = useState<PublicationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [subdomain, setSubdomain] = useState('')
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [password, setPassword] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('template-1')

  // Generate suggested subdomain from resume title
  const generateSubdomain = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Check subdomain availability
  const checkSubdomainAvailability = async (subdomainToCheck: string) => {
    if (!subdomainToCheck || subdomainToCheck.length < 3) {
      setSubdomainAvailable(null)
      return
    }

    setCheckingSubdomain(true)
    try {
      const data = await apiCall(`/resumes/${id}/check-subdomain/${subdomainToCheck}`)
      
      if (data.success) {
        setSubdomainAvailable(data.data.available)
      }
    } catch (error) {
      // Silently handle error and assume available for demo
      setSubdomainAvailable(true)
    } finally {
      setCheckingSubdomain(false)
    }
  }

  // Fetch publication status
  const fetchPublicationStatus = async () => {
    console.log('🔍 Fetching publication status for resume ID:', id)
    try {
      const data = await apiCall(`/resumes/${id}/publication-status`)
      console.log('📊 Publication status response:', data)
      
      if (data.success) {
        console.log('✅ Publication data received:', data.data.publication)
        setPublicationData(data.data.publication)
        
        // Set form values
        if (data.data.publication && data.data.publication.isPublished) {
          console.log('🚀 Resume is published, setting published state')
          setSubdomain(data.data.publication.subdomain || '')
          setIsPasswordProtected(data.data.publication.isPasswordProtected || false)
          setSeoTitle(data.data.publication.seoMetadata?.title || '')
          setSeoDescription(data.data.publication.seoMetadata?.description || '')
          setSeoKeywords(data.data.publication.seoMetadata?.keywords?.join(', ') || '')
        } else {
          console.log('📝 Resume not published, setting default values')
          // Set suggested values for new publication
          const suggestedSubdomain = data.data.suggestedSubdomain || generateSubdomain(resumeData?.title || 'my-resume')
          setSubdomain(suggestedSubdomain)
          setSeoTitle(`${resumeData?.personalInfo?.firstName} ${resumeData?.personalInfo?.lastName} - Resume`)
          setSeoDescription(resumeData?.summary?.substring(0, 160) || `Professional resume of ${resumeData?.personalInfo?.firstName} ${resumeData?.personalInfo?.lastName}`)
          setSeoKeywords(resumeData?.skills?.map(skill => skill.skillName).slice(0, 10).join(', ') || '')
          
          // Check availability of suggested subdomain
          checkSubdomainAvailability(suggestedSubdomain)
        }
      } else {
        console.error('❌ Failed to fetch publication status:', data.message)
      }
    } catch (error) {
      console.error('💥 Error fetching publication status:', error)
      // Set default values if API fails
      if (resumeData) {
        const suggestedSubdomain = generateSubdomain(resumeData?.title || 'my-resume')
        setSubdomain(suggestedSubdomain)
        setSeoTitle(`${resumeData?.personalInfo?.firstName} ${resumeData?.personalInfo?.lastName} - Resume`)
        setSeoDescription(resumeData?.summary?.substring(0, 160) || `Professional resume of ${resumeData?.personalInfo?.firstName} ${resumeData?.personalInfo?.lastName}`)
        setSeoKeywords(resumeData?.skills?.map(skill => skill.skillName).slice(0, 10).join(', ') || '')
      }
    } finally {
      setLoading(false)
    }
  }

  // Publish resume
  const handlePublish = async () => {
    if (!subdomain || subdomainAvailable === false) {
      toast({
        title: "Error",
        description: "Please choose an available subdomain",
        variant: "destructive"
      })
      return
    }

    if (isPasswordProtected && !password) {
      toast({
        title: "Error", 
        description: "Please enter a password for protection",
        variant: "destructive"
      })
      return
    }

    setPublishing(true)
    try {
      // First save the template selection
      await apiCall(`/resumes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          templateId: selectedTemplate
        })
      })

      const data = await apiCall(`/resumes/${id}/publish`, {
        method: 'POST',
        body: JSON.stringify({
          subdomain,
          isPasswordProtected,
          password: isPasswordProtected ? password : null,
          seoMetadata: {
            title: seoTitle,
            description: seoDescription,
            keywords: seoKeywords.split(',').map(k => k.trim()).filter(k => k)
          }
        })
      })
      
      if (data.success) {
        toast({
          title: "Success!",
          description: "Your resume has been published successfully",
        })
        
        // Reload the resume data to get updated status and progress
        await loadResume(id as string)
        
        // Refresh publication data
        fetchPublicationStatus()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to publish resume",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish resume",
        variant: "destructive"
      })
    } finally {
      setPublishing(false)
    }
  }

  // Unpublish resume
  const handleUnpublish = async () => {
    try {
      const data = await apiCall(`/resumes/${id}/unpublish`, {
        method: 'DELETE'
      })
      
      if (data.success) {
        toast({
          title: "Success!",
          description: "Your resume has been unpublished",
        })
        
        // Reload the resume data to get updated status and progress
        await loadResume(id as string)
        
        // Refresh publication data
        fetchPublicationStatus()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to unpublish resume",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unpublish resume",
        variant: "destructive"
      })
    }
  }

  // Copy URL to clipboard
  const copyUrl = async () => {
    if (!publishedUrl) return
    const url = `http://${publishedUrl}`
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Copied!",
        description: "Resume URL copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive"
      })
    }
  }

  // Load resume data and set template
  useEffect(() => {
    if (resumeData && resumeData.templateId) {
      setSelectedTemplate(resumeData.templateId)
    }
  }, [resumeData])

  useEffect(() => {
    console.log('🔄 useEffect triggered - resumeData:', !!resumeData, 'id:', id)
    if (id && typeof id === 'string') {
      // Load resume data first if not already loaded
      if (!resumeData) {
        loadResume(id)
      }
      // Always try to fetch publication status when we have an ID
      console.log('📞 Calling fetchPublicationStatus')
      fetchPublicationStatus()
    }
  }, [id, resumeData, loadResume])

  useEffect(() => {
    if (subdomain && subdomain !== publicationData?.subdomain) {
      const timeoutId = setTimeout(() => {
        checkSubdomainAvailability(subdomain)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [subdomain, publicationData?.subdomain])

  // Go back to previous step
  const handleGoBack = () => {
    router.push(`/resume-builder/${id}/steps/review`)
  }

  // Save draft
  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      await saveResume()
    } catch (error) {
      // Error already handled in saveResume
    } finally {
      setIsSaving(false)
    }
  }

  const isPublished = publicationData?.isPublished
  
  // Generate the correct published URL based on environment
  const getPublishedUrl = () => {
    if (!isPublished || !publicationData?.subdomain) return null
    
    // Check if we're in development or production
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    
    if (isLocalhost) {
      // In development, use localhost with port
      return `${publicationData.subdomain}.localhost:8080`
    } else {
      // In production, use the proper domain without www
      const baseDomain = hostname.replace(/^www\./, '') // Remove www. if present
      return `${publicationData.subdomain}.${baseDomain}`
    }
  }
  
  const publishedUrl = getPublishedUrl()

  return (
    <SimpleSidebar title={`Resume Builder${resumeData?.title ? ` - ${resumeData.title}` : ''}`}>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="mb-4">
              <div
                onClick={() => router.push('/resume-builder')}
                className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors inline-block"
              >
                <ArrowLeft className="h-6 w-6" />
              </div>
            </div>
            <h1 className="text-xl font-bold">Publish Resume</h1>
            <p className="text-muted-foreground">
              Make your resume accessible online with a custom subdomain
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Step 9 of 9
            </div>
            {lastSaved && !isDirty && (
              <div className="text-sm text-green-600 flex items-center gap-2 justify-end mt-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Auto-save indicator */}
        {isDirty && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="animate-pulse h-2 w-2 bg-yellow-500 rounded-full"></div>
            Auto-saving...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Panel */}
          <div className="lg:col-span-1">
            <ResumeNavigation currentStep="publish" />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">

            {/* Publication Status */}
            {isPublished && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your resume is live at{' '}
                  <a 
                    href={`http://${publishedUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {publishedUrl}
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Template Selection</CardTitle>
                <CardDescription>
                  Choose the design template for your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={setSelectedTemplate}
                  resumeData={resumeData || undefined}
                />
              </CardContent>
            </Card>

            {/* Publication Settings */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Publication Settings
              </CardTitle>
              <CardDescription>
                Configure how your resume will be published online
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subdomain */}
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="my-resume"
                    disabled={isPublished}
                  />
                  <span className="text-sm text-muted-foreground">
                    .{typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
                  </span>
                </div>
                
                {/* Subdomain availability indicator */}
                {subdomain && !isPublished && (
                  <div className="flex items-center gap-2 text-sm">
                    {checkingSubdomain ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : subdomainAvailable === true ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Available</span>
                      </>
                    ) : subdomainAvailable === false ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">Not available</span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Password Protection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Password Protection</Label>
                    <p className="text-sm text-muted-foreground">
                      Require a password to view your resume
                    </p>
                  </div>
                  <Switch
                    checked={isPasswordProtected}
                    onCheckedChange={setIsPasswordProtected}
                  />
                </div>
                
                {isPasswordProtected && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* SEO Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">SEO Settings</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="seo-title">Page Title</Label>
                  <Input
                    id="seo-title"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="John Doe - Software Engineer"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seo-description">Meta Description</Label>
                  <Textarea
                    id="seo-description"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Professional software engineer with 5+ years of experience..."
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoDescription.length}/160 characters
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seo-keywords">Keywords</Label>
                  <Input
                    id="seo-keywords"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="software engineer, react, node.js, javascript"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate keywords with commas
                  </p>
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>

          <div className="flex gap-2">
            {!isPublished ? (
              <Button 
                onClick={handlePublish} 
                disabled={publishing || !subdomain || subdomainAvailable === false}
                className="flex items-center gap-2"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                {publishing ? 'Publishing...' : 'Publish Resume'}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={copyUrl}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy URL
                </Button>
                
                <Button 
                  onClick={() => window.open(`http://${publishedUrl}`, '_blank')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Live
                </Button>
                
                <Button 
                  onClick={handleUnpublish}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Unpublish
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </SimpleSidebar>
  )
}

export default function PublishPage() {
  return (
    <ResumeProvider>
      <PublishForm />
    </ResumeProvider>
  )
}
