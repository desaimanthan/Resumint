  'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeProvider, useResume, EducationItem, CertificationItem } from '@/contexts/ResumeContext'
import { ResumeNavigation } from '@/components/resume-navigation'
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Save, 
  ArrowLeft,
  Award,
  Calendar,
  Building2,
  BookOpen
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function EducationForm() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const {
    resumeData,
    isLoading,
    isDirty,
    lastSaved,
    loadResume,
    updateEducation,
    updateCertifications,
    saveResume,
    saveDraft
  } = useResume()

  const [education, setEducation] = useState<EducationItem[]>([])
  const [certifications, setCertifications] = useState<CertificationItem[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Load resume data
  useEffect(() => {
    if (id && typeof id === 'string' && !resumeData) {
      loadResume(id)
    }
  }, [id, loadResume, resumeData])

  // Update form when resume data loads
  useEffect(() => {
    if (resumeData?.education) {
      setEducation(resumeData.education.length > 0 ? resumeData.education : [getEmptyEducationItem()])
    } else if (resumeData) {
      setEducation([getEmptyEducationItem()])
    }
    
    if (resumeData?.certifications) {
      setCertifications(resumeData.certifications)
    }
  }, [resumeData])

  // Create empty education item
  const getEmptyEducationItem = (): EducationItem => ({
    degreeLevel: '',
    institution: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    gpa: null,
    honors: '',
    relevantCoursework: []
  })

  // Create empty certification item
  const getEmptyCertificationItem = (): CertificationItem => ({
    name: '',
    issuer: '',
    dateObtained: '',
    expirationDate: null,
    credentialId: '',
    verificationUrl: ''
  })

  // Add new education
  const addEducation = () => {
    const newEducation = [...education, getEmptyEducationItem()]
    setEducation(newEducation)
    updateEducation(newEducation)
  }

  // Remove education
  const removeEducation = (index: number) => {
    if (education.length === 1) {
      toast({
        title: 'Cannot remove',
        description: 'At least one education entry is required.',
        variant: 'destructive',
      })
      return
    }
    
    const newEducation = education.filter((_, i) => i !== index)
    setEducation(newEducation)
    updateEducation(newEducation)
  }

  // Update education item field
  const updateEducationItem = (index: number, field: keyof EducationItem, value: any) => {
    const newEducation = [...education]
    newEducation[index] = { ...newEducation[index], [field]: value }
    setEducation(newEducation)
    updateEducation(newEducation)
  }

  // Add new certification
  const addCertification = () => {
    const newCertifications = [...certifications, getEmptyCertificationItem()]
    setCertifications(newCertifications)
    updateCertifications(newCertifications)
  }

  // Remove certification
  const removeCertification = (index: number) => {
    const newCertifications = certifications.filter((_, i) => i !== index)
    setCertifications(newCertifications)
    updateCertifications(newCertifications)
  }

  // Update certification item field
  const updateCertificationItem = (index: number, field: keyof CertificationItem, value: any) => {
    const newCertifications = [...certifications]
    newCertifications[index] = { ...newCertifications[index], [field]: value }
    setCertifications(newCertifications)
    updateCertifications(newCertifications)
  }

  // Save and continue
  const handleSaveAndContinue = async () => {
    setIsSaving(true)
    try {
      await saveResume()
      router.push(`/resume-builder/${id}/steps/skills`)
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
      updateEducation(education)
      updateCertifications(certifications)
      await saveDraft()
    } catch (error) {
      // Error already handled in saveDraft
    } finally {
      setIsSaving(false)
    }
  }

  // Go back
  const handleGoBack = () => {
    router.push(`/resume-builder/${id}/steps/work-history`)
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
            <h1 className="text-xl font-bold">Education & Certifications</h1>
            <p className="text-muted-foreground">
              Add your educational background and professional certifications.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Step 3 of 9
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
            <ResumeNavigation currentStep="education" />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Education Section */}
            <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </h2>
          
          {education.map((edu, eduIndex) => (
            <Card key={eduIndex}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {eduIndex === 0 ? 'Highest Degree/Qualification' : `Education ${eduIndex + 1}`}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      {eduIndex === 0 ? 'Start with your highest level of education' : 'Additional education'}
                    </CardDescription>
                  </div>
                  {education.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEducation(eduIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Degree Level and Field of Study */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`degreeLevel-${eduIndex}`}>Degree Level *</Label>
                    <Select
                      value={edu.degreeLevel}
                      onValueChange={(value) => updateEducationItem(eduIndex, 'degreeLevel', value)}
                    >
                      <SelectTrigger id={`degreeLevel-${eduIndex}`}>
                        <SelectValue placeholder="Select degree level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High School">High School Diploma</SelectItem>
                        <SelectItem value="Associate">Associate Degree</SelectItem>
                        <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
                        <SelectItem value="Master">Master's Degree</SelectItem>
                        <SelectItem value="Doctorate">Doctorate (PhD)</SelectItem>
                        <SelectItem value="Professional">Professional Degree</SelectItem>
                        <SelectItem value="Certificate">Certificate Program</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`fieldOfStudy-${eduIndex}`}>Field of Study *</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={`fieldOfStudy-${eduIndex}`}
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducationItem(eduIndex, 'fieldOfStudy', e.target.value)}
                        placeholder="e.g., Computer Science, Business Administration"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Institution */}
                <div className="space-y-2">
                  <Label htmlFor={`institution-${eduIndex}`}>Institution Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`institution-${eduIndex}`}
                      value={edu.institution}
                      onChange={(e) => updateEducationItem(eduIndex, 'institution', e.target.value)}
                      placeholder="e.g., Stanford University, MIT"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={(() => {
                          if (!edu.startDate) return ''
                          const dateStr = typeof edu.startDate === 'string' ? edu.startDate : edu.startDate.toISOString().slice(0, 7)
                          const [year, month] = dateStr.split('-')
                          return month ? parseInt(month).toString() : ''
                        })()}
                        onValueChange={(month) => {
                          const currentYear = edu.startDate ? 
                            parseInt((typeof edu.startDate === 'string' ? edu.startDate : edu.startDate.toISOString()).split('-')[0]) : 
                            new Date().getFullYear()
                          const formattedMonth = month.padStart(2, '0')
                          const newDateString = `${currentYear}-${formattedMonth}`
                          updateEducationItem(eduIndex, 'startDate', newDateString)
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
                        value={edu.startDate ? 
                          (typeof edu.startDate === 'string' ? edu.startDate : edu.startDate.toISOString().slice(0, 7)).split('-')[0] : 
                          ''}
                        onValueChange={(year) => {
                          const currentMonth = edu.startDate ? 
                            (typeof edu.startDate === 'string' ? edu.startDate : edu.startDate.toISOString().slice(0, 7)).split('-')[1] : 
                            (new Date().getMonth() + 1).toString().padStart(2, '0')
                          const newDateString = `${year}-${currentMonth}`
                          updateEducationItem(eduIndex, 'startDate', newDateString)
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

                  <div className="space-y-2">
                    <Label>End Date (or Expected)</Label>
                    <div className="flex gap-2">
                      <Select
                        value={(() => {
                          if (!edu.endDate) return ''
                          const dateStr = typeof edu.endDate === 'string' ? edu.endDate : edu.endDate.toISOString().slice(0, 7)
                          const [year, month] = dateStr.split('-')
                          return month ? parseInt(month).toString() : ''
                        })()}
                        onValueChange={(month) => {
                          const currentYear = edu.endDate ? 
                            parseInt((typeof edu.endDate === 'string' ? edu.endDate : edu.endDate.toISOString()).split('-')[0]) : 
                            new Date().getFullYear()
                          const formattedMonth = month.padStart(2, '0')
                          const newDateString = `${currentYear}-${formattedMonth}`
                          updateEducationItem(eduIndex, 'endDate', newDateString)
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
                        value={edu.endDate ? 
                          (typeof edu.endDate === 'string' ? edu.endDate : edu.endDate.toISOString().slice(0, 7)).split('-')[0] : 
                          ''}
                        onValueChange={(year) => {
                          const currentMonth = edu.endDate ? 
                            (typeof edu.endDate === 'string' ? edu.endDate : edu.endDate.toISOString().slice(0, 7)).split('-')[1] : 
                            (new Date().getMonth() + 1).toString().padStart(2, '0')
                          const newDateString = `${year}-${currentMonth}`
                          updateEducationItem(eduIndex, 'endDate', newDateString)
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: new Date().getFullYear() - 1950 + 10 }, (_, i) => new Date().getFullYear() - i + 10).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* GPA and Honors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`gpa-${eduIndex}`}>GPA (Optional)</Label>
                    <Input
                      id={`gpa-${eduIndex}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={edu.gpa || ''}
                      onChange={(e) => updateEducationItem(eduIndex, 'gpa', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="e.g., 3.85"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`honors-${eduIndex}`}>Honors/Awards (Optional)</Label>
                    <Input
                      id={`honors-${eduIndex}`}
                      value={edu.honors}
                      onChange={(e) => updateEducationItem(eduIndex, 'honors', e.target.value)}
                      placeholder="e.g., Magna Cum Laude, Dean's List"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Education Button */}
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-6">
              <Button
                variant="outline"
                onClick={addEducation}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Another Education
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Certifications Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Award className="h-5 w-5" />
            Professional Certifications
          </h2>
          
          {certifications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No certifications yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add professional certifications like AWS, PMP, Google Cloud, etc.
                </p>
                <Button
                  variant="outline"
                  onClick={addCertification}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Certification
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {certifications.map((cert, certIndex) => (
                <Card key={certIndex}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          Certification {certIndex + 1}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                          Professional certification or license
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCertification(certIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Certificate Name and Issuer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`certName-${certIndex}`}>Certificate Name *</Label>
                        <Input
                          id={`certName-${certIndex}`}
                          value={cert.name}
                          onChange={(e) => updateCertificationItem(certIndex, 'name', e.target.value)}
                          placeholder="e.g., AWS Solutions Architect, PMP"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`issuer-${certIndex}`}>Issuing Organization *</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id={`issuer-${certIndex}`}
                            value={cert.issuer}
                            onChange={(e) => updateCertificationItem(certIndex, 'issuer', e.target.value)}
                            placeholder="e.g., Amazon Web Services, PMI"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Date Obtained */}
                    <div className="space-y-2">
                      <Label>Date Obtained *</Label>
                      <div className="flex gap-2 max-w-md">
                        <Select
                          value={(() => {
                            if (!cert.dateObtained) return ''
                            const dateStr = typeof cert.dateObtained === 'string' ? cert.dateObtained : cert.dateObtained.toISOString().slice(0, 7)
                            const [year, month] = dateStr.split('-')
                            return month ? parseInt(month).toString() : ''
                          })()}
                          onValueChange={(month) => {
                            const currentYear = cert.dateObtained ? 
                              parseInt((typeof cert.dateObtained === 'string' ? cert.dateObtained : cert.dateObtained.toISOString()).split('-')[0]) : 
                              new Date().getFullYear()
                            const formattedMonth = month.padStart(2, '0')
                            const newDateString = `${currentYear}-${formattedMonth}`
                            updateCertificationItem(certIndex, 'dateObtained', newDateString)
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
                          value={cert.dateObtained ? 
                            (typeof cert.dateObtained === 'string' ? cert.dateObtained : cert.dateObtained.toISOString().slice(0, 7)).split('-')[0] : 
                            ''}
                          onValueChange={(year) => {
                            const currentMonth = cert.dateObtained ? 
                              (typeof cert.dateObtained === 'string' ? cert.dateObtained : cert.dateObtained.toISOString().slice(0, 7)).split('-')[1] : 
                              (new Date().getMonth() + 1).toString().padStart(2, '0')
                            const newDateString = `${year}-${currentMonth}`
                            updateCertificationItem(certIndex, 'dateObtained', newDateString)
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Optional Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`credentialId-${certIndex}`}>Credential ID (Optional)</Label>
                        <Input
                          id={`credentialId-${certIndex}`}
                          value={cert.credentialId}
                          onChange={(e) => updateCertificationItem(certIndex, 'credentialId', e.target.value)}
                          placeholder="e.g., ABC123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`verificationUrl-${certIndex}`}>Verification URL (Optional)</Label>
                        <Input
                          id={`verificationUrl-${certIndex}`}
                          type="url"
                          value={cert.verificationUrl}
                          onChange={(e) => updateCertificationItem(certIndex, 'verificationUrl', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Certification Button */}
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-6">
                  <Button
                    variant="outline"
                    onClick={addCertification}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Certification
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
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
            disabled={isSaving || !education.some(edu => edu.degreeLevel && edu.degreeLevel.trim() && edu.institution && edu.institution.trim() && edu.fieldOfStudy && edu.fieldOfStudy.trim())}
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </SimpleSidebar>
  )
}

export default function EducationPage() {
  return (
    <ResumeProvider>
      <EducationForm />
    </ResumeProvider>
  )
}
