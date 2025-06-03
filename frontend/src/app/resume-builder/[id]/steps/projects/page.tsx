'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeProvider, useResume, ProjectItem } from '@/contexts/ResumeContext'
import { ResumeNavigation } from '@/components/resume-navigation'
import { DatePicker } from '@/components/ui/date-picker'
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Save,
  FolderOpen,
  Calendar,
  Code,
  Target,
  ExternalLink,
  Github,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Common tech stack options for quick selection
const COMMON_TECHNOLOGIES = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'Node.js', 'Express.js',
  'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'C#', '.NET', 'PHP', 'Laravel',
  'Ruby', 'Rails', 'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'Ionic',
  'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Bootstrap', 'Material-UI', 'Styled Components',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase', 'AWS', 'Azure', 'GCP',
  'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'Terraform', 'Ansible',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV',
  'Unity', 'Unreal Engine', 'Blender', 'Figma', 'Adobe XD', 'Sketch'
]

interface ProjectFormData {
  name: string
  role: string
  startDate: Date | undefined
  endDate: Date | undefined
  description: string
  technologies: string[]
  outcome: string
  url: string
  github: string
}

const getDefaultProjectData = (): ProjectFormData => ({
  name: '',
  role: '',
  startDate: undefined,
  endDate: undefined,
  description: '',
  technologies: [],
  outcome: '',
  url: '',
  github: ''
})

interface ProjectFormProps {
  project: ProjectFormData
  onUpdate: (project: ProjectFormData) => void
  onRemove: () => void
  isFirst: boolean
  projectNumber: number
}

