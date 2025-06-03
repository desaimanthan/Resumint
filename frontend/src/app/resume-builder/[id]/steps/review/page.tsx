'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeProvider, useResume } from '@/contexts/ResumeContext'
import { ResumeNavigation } from '@/components/resume-navigation'
import { 
  ArrowRight, 
  Save, 
  ArrowLeft, 
  Download,
  Edit,
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Calendar,
  Briefcase
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

function ReviewForm() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const {
    resumeData,
    isLoading,
    isDirty,
    lastSaved,
    loadResume,
    saveResume
  } = useResume()

  const [isSaving, setIsSaving] = useState(false)

  // Load resume data
  useEffect(() => {
    if (id && typeof id === 'string' && !resumeData) {
      loadResume(id)
    }
  }, [id, loadResume, resumeData])

  // Go back to previous step
  const handleGoBack = () => {
    router.push(`/resume-builder/${id}/steps/additional-sections`)
  }

  // Save and continue to publish step
  const handleSaveAndContinue = async () => {
    setIsSaving(true)
    try {
      await saveResume()
      // Navigate to publish step
      router.push(`/resume-builder/${id}/steps/publish`)
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

  // Edit specific section
  const handleEditSection = (section: string) => {
    router.push(`/resume-builder/${id}/steps/${section}`)
  }

  // Format date for display
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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

  if (!resumeData) {
    return (
      <SimpleSidebar title={`Resume Builder${resumeData?.title ? ` - ${resumeData.title}` : ''}`}>
        <div className="flex items-center justify-center h-64">
          <p>Resume data not found</p>
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
            <h1 className="text-xl font-bold">Review Your Resume</h1>
            <p className="text-muted-foreground">
              Review your resume and make any final adjustments before downloading.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Step 8 of 9
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
            <ResumeNavigation currentStep="review" />
          </div>

          {/* Resume Preview */}
          <div className="lg:col-span-3">
            <Card className="p-0 overflow-hidden">
              <div className="bg-white text-black p-8 min-h-[800px]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {/* Header Section */}
                <div className="border-b-2 border-gray-300 pb-6 mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {resumeData.personalInfo?.firstName} {resumeData.personalInfo?.lastName}
                  </h1>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {resumeData.personalInfo?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {resumeData.personalInfo.email}
                      </div>
                    )}
                    {resumeData.personalInfo?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {resumeData.personalInfo.phone}
                      </div>
                    )}
                    {(typeof resumeData.personalInfo?.location === 'object' && (resumeData.personalInfo.location.city || resumeData.personalInfo.location.state)) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {resumeData.personalInfo.location.city}{resumeData.personalInfo.location.city && resumeData.personalInfo.location.state && ', '}{resumeData.personalInfo.location.state}
                      </div>
                    )}
                    {resumeData.personalInfo?.linkedIn && (
                      <div className="flex items-center gap-1">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </div>
                    )}
                    {resumeData.personalInfo?.portfolio && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        Portfolio
                      </div>
                    )}
                    {resumeData.personalInfo?.github && (
                      <div className="flex items-center gap-1">
                        <Github className="h-4 w-4" />
                        GitHub
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Summary */}
                {resumeData.summary && resumeData.summary.trim() && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                      PROFESSIONAL SUMMARY
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {resumeData.summary}
                    </p>
                  </div>
                )}

                {/* Work Experience */}
                {resumeData.workHistory && resumeData.workHistory.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                      WORK EXPERIENCE
                    </h2>
                    <div className="space-y-4">
                      {resumeData.workHistory.map((job, index) => (
                        <div key={index}>
                          <div className="flex gap-3 mb-2">
                            {/* Company Logo */}
                            <div className="flex-shrink-0 mt-1">
                              {job.companyLogo ? (
                                <img 
                                  src={job.companyLogo} 
                                  alt={`${job.companyName} logo`}
                                  className="w-8 h-8 object-contain rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-8 h-8 bg-gray-100 rounded flex items-center justify-center ${job.companyLogo ? 'hidden' : ''}`}>
                                <Briefcase className="h-4 w-4 text-gray-500" />
                              </div>
                            </div>
                            
                            {/* Job Details */}
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-gray-900">{job.jobTitle}</h3>
                                  <p className="text-gray-700">{job.companyName}</p>
                                </div>
                                <div className="text-right text-sm text-gray-600">
                                  <p>{formatDate(job.startDate)} - {job.isCurrentRole ? 'Present' : formatDate(job.endDate)}</p>
                                  {job.location && <p>{job.location}</p>}
                                </div>
                              </div>
                              
                              {job.responsibilities && job.responsibilities.length > 0 && job.responsibilities.some(resp => resp && resp.trim()) && (
                                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-4 mt-2">
                                  {job.responsibilities.filter(resp => resp.trim()).map((resp, respIndex) => (
                                    <li key={respIndex}>{resp}</li>
                                  ))}
                                </ul>
                              )}
                              
                              {job.achievements && job.achievements.length > 0 && job.achievements.some(ach => ach && ach.description && ach.description.trim()) && (
                                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-4 mt-2">
                                  {job.achievements.filter(ach => ach.description.trim()).map((achievement, achIndex) => (
                                    <li key={achIndex}>
                                      {achievement.description}
                                      {achievement.metric && achievement.metric.trim() && ` (${achievement.metric})`}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              
                              {job.technologies && job.technologies.length > 0 && job.technologies.some(tech => tech && tech.trim()) && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <strong>Technologies:</strong> {job.technologies.filter(tech => tech.trim()).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {resumeData.education && resumeData.education.length > 0 && resumeData.education.some(edu => edu && edu.institution && edu.institution.trim() && edu.degree && edu.degree.trim()) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                      EDUCATION
                    </h2>
                    <div className="space-y-3">
                      {resumeData.education.filter(edu => edu.institution.trim() && edu.degree.trim()).map((edu, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {edu.degree}
                            </h3>
                            <p className="text-gray-700">{edu.institution}</p>
                            {edu.honors && Array.isArray(edu.honors) && edu.honors.length > 0 && <p className="text-sm text-gray-600">{edu.honors.filter(honor => honor && honor.trim()).join(', ')}</p>}
                            {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <p>{edu.graduationDate ? formatDate(edu.graduationDate) : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {resumeData.skills && resumeData.skills.length > 0 && resumeData.skills.some(skill => skill && skill.skillName && skill.skillName.trim()) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                      SKILLS
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['Technical', 'Soft', 'Other'].map(category => {
                        const categorySkills = resumeData.skills.filter(skill => 
                          (skill.category === category || (category === 'Technical' && skill.category === 'Technical')) &&
                          skill.skillName.trim()
                        )
                        if (categorySkills.length === 0) return null
                        
                        return (
                          <div key={category}>
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {category === 'Technical' ? 'Technical Skills' : 
                               category === 'Soft' ? 'Soft Skills' : 'Other Skills'}
                            </h3>
                            <div className="flex flex-wrap gap-1">
                              {categorySkills.map((skill, index) => (
                                <span key={index} className="text-sm text-gray-700">
                                  {skill.skillName}{index < categorySkills.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {resumeData.projects && resumeData.projects.length > 0 && resumeData.projects.some(project => project && project.name && project.name.trim()) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                      PROJECTS
                    </h2>
                    <div className="space-y-4">
                      {resumeData.projects.filter(project => project.name.trim()).map((project, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-gray-900">{project.name}</h3>
                              {project.role && project.role.trim() && <p className="text-gray-700">{project.role}</p>}
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <p>{formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
                            </div>
                          </div>
                          
                          {project.description && project.description.trim() && (
                            <p className="text-gray-700 text-sm mb-2">{project.description}</p>
                          )}
                          
                          {project.outcome && project.outcome.trim() && (
                            <p className="text-gray-700 text-sm mb-2"><strong>Outcome:</strong> {project.outcome}</p>
                          )}
                          
                          {project.technologies && project.technologies.length > 0 && project.technologies.some(tech => tech && tech.trim()) && (
                            <p className="text-sm text-gray-600">
                              <strong>Technologies:</strong> {project.technologies.filter(tech => tech.trim()).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {resumeData.optionalSections?.languages && resumeData.optionalSections.languages.length > 0 && 
                 resumeData.optionalSections.languages.some(lang => lang && lang.language && lang.language.trim()) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                      LANGUAGES
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                      {resumeData.optionalSections.languages
                        .filter(lang => lang.language.trim())
                        .map((language, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-700">{language.language}</span>
                          <span className="text-gray-600 text-sm">{language.proficiency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Volunteer Work */}
                {resumeData.optionalSections?.volunteerWork && resumeData.optionalSections.volunteerWork.length > 0 && 
                 resumeData.optionalSections.volunteerWork.some(work => work && work.organization && work.organization.trim()) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                      VOLUNTEER EXPERIENCE
                    </h2>
                    <div className="space-y-3">
                      {resumeData.optionalSections.volunteerWork
                        .filter(work => work.organization.trim())
                        .map((work, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="font-bold text-gray-900">{work.role}</h3>
                              <p className="text-gray-700">{work.organization}</p>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <p>{formatDate(work.startDate)} - {formatDate(work.endDate)}</p>
                            </div>
                          </div>
                          {work.description && work.description.trim() && (
                            <p className="text-gray-700 text-sm">{work.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publications */}
                {resumeData.optionalSections?.publications && resumeData.optionalSections.publications.length > 0 && 
                 resumeData.optionalSections.publications.some(pub => pub && pub.title && pub.title.trim()) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                      PUBLICATIONS
                    </h2>
                    <div className="space-y-2">
                      {resumeData.optionalSections.publications
                        .filter(pub => pub.title.trim())
                        .map((publication, index) => (
                        <div key={index}>
                          <h3 className="font-bold text-gray-900">{publication.title}</h3>
                          <p className="text-gray-700 text-sm">
                            {publication.publisher} {publication.date && `(${formatDate(publication.date)})`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hobbies & Interests */}
                {resumeData.optionalSections?.hobbies && resumeData.optionalSections.hobbies.length > 0 && 
                 resumeData.optionalSections.hobbies.some(hobby => hobby && hobby.trim()) && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                      INTERESTS
                    </h2>
                    <p className="text-gray-700">
                      {resumeData.optionalSections.hobbies.filter(hobby => hobby.trim()).join(', ')}
                    </p>
                  </div>
                )}
              </div>
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
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Finalize Resume'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </SimpleSidebar>
  )
}

export default function ReviewPage() {
  return (
    <ResumeProvider>
      <ReviewForm />
    </ResumeProvider>
  )
}
