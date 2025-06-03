'use client'

import { Badge } from '@/components/ui/badge'
import { TemplateWrapper } from './shared/template-wrapper'
import { 
  ResumeData, 
  ContactInfo, 
  SocialLinks, 
  SectionHeader, 
  SkillsGrid, 
  WorkExperienceItem, 
  EducationItem, 
  ProjectItem, 
  formatDate,
  Icons 
} from './shared/common-components'

interface Template1Props {
  resumeData: ResumeData
}

export default function Template1Professional({ resumeData }: Template1Props) {
  return (
    <TemplateWrapper className="bg-white">
      <div className="max-w-4xl mx-auto p-6 print:p-0">
        {/* Header Section */}
        <header className="mb-8 print:mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {resumeData.personalInfo.profilePhoto && (
              <div className="flex-shrink-0">
                <img
                  src={resumeData.personalInfo.profilePhoto}
                  alt={`${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-sm"
                />
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                {resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}
              </h1>
              
              <ContactInfo 
                personalInfo={resumeData.personalInfo} 
                className="mb-4" 
              />

              <SocialLinks 
                personalInfo={resumeData.personalInfo} 
              />
            </div>
          </div>
        </header>

        {/* Summary Section */}
        {resumeData.summary && (
          <section className="mb-8 print:mb-6">
            <SectionHeader 
              title="Professional Summary" 
              icon={<Icons.User className="h-6 w-6" />} 
            />
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-700 leading-relaxed">{resumeData.summary}</p>
            </div>
          </section>
        )}

        {/* Work Experience */}
        {resumeData.workHistory && resumeData.workHistory.length > 0 && (
          <section className="mb-8 print:mb-6">
            <SectionHeader 
              title="Work Experience" 
              icon={<Icons.Briefcase className="h-6 w-6" />} 
            />
            
            <div className="space-y-6">
              {resumeData.workHistory.map((job, index) => (
                <WorkExperienceItem key={index} job={job} />
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {resumeData.skills && resumeData.skills.length > 0 && (
          <section className="mb-8 print:mb-6">
            <SectionHeader 
              title="Skills" 
              icon={<Icons.Code className="h-6 w-6" />} 
            />
            <SkillsGrid skills={resumeData.skills} />
          </section>
        )}

        {/* Education */}
        {resumeData.education && resumeData.education.length > 0 && (
          <section className="mb-8 print:mb-6">
            <SectionHeader 
              title="Education" 
              icon={<Icons.GraduationCap className="h-6 w-6" />} 
            />
            
            <div className="space-y-4">
              {resumeData.education.map((edu, index) => (
                <EducationItem key={index} education={edu} />
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {resumeData.projects && resumeData.projects.length > 0 && (
          <section className="mb-8 print:mb-6">
            <SectionHeader 
              title="Projects" 
              icon={<Icons.Code className="h-6 w-6" />} 
            />
            
            <div className="space-y-6">
              {resumeData.projects.map((project, index) => (
                <ProjectItem key={index} project={project} />
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {resumeData.certifications && resumeData.certifications.length > 0 && (
          <section className="mb-8 print:mb-6">
            <SectionHeader 
              title="Certifications" 
              icon={<Icons.Award className="h-6 w-6" />} 
            />
            
            <div className="space-y-4">
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="border-l-2 border-yellow-200 pl-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{cert.name}</h3>
                    <span className="text-gray-600">{formatDate(cert.dateEarned)}</span>
                  </div>
                  
                  <p className="text-gray-700 font-medium">{cert.issuer}</p>
                  
                  {cert.credentialId && (
                    <p className="text-sm text-gray-600">Credential ID: {cert.credentialId}</p>
                  )}
                  
                  {cert.expirationDate && (
                    <p className="text-sm text-gray-600">Expires: {formatDate(cert.expirationDate)}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Optional Sections */}
        {resumeData.optionalSections && (
          <>
            {/* Languages */}
            {resumeData.optionalSections.languages && resumeData.optionalSections.languages.length > 0 && (
              <section className="mb-8 print:mb-6">
                <SectionHeader 
                  title="Languages" 
                  icon={<Icons.Globe className="h-6 w-6" />} 
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {resumeData.optionalSections.languages.map((lang, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{lang.language}</span>
                      <Badge variant="outline">{lang.proficiency}</Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Volunteer Work */}
            {resumeData.optionalSections.volunteerWork && resumeData.optionalSections.volunteerWork.length > 0 && resumeData.optionalSections.volunteerWork.some(vol => vol.role && vol.role.trim() && vol.organization && vol.organization.trim()) && (
              <section className="mb-8 print:mb-6">
                <SectionHeader 
                  title="Volunteer Experience" 
                  icon={<Icons.User className="h-6 w-6" />} 
                />
                <div className="space-y-4">
                  {resumeData.optionalSections.volunteerWork.filter(vol => vol.role && vol.role.trim() && vol.organization && vol.organization.trim()).map((volunteer, index) => (
                    <div key={index} className="border-l-2 border-red-200 pl-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{volunteer.role}</h3>
                        <span className="text-gray-600">
                          {formatDate(volunteer.startDate)} - {volunteer.endDate ? formatDate(volunteer.endDate) : 'Present'}
                        </span>
                      </div>
                      <p className="font-medium text-gray-700 mb-2">{volunteer.organization}</p>
                      {volunteer.description && volunteer.description.trim() && (
                        <p className="text-gray-700">{volunteer.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Publications */}
            {resumeData.optionalSections.publications && resumeData.optionalSections.publications.length > 0 && resumeData.optionalSections.publications.some(pub => pub.title && pub.title.trim() && pub.publisher && pub.publisher.trim()) && (
              <section className="mb-8 print:mb-6">
                <SectionHeader 
                  title="Publications" 
                  icon={<Icons.Award className="h-6 w-6" />} 
                />
                <div className="space-y-3">
                  {resumeData.optionalSections.publications.filter(pub => pub.title && pub.title.trim() && pub.publisher && pub.publisher.trim()).map((pub, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900">{pub.title}</h3>
                      <p className="text-gray-700">{pub.publisher} • {formatDate(pub.date)}</p>
                      {pub.url && pub.url.trim() && (
                        <a 
                          href={pub.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Publication
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hobbies */}
            {resumeData.optionalSections.hobbies && resumeData.optionalSections.hobbies.length > 0 && resumeData.optionalSections.hobbies.some(hobby => hobby && hobby.trim()) && (
              <section className="mb-8 print:mb-6">
                <SectionHeader 
                  title="Interests & Hobbies" 
                  icon={<Icons.User className="h-6 w-6" />} 
                />
                <div className="flex flex-wrap gap-2">
                  {resumeData.optionalSections.hobbies.filter(hobby => hobby && hobby.trim()).map((hobby, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </TemplateWrapper>
  )
}
