'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeProvider, useResume } from '@/contexts/ResumeContext'
import { ResumeNavigation } from '@/components/resume-navigation'
import { FileText, ArrowRight, Save, ArrowLeft, Sparkles, Copy, RefreshCw, Lightbulb } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'

function SummaryForm() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { apiCall } = useAuth()
  const {
    resumeData,
    isLoading,
    isDirty,
    lastSaved,
    loadResume,
    updateSummary,
    saveResume
  } = useResume()

  const [summary, setSummary] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiKeywords, setAiKeywords] = useState('')
  const [showExamples, setShowExamples] = useState(false)
  const [lastUsage, setLastUsage] = useState<{
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost: number
  } | null>(null)

  // Example summaries for different roles
  const exampleSummaries = [
    {
      role: "UI/UX Designer",
      summary: "Senior UI/UX designer with 8+ years in fintech and a track record of launching mobile experiences that drive customer retention. Led design systems for 3 major product launches, increasing user engagement by 40%."
    },
    {
      role: "Software Engineer",
      summary: "Full-stack software engineer with 5+ years building scalable web applications. Expertise in React, Node.js, and cloud architecture, with experience leading teams of 4+ developers on high-impact projects."
    },
    {
      role: "Product Manager",
      summary: "Results-driven product manager with 6+ years launching B2B SaaS products. Successfully managed product roadmaps for $10M+ revenue streams and led cross-functional teams to deliver features used by 100K+ users."
    },
    {
      role: "Marketing Manager",
      summary: "Digital marketing professional with 7+ years driving growth for e-commerce brands. Increased organic traffic by 300% and managed $2M+ ad budgets, specializing in SEO, PPC, and conversion optimization."
    },
    {
      role: "Data Scientist",
      summary: "Data scientist with 4+ years applying machine learning to solve business problems. Built predictive models that improved operational efficiency by 25% and led analytics initiatives for Fortune 500 clients."
    }
  ]

  // Load resume data
  useEffect(() => {
    if (id && typeof id === 'string' && !resumeData) {
      loadResume(id)
    }
  }, [id, loadResume, resumeData])

  // Update form when resume data loads
  useEffect(() => {
    if (resumeData?.summary) {
      setSummary(resumeData.summary)
    }
  }, [resumeData])

  // Handle summary change
  const handleSummaryChange = (value: string) => {
    setSummary(value)
    updateSummary(value)
  }

  // Generate AI summary
  const generateAISummary = async () => {
    if (!aiKeywords.trim()) {
      toast({
        title: 'Keywords Required',
        description: 'Please enter some keywords to generate a summary.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await apiCall('/ai/generate-summary', {
        method: 'POST',
        body: JSON.stringify({
          keywords: aiKeywords,
          resumeId: id
        })
      })
      
      const generatedSummary = response.data.summary
      setSummary(generatedSummary)
      updateSummary(generatedSummary)
      
      // Store usage information
      if (response.data.usage) {
        setLastUsage(response.data.usage)
      }
      
      toast({
        title: 'Summary Generated',
        description: `AI has generated a professional summary using ${response.data.usage?.totalTokens || 0} tokens (≈${(response.data.usage?.estimatedCost || 0).toFixed(4)}).`,
      })
    } catch (error) {
      console.error('AI generation error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate summary. Please try again or write your summary manually.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy example to summary
  const copyExample = (exampleSummary: string) => {
    setSummary(exampleSummary)
    updateSummary(exampleSummary)
    toast({
      title: 'Example Copied',
      description: 'Example summary has been copied. You can now edit it to match your experience.',
    })
  }

  // Go back to previous step
  const handleGoBack = () => {
    router.push(`/resume-builder/${id}/steps/projects`)
  }

  // Save and continue
  const handleSaveAndContinue = async () => {
    setIsSaving(true)
    try {
      await saveResume()
      // Navigate to next step (additional sections)
      router.push(`/resume-builder/${id}/steps/additional-sections`)
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

  if (isLoading) {
    return (
      <SimpleSidebar title={`Resume Builder${resumeData?.title ? ` - ${resumeData.title}` : ''}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SimpleSidebar>
    )
  }

  const characterCount = summary.length

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
            <h1 className="text-xl font-bold">Professional Summary</h1>
            <p className="text-muted-foreground">
              Write a compelling 2-3 sentence summary that highlights your key strengths and experience.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Step 6 of 9
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
            <ResumeNavigation currentStep="summary" />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* AI Assistant */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Summary Assistant
            </CardTitle>
            <CardDescription>
              Enter a few keywords about your role and experience, and we'll generate a professional summary for you to customize.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-keywords">Keywords (e.g., "Senior UI/UX Designer, Fintech, Mobile Apps")</Label>
              <Input
                id="ai-keywords"
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                placeholder="Enter your role, industry, skills, or experience level..."
                className="w-full"
              />
            </div>
            <Button 
              onClick={generateAISummary}
              disabled={isGenerating || !aiKeywords.trim()}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Summary Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Professional Summary
            </CardTitle>
            <CardDescription>
              Write a 2–3-sentence professional summary about yourself. Focus on your key achievements, skills, and what makes you unique.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Professional Summary *</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => handleSummaryChange(e.target.value)}
                placeholder="E.g., 'Senior UI/UX designer with 8+ years in fintech and a track record of launching mobile experiences that drive customer retention. Led design systems for 3 major product launches, increasing user engagement by 40%.'"
                className="min-h-[120px] resize-none"
              />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Aim for 2-3 sentences that highlight your key strengths
                </span>
                <span className="text-muted-foreground">
                  {characterCount} characters
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Tips for a great summary:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Start with your job title and years of experience</li>
                    <li>• Include 1-2 key achievements with specific metrics</li>
                    <li>• Mention your core skills or specializations</li>
                    <li>• Keep it concise but impactful</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examples Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Example Summaries
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExamples(!showExamples)}
              >
                {showExamples ? 'Hide' : 'Show'} Examples
              </Button>
            </CardTitle>
            {showExamples && (
              <CardDescription>
                Click on any example to copy it to your summary, then customize it with your own details.
              </CardDescription>
            )}
          </CardHeader>
          {showExamples && (
            <CardContent>
              <div className="space-y-4">
                {exampleSummaries.map((example, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => copyExample(example.summary)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-blue-600 mb-2">{example.role}</h4>
                        <p className="text-sm text-gray-700">{example.summary}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
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
            disabled={isSaving || !summary || !summary.trim()}
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </SimpleSidebar>
  )
}

export default function SummaryPage() {
  return (
    <ResumeProvider>
      <SummaryForm />
    </ResumeProvider>
  )
}
