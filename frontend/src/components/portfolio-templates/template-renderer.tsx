'use client'

import Template1Professional from './template-1-professional'
import Template2Modern from './template-2-modern'
import Template3Minimal from './template-3-minimal'
import { ResumeData } from './shared/common-components'

interface TemplateRendererProps {
  templateId: string
  resumeData: ResumeData
}

const templateComponents = {
  'template-1': Template1Professional,
  'template-2': Template2Modern,
  'template-3': Template3Minimal,
  // Fallback for legacy template IDs
  'default': Template1Professional,
  'professional': Template1Professional,
  'modern': Template2Modern,
  'minimal': Template3Minimal
}

export function TemplateRenderer({ templateId, resumeData }: TemplateRendererProps) {
  const TemplateComponent = templateComponents[templateId as keyof typeof templateComponents] || Template1Professional
  
  return <TemplateComponent resumeData={resumeData} />
}
