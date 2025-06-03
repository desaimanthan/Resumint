'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeProvider, useResume, OptionalSections } from '@/contexts/ResumeContext'
import { ResumeNavigation } from '@/components/resume-navigation'
import { 
  Globe, 
  Heart, 
  BookOpen, 
  Users, 
  ArrowRight, 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DatePicker } from '@/components/ui/date-picker'

function AdditionalSectionsForm() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const {
    resumeData,
    isLoading,
    isDirty,
    lastSaved,
    loadResume,
    updateOptionalSections,
    saveResume
  } = useResume()

  const [optionalSections, setOptionalSections] = useState<OptionalSections>({
    languages: [],
    volunteerWork: [],
    publications: [],
    hobbies: []
  })
  const [isSaving, setIsSaving] = useState(false)


  // Load resume data
  useEffect(() => {
    if (id && typeof id === 'string' && !resumeData) {
      loadResume(id)
    }
  }, [id, loadResume, resumeData])

  // Update form when resume data loads
  useEffect(() => {
    if (resumeData?.optionalSections) {
      const sections = resumeData.optionalSections
      // Initialize with default empty forms if sections are empty
      setOptionalSections({
        languages: sections.languages.length > 0 ? sections.languages : [{ language: '', proficiency: 'Conversational' }],
        volunteerWork: sections.volunteerWork.length > 0 ? sections.volunteerWork : [{
          organization: '',
          role: '',
          startDate: '',
          endDate: '',
          description: ''
        }],
        publications: sections.publications.length > 0 ? sections.publications : [{
          title: '',
          publisher: '',
          date: '',
          url: ''
        }],
        hobbies: sections.hobbies.length > 0 ? sections.hobbies : ['']
      })
    } else {
      // Initialize with one empty item for each section by default
      setOptionalSections({
        languages: [{ language: '', proficiency: 'Conversational' }],
        volunteerWork: [{
          organization: '',
          role: '',
          startDate: '',
          endDate: '',
          description: ''
        }],
        publications: [{
          title: '',
          publisher: '',
          date: '',
          url: ''
        }],
        hobbies: ['']
      })
    }
  }, [resumeData])

  // Handle section updates
  const handleSectionUpdate = (section: keyof OptionalSections, data: any) => {
    const updatedSections = {
      ...optionalSections,
      [section]: data
    }
    setOptionalSections(updatedSections)
    updateOptionalSections(updatedSections)
  }

  // Language functions
  const addLanguage = () => {
    const newLanguage = { language: '', proficiency: 'Conversational' as const }
    handleSectionUpdate('languages', [...optionalSections.languages, newLanguage])
  }

  const updateLanguage = (index: number, field: string, value: string) => {
    const updated = optionalSections.languages.map((lang, i) => 
      i === index ? { ...lang, [field]: value } : lang
    )
    handleSectionUpdate('languages', updated)
  }

  const removeLanguage = (index: number) => {
    const updated = optionalSections.languages.filter((_, i) => i !== index)
    handleSectionUpdate('languages', updated)
  }

  // Volunteer work functions
  const addVolunteerWork = () => {
    const newWork = {
      organization: '',
      role: '',
      startDate: '',
      endDate: '',
      description: ''
    }
    handleSectionUpdate('volunteerWork', [...optionalSections.volunteerWork, newWork])
  }

  const updateVolunteerWork = (index: number, field: string, value: string | Date) => {
    const updated = optionalSections.volunteerWork.map((work, i) => 
      i === index ? { ...work, [field]: value } : work
    )
    handleSectionUpdate('volunteerWork', updated)
  }

  const removeVolunteerWork = (index: number) => {
    const updated = optionalSections.volunteerWork.filter((_, i) => i !== index)
    handleSectionUpdate('volunteerWork', updated)
  }

  // Publications functions
  const addPublication = () => {
    const newPublication = {
      title: '',
      publisher: '',
      date: '',
      url: ''
    }
    handleSectionUpdate('publications', [...optionalSections.publications, newPublication])
  }

  const updatePublication = (index: number, field: string, value: string | Date) => {
    const updated = optionalSections.publications.map((pub, i) => 
      i === index ? { ...pub, [field]: value } : pub
    )
    handleSectionUpdate('publications', updated)
  }

  const removePublication = (index: number) => {
    const updated = optionalSections.publications.filter((_, i) => i !== index)
    handleSectionUpdate('publications', updated)
  }

  // Hobbies functions
  const addHobby = () => {
    handleSectionUpdate('hobbies', [...optionalSections.hobbies, ''])
  }

  const updateHobby = (index: number, value: string) => {
    const updated = optionalSections.hobbies.map((hobby, i) => 
      i === index ? value : hobby
    )
    handleSectionUpdate('hobbies', updated)
  }

  const removeHobby = (index: number) => {
    const updated = optionalSections.hobbies.filter((_, i) => i !== index)
    handleSectionUpdate('hobbies', updated)
  }

  // Go back to previous step
  const handleGoBack = () => {
    router.push(`/resume-builder/${id}/steps/summary`)
  }

  // Save and continue
  const handleSaveAndContinue = async () => {
    setIsSaving(true)
    try {
      await saveResume()
      // Navigate to next step (review)
      router.push(`/resume-builder/${id}/steps/review`)
    } catch (error) {
      // Error already handled in saveResume
    } finally {
      setIsSaving(false)
    }
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

  // Skip this step
  const handleSkip = () => {
    router.push(`/resume-builder/${id}/steps/review`)
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
            <h1 className="text-xl font-bold">Additional Sections</h1>
            <p className="text-muted-foreground">
              Add optional sections to showcase your language skills, volunteer work, publications, or interests.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Step 7 of 9
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
            <ResumeNavigation currentStep="additional-sections" />
          </div>

          {/* All Sections as Separate Cards */}
          <div className="lg:col-span-3 space-y-6">
          {/* Languages Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language Proficiency
              </CardTitle>
              <CardDescription>
                List languages you speak and your proficiency level. This is especially valuable for international roles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {optionalSections.languages.map((language, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`language-${index}`}>Language</Label>
                    <Input
                      id={`language-${index}`}
                      value={language.language}
                      onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                      placeholder="e.g., Spanish, Mandarin, French"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`proficiency-${index}`}>Proficiency</Label>
                    <Select
                      value={language.proficiency}
                      onValueChange={(value) => updateLanguage(index, 'proficiency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Conversational">Conversational</SelectItem>
                        <SelectItem value="Fluent">Fluent</SelectItem>
                        <SelectItem value="Native">Native</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLanguage(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addLanguage}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Language
              </Button>
            </CardContent>
          </Card>

          {/* Volunteer Work Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Volunteer Work
              </CardTitle>
              <CardDescription>
                Showcase your community involvement and volunteer experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {optionalSections.volunteerWork.map((work, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Volunteer Experience {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVolunteerWork(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`org-${index}`}>Organization</Label>
                      <Input
                        id={`org-${index}`}
                        value={work.organization}
                        onChange={(e) => updateVolunteerWork(index, 'organization', e.target.value)}
                        placeholder="e.g., Red Cross, Local Food Bank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`role-${index}`}>Role</Label>
                      <Input
                        id={`role-${index}`}
                        value={work.role}
                        onChange={(e) => updateVolunteerWork(index, 'role', e.target.value)}
                        placeholder="e.g., Volunteer Coordinator, Tutor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`start-${index}`}>Start Date</Label>
                      <DatePicker
                        date={work.startDate ? new Date(work.startDate) : undefined}
                        onSelect={(date: Date | undefined) => updateVolunteerWork(index, 'startDate', date || '')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`end-${index}`}>End Date</Label>
                      <DatePicker
                        date={work.endDate ? new Date(work.endDate) : undefined}
                        onSelect={(date: Date | undefined) => updateVolunteerWork(index, 'endDate', date || '')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`desc-${index}`}>Description</Label>
                    <Textarea
                      id={`desc-${index}`}
                      value={work.description}
                      onChange={(e) => updateVolunteerWork(index, 'description', e.target.value)}
                      placeholder="Describe your volunteer activities and impact..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addVolunteerWork}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Volunteer Experience
              </Button>
            </CardContent>
          </Card>

          {/* Publications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Publications
              </CardTitle>
              <CardDescription>
                List your published works, research papers, articles, or blog posts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {optionalSections.publications.map((publication, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Publication {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePublication(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${index}`}>Title</Label>
                      <Input
                        id={`title-${index}`}
                        value={publication.title}
                        onChange={(e) => updatePublication(index, 'title', e.target.value)}
                        placeholder="e.g., Machine Learning in Healthcare"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`publisher-${index}`}>Publisher/Journal</Label>
                        <Input
                          id={`publisher-${index}`}
                          value={publication.publisher}
                          onChange={(e) => updatePublication(index, 'publisher', e.target.value)}
                          placeholder="e.g., IEEE, Medium, Company Blog"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`date-${index}`}>Publication Date</Label>
                        <DatePicker
                          date={publication.date ? new Date(publication.date) : undefined}
                          onSelect={(date: Date | undefined) => updatePublication(index, 'date', date || '')}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`url-${index}`}>URL (Optional)</Label>
                      <Input
                        id={`url-${index}`}
                        value={publication.url}
                        onChange={(e) => updatePublication(index, 'url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addPublication}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Publication
              </Button>
            </CardContent>
          </Card>

          {/* Hobbies & Interests Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Hobbies & Interests
              </CardTitle>
              <CardDescription>
                Share your personal interests and hobbies. This can help you connect with interviewers and show your personality.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {optionalSections.hobbies.map((hobby, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Input
                      value={hobby}
                      onChange={(e) => updateHobby(index, e.target.value)}
                      placeholder="e.g., Photography, Rock climbing, Chess"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeHobby(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addHobby}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hobby/Interest
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

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
            >
              Skip This Step
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save & Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </SimpleSidebar>
  )
}

export default function AdditionalSectionsPage() {
  return (
    <ResumeProvider>
      <AdditionalSectionsForm />
    </ResumeProvider>
  )
}