function ProjectForm({ project, onUpdate, onRemove, isFirst, projectNumber }: ProjectFormProps) {
  const [techInput, setTechInput] = useState('')
  const [showTechSuggestions, setShowTechSuggestions] = useState(false)

  const filteredTechnologies = COMMON_TECHNOLOGIES.filter(tech => 
    tech.toLowerCase().includes(techInput.toLowerCase()) &&
    !project.technologies.includes(tech)
  )

  const addTechnology = (tech: string) => {
    if (tech.trim() && !project.technologies.includes(tech.trim())) {
      onUpdate({
        ...project,
        technologies: [...project.technologies, tech.trim()]
      })
    }
    setTechInput('')
    setShowTechSuggestions(false)
  }

  const removeTechnology = (tech: string) => {
    onUpdate({
      ...project,
      technologies: project.technologies.filter(t => t !== tech)
    })
  }

  const handleTechInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault()
      addTechnology(techInput)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Project #{projectNumber} {isFirst && '(Optional)'}
            </CardTitle>
            <CardDescription>
              {isFirst ? 'All fields are optional. Leave blank to skip this section entirely.' : 'Share details about your project.'}
            </CardDescription>
          </div>
          {!isFirst && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Name and Role */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              placeholder="e.g., E-commerce Platform, Mobile App, Open Source Library"
              value={project.name}
              onChange={(e) => onUpdate({ ...project, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Your Role</Label>
            <Input
              id="role"
              placeholder="e.g., Full Stack Developer, Lead Developer, Contributor"
              value={project.role}
              onChange={(e) => onUpdate({ ...project, role: e.target.value })}
            />
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Project Duration
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm text-muted-foreground">Start Date</Label>
              <DatePicker
                date={project.startDate}
                onSelect={(date: Date | undefined) => onUpdate({ ...project, startDate: date })}
                placeholder="Select start date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm text-muted-foreground">End Date</Label>
              <DatePicker
                date={project.endDate}
                onSelect={(date: Date | undefined) => onUpdate({ ...project, endDate: date })}
                placeholder="Select end date (or leave blank if ongoing)"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Project Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your project in 2-3 sentences. What problem did it solve? What was your contribution? What was the impact?"
            value={project.description}
            onChange={(e) => onUpdate({ ...project, description: e.target.value })}
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            Tip: Focus on the problem solved, your role, and measurable impact.
          </p>
        </div>

        {/* Technologies */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Technologies Used
          </Label>
          <div className="space-y-3">
            <div className="relative">
              <Input
                placeholder="Type to search technologies or add custom ones..."
                value={techInput}
                onChange={(e) => {
                  setTechInput(e.target.value)
                  setShowTechSuggestions(e.target.value.length > 0)
                }}
                onKeyDown={handleTechInputKeyDown}
                onFocus={() => setShowTechSuggestions(techInput.length > 0)}
                onBlur={() => setTimeout(() => setShowTechSuggestions(false), 200)}
              />
              {showTechSuggestions && filteredTechnologies.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredTechnologies.slice(0, 8).map((tech) => (
                    <button
                      key={tech}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      onMouseDown={() => addTechnology(tech)}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <Badge
                    key={tech}
                    variant="outline"
                    className="bg-blue-50 text-blue-800 border-blue-200 cursor-pointer hover:opacity-80"
                    onClick={() => removeTechnology(tech)}
                  >
                    {tech}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Press Enter to add custom technologies or click from suggestions above.
            </p>
          </div>
        </div>

        {/* Measurable Outcome */}
        <div className="space-y-2">
          <Label htmlFor="outcome" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Measurable Outcome
          </Label>
          <Textarea
            id="outcome"
            placeholder="e.g., Reduced load time by 30%, Increased user engagement by 25%, Gained 1000+ GitHub stars, Served 10,000+ users"
            value={project.outcome}
            onChange={(e) => onUpdate({ ...project, outcome: e.target.value })}
            rows={2}
          />
          <p className="text-sm text-muted-foreground">
            Include specific metrics, numbers, or achievements when possible.
          </p>
        </div>

        {/* Project Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectUrl" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Project URL
            </Label>
            <Input
              id="projectUrl"
              type="url"
              placeholder="https://your-project.com"
              value={project.url}
              onChange={(e) => onUpdate({ ...project, url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubUrl" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub URL
            </Label>
            <Input
              id="githubUrl"
              type="url"
              placeholder="https://github.com/username/repo"
              value={project.github}
              onChange={(e) => onUpdate({ ...project, github: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectsForm() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const {
    resumeData,
    isLoading,
    isDirty,
    lastSaved,
    loadResume,
    updateProjects,
    saveResume,
    saveDraft
  } = useResume()

  const [projects, setProjects] = useState<ProjectFormData[]>([getDefaultProjectData()])
  const [isSaving, setIsSaving] = useState(false)

  // Load resume data
  useEffect(() => {
    if (id && typeof id === 'string' && !resumeData) {
      loadResume(id)
    }
  }, [id, loadResume, resumeData])

  // Update form when resume data loads
  useEffect(() => {
    if (resumeData?.projects && resumeData.projects.length > 0) {
      const formattedProjects = resumeData.projects.map(project => ({
        name: project.name || '',
        role: project.role || '',
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        description: project.description || '',
        technologies: project.technologies || [],
        outcome: project.outcome || '',
        url: project.url || '',
        github: project.github || ''
      }))
      setProjects(formattedProjects)
    }
  }, [resumeData])

  // Helper function to update context
  const updateProjectsContext = (projectsData: ProjectFormData[]) => {
    const projectItems: ProjectItem[] = projectsData
      .filter(project => project.projectName.trim())
      .map(project => ({
        projectName: project.projectName,
        role: project.role,
        startDate: project.startDate || new Date(),
        endDate: project.endDate || new Date(),
        description: project.description,
        technologies: project.technologies,
        outcome: project.outcome,
        projectUrl: project.projectUrl,
        githubUrl: project.githubUrl
      }))
    updateProjects(projectItems)
  }

  const addProject = () => {
    const newProjects = [...projects, getDefaultProjectData()]
    setProjects(newProjects)
    updateProjectsContext(newProjects)
  }

  const updateProject = (index: number, updatedProject: ProjectFormData) => {
    const newProjects = [...projects]
    newProjects[index] = updatedProject
    setProjects(newProjects)
    updateProjectsContext(newProjects)
  }

  const removeProject = (index: number) => {
    if (projects.length > 1) {
      const newProjects = projects.filter((_, i) => i !== index)
      setProjects(newProjects)
      updateProjectsContext(newProjects)
    }
  }

  // Save and continue
  const handleSaveAndContinue = async () => {
    setIsSaving(true)
    try {
      try {
        await saveResume()
      } catch (saveError) {
        console.error('Save failed, but continuing navigation:', saveError)
        toast({
          title: 'Warning',
          description: 'Changes may not be saved. Please try saving again.',
          variant: 'destructive',
        })
      }
      router.push(`/resume-builder/${id}/steps/summary`)
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
      await saveDraft()
    } catch (error) {
      // Error already handled in saveDraft
    } finally {
      setIsSaving(false)
    }
  }

  // Go back
  const handleGoBack = () => {
    router.push(`/resume-builder/${id}/steps/skills`)
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
            <h1 className="text-xl font-bold">Projects & Achievements</h1>
            <p className="text-muted-foreground">
              Showcase your notable projects, open-source contributions, and freelance work.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Step 5 of 9
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
            <ResumeNavigation currentStep="projects" />
          </div>

          {/* Projects Forms */}
          <div className="lg:col-span-3 space-y-6">
          {projects.map((project, index) => (
            <ProjectForm
              key={index}
              project={project}
              onUpdate={(updatedProject) => updateProject(index, updatedProject)}
              onRemove={() => removeProject(index)}
              isFirst={index === 0}
              projectNumber={index + 1}
            />
          ))}

          {/* Add Another Project Button */}
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Button
                variant="outline"
                onClick={addProject}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Another Project
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Add more projects to showcase your experience
              </p>
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
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </SimpleSidebar>
  )
}

export default function ProjectsPage() {
  return (
    <ResumeProvider>
      <ProjectsForm />
    </ResumeProvider>
  )
}
