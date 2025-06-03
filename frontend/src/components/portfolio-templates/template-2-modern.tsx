'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TemplateWrapper } from './shared/template-wrapper'
import { 
  ResumeData, 
  ContactInfo, 
  SocialLinks, 
  SectionHeader, 
  WorkExperienceItem, 
  EducationItem, 
  ProjectItem, 
  formatDate,
  Icons 
} from './shared/common-components'

interface Template2Props {
  resumeData: ResumeData
}

export default function Template2Modern({ resumeData }: Template2Props) {
  // Skills with visual progress bars
  const SkillsWithProgress = ({ skills }: { skills: ResumeData['skills'] }) => {
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
            <h3 className="font-semibold text-white mb-3">{category}</h3>
            <div className="space-y-2">
              {skillList.map((skill, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-200">{skill}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.random() * 30 + 70}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <TemplateWrapper className="bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6 print:p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-2xl">
              <CardContent className="p-6">
                {/* Profile Photo */}
                {resumeData.personalInfo.profilePhoto && (
                  <div className="text-center mb-6">
                    <img
                      src={resumeData.personalInfo.profilePhoto}
                      alt={`${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}`}
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                    />
                  </div>
                )}

                {/* Name */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">
                    {resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}
                  </h1>
                </div>

                {/* Contact Info */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3 text-blue-300">Contact</h2>
                  <ContactInfo 
                    personalInfo={resumeData.personalInfo} 
                    layout="vertical"
                    className="text-gray-200"
                    iconSize="h-4 w-4"
                  />
                </div>

                {/* Social Links */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3 text-blue-300">Links</h2>
                  <SocialLinks 
                    personalInfo={resumeData.personalInfo} 
                    layout="vertical"
                    className="text-blue-300"
                    iconSize="h-4 w-4"
                  />
                </div>

                {/* Skills */}
                {resumeData.skills && resumeData.skills.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-blue-300">Skills</h2>
                    <SkillsWithProgress skills={resumeData.skills} />
                  </div>
                )}

                {/* Languages */}
                {resumeData.optionalSections?.languages && resumeData.optionalSections.languages.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-blue-300">Languages</h2>
                    <div className="space-y-2">
                      {resumeData.optionalSections.languages.map((lang, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-200">{lang.language}</span>
                          <Badge variant="outline" className="bg-blue-600 text-white border-blue-400">
                            {lang.proficiency}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hobbies */}
                {resumeData.optionalSections?.hobbies && resumeData.optionalSections.hobbies.length > 0 && resumeData.optionalSections.hobbies.some(hobby => hobby && hobby.trim()) && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3 text-blue-300">Interests</h2>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.optionalSections.hobbies.filter(hobby => hobby && hobby.trim()).map((hobby, index) => (
                        <Badge key={index} variant="outline" className="bg-purple-600 text-white border-purple-400 text-xs">
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary */}
            {resumeData.summary && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <SectionHeader 
                    title="Professional Summary" 
                    icon={<Icons.User className="h-6 w-6 text-blue-600" />} 
                    className="text-gray-800"
                  />
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-gray-700 leading-relaxed">{resumeData.summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Work Experience */}
            {resumeData.workHistory && resumeData.workHistory.length > 0 && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <SectionHeader 
                    title="Work Experience" 
                    icon={<Icons.Briefcase className="h-6 w-6 text-blue-600" />} 
                    className="text-gray-800"
                  />
                  
                  <div className="space-y-6">
                    {resumeData.workHistory.map((job, index) => (
                      <div key={index} className="relative">
                        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                        <div className="pl-6">
                          <WorkExperienceItem job={job} className="border-l-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {resumeData.education && resumeData.education.length > 0 && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <SectionHeader 
                    title="Education" 
                    icon={<Icons.GraduationCap className="h-6 w-6 text-blue-600" />} 
                    className="text-gray-800"
                  />
                  
                  <div className="space-y-4">
                    {resumeData.education.map((edu, index) => (
                      <div key={index} className="relative">
                        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                        <div className="pl-6">
                          <EducationItem education={edu} className="border-l-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects */}
            {resumeData.projects && resumeData.projects.length > 0 && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <SectionHeader 
                    title="Projects" 
                    icon={<Icons.Code className="h-6 w-6 text-blue-600" />} 
                    className="text-gray-800"
                  />
                  
                  <div className="grid gap-6">
                    {resumeData.projects.map((project, index) => (
                      <Card key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 border-l-4 border-purple-500">
                        <CardContent className="p-4">
                          <ProjectItem project={project} className="border-l-0" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {resumeData.certifications && resumeData.certifications.length > 0 && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <SectionHeader 
                    title="Certifications" 
                    icon={<Icons.Award className="h-6 w-6 text-blue-600" />} 
                    className="text-gray-800"
                  />
                  
                  <div className="grid gap-4">
                    {resumeData.certifications.map((cert, index) => (
                      <Card key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{cert.name}</h3>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              {formatDate(cert.dateEarned)}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-700 font-medium mb-1">{cert.issuer}</p>
                          
                          {cert.credentialId && (
                            <p className="text-sm text-gray-600">Credential ID: {cert.credentialId}</p>
                          )}
                          
                          {cert.expirationDate && (
                            <p className="text-sm text-gray-600">Expires: {formatDate(cert.expirationDate)}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Volunteer Work */}
            {resumeData.optionalSections?.volunteerWork && resumeData.optionalSections.volunteerWork.length > 0 && resumeData.optionalSections.volunteerWork.some(vol => vol.role && vol.role.trim() && vol.organization && vol.organization.trim()) && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <SectionHeader 
                    title="Volunteer Experience" 
                    icon={<Icons.User className="h-6 w-6 text-blue-600" />} 
                    className="text-gray-800"
                  />
                  
                  <div className="space-y-4">
                    {resumeData.optionalSections.volunteerWork.filter(vol => vol.role && vol.role.trim() && vol.organization && vol.organization.trim()).map((volunteer, index) => (
                      <Card key={index} className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{volunteer.role}</h3>
                            <span className="text-gray-600">
                              {formatDate(volunteer.startDate)} - {volunteer.endDate ? formatDate(volunteer.endDate) : 'Present'}
                            </span>
                          </div>
                          <p className="font-medium text-gray-700 mb-2">{volunteer.organization}</p>
                          {volunteer.description && volunteer.description.trim() && (
                            <p className="text-gray-700">{volunteer.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Publications */}
            {resumeData.optionalSections?.publications && resumeData.optionalSections.publications.length > 0 && resumeData.optionalSections.publications.some(pub => pub.title && pub.title.trim() && pub.publisher && pub.publisher.trim()) && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <SectionHeader 
                    title="Publications" 
                    icon={<Icons.Award className="h-6 w-6 text-blue-600" />} 
                    className="text-gray-800"
                  />
                  
                  <div className="space-y-4">
                    {resumeData.optionalSections.publications.filter(pub => pub.title && pub.title.trim() && pub.publisher && pub.publisher.trim()).map((pub, index) => (
                      <Card key={index} className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1">{pub.title}</h3>
                          <p className="text-gray-700 mb-2">{pub.publisher} • {formatDate(pub.date)}</p>
                          {pub.url && pub.url.trim() && (
                            <a 
                              href={pub.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Publication →
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TemplateWrapper>
  )
}
