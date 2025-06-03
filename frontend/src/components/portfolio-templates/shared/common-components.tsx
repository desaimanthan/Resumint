import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Linkedin, 
  Github,
  Building,
  GraduationCap,
  Award,
  Code,
  Briefcase,
  User,
  Calendar
} from 'lucide-react'

// Types
export interface ResumeData {
  _id: string
  title: string
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    location?: string
    website?: string
    linkedin?: string
    github?: string
    profilePhoto?: string
  }
  summary: string
  workHistory: Array<{
    jobTitle: string
    company?: string
    companyName?: string
    companyLogo?: string
    location?: string
    startDate: string
    endDate?: string
    isCurrentJob: boolean
    responsibilities: string[]
    achievements: Array<{
      description: string
      impact?: string
    }>
  }>
  education: Array<{
    degree: string
    institution: string
    location?: string
    graduationDate: string
    gpa?: string
    honors?: string[]
  }>
  skills: Array<{
    skillName: string
    category: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    dateEarned: string
    expirationDate?: string
    credentialId?: string
  }>
  projects: Array<{
    name: string
    description: string
    technologies: string[]
    startDate: string
    endDate?: string
    url?: string
    github?: string
  }>
  otherAchievements: Array<{
    title: string
    description: string
    date: string
  }>
  optionalSections: {
    languages?: Array<{
      language: string
      proficiency: string
    }>
    volunteerWork?: Array<{
      organization: string
      role: string
      startDate: string
      endDate?: string
      description: string
    }>
    publications?: Array<{
      title: string
      publisher: string
      date: string
      url?: string
    }>
    hobbies?: string[]
  }
}

// Utility function to format dates
export const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  })
}

// Contact Info Component
interface ContactInfoProps {
  personalInfo: ResumeData['personalInfo']
  className?: string
  iconSize?: string
  layout?: 'horizontal' | 'vertical'
}

export function ContactInfo({ personalInfo, className = '', iconSize = 'h-4 w-4', layout = 'horizontal' }: ContactInfoProps) {
  const containerClass = layout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'
  
  return (
    <div className={`${containerClass} ${className}`}>
      {personalInfo.email && (
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className={iconSize} />
          <a href={`mailto:${personalInfo.email}`} className="hover:text-blue-600">
            {personalInfo.email}
          </a>
        </div>
      )}
      
      {personalInfo.phone && (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className={iconSize} />
          <a href={`tel:${personalInfo.phone}`} className="hover:text-blue-600">
            {personalInfo.phone}
          </a>
        </div>
      )}
      
      {personalInfo.location && (
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className={iconSize} />
          <span>{typeof personalInfo.location === 'string' ? personalInfo.location : JSON.stringify(personalInfo.location)}</span>
        </div>
      )}
    </div>
  )
}

// Social Links Component
interface SocialLinksProps {
  personalInfo: ResumeData['personalInfo']
  className?: string
  iconSize?: string
  layout?: 'horizontal' | 'vertical'
}

