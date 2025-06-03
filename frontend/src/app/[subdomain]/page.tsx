'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { TemplateRenderer } from '@/components/portfolio-templates/template-renderer'
import { ResumeData } from '@/components/portfolio-templates/shared/common-components'

interface PortfolioResumeData extends ResumeData {
  templateId?: string
  publication: {
    isPublished: boolean
    subdomain: string
    isPasswordProtected: boolean
    seoMetadata: {
      title: string
      description: string
      keywords: string[]
    }
  }
}

export default function SubdomainPortfolioPage() {
  const { subdomain } = useParams()
  const router = useRouter()
  const [resumeData, setResumeData] = useState<PortfolioResumeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const trackDetailedAnalytics = async () => {
    try {
      // Generate unique visitor ID
      let visitorId = localStorage.getItem('resumint_visitor_id')
      if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem('resumint_visitor_id', visitorId)
      }

      // Track session start time
      const sessionStartTime = Date.now()
      sessionStorage.setItem('session_start_time', sessionStartTime.toString())

      const analyticsData = {
        visitorId,
        sessionDuration: 0,
        referrer: document.referrer || '',
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timeZoneOffset: new Date().getTimezoneOffset(),
        colorDepth: screen.colorDepth,
        cookieEnabled: navigator.cookieEnabled
      }

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/published/${subdomain}/track-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyticsData)
      })

      console.log('Analytics tracked for subdomain session')
      
    } catch (error) {
      // Silently fail analytics tracking
      console.error('Analytics tracking failed:', error)
    }
  }

  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        // Check if we have cached resume data from password authentication
        const cachedData = sessionStorage.getItem(`portfolio_data_${subdomain}`)
        const isAuthenticated = sessionStorage.getItem(`portfolio_access_${subdomain}`)
        
        if (cachedData && isAuthenticated) {
          // Use cached data for password-protected resumes
          const resumeData = JSON.parse(cachedData)
          setResumeData(resumeData)
          
          // Track analytics for authenticated access
          trackDetailedAnalytics()
          setLoading(false)
          return
        }

        // Make direct fetch call without authentication to avoid AuthContext interference
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/published/${subdomain}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Resume not found')
          } else {
            setError('Failed to load resume')
          }
          return
        }

        const data = await response.json()
        if (data.success) {
          // Check if password protected
          if (data.data.isPasswordProtected) {
            // Redirect to password page
            router.push(`/portfolio/${subdomain}/password`)
            return
          }
          
          setResumeData(data.data.resume)
          
          // Track analytics for public resumes
          trackDetailedAnalytics()
        } else {
          setError(data.message || 'Failed to load resume')
        }
      } catch (error) {
        console.error('Error fetching resume:', error)
        setError('Failed to connect to server')
      } finally {
        setLoading(false)
      }
    }

    if (subdomain) {
      fetchResumeData()
    }
  }, [subdomain, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Resume Not Found</h1>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!resumeData) {
    return null
  }

  // Get the template ID from the resume data, default to template-1
  const templateId = resumeData.templateId || 'template-1'

  return (
    <TemplateRenderer 
      templateId={templateId} 
      resumeData={resumeData} 
    />
  )
}
