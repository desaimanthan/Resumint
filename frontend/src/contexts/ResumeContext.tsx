'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from '@/hooks/use-toast'

// Resume data types
export interface PersonalInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: {
    city: string
    state: string
    country: string
  } | string
  linkedin: string
  website: string
  github: string
  profilePhoto: string
}

export interface WorkHistoryItem {
  _id?: string
  jobTitle: string
  companyName: string
  companyLogo?: string
  companyDomain?: string
  startDate: Date | string
  endDate: Date | string | null
  isCurrentJob: boolean
  responsibilities: string[]
  achievements: Array<{
    description: string
    impact: string
  }>
  technologies: string[]
  location: string
}

export interface EducationItem {
  _id?: string
  degree: string
  institution: string
  fieldOfStudy?: string
  location?: string
  graduationDate: Date | string
  gpa: string | null
  honors: string[]
  relevantCoursework: string[]
}

export interface CertificationItem {
  _id?: string
  name: string
  issuer: string
  dateEarned: Date | string
  expirationDate: Date | string | null
  credentialId: string
  verificationUrl: string
}

export interface SkillItem {
  _id?: string
  skillName: string
  category: 'Technical' | 'Soft' | 'Language' | 'Other'
}

export interface ProjectItem {
  _id?: string
  name: string
  role: string
  startDate: Date | string
  endDate: Date | string
  description: string
  technologies: string[]
  outcome: string
  url: string
  github: string
}

export interface AchievementItem {
  _id?: string
  title: string
  issuer: string
  date: Date | string
  description: string
}

export interface OptionalSections {
  languages: Array<{
    language: string
    proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native'
  }>
  volunteerWork: Array<{
    organization: string
    role: string
    startDate: Date | string
    endDate: Date | string
    description: string
  }>
  publications: Array<{
    title: string
    publisher: string
    date: Date | string
    url: string
  }>
  hobbies: string[]
}

export interface ResumeData {
  _id?: string
  userId?: string
  title: string
  personalInfo: PersonalInfo
  workHistory: WorkHistoryItem[]
  education: EducationItem[]
  certifications: CertificationItem[]
  skills: SkillItem[]
  projects: ProjectItem[]
  otherAchievements: AchievementItem[]
  summary: string
  optionalSections: OptionalSections
  isDraft: boolean
  lastSaved: Date | string | null
  templateId: string
  createdAt?: Date | string
  updatedAt?: Date | string
  creationMethod?: 'scratch' | 'pdf_upload'
  pdfParsingMetadata?: {
    fileName?: string
    fileSize?: number
    pageCount?: number
    processingTime?: number
    claudeModel?: string
    parsedAt?: Date | string
  }
  publication?: {
    isPublished: boolean
    subdomain?: string
    isPasswordProtected?: boolean
    publishedAt?: Date | string
    seoMetadata?: {
      title?: string
      description?: string
      keywords?: string[]
    }
    analytics?: {
      totalViews: number
      uniqueVisitors: number
      lastViewed?: Date | string
    }
  }
}

interface ResumeContextType {
  resumeData: ResumeData | null
  isLoading: boolean
  isDirty: boolean
  lastSaved: Date | null
  autoSaveEnabled: boolean
  
  // CRUD operations
  loadResume: (resumeId: string) => Promise<void>
  createResume: (title: string) => Promise<string>
  updateResume: (updates: Partial<ResumeData>) => Promise<void>
  saveResume: () => Promise<void>
  saveDraft: () => Promise<void>
  autoSave: () => Promise<void>
  
  // Section updates
  updatePersonalInfo: (personalInfo: Partial<PersonalInfo>) => void
  updateWorkHistory: (workHistory: WorkHistoryItem[]) => void
  updateEducation: (education: EducationItem[]) => void
  updateCertifications: (certifications: CertificationItem[]) => void
  updateSkills: (skills: SkillItem[]) => void
  updateProjects: (projects: ProjectItem[]) => void
  updateAchievements: (achievements: AchievementItem[]) => void
  updateSummary: (summary: string) => void
  updateOptionalSections: (optionalSections: Partial<OptionalSections>) => void
  
  // Utility functions
  resetResume: () => void
  setAutoSaveEnabled: (enabled: boolean) => void
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined)

