'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Circle, CheckCircle, Upload, Eye, BarChart3 } from 'lucide-react'
import { useResume } from '@/contexts/ResumeContext'

interface ResumeNavigationProps {
  currentStep?: string
}

export function ResumeNavigation({ currentStep }: ResumeNavigationProps) {
  const router = useRouter()
  const { id } = useParams()
  const { resumeData, isDirty } = useResume()

  const sections = [
    { 
      id: 'file-upload', 
      label: 'PDF Upload',
      isComplete: !!(resumeData?.creationMethod === 'pdf_upload' && resumeData?.pdfParsingMetadata?.parsedAt),
      isOptional: true,
      showOnlyForPdfUpload: true
    },
    { 
      id: 'personal-info', 
      label: 'Personal Information',
      isComplete: !!(resumeData?.personalInfo?.firstName && resumeData?.personalInfo?.lastName && resumeData?.personalInfo?.email)
    },
    { 
      id: 'work-history', 
      label: 'Work History',
      isComplete: !!(resumeData?.workHistory && resumeData.workHistory.length > 0)
    },
    { 
      id: 'education', 
      label: 'Education',
      isComplete: !!(resumeData?.education && resumeData.education.length > 0)
    },
    { 
      id: 'skills', 
      label: 'Skills',
      isComplete: !!(resumeData?.skills && resumeData.skills.length > 0)
    },
    { 
      id: 'projects', 
      label: 'Projects',
      isComplete: !!(resumeData?.projects && resumeData.projects.length > 0)
    },
    { 
      id: 'summary', 
      label: 'Summary',
      isComplete: !!(resumeData?.summary && resumeData.summary.trim && resumeData.summary.trim().length > 0)
    },
    { 
      id: 'additional-sections', 
      label: 'Additional Sections',
      isComplete: !!(resumeData?.optionalSections && (
        (resumeData.optionalSections.languages && resumeData.optionalSections.languages.some(lang => lang.language && lang.language.trim && lang.language.trim())) ||
        (resumeData.optionalSections.volunteerWork && resumeData.optionalSections.volunteerWork.some(work => work.organization && work.organization.trim && work.organization.trim())) ||
        (resumeData.optionalSections.publications && resumeData.optionalSections.publications.some(pub => pub.title && pub.title.trim && pub.title.trim())) ||
        (resumeData.optionalSections.hobbies && resumeData.optionalSections.hobbies.some(hobby => hobby && typeof hobby === 'string' && hobby.trim()))
      ))
    }
  ]

  const handleSectionClick = (sectionId: string) => {
    if (sectionId === currentStep) return // Don't navigate to current step
    router.push(`/resume-builder/${id}/steps/${sectionId}`)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Sections
          </CardTitle>
          <CardDescription>
            Click to edit any section of your resume
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.map((section) => {
            const isCurrent = section.id === currentStep
            const hasUnsavedChanges = isCurrent && isDirty
            
            // Only show PDF upload section if creation method is pdf_upload
            if (section.showOnlyForPdfUpload && resumeData?.creationMethod !== 'pdf_upload') {
              return null
            }
            
            return (
              <Button
                key={section.id}
                variant={isCurrent ? "default" : "outline"}
                className={`w-full justify-between ${isCurrent ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => handleSectionClick(section.id)}
                disabled={isCurrent}
              >
                <span className="flex items-center gap-2">
                  {section.isComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                  {section.label}
                </span>
                
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-1">
                    <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-xs text-yellow-200">Unsaved</span>
                  </div>
                )}
              </Button>
            )
          }).filter(Boolean)}
          
          {/* Review Step */}
          <Button
            variant={currentStep === 'review' ? "default" : "outline"}
            className={`w-full justify-start ${currentStep === 'review' ? 'bg-blue-600 text-white' : ''}`}
            onClick={() => handleSectionClick('review')}
            disabled={currentStep === 'review'}
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              Resume Preview
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* Publication Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publication Settings
          </CardTitle>
          <CardDescription>
            Publish and share your resume
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant={currentStep === 'publish' ? "default" : "outline"}
            className={`w-full justify-start ${currentStep === 'publish' ? 'bg-blue-600 text-white' : ''}`}
            onClick={() => handleSectionClick('publish')}
            disabled={currentStep === 'publish'}
          >
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-purple-500" />
              Publish Resume
            </span>
          </Button>
          
          <Button
            variant={currentStep === 'analytics' ? "default" : "outline"}
            className={`w-full justify-start ${currentStep === 'analytics' ? 'bg-blue-600 text-white' : ''}`}
            onClick={() => handleSectionClick('analytics')}
            disabled={currentStep === 'analytics'}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              Analytics
            </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
