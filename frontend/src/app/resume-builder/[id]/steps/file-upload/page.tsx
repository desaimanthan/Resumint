'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeProvider, useResume } from '@/contexts/ResumeContext'
import { ResumeNavigation } from '@/components/resume-navigation'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  RefreshCw,
  Brain,
  Zap,
  ArrowLeft
} from 'lucide-react'

interface ParsedResumeData {
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    location: string
    linkedinUrl: string
    portfolioUrl: string
  }
  summary: string
  workHistory: Array<{
    company: string
    position: string
    startDate: string
    endDate: string
    description: string
    location: string
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    startDate: string
    endDate: string
    gpa: string
    location: string
  }>
  skills: string[]
  projects: Array<{
    name: string
    description: string
    technologies: string[]
    startDate: string
    endDate: string
    url: string
  }>
}

interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
}

function FileUploadForm() {
  const { id } = useParams()
  const router = useRouter()
  const { apiCall } = useAuth()
  const { toast } = useToast()
  const { resumeData, isLoading, loadResume } = useResume()
  
  const resumeId = id as string
  
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parseProgress, setParseProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null)
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<'upload' | 'parse' | 'complete' | 'error'>('upload')
  const [currentParsingMessage, setCurrentParsingMessage] = useState('')

  // Load resume data
  useEffect(() => {
    if (resumeId && !resumeData) {
      loadResume(resumeId)
    }
  }, [resumeId, loadResume, resumeData])

  // File validation
  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Please select a PDF file'
    }
    if (file.size > 32 * 1024 * 1024) { // 32MB limit
      return 'File size must be less than 32MB'
    }
    return null
  }

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    
    setSelectedFile(file)
    setError(null)
    setProcessingStep('upload')
  }, [])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Upload and parse PDF
  const handleUploadAndParse = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setProcessingStep('upload')
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('pdf', selectedFile)
      formData.append('resumeId', resumeId)

      // Upload and parse PDF using apiCall
      const result = await apiCall('/ai/parse-resume-pdf', {
        method: 'POST',
        body: formData
      })

      clearInterval(uploadInterval)
      setUploadProgress(100)

      setIsUploading(false)
      setIsParsing(true)
      setProcessingStep('parse')
      setParseProgress(0)

      // Dynamic parsing messages with progress
      const parsingMessages = [
        'Initializing AI analysis...',
        'Reading PDF document structure...',
        'Extracting personal information...',
        'Parsing work experience details...',
        'Analyzing education background...',
        'Identifying skills and competencies...',
        'Processing project information...',
        'Extracting professional summary...',
        'Validating and structuring data...',
        'Finalizing resume parsing...'
      ]

      let messageIndex = 0
      let progress = 0
      
      const parseInterval = setInterval(() => {
        // Update message
        if (messageIndex < parsingMessages.length) {
          setCurrentParsingMessage(parsingMessages[messageIndex])
          messageIndex++
        }
        
        // Update progress
        progress += 10
        setParseProgress(progress)
        
        if (progress >= 90) {
          clearInterval(parseInterval)
          setCurrentParsingMessage('Completing analysis...')
          setParseProgress(100)
        }
      }, 800)
      
      // Wait for the interval to complete
      await new Promise(resolve => {
        const checkComplete = setInterval(() => {
          if (progress >= 90) {
            clearInterval(checkComplete)
            clearInterval(parseInterval)
            resolve(undefined)
          }
        }, 100)
      })

      // Set parsed data and token usage
      setParsedData(result.data.parsedData)
      setTokenUsage(result.data.usage)
      setIsParsing(false)
      setProcessingStep('complete')

      toast({
        title: 'Success',
        description: 'Resume parsed successfully! Redirecting to personal information...',
      })

      // Auto-redirect to personal info step after 2 seconds
      setTimeout(() => {
        router.push(`/resume-builder/${resumeId}/steps/personal-info`)
      }, 2000)

    } catch (error) {
      setIsUploading(false)
      setIsParsing(false)
      setProcessingStep('error')
      const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Continue to next step
  const handleContinue = () => {
    router.push(`/resume-builder/${resumeId}/steps/personal-info`)
  }

  // Reset and try again
  const handleReset = () => {
    setSelectedFile(null)
    setParsedData(null)
    setTokenUsage(null)
    setError(null)
    setProcessingStep('upload')
    setUploadProgress(0)
    setParseProgress(0)
  }

  if (isLoading) {
    return (
      <SimpleSidebar title={`Resume Builder${resumeData?.title ? ` - ${resumeData.title}` : ''}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SimpleSidebar>
    )
  }

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
            <h1 className="text-xl font-bold">Upload Your Resume</h1>
            <p className="text-muted-foreground">
              Upload your PDF resume and we'll extract all the information using AI to pre-fill your resume builder.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Step 0 of 9
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              PDF Upload & Parsing
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Panel */}
          <div className="lg:col-span-1">
            <ResumeNavigation currentStep="file-upload" />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* AI Processing Info */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Brain className="h-5 w-5" />
                  AI-Powered Resume Parsing
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Our advanced AI will read your PDF resume and automatically extract all information including work experience, education, skills, and more. This saves you time by pre-filling the resume builder.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Progress Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between space-x-4">
                  <div className={`flex items-center space-x-2 ${
                    processingStep === 'upload' ? 'text-blue-600' : 
                    ['parse', 'complete'].includes(processingStep) ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      processingStep === 'upload' ? 'bg-blue-100 border-2 border-blue-600' :
                      ['parse', 'complete'].includes(processingStep) ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100'
                    }`}>
                      {['parse', 'complete'].includes(processingStep) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">1</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">Upload PDF</span>
                  </div>
                  
                  <div className={`flex-1 h-0.5 ${
                    ['parse', 'complete'].includes(processingStep) ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                  
                  <div className={`flex items-center space-x-2 ${
                    processingStep === 'parse' ? 'text-blue-600' : 
                    processingStep === 'complete' ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      processingStep === 'parse' ? 'bg-blue-100 border-2 border-blue-600' :
                      processingStep === 'complete' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100'
                    }`}>
                      {processingStep === 'complete' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : processingStep === 'parse' ? (
                        <Brain className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">2</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">AI Parsing</span>
                  </div>
                  
                  <div className={`flex-1 h-0.5 ${
                    processingStep === 'complete' ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                  
                  <div className={`flex items-center space-x-2 ${
                    processingStep === 'complete' ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      processingStep === 'complete' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100'
                    }`}>
                      {processingStep === 'complete' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">3</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">Complete</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload Section */}
            {processingStep === 'upload' && !selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload PDF Resume
                  </CardTitle>
                  <CardDescription>
                    Select your resume file to get started. We support PDF files up to 32MB.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Drop your PDF here</h3>
                    <p className="text-muted-foreground mb-4">
                      or click to browse files
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer">
                        Choose File
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-4">
                      Maximum file size: 32MB • PDF format only
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Selected */}
            {selectedFile && processingStep === 'upload' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Ready to Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="flex-1">
                      <h3 className="font-medium">{selectedFile.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleReset}>
                      Change File
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleUploadAndParse}
                    disabled={isUploading || isParsing}
                    className="w-full"
                    size="lg"
                  >
                    {isUploading || isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Start AI Processing
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Processing Progress */}
            {(isUploading || isParsing) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Your Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isUploading && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Uploading file...</span>
                        <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                  
                  {isParsing && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          AI is reading your resume...
                        </span>
                        <span className="text-sm text-muted-foreground">{parseProgress}%</span>
                      </div>
                      <Progress value={parseProgress} className="h-2" />
                      {currentParsingMessage && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700 flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {currentParsingMessage}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        This may take a few moments while our AI extracts all your information.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && processingStep === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success State */}
            {processingStep === 'complete' && parsedData && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Resume Parsed Successfully!</span>
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    We've extracted the following information from your resume. You can review and edit this in the next steps.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Personal Info Preview */}
                  <div>
                    <h4 className="font-medium mb-2">Personal Information</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{parsedData.personalInfo.firstName} {parsedData.personalInfo.lastName}</p>
                      <p>{parsedData.personalInfo.email}</p>
                      <p>{parsedData.personalInfo.phone}</p>
                      <p>{typeof parsedData.personalInfo.location === 'string' ? parsedData.personalInfo.location : 'Location information extracted'}</p>
                    </div>
                  </div>

                  {/* Work History Preview */}
                  {parsedData.workHistory.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Work Experience</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>{parsedData.workHistory.length} position(s) found</p>
                      </div>
                    </div>
                  )}

                  {/* Education Preview */}
                  {parsedData.education.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Education</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>{parsedData.education.length} education entry(ies) found</p>
                      </div>
                    </div>
                  )}

                  {/* Skills Preview */}
                  {parsedData.skills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Skills</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>{parsedData.skills.length} skills found</p>
                      </div>
                    </div>
                  )}

                  {/* Token Usage */}
                  {tokenUsage && (
                    <div className="pt-4 border-t border-green-200">
                      <h4 className="font-medium mb-2">AI Usage</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Tokens used: {tokenUsage.totalTokens.toLocaleString()}</p>
                        <p>Estimated cost: ${tokenUsage.estimatedCost.toFixed(4)}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <p className="text-sm text-green-600 mb-4">
                      🎉 Automatically redirecting to Personal Information step in a few seconds...
                    </p>
                    <Button onClick={handleContinue} className="w-full" size="lg">
                      Continue to Personal Information
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {processingStep === 'complete' && (
          <div className="flex justify-between items-center pt-6">
            <Button onClick={handleReset} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Upload Different File
            </Button>
            <Button onClick={handleContinue} size="lg">
              Continue to Resume Builder
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </SimpleSidebar>
  )
}

export default function FileUploadPage() {
  return (
    <ResumeProvider>
      <FileUploadForm />
    </ResumeProvider>
  )
}
