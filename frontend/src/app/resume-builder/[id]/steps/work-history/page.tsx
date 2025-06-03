'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeProvider, useResume, WorkHistoryItem } from '@/contexts/ResumeContext'
import { ResumeNavigation } from '@/components/resume-navigation'
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Save, 
  ArrowLeft,
  Building,
  MapPin,
  Award,
  Target
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CompanyAutocomplete } from '@/components/ui/company-autocomplete'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function WorkHistoryForm() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const {
    resumeData,
    isLoading,
    isDirty,
    lastSaved,
    loadResume,
    updateWorkHistory,
    saveResume,
    saveDraft
  } = useResume()

  const [workHistory, setWorkHistory] = useState<WorkHistoryItem[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Load resume data
  useEffect(() => {
    if (id && typeof id === 'string' && !resumeData) {
      loadResume(id)
    }
  }, [id, loadResume, resumeData])

  // Update form when resume data loads
  useEffect(() => {
    if (resumeData?.workHistory) {
      setWorkHistory(resumeData.workHistory.length > 0 ? resumeData.workHistory : [getEmptyWorkItem()])
    } else if (resumeData) {
      // Initialize with one empty work item if no work history exists
      setWorkHistory([getEmptyWorkItem()])
    }
  }, [resumeData])

  // Force re-render when work history changes to update logos immediately
  useEffect(() => {
  }, [workHistory])

  // Create empty work item
  const getEmptyWorkItem = (): WorkHistoryItem => ({
    jobTitle: '',
    companyName: '',
    companyLogo: '',
    companyDomain: '',
    startDate: '',
    endDate: '',
    isCurrentJob: false,
    responsibilities: [''],
    achievements: [{ description: '', impact: '' }],
    technologies: [''],
    location: ''
  })

  // Add new work experience
  const addWorkExperience = () => {
    const newWorkHistory = [...workHistory, getEmptyWorkItem()]
    setWorkHistory(newWorkHistory)
    updateWorkHistory(newWorkHistory)
  }

  // Remove work experience
  const removeWorkExperience = (index: number) => {
    if (workHistory.length === 1) {
      toast({
        title: 'Cannot remove',
        description: 'At least one work experience entry is required.',
        variant: 'destructive',
      })
      return
    }
    
    const newWorkHistory = workHistory.filter((_, i) => i !== index)
    setWorkHistory(newWorkHistory)
    updateWorkHistory(newWorkHistory)
  }

  // Update work item field
  const updateWorkItem = (index: number, field: keyof WorkHistoryItem, value: any) => {
    const newWorkHistory = [...workHistory]
    newWorkHistory[index] = { ...newWorkHistory[index], [field]: value }
    setWorkHistory(newWorkHistory)
    updateWorkHistory(newWorkHistory)
  }

  // Add responsibility
  const addResponsibility = (workIndex: number) => {
    const newWorkHistory = [...workHistory]
    newWorkHistory[workIndex].responsibilities.push('')
    setWorkHistory(newWorkHistory)
    updateWorkHistory(newWorkHistory)
  }

  // Remove responsibility
  const removeResponsibility = (workIndex: number, respIndex: number) => {
    const newWorkHistory = [...workHistory]
    if (newWorkHistory[workIndex].responsibilities.length > 1) {
      newWorkHistory[workIndex].responsibilities.splice(respIndex, 1)
      setWorkHistory(newWorkHistory)
      updateWorkHistory(newWorkHistory)
    }
  }

  // Update responsibility
  const updateResponsibility = (workIndex: number, respIndex: number, value: string) => {
    const newWorkHistory = [...workHistory]
    newWorkHistory[workIndex].responsibilities[respIndex] = value
    setWorkHistory(newWorkHistory)
    updateWorkHistory(newWorkHistory)
  }

  // Add achievement
  const addAchievement = (workIndex: number) => {
    const newWorkHistory = [...workHistory]
    newWorkHistory[workIndex].achievements.push({ description: '', impact: '' })
    setWorkHistory(newWorkHistory)
    updateWorkHistory(newWorkHistory)
  }

  // Remove achievement
  const removeAchievement = (workIndex: number, achIndex: number) => {
    const newWorkHistory = [...workHistory]
    if (newWorkHistory[workIndex].achievements.length > 1) {
      newWorkHistory[workIndex].achievements.splice(achIndex, 1)
      setWorkHistory(newWorkHistory)
      updateWorkHistory(newWorkHistory)
    }
  }

  // Update achievement
  const updateAchievement = (workIndex: number, achIndex: number, field: 'description' | 'impact', value: string) => {
    const newWorkHistory = [...workHistory]
    newWorkHistory[workIndex].achievements[achIndex][field] = value
    setWorkHistory(newWorkHistory)
    updateWorkHistory(newWorkHistory)
  }

  // Add technology
  const addTechnology = (workIndex: number) => {
    const newWorkHistory = [...workHistory]
    newWorkHistory[workIndex].technologies.push('')
    setWorkHistory(newWorkHistory)
    updateWorkHistory(newWorkHistory)
  }

  // Remove technology
  const removeTechnology = (workIndex: number, techIndex: number) => {
    const newWorkHistory = [...workHistory]
    if (newWorkHistory[workIndex].technologies.length > 1) {
      newWorkHistory[workIndex].technologies.splice(techIndex, 1)
      setWorkHistory(newWorkHistory)
      updateWorkHistory(newWorkHistory)
    }
  }

  // Update technology
  const updateTechnology = (workIndex: number, techIndex: number, value: string) => {
    const newWorkHistory = [...workHistory]
    newWorkHistory[workIndex].technologies[techIndex] = value
    setWorkHistory(newWorkHistory)
    updateWorkHistory(newWorkHistory)
  }

  // Handle current role checkbox
  const handleCurrentRoleChange = (workIndex: number, isCurrentRole: boolean) => {
    const newWorkHistory = [...workHistory]
    newWorkHistory[workIndex].isCurrentJob = isCurrentRole
    if (isCurrentRole) {
      newWorkHistory[workIndex].endDate = ''
    }
    setWorkHistory(newWorkHistory)
    updateWorkHistory(newWorkHistory)
  }

  // Save and continue
  const handleSaveAndContinue = async () => {
    setIsSaving(true)
    try {
      // First update the work history in context
      updateWorkHistory(workHistory)
      // Try to save, but continue navigation even if save fails
      try {
        await saveResume()
      } catch (saveError) {
        console.error('Save failed, but continuing navigation:', saveError)
        // Show a warning but don't block navigation
        toast({
          title: 'Warning',
          description: 'Changes may not be saved. Please try saving again.',
          variant: 'destructive',
        })
      }
      // Navigate regardless of save status
      router.push(`/resume-builder/${id}/steps/education`)
    } catch (error) {
      console.error('Navigation error:', error)
      toast({
        title: 'Error',
        description: 'Failed to navigate to next step',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Save draft
  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      // For draft saves, we want to save all current work including incomplete entries
      updateWorkHistory(workHistory)
      await saveDraft()
    } catch (error) {
      // Error already handled in saveDraft
    } finally {
      setIsSaving(false)
    }
  }

  // Go back
  const handleGoBack = () => {
    router.push(`/resume-builder/${id}/steps/personal-info`)
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
            <h1 className="text-xl font-bold">Work History</h1>
            <p className="text-muted-foreground">
              Add your professional experience, starting with your most recent role.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Step 2 of 9
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
            <ResumeNavigation currentStep="work-history" />
          </div>

          {/* Work History Entries */}
          <div className="lg:col-span-3 space-y-6">
            {workHistory.map((work, workIndex) => (
          <Card key={`${workIndex}-${work.companyLogo || 'no-logo'}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    {work.companyLogo ? (
                      <img
                        src={work.companyLogo}
                        alt={`${work.companyName} logo`}
                        className="w-12 h-12 rounded-lg object-contain border border-gray-200"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          // Show fallback briefcase icon with background
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) {
                            fallback.style.display = 'flex'
                            fallback.classList.add('bg-gray-100', 'rounded-lg', 'border', 'border-gray-200')
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center ${work.companyLogo ? 'hidden' : 'flex'}`}>
                      <Briefcase className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Work Experience {workIndex + 1}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      {workIndex === 0 ? 'Your most recent position' : 'Previous work experience'}
                    </CardDescription>
                  </div>
                </div>
                {workHistory.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeWorkExperience(workIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Job Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`jobTitle-${workIndex}`}>Job Title *</Label>
                  <Input
                    id={`jobTitle-${workIndex}`}
                    value={work.jobTitle || ''}
                    onChange={(e) => updateWorkItem(workIndex, 'jobTitle', e.target.value)}
                    placeholder="Software Engineer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`companyName-${workIndex}`}>Company Name *</Label>
                  <CompanyAutocomplete
                    value={work.companyName || ''}
                    onSelect={(company) => {
                      if (company) {
                        // Update all company fields in a single state update to avoid race conditions
                        const newWorkHistory = [...workHistory]
                        newWorkHistory[workIndex] = {
                          ...newWorkHistory[workIndex],
                          companyName: company.name,
                          companyLogo: company.logo || '',
                          companyDomain: company.domain || ''
                        }
                        setWorkHistory(newWorkHistory)
                        updateWorkHistory(newWorkHistory)
                      }
                    }}
                    onChange={(value) => {
                      // Only update company name when manually typing, not when selecting from dropdown
                      // This prevents overwriting logo and domain
                      if (value !== work.companyName) {
                        updateWorkItem(workIndex, 'companyName', value)
                      }
                    }}
                    placeholder="Search or enter company name..."
                  />
                </div>
              </div>

              {/* Dates and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={(() => {
                        if (!work.startDate) return ''
                        // Parse YYYY-MM format explicitly
                        const dateStr = typeof work.startDate === 'string' ? work.startDate : work.startDate.toISOString().slice(0, 7)
                        const [year, month] = dateStr.split('-')
                        return month ? parseInt(month).toString() : ''
                      })()}
                      onValueChange={(month) => {
                        const currentYear = work.startDate ? 
                          parseInt((typeof work.startDate === 'string' ? work.startDate : work.startDate.toISOString()).split('-')[0]) : 
                          new Date().getFullYear()
                        // Format as YYYY-MM with leading zero
                        const formattedMonth = month.padStart(2, '0')
                        const newDateString = `${currentYear}-${formattedMonth}`
                        updateWorkItem(workIndex, 'startDate', newDateString)
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={work.startDate ? 
                        (typeof work.startDate === 'string' ? work.startDate : work.startDate.toISOString().slice(0, 7)).split('-')[0] : 
                        ''}
                      onValueChange={(year) => {
                        const currentMonth = work.startDate ? 
                          (typeof work.startDate === 'string' ? work.startDate : work.startDate.toISOString().slice(0, 7)).split('-')[1] : 
                          (new Date().getMonth() + 1).toString().padStart(2, '0')
                        const newDateString = `${year}-${currentMonth}`
                        updateWorkItem(workIndex, 'startDate', newDateString)
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div className="flex gap-2">
                    <Select
                      value={work.endDate && !work.isCurrentJob ? (new Date(work.endDate).getMonth() + 1).toString() : ''}
                      onValueChange={(month) => {
                        const currentDate = work.endDate ? new Date(work.endDate) : new Date()
                        const newDate = new Date(currentDate.getFullYear(), parseInt(month) - 1, 1)
                        updateWorkItem(workIndex, 'endDate', newDate.toISOString())
                      }}
                      disabled={work.isCurrentJob}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={work.endDate && !work.isCurrentJob ? new Date(work.endDate).getFullYear().toString() : ''}
                      onValueChange={(year) => {
                        const currentDate = work.endDate ? new Date(work.endDate) : new Date()
                        const newDate = new Date(parseInt(year), currentDate.getMonth(), 1)
                        updateWorkItem(workIndex, 'endDate', newDate.toISOString())
                      }}
                      disabled={work.isCurrentJob}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`currentRole-${workIndex}`}
                      checked={work.isCurrentJob}
                      onCheckedChange={(checked) => handleCurrentRoleChange(workIndex, checked as boolean)}
                    />
                    <Label htmlFor={`currentRole-${workIndex}`} className="text-sm">
                      I currently work here
                    </Label>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor={`location-${workIndex}`}>Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`location-${workIndex}`}
                    value={work.location || ''}
                    onChange={(e) => updateWorkItem(workIndex, 'location', e.target.value)}
                    placeholder="San Francisco, CA"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Responsibilities */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Key Responsibilities
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addResponsibility(workIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                {work.responsibilities.map((responsibility, respIndex) => (
                  <div key={respIndex} className="flex gap-2">
                    <Textarea
                      value={responsibility || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateResponsibility(workIndex, respIndex, e.target.value)}
                      placeholder="Describe your key responsibility or duty..."
                      className="flex-1"
                      rows={2}
                    />
                    {work.responsibilities.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeResponsibility(workIndex, respIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Achievements */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Key Achievements
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAchievement(workIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                {work.achievements.map((achievement, achIndex) => (
                  <div key={achIndex} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <Label className="text-sm">Achievement {achIndex + 1}</Label>
                      {work.achievements.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAchievement(workIndex, achIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={achievement.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateAchievement(workIndex, achIndex, 'description', e.target.value)}
                      placeholder="Describe your achievement..."
                      rows={2}
                    />
                    <Input
                      value={achievement.impact || ''}
                      onChange={(e) => updateAchievement(workIndex, achIndex, 'impact', e.target.value)}
                      placeholder="Quantify the impact (e.g., 'increased sales by 25%')"
                    />
                  </div>
                ))}
              </div>

              {/* Technologies */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Technologies & Tools Used</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTechnology(workIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {work.technologies.map((tech, techIndex) => (
                    <div key={techIndex} className="flex gap-2">
                      <Input
                        value={tech || ''}
                        onChange={(e) => updateTechnology(workIndex, techIndex, e.target.value)}
                        placeholder="e.g., React, Python, AWS"
                        className="flex-1"
                      />
                      {work.technologies.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTechnology(workIndex, techIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Work Experience Button */}
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <Button
              variant="outline"
              onClick={addWorkExperience}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Work Experience
            </Button>
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

          <Button
            onClick={handleSaveAndContinue}
            disabled={isSaving || !workHistory.some(work => (work.jobTitle && work.jobTitle.trim()) || (work.companyName && work.companyName.trim()))}
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </SimpleSidebar>
  )
}

export default function WorkHistoryPage() {
  return (
    <ResumeProvider>
      <WorkHistoryForm />
    </ResumeProvider>
  )
}