export function SocialLinks({ personalInfo, className = '', iconSize = 'h-4 w-4', layout = 'horizontal' }: SocialLinksProps) {
  const containerClass = layout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'
  
  return (
    <div className={`${containerClass} ${className}`}>
      {personalInfo.website && (
        <a 
          href={personalInfo.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <Globe className={iconSize} />
          Website
        </a>
      )}
      
      {personalInfo.linkedin && (
        <a 
          href={personalInfo.linkedin} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <Linkedin className={iconSize} />
          LinkedIn
        </a>
      )}
      
      {personalInfo.github && (
        <a 
          href={personalInfo.github} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <Github className={iconSize} />
          GitHub
        </a>
      )}
    </div>
  )
}

// Section Header Component
interface SectionHeaderProps {
  title: string
  icon: React.ReactNode
  className?: string
}

export function SectionHeader({ title, icon, className = '' }: SectionHeaderProps) {
  return (
    <h2 className={`text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2 ${className}`}>
      {icon}
      {title}
    </h2>
  )
}

// Skills Grid Component
interface SkillsGridProps {
  skills: ResumeData['skills']
  className?: string
}

export function SkillsGrid({ skills, className = '' }: SkillsGridProps) {
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill.skillName)
    return acc
  }, {} as Record<string, string[]>)

  return (
    <div className={`space-y-4 ${className}`}>
      {Object.entries(skillsByCategory).map(([category, skillList]) => (
        <div key={category}>
          <h3 className="font-semibold text-gray-900 mb-2">{category}</h3>
          <div className="flex flex-wrap gap-2">
            {skillList.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Work Experience Item Component
interface WorkExperienceItemProps {
  job: ResumeData['workHistory'][0]
  className?: string
}

export function WorkExperienceItem({ job, className = '' }: WorkExperienceItemProps) {
  return (
    <div className={`border-l-2 border-blue-200 pl-4 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
        {job.jobTitle && (
          <h3 className="text-xl font-semibold text-gray-900">{job.jobTitle}</h3>
        )}
        <span className="text-gray-600">
          {formatDate(job.startDate)} - {job.isCurrentJob ? 'Present' : formatDate(job.endDate || '')}
        </span>
      </div>
      
      <div className="flex items-center gap-3 mb-3">
        {job.companyLogo ? (
          <img
            src={job.companyLogo}
            alt={`${job.company || 'Company'} logo`}
            className="w-6 h-6 object-contain rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Building className={`h-4 w-4 text-gray-500 ${job.companyLogo ? 'hidden' : ''}`} />
        <span className="font-medium text-gray-700">
          {job.companyName || 'Company Name Not Available'}
        </span>
        {job.location && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{job.location}</span>
          </>
        )}
      </div>

      {job.responsibilities && job.responsibilities.length > 0 && job.responsibilities.some(resp => resp && resp.trim()) && (
        <ul className="list-disc list-inside space-y-1 mb-3">
          {job.responsibilities.filter(resp => resp && resp.trim()).map((responsibility, idx) => (
            <li key={idx} className="text-gray-700">{responsibility}</li>
          ))}
        </ul>
      )}

      {job.achievements && job.achievements.length > 0 && job.achievements.some(ach => ach.description && ach.description.trim()) && (
        <div className="space-y-1">
          <h4 className="font-medium text-gray-900">Key Achievements:</h4>
          <ul className="list-disc list-inside space-y-1">
            {job.achievements.filter(ach => ach.description && ach.description.trim()).map((achievement, idx) => (
              <li key={idx} className="text-gray-700">
                {achievement.description}
                {achievement.impact && achievement.impact.trim() && (
                  <span className="text-green-600 font-medium"> - {achievement.impact}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Education Item Component
interface EducationItemProps {
  education: ResumeData['education'][0]
  className?: string
}

export function EducationItem({ education, className = '' }: EducationItemProps) {
  return (
    <div className={`border-l-2 border-green-200 pl-4 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
        <h3 className="text-xl font-semibold text-gray-900">{education.degree}</h3>
        <span className="text-gray-600">{formatDate(education.graduationDate)}</span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-gray-700">{education.institution}</span>
        {education.location && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{education.location}</span>
          </>
        )}
      </div>

      {education.gpa && (
        <p className="text-gray-700">GPA: {education.gpa}</p>
      )}

      {education.honors && education.honors.length > 0 && education.honors.some(honor => honor && honor.trim()) && (
        <div className="mt-2">
          <span className="font-medium text-gray-900">Honors: </span>
          <span className="text-gray-700">{education.honors.filter(honor => honor && honor.trim()).join(', ')}</span>
        </div>
      )}
    </div>
  )
}

// Project Item Component
interface ProjectItemProps {
  project: ResumeData['projects'][0]
  className?: string
}

export function ProjectItem({ project, className = '' }: ProjectItemProps) {
  return (
    <div className={`border-l-2 border-purple-200 pl-4 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
        <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
        <span className="text-gray-600">
          {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
        </span>
      </div>
      
      <p className="text-gray-700 mb-3">{project.description}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {project.technologies.map((tech, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">
            {tech}
          </Badge>
        ))}
      </div>

      <div className="flex gap-4">
        {project.url && (
          <a 
            href={project.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View Project
          </a>
        )}
        
        {project.github && (
          <a 
            href={project.github} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View Code
          </a>
        )}
      </div>
    </div>
  )
}

// Export icons for use in templates
export const Icons = {
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github
}
