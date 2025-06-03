'use client'

import { Badge } from '@/components/ui/badge'
import { TemplateWrapper } from './shared/template-wrapper'
import { 
  ResumeData, 
  ContactInfo, 
  SocialLinks, 
  WorkExperienceItem, 
  EducationItem, 
  ProjectItem, 
  formatDate,
  Icons 
} from './shared/common-components'

interface Template3Props {
  resumeData: ResumeData
}

export default function Template3Minimal({ resumeData }: Template3Props) {
  // Minimal section header
  const MinimalSectionHeader = ({ title }: { title: string }) => (
    <div className="mb-8">
      <h2 className="text-xl font-light text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
        {title}
      </h2>
    </div>
  )

  // Minimal skills display
  const MinimalSkills = ({ skills }: { skills: ResumeData['skills'] }) => {
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = []
      }
      acc[skill.category].push(skill.skillName)
      return acc
    }, {} as Record<string, string[]>)

    return (
      <div className="space-y-6">
        {Object.entries(skillsByCategory).map(([category, skillList]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">{category}</h3>
            <p className="text-gray-700 leading-relaxed">
              {skillList.join(' • ')}
            </p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <TemplateWrapper className="bg-white">
      <div className="max-w-3xl mx-auto p-8 print:p-0">
        {/* Header Section */}
        <header className="text-center mb-16 print:mb-12">
          {resumeData.personalInfo.profilePhoto && (
            <div className="mb-8">
              <img
                src={resumeData.personalInfo.profilePhoto}
                alt={`${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}`}
                className="w-20 h-20 rounded-full object-cover mx-auto grayscale border border-gray-200"
              />
            </div>
          )}
          
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-wide">
            {resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}
          </h1>
          
          <div className="space-y-2 text-gray-600">
            <ContactInfo 
              personalInfo={resumeData.personalInfo} 
              className="justify-center text-sm"
            />
            <SocialLinks 
              personalInfo={resumeData.personalInfo} 
              className="justify-center text-sm"
            />
          </div>
        </header>

        {/* Summary Section */}
        {resumeData.summary && (
          <section className="mb-16 print:mb-12">
            <div className="text-center">
              <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto font-light italic">
                "{resumeData.summary}"
              </p>
            </div>
          </section>
        )}

        {/* Work Experience */}
        {resumeData.workHistory && resumeData.workHistory.length > 0 && (
          <section className="mb-16 print:mb-12">
            <MinimalSectionHeader title="Experience" />
            
            <div className="space-y-12">
              {resumeData.workHistory.map((job, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                    <div>
                      {job.jobTitle && (
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{job.jobTitle}</h3>
                      )}
                      <p className="text-gray-600 font-light">
                        {job.companyName || 'Company Name Not Available'}
                        {job.location && ` • ${job.location}`}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 font-light mt-2 md:mt-0">
                      {formatDate(job.startDate)} — {job.isCurrentJob ? 'Present' : formatDate(job.endDate || '')}
                    </div>
                  </div>

                  {job.responsibilities && job.responsibilities.length > 0 && job.responsibilities.some(resp => resp && resp.trim()) && (
                    <div className="mb-4">
                      <ul className="space-y-2">
                        {job.responsibilities.filter(resp => resp && resp.trim()).map((responsibility, idx) => (
                          <li key={idx} className="text-gray-700 leading-relaxed font-light">
                            {responsibility}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.achievements && job.achievements.length > 0 && job.achievements.some(ach => ach.description && ach.description.trim()) && (
                    <div className="space-y-2">
                      {job.achievements.filter(ach => ach.description && ach.description.trim()).map((achievement, idx) => (
                        <p key={idx} className="text-gray-700 leading-relaxed font-light italic">
                          {achievement.description}
                          {achievement.impact && achievement.impact.trim() && (
                            <span className="text-gray-900 font-normal"> — {achievement.impact}</span>
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {resumeData.skills && resumeData.skills.length > 0 && (
          <section className="mb-16 print:mb-12">
            <MinimalSectionHeader title="Skills" />
            <MinimalSkills skills={resumeData.skills} />
          </section>
        )}

        {/* Education */}
        {resumeData.education && resumeData.education.length > 0 && (
          <section className="mb-16 print:mb-12">
            <MinimalSectionHeader title="Education" />
            
            <div className="space-y-8">
              {resumeData.education.map((edu, index) => (
                <div key={index}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{edu.degree}</h3>
                      <p className="text-gray-600 font-light">
                        {edu.institution}
                        {edu.location && ` • ${edu.location}`}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 font-light mt-2 md:mt-0">
                      {formatDate(edu.graduationDate)}
                    </div>
                  </div>

                  {edu.gpa && (
                    <p className="text-gray-700 font-light">GPA: {edu.gpa}</p>
                  )}

                  {edu.honors && edu.honors.length > 0 && edu.honors.some(honor => honor && honor.trim()) && (
                    <p className="text-gray-700 font-light italic">
                      {edu.honors.filter(honor => honor && honor.trim()).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {resumeData.projects && resumeData.projects.length > 0 && (
          <section className="mb-16 print:mb-12">
            <MinimalSectionHeader title="Projects" />
            
            <div className="space-y-8">
              {resumeData.projects.map((project, index) => (
                <div key={index}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                    <div className="text-sm text-gray-500 font-light mt-1 md:mt-0">
                      {formatDate(project.startDate)} — {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed font-light mb-3">{project.description}</p>

                  <div className="mb-3">
                    <p className="text-sm text-gray-500 font-light">
                      {project.technologies.join(' • ')}
                    </p>
                  </div>

                  <div className="flex gap-6 text-sm">
                    {project.url && (
                      <a 
                        href={project.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 font-light underline"
                      >
                        View Project
                      </a>
                    )}
                    
                    {project.github && (
                      <a 
                        href={project.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 font-light underline"
                      >
                        View Code
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {resumeData.certifications && resumeData.certifications.length > 0 && (
          <section className="mb-16 print:mb-12">
            <MinimalSectionHeader title="Certifications" />
            
            <div className="space-y-6">
              {resumeData.certifications.map((cert, index) => (
                <div key={index}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-1">
                    <h3 className="text-lg font-medium text-gray-900">{cert.name}</h3>
                    <div className="text-sm text-gray-500 font-light mt-1 md:mt-0">
                      {formatDate(cert.dateEarned)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 font-light">{cert.issuer}</p>
                  
                  {cert.credentialId && (
                    <p className="text-sm text-gray-500 font-light">ID: {cert.credentialId}</p>
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
              <section className="mb-16 print:mb-12">
                <MinimalSectionHeader title="Languages" />
                <div className="space-y-2">
                  {resumeData.optionalSections.languages.map((lang, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700 font-light">{lang.language}</span>
                      <span className="text-gray-500 text-sm font-light">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Volunteer Work */}
            {resumeData.optionalSections.volunteerWork && resumeData.optionalSections.volunteerWork.length > 0 && resumeData.optionalSections.volunteerWork.some(vol => vol.role && vol.role.trim() && vol.organization && vol.organization.trim()) && (
              <section className="mb-16 print:mb-12">
                <MinimalSectionHeader title="Volunteer Experience" />
                <div className="space-y-6">
                  {resumeData.optionalSections.volunteerWork.filter(vol => vol.role && vol.role.trim() && vol.organization && vol.organization.trim()).map((volunteer, index) => (
                    <div key={index}>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{volunteer.role}</h3>
                          <p className="text-gray-600 font-light">{volunteer.organization}</p>
                        </div>
                        <div className="text-sm text-gray-500 font-light mt-1 md:mt-0">
                          {formatDate(volunteer.startDate)} — {volunteer.endDate ? formatDate(volunteer.endDate) : 'Present'}
                        </div>
                      </div>
                      {volunteer.description && volunteer.description.trim() && (
                        <p className="text-gray-700 font-light leading-relaxed">{volunteer.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Publications */}
            {resumeData.optionalSections.publications && resumeData.optionalSections.publications.length > 0 && resumeData.optionalSections.publications.some(pub => pub.title && pub.title.trim() && pub.publisher && pub.publisher.trim()) && (
              <section className="mb-16 print:mb-12">
                <MinimalSectionHeader title="Publications" />
                <div className="space-y-4">
                  {resumeData.optionalSections.publications.filter(pub => pub.title && pub.title.trim() && pub.publisher && pub.publisher.trim()).map((pub, index) => (
                    <div key={index}>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{pub.title}</h3>
                      <p className="text-gray-600 font-light mb-1">{pub.publisher} • {formatDate(pub.date)}</p>
                      {pub.url && pub.url.trim() && (
                        <a 
                          href={pub.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900 text-sm font-light underline"
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
              <section className="mb-16 print:mb-12">
                <MinimalSectionHeader title="Interests" />
                <p className="text-gray-700 font-light leading-relaxed">
                  {resumeData.optionalSections.hobbies.filter(hobby => hobby && hobby.trim()).join(' • ')}
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </TemplateWrapper>
  )
}
