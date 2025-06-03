'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Template1Professional from './template-1-professional'
import Template2Modern from './template-2-modern'
import Template3Minimal from './template-3-minimal'
import { ResumeData } from './shared/common-components'
import { ResumeData as ContextResumeData } from '@/contexts/ResumeContext'

interface TemplateSelectorProps {
  selectedTemplate: string
  onTemplateSelect: (templateId: string) => void
  resumeData?: ContextResumeData
}

const templates = [
  {
    id: 'template-1',
    name: 'Professional',
    description: 'Clean, traditional layout perfect for corporate environments',
    features: ['Traditional layout', 'Professional colors', 'Print optimized', 'ATS friendly'],
    preview: '/template-previews/professional.png',
    component: Template1Professional
  },
  {
    id: 'template-2',
    name: 'Modern',
    description: 'Contemporary design with sidebar and visual elements',
    features: ['Sidebar layout', 'Visual skills display', 'Modern gradients', 'Card-based sections'],
    preview: '/template-previews/modern.png',
    component: Template2Modern
  },
  {
    id: 'template-3',
    name: 'Minimal',
    description: 'Clean, typography-focused design with lots of whitespace',
    features: ['Typography focused', 'Minimal design', 'Elegant spacing', 'Monochromatic'],
    preview: '/template-previews/minimal.png',
    component: Template3Minimal
  }
]

export function TemplateSelector({ selectedTemplate, onTemplateSelect, resumeData }: TemplateSelectorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null)

  // Mock resume data for preview if none provided
  const mockResumeData: ResumeData = {
    _id: 'preview',
    title: 'Preview Resume',
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      website: 'https://johndoe.com',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    summary: 'Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Passionate about creating scalable solutions and leading high-performing teams.',
    workHistory: [
      {
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Corp',
        location: 'San Francisco, CA',
        startDate: '2022-01-01',
        endDate: '',
        isCurrentJob: true,
        responsibilities: [
          'Led development of microservices architecture serving 1M+ users',
          'Mentored junior developers and conducted code reviews',
          'Implemented CI/CD pipelines reducing deployment time by 60%'
        ],
        achievements: [
          {
            description: 'Increased system performance by 40%',
            impact: 'Improved user experience and reduced server costs'
          }
        ]
      },
      {
        jobTitle: 'Software Engineer',
        companyName: 'StartupXYZ',
        location: 'San Francisco, CA',
        startDate: '2020-06-01',
        endDate: '2021-12-31',
        isCurrentJob: false,
        responsibilities: [
          'Developed React-based web applications',
          'Built RESTful APIs using Node.js and Express',
          'Collaborated with design team on UI/UX improvements'
        ],
        achievements: [
          {
            description: 'Launched 3 major product features',
            impact: 'Increased user engagement by 25%'
          }
        ]
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of California, Berkeley',
        location: 'Berkeley, CA',
        graduationDate: '2020-05-01',
        gpa: '3.8',
        honors: ['Magna Cum Laude', 'Dean\'s List']
      }
    ],
    skills: [
      { skillName: 'JavaScript', category: 'Programming Languages' },
      { skillName: 'TypeScript', category: 'Programming Languages' },
      { skillName: 'Python', category: 'Programming Languages' },
      { skillName: 'React', category: 'Frontend' },
      { skillName: 'Node.js', category: 'Backend' },
      { skillName: 'AWS', category: 'Cloud' },
      { skillName: 'Docker', category: 'DevOps' }
    ],
    certifications: [
      {
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        dateEarned: '2023-03-01',
        credentialId: 'AWS-CSA-123456'
      }
    ],
    projects: [
      {
        name: 'E-commerce Platform',
        description: 'Full-stack e-commerce solution with React frontend and Node.js backend',
        technologies: ['React', 'Node.js', 'MongoDB', 'Stripe API'],
        startDate: '2023-01-01',
        endDate: '2023-06-01',
        url: 'https://demo-ecommerce.com',
        github: 'https://github.com/johndoe/ecommerce'
      }
    ],
    otherAchievements: [],
    optionalSections: {
      languages: [
        { language: 'English', proficiency: 'Native' },
        { language: 'Spanish', proficiency: 'Conversational' }
      ],
      hobbies: ['Photography', 'Rock Climbing', 'Chess', 'Cooking']
    }
  }

  // Convert ContextResumeData to ResumeData for template compatibility
  const convertToTemplateData = (data: ContextResumeData): ResumeData => {
    return {
      ...data,
      _id: data._id || 'preview'
    } as ResumeData
  }

  const previewData = resumeData ? convertToTemplateData(resumeData) : mockResumeData

  const renderPreview = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return null

    const TemplateComponent = template.component
    return <TemplateComponent resumeData={previewData} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Choose Template</h3>
        <p className="text-sm text-gray-600">
          Select a template design for your portfolio. You can change this anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTemplate === template.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => onTemplateSelect(template.id)}
          >
            <CardContent className="p-4">
              {/* Template Preview Image */}
              <div className="relative mb-4">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  {/* Placeholder for template preview */}
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Preview</span>
                  </div>
                </div>
                
                {/* Selected indicator */}
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                {/* Preview button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewTemplate(template.id)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>{template.name} Template Preview</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      {renderPreview(template.id)}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Template Info */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    {template.name}
                    {selectedTemplate === template.id && (
                      <Badge variant="default" className="text-xs">Selected</Badge>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>

                {/* Features */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Features
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected template info */}
      {selectedTemplate && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {templates.find(t => t.id === selectedTemplate)?.name} Template Selected
            </span>
          </div>
          <p className="text-sm text-blue-700">
            {templates.find(t => t.id === selectedTemplate)?.description}
          </p>
        </div>
      )}
    </div>
  )
}