// Default resume data structure
const getDefaultResumeData = (): ResumeData => ({
  title: 'My Resume',
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: {
      city: '',
      state: '',
      country: ''
    },
    linkedin: '',
    website: '',
    github: '',
    profilePhoto: ''
  },
  workHistory: [],
  education: [],
  certifications: [],
  skills: [],
  projects: [],
  otherAchievements: [],
  summary: '',
  optionalSections: {
    languages: [],
    volunteerWork: [],
    publications: [],
    hobbies: []
  },
  isDraft: true,
  lastSaved: null,
  templateId: 'default'
})

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const { apiCall } = useAuth()
  const { toast } = useToast()
  
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // Auto-save functionality (simplified for now)
  const scheduleAutoSave = useCallback(() => {
    // Auto-save functionality will be implemented later
    // For now, we'll rely on manual saves
  }, [])

  // Load resume from API
  const loadResume = useCallback(async (resumeId: string) => {
    setIsLoading(true)
    try {
      const data = await apiCall(`/resumes/${resumeId}`)
      setResumeData(data.data.resume)
      setIsDirty(false)
      setLastSaved(new Date(data.data.resume.lastSaved))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load resume',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [apiCall, toast])

  // Create new resume
  const createResume = useCallback(async (title: string): Promise<string> => {
    setIsLoading(true)
    try {
      const data = await apiCall('/resumes', {
        method: 'POST',
        body: JSON.stringify({ title }),
      })
      setResumeData(data.data.resume)
      setIsDirty(false)
      setLastSaved(new Date(data.data.resume.lastSaved))
      return data.data.resume._id
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create resume',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [apiCall, toast])

  // Update resume
  const updateResume = useCallback(async (updates: Partial<ResumeData>) => {
    if (!resumeData?._id) return

    try {
      const data = await apiCall(`/resumes/${resumeData._id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setResumeData(data.data.resume)
      setIsDirty(false)
      setLastSaved(new Date(data.data.resume.lastSaved))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update resume',
        variant: 'destructive',
      })
      throw error
    }
  }, [resumeData?._id, apiCall, toast])

  // Save resume
  const saveResume = useCallback(async () => {
    if (!resumeData?._id || !isDirty) return

    try {
      await updateResume(resumeData)
      toast({
        title: 'Success',
        description: 'Resume saved successfully',
      })
    } catch (error) {
      // Error already handled in updateResume
    }
  }, [resumeData, isDirty, updateResume, toast])

  // Save draft (bypasses validation)
  const saveDraft = useCallback(async () => {
    if (!resumeData?._id) return

    try {
      
      const data = await apiCall(`/resumes/${resumeData._id}/draft`, {
        method: 'PATCH',
        body: JSON.stringify(resumeData),
      })
      
      setResumeData(data.data.resume)
      setIsDirty(false)
      setLastSaved(new Date(data.data.resume.lastSaved))
      toast({
        title: 'Success',
        description: 'Draft saved successfully',
      })
    } catch (error) {
      console.error('Save draft error:', error)
      
      // Check if it's an authentication error
      if (error instanceof Error && (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('token'))) {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue editing your resume.',
          variant: 'destructive',
        })
        // Redirect to login after a short delay
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }, 2000)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save draft. Please try again.',
          variant: 'destructive',
        })
      }
      throw error
    }
  }, [resumeData, apiCall, toast])

  // Auto-save
  const autoSave = useCallback(async () => {
    if (!resumeData?._id || !isDirty) return

    try {
      const data = await apiCall(`/resumes/${resumeData._id}/autosave`, {
        method: 'PATCH',
        body: JSON.stringify(resumeData),
      })
      setIsDirty(false)
      setLastSaved(new Date(data.data.lastSaved))
    } catch (error) {
    }
  }, [resumeData, isDirty, apiCall])



  // Section update functions
  const updatePersonalInfo = useCallback((personalInfo: Partial<PersonalInfo>) => {
    if (!resumeData) return
    const updatedData = {
      ...resumeData,
      personalInfo: { ...resumeData.personalInfo, ...personalInfo }
    };
    setResumeData(updatedData);
    setIsDirty(true)
  }, [resumeData])

  const updateWorkHistory = useCallback((workHistory: WorkHistoryItem[]) => {
    if (!resumeData) return
    const updatedData = { ...resumeData, workHistory };
    setResumeData(updatedData);
    setIsDirty(true)
  }, [resumeData])

  const updateEducation = useCallback((education: EducationItem[]) => {
    if (!resumeData) return
    const updatedData = { ...resumeData, education };
    setResumeData(updatedData);
    setIsDirty(true)
  }, [resumeData])

  const updateCertifications = useCallback((certifications: CertificationItem[]) => {
    if (!resumeData) return
    const updatedData = { ...resumeData, certifications };
    setResumeData(updatedData);
    setIsDirty(true)
  }, [resumeData])

  const updateSkills = useCallback((skills: SkillItem[]) => {
    if (!resumeData) return
    const updatedData = { ...resumeData, skills };
    setResumeData(updatedData);
    setIsDirty(true)
  }, [resumeData])

  const updateProjects = useCallback((projects: ProjectItem[]) => {
    if (!resumeData) return
    const updatedData = { ...resumeData, projects };
    setResumeData(updatedData);
    setIsDirty(true)
  }, [resumeData])

  const updateAchievements = useCallback((otherAchievements: AchievementItem[]) => {
    if (!resumeData) return
    const updatedData = { ...resumeData, otherAchievements };
    setResumeData(updatedData);
    setIsDirty(true)
  }, [resumeData])

  const updateSummary = useCallback((summary: string) => {
    if (!resumeData) return
    const updatedData = { ...resumeData, summary };
    setResumeData(updatedData);
    setIsDirty(true)
  }, [resumeData])

  const updateOptionalSections = useCallback((optionalSections: Partial<OptionalSections>) => {
    if (!resumeData) return
    const updatedData = {
      ...resumeData,
      optionalSections: { ...resumeData.optionalSections, ...optionalSections }
    };
    setResumeData(updatedData);
    setIsDirty(true)
  }, [resumeData])

  // Reset resume
  const resetResume = useCallback(() => {
    setResumeData(getDefaultResumeData())
    setIsDirty(false)
    setLastSaved(null)
  }, [])

  // Schedule auto-save when data changes (disabled for now)
  useEffect(() => {
    // scheduleAutoSave()
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [])

  const value: ResumeContextType = {
    resumeData,
    isLoading,
    isDirty,
    lastSaved,
    autoSaveEnabled,
    
    loadResume,
    createResume,
    updateResume,
    saveResume,
    saveDraft,
    autoSave,
    
    updatePersonalInfo,
    updateWorkHistory,
    updateEducation,
    updateCertifications,
    updateSkills,
    updateProjects,
    updateAchievements,
    updateSummary,
    updateOptionalSections,
    
    resetResume,
    setAutoSaveEnabled,
  }

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  )
}

export function useResume() {
  const context = useContext(ResumeContext)
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider')
  }
  return context
}
