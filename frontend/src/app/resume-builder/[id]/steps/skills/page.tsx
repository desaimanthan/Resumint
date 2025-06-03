'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeProvider, useResume, SkillItem } from '@/contexts/ResumeContext'
import { ResumeNavigation } from '@/components/resume-navigation'
import { 
  Code, 
  Plus, 
  X, 
  ArrowRight, 
  Save, 
  ArrowLeft,
  Zap,
  Users,
  Globe,
  Search,
  Check,
  ChevronDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// Skills database organized by type
const SKILLS_DATABASE = {
  hard: [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
    'PHP', 'Ruby', 'Scala', 'R', 'MATLAB', 'SQL', 'HTML', 'CSS', 'Dart', 'Objective-C',
    'Perl', 'Haskell', 'Clojure', 'F#', 'Erlang', 'Elixir', 'Julia', 'Lua', 'Assembly', 'COBOL',
    'VB.NET', 'Fortran', 'Pascal', 'Ada', 'Prolog', 'Lisp', 'Scheme', 'OCaml', 'Crystal', 'Nim',
    
    // Frontend Development
    'React', 'Angular', 'Vue.js', 'Svelte', 'SvelteKit', 'jQuery', 'Bootstrap', 'Tailwind CSS', 'Material-UI',
    'Ant Design', 'Chakra UI', 'Styled Components', 'Emotion', 'Sass', 'Less', 'Stylus', 'PostCSS',
    'Webpack', 'Vite', 'Parcel', 'Rollup', 'ESBuild', 'Next.js', 'Nuxt.js', 'Gatsby', 'Remix',
    'Ember.js', 'Backbone.js', 'Alpine.js', 'Stimulus', 'Lit', 'Stencil', 'Web Components', 'PWA',
    
    // Backend Development
    'Node.js', 'Express.js', 'Fastify', 'Koa.js', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Tornado',
    'Spring Boot', 'Spring Framework', 'Spring Cloud', 'Laravel', 'Symfony', 'CodeIgniter', 'CakePHP',
    'Ruby on Rails', 'Sinatra', 'ASP.NET', 'ASP.NET Core', '.NET Framework', 'Gin', 'Echo', 'Fiber',
    'Actix', 'Rocket', 'Warp', 'Vapor', 'Perfect', 'Ktor', 'Micronaut', 'Quarkus', 'Helidon',
    
    // Mobile Development
    'React Native', 'Flutter', 'SwiftUI', 'Java Android', 'Ionic', 'Xamarin', 'PhoneGap', 'Cordova',
    'NativeScript', 'Android Studio', 'Xcode', 'Expo', 'Capacitor',
    'Titanium', 'Qt', 'Kivy', 'Corona SDK', 'Sencha Touch', 'Framework7',
    
    // Databases & Data Storage
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'MariaDB',
    'Cassandra', 'DynamoDB', 'CouchDB', 'Neo4j', 'InfluxDB', 'Elasticsearch', 'Firebase Firestore',
    'Supabase', 'PlanetScale', 'Prisma', 'TypeORM', 'Sequelize', 'Mongoose', 'Knex.js', 'Drizzle',
    'Amazon RDS', 'Azure SQL', 'Google Cloud SQL', 'CockroachDB', 'TimescaleDB', 'ClickHouse',
    
    // Cloud Platforms & Services
    'AWS', 'Amazon EC2', 'Amazon S3', 'AWS Lambda', 'Amazon EKS', 'AWS CloudFormation',
    'Azure', 'Azure App Service', 'Azure Functions', 'Azure DevOps', 'Azure Kubernetes Service',
    'Google Cloud Platform', 'Google Compute Engine', 'Google Kubernetes Engine', 'Google Cloud Functions',
    'Heroku', 'Vercel', 'Netlify', 'DigitalOcean', 'Linode', 'Vultr', 'Railway', 'Render',
    
    // DevOps & Infrastructure
    'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI/CD', 'GitHub Actions', 'CircleCI', 'Travis CI',
    'TeamCity', 'Bamboo', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant',
    'Nginx', 'Apache', 'HAProxy', 'CloudFormation', 'Pulumi', 'Helm', 'Istio', 'Linkerd',
    'Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'New Relic', 'Splunk', 'Nagios',
    
    // Version Control & Collaboration Tools
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Azure Repos', 'SVN', 'Mercurial', 'Perforce',
    'Jira', 'Confluence', 'Trello', 'Asana', 'Monday.com', 'ClickUp', 'Linear', 'Notion',
    
    // Testing & Quality Assurance
    'Jest', 'Mocha', 'Chai', 'Jasmine', 'Karma', 'Cypress', 'Selenium', 'WebDriver', 'Playwright',
    'Puppeteer', 'TestCafe', 'Protractor', 'JUnit', 'TestNG', 'Mockito', 'PyTest', 'unittest',
    'RSpec', 'Capybara', 'PHPUnit', 'Postman', 'Insomnia', 'SoapUI', 'LoadRunner', 'JMeter',
    
    // Data Science & Machine Learning
    'Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Seaborn', 'Plotly', 'Bokeh', 'Jupyter', 'Anaconda',
    'Scikit-learn', 'TensorFlow', 'PyTorch', 'Keras', 'XGBoost', 'LightGBM', 'OpenCV', 'NLTK', 'SpaCy',
    'Hugging Face', 'MLflow', 'Kubeflow', 'Apache Spark', 'Hadoop', 'Kafka', 'Airflow', 'Dask', 'Ray',
    
    // Business Intelligence & Analytics
    'Tableau', 'Power BI', 'Looker', 'QlikView', 'QlikSense', 'Sisense', 'Spotfire', 'Pentaho',
    'Google Analytics', 'Adobe Analytics', 'Mixpanel', 'Amplitude', 'Segment', 'Hotjar',
    'Google Data Studio', 'Amazon QuickSight', 'Metabase', 'Superset', 'Retool',
    
    // Design & User Experience
    'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Framer', 'Principle', 'ProtoPie', 'Marvel',
    'Zeplin', 'Balsamiq', 'Axure', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe After Effects',
    'Adobe Premiere Pro', 'Canva', 'Procreate', 'Blender', 'Cinema 4D', 'Maya', 'AutoCAD',
    'Wireframing', 'Prototyping', 'User Research', 'Usability Testing', 'Design Systems', 'A/B Testing',
    
    // Cybersecurity & Information Security
    'Cybersecurity', 'Information Security', 'Network Security', 'Application Security',
    'Penetration Testing', 'Vulnerability Assessment', 'Security Auditing', 'Incident Response',
    'OWASP', 'NIST Framework', 'ISO 27001', 'SOC 2', 'GDPR', 'HIPAA', 'PCI DSS',
    'SSL/TLS', 'OAuth', 'SAML', 'JWT', 'Firewall Management', 'IDS/IPS', 'SIEM',
    
    // Blockchain & Cryptocurrency
    'Blockchain', 'Bitcoin', 'Ethereum', 'Smart Contracts', 'Solidity', 'Web3', 'DeFi',
    'NFTs', 'Cryptocurrency', 'Hyperledger', 'Chaincode', 'Truffle', 'Hardhat', 'MetaMask',
    'IPFS', 'Consensus Algorithms', 'Cryptography', 'Tokenomics', 'DAO', 'Cross-chain',
    
    // Internet of Things (IoT)
    'IoT', 'Arduino', 'Raspberry Pi', 'ESP32', 'ESP8266', 'Sensors', 'Actuators', 'MQTT',
    'CoAP', 'LoRaWAN', 'Zigbee', 'Bluetooth', 'WiFi', 'Edge Computing', 'Industrial IoT',
    'Smart Home', 'Wearables', 'Embedded Systems', 'Real-time Systems', 'Microcontrollers',
    
    // Game Development
    'Unity', 'Unreal Engine', 'Godot', 'GameMaker Studio', 'Construct', 'Defold', 'Cocos2d',
    'GDScript', '3D Modeling', 'Animation', 'Game Design', 'Level Design', 'Game Physics',
    'AI Programming', 'Multiplayer Networking',
    
    // Digital Marketing & SEO
    'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Twitter Ads', 'TikTok Ads',
    'Content Marketing', 'Email Marketing', 'Social Media Marketing', 'Influencer Marketing',
    'Affiliate Marketing', 'Google Tag Manager', 'Facebook Pixel', 'HubSpot', 'Mailchimp',
    'Constant Contact', 'Hootsuite', 'Buffer', 'Sprout Social',
    
    // Sales & Customer Relationship
    'Salesforce', 'HubSpot CRM', 'Pipedrive', 'Zoho CRM', 'Microsoft Dynamics', 'SugarCRM',
    'Freshsales', 'Copper', 'Sales Forecasting', 'Lead Generation', 'Account Management',
    'Customer Success', 'Zendesk', 'Intercom', 'Freshdesk', 'ServiceNow', 'JIRA Service Desk',
    
    // Finance & Accounting
    'QuickBooks', 'SAP', 'Oracle Financials', 'NetSuite', 'Xero', 'FreshBooks', 'Wave',
    'Excel', 'Financial Modeling', 'Budgeting', 'Forecasting', 'Financial Analysis', 'GAAP',
    'IFRS', 'Tax Preparation', 'Audit', 'Risk Management', 'Investment Analysis', 'Bloomberg Terminal',
    
    // Human Resources & Talent
    'Workday', 'BambooHR', 'ADP', 'Paychex', 'Gusto', 'Namely', 'Greenhouse', 'Lever',
    'Workable', 'JazzHR', 'Talent Acquisition', 'Performance Management', 'Employee Engagement',
    'Compensation & Benefits', 'HRIS', 'Payroll', 'Compliance', 'Training & Development'
  ],
  
  soft: [
    'Communication', 'Problem Solving', 'Critical Thinking', 'Adaptability', 'Flexibility',
    'Time Management', 'Organization', 'Prioritization', 'Creativity', 'Innovation',
    'Emotional Intelligence', 'Empathy', 'Active Listening', 'Conflict Resolution',
    'Negotiation', 'Public Speaking', 'Presentation Skills', 'Interpersonal Skills',
    'Teamwork', 'Collaboration', 'Cross-functional Collaboration', 'Customer Service',
    'Attention to Detail', 'Analytical Thinking', 'Research Skills', 'Learning Agility',
    'Curiosity', 'Open-mindedness', 'Patience', 'Persistence', 'Resilience',
    'Stress Management', 'Work-life Balance', 'Cultural Awareness', 'Cross-cultural Communication'
  ],
  
  leadership: [
    'Leadership', 'Team Management', 'Team Building', 'Team Development', 'People Management',
    'Strategic Planning', 'Strategic Thinking', 'Vision Setting', 'Goal Setting',
    'Decision Making', 'Executive Decision Making', 'Delegation', 'Empowerment',
    'Mentoring', 'Coaching', 'Performance Management', 'Talent Development',
    'Change Management', 'Organizational Development', 'Culture Building',
    'Stakeholder Management', 'Executive Communication', 'Board Reporting',
    'Budget Management', 'Resource Allocation', 'Project Management', 'Program Management',
    'Risk Management', 'Crisis Management', 'Conflict Management', 'Influence',
    'Motivation', 'Inspiration', 'Employee Engagement', 'Succession Planning'
  ]
}

interface SkillSelectorProps {
  title: string
  skills: string[]
  selectedSkills: string[]
  onSkillAdd: (skill: string) => void
  onSkillRemove: (skill: string) => void
  placeholder: string
  badgeColor: string
  icon: React.ReactNode
}

function SkillSelector({ 
  title, 
  skills, 
  selectedSkills, 
  onSkillAdd, 
  onSkillRemove, 
  placeholder, 
  badgeColor,
  icon 
}: SkillSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const filteredSkills = skills.filter(skill => 
    skill.toLowerCase().includes(searchValue.toLowerCase()) &&
    !selectedSkills.includes(skill)
  )

  const handleSkillSelect = (skill: string) => {
    onSkillAdd(skill)
    setSearchValue('')
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      e.preventDefault()
      // If there's an exact match in filtered skills, add that
      const exactMatch = filteredSkills.find(skill => 
        skill.toLowerCase() === searchValue.toLowerCase()
      )
      
      if (exactMatch) {
        handleSkillSelect(exactMatch)
      } else if (!selectedSkills.includes(searchValue.trim())) {
        // Add as custom skill if not already selected
        onSkillAdd(searchValue.trim())
        setSearchValue('')
        setOpen(false)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>
          Search and select {title.toLowerCase()} for your resume.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Searchable Dropdown */}
        <div className="space-y-2">
          <Label>Add Skills</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {placeholder}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder={`Search or type to add custom ${title.toLowerCase().slice(0, -1)}...`}
                  value={searchValue}
                  onValueChange={setSearchValue}
                  onKeyDown={handleKeyDown}
                />
                <CommandList className="max-h-[300px] overflow-y-auto">
                  <CommandEmpty>
                    {searchValue.trim() ? (
                      <div className="py-6 text-center text-sm">
                        <p className="mb-2">No matching skills found.</p>
                        <p className="text-muted-foreground mb-3">
                          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded">Enter</kbd> to add "{searchValue}" as a custom skill
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!selectedSkills.includes(searchValue.trim())) {
                              onSkillAdd(searchValue.trim())
                              setSearchValue('')
                              setOpen(false)
                            }
                          }}
                          disabled={selectedSkills.includes(searchValue.trim())}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add "{searchValue}"
                        </Button>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        <p>Start typing to search skills or add a custom one</p>
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredSkills.map((skill) => (
                      <CommandItem
                        key={skill}
                        value={skill}
                        onSelect={() => handleSkillSelect(skill)}
                      >
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        {skill}
                      </CommandItem>
                    ))}
                    {searchValue.trim() && filteredSkills.length > 0 && !selectedSkills.includes(searchValue.trim()) && (
                      <CommandItem
                        onSelect={() => {
                          onSkillAdd(searchValue.trim())
                          setSearchValue('')
                          setOpen(false)
                        }}
                        className="border-t bg-muted/50"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add "{searchValue}" as custom skill
                      </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected Skills Badges */}
        {selectedSkills.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Skills ({selectedSkills.length})</Label>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className={`${badgeColor} cursor-pointer hover:opacity-80`}
                  onClick={() => onSkillRemove(skill)}
                >
                  {skill}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {selectedSkills.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <p>No skills selected yet.</p>
            <p className="mt-1">Search for skills above or type to add custom ones.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SkillsForm() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const {
    resumeData,
    isLoading,
    isDirty,
    lastSaved,
    loadResume,
    updateSkills,
    saveResume,
    saveDraft
  } = useResume()

  const [hardSkills, setHardSkills] = useState<string[]>([])
  const [softSkills, setSoftSkills] = useState<string[]>([])
  const [leadershipSkills, setLeadershipSkills] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Load resume data
  useEffect(() => {
    if (id && typeof id === 'string' && !resumeData) {
      loadResume(id)
    }
  }, [id, loadResume, resumeData])

  // Update form when resume data loads
  useEffect(() => {
    if (resumeData?.skills) {
      const hard: string[] = []
      const soft: string[] = []
      const leadership: string[] = []

      resumeData.skills.forEach(skill => {
        if (SKILLS_DATABASE.hard.includes(skill.skillName)) {
          hard.push(skill.skillName)
        } else if (SKILLS_DATABASE.soft.includes(skill.skillName)) {
          soft.push(skill.skillName)
        } else if (SKILLS_DATABASE.leadership.includes(skill.skillName)) {
          leadership.push(skill.skillName)
        } else {
          // Default to hard skills for unknown skills
          hard.push(skill.skillName)
        }
      })

      setHardSkills(hard)
      setSoftSkills(soft)
      setLeadershipSkills(leadership)
    }
  }, [resumeData])

  // Helper function to update all skills in context
  const updateAllSkills = () => {
    const allSkills: SkillItem[] = [
      ...hardSkills.map(skill => ({ skillName: skill, category: 'Technical' as const })),
      ...softSkills.map(skill => ({ skillName: skill, category: 'Soft' as const })),
      ...leadershipSkills.map(skill => ({ skillName: skill, category: 'Other' as const }))
    ]
    updateSkills(allSkills)
  }

  // Skill management functions
  const addHardSkill = (skill: string) => {
    const newHardSkills = [...hardSkills, skill]
    setHardSkills(newHardSkills)
    
    // Update context immediately
    const allSkills: SkillItem[] = [
      ...newHardSkills.map(s => ({ skillName: s, category: 'Technical' as const })),
      ...softSkills.map(s => ({ skillName: s, category: 'Soft' as const })),
      ...leadershipSkills.map(s => ({ skillName: s, category: 'Other' as const }))
    ]
    updateSkills(allSkills)
  }

  const removeHardSkill = (skill: string) => {
    const newHardSkills = hardSkills.filter(s => s !== skill)
    setHardSkills(newHardSkills)
    
    // Update context immediately
    const allSkills: SkillItem[] = [
      ...newHardSkills.map(s => ({ skillName: s, category: 'Technical' as const })),
      ...softSkills.map(s => ({ skillName: s, category: 'Soft' as const })),
      ...leadershipSkills.map(s => ({ skillName: s, category: 'Other' as const }))
    ]
    updateSkills(allSkills)
  }

  const addSoftSkill = (skill: string) => {
    const newSoftSkills = [...softSkills, skill]
    setSoftSkills(newSoftSkills)
    
    // Update context immediately
    const allSkills: SkillItem[] = [
      ...hardSkills.map(s => ({ skillName: s, category: 'Technical' as const })),
      ...newSoftSkills.map(s => ({ skillName: s, category: 'Soft' as const })),
      ...leadershipSkills.map(s => ({ skillName: s, category: 'Other' as const }))
    ]
    updateSkills(allSkills)
  }

  const removeSoftSkill = (skill: string) => {
    const newSoftSkills = softSkills.filter(s => s !== skill)
    setSoftSkills(newSoftSkills)
    
    // Update context immediately
    const allSkills: SkillItem[] = [
      ...hardSkills.map(s => ({ skillName: s, category: 'Technical' as const })),
      ...newSoftSkills.map(s => ({ skillName: s, category: 'Soft' as const })),
      ...leadershipSkills.map(s => ({ skillName: s, category: 'Other' as const }))
    ]
    updateSkills(allSkills)
  }

  const addLeadershipSkill = (skill: string) => {
    const newLeadershipSkills = [...leadershipSkills, skill]
    setLeadershipSkills(newLeadershipSkills)
    
    // Update context immediately
    const allSkills: SkillItem[] = [
      ...hardSkills.map(s => ({ skillName: s, category: 'Technical' as const })),
      ...softSkills.map(s => ({ skillName: s, category: 'Soft' as const })),
      ...newLeadershipSkills.map(s => ({ skillName: s, category: 'Other' as const }))
    ]
    updateSkills(allSkills)
  }

  const removeLeadershipSkill = (skill: string) => {
    const newLeadershipSkills = leadershipSkills.filter(s => s !== skill)
    setLeadershipSkills(newLeadershipSkills)
    
    // Update context immediately
    const allSkills: SkillItem[] = [
      ...hardSkills.map(s => ({ skillName: s, category: 'Technical' as const })),
      ...softSkills.map(s => ({ skillName: s, category: 'Soft' as const })),
      ...newLeadershipSkills.map(s => ({ skillName: s, category: 'Other' as const }))
    ]
    updateSkills(allSkills)
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
      router.push(`/resume-builder/${id}/steps/projects`)
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
    router.push(`/resume-builder/${id}/steps/education`)
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
            <h1 className="text-xl font-bold">Skills & Technologies</h1>
            <p className="text-muted-foreground">
              Add your technical skills, soft skills, and leadership abilities.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Step 4 of 9
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
            <ResumeNavigation currentStep="skills" />
          </div>

          {/* Skills Sections */}
          <div className="lg:col-span-3 space-y-6">
          {/* Hard Skills */}
          <SkillSelector
            title="Hard Skills"
            skills={SKILLS_DATABASE.hard}
            selectedSkills={hardSkills}
            onSkillAdd={addHardSkill}
            onSkillRemove={removeHardSkill}
            placeholder="Search technical skills..."
            badgeColor="bg-blue-50 text-blue-800 border-blue-200"
            icon={<Code className="h-5 w-5" />}
          />

          {/* Soft Skills */}
          <SkillSelector
            title="Soft Skills"
            skills={SKILLS_DATABASE.soft}
            selectedSkills={softSkills}
            onSkillAdd={addSoftSkill}
            onSkillRemove={removeSoftSkill}
            placeholder="Search soft skills..."
            badgeColor="bg-green-50 text-green-800 border-green-200"
            icon={<Users className="h-5 w-5" />}
          />

          {/* Leadership & Management */}
          <SkillSelector
            title="Leadership & Management"
            skills={SKILLS_DATABASE.leadership}
            selectedSkills={leadershipSkills}
            onSkillAdd={addLeadershipSkill}
            onSkillRemove={removeLeadershipSkill}
            placeholder="Search leadership skills..."
            badgeColor="bg-purple-50 text-purple-800 border-purple-200"
            icon={<Zap className="h-5 w-5" />}
          />
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

export default function SkillsPage() {
  return (
    <ResumeProvider>
      <SkillsForm />
    </ResumeProvider>
  )
}
