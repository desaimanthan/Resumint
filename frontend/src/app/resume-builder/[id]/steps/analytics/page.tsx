'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeNavigation } from '@/components/resume-navigation'
import { ResumeProvider, useResume } from '@/contexts/ResumeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { 
  BarChart3,
  Users,
  Eye,
  Globe,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  ArrowLeft,
  TrendingUp,
  MapPin,
  Calendar,
  Activity,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'

interface AnalyticsData {
  summary: {
    totalViews: number
    uniqueVisitors: number
    avgSessionDuration: number
    topCountries: string[]
    deviceTypes: string[]
    referrers: string[]
  }
  dailyAnalytics: Array<{
    date: string
    views: number
    uniqueVisitors: number
  }>
  geographicData: Array<{
    country: string
    countryCode: string
    visitors: number
    views: number
  }>
  dateRange: number
}

function AnalyticsForm() {
  const { id } = useParams()
  const router = useRouter()
  const { resumeData, isLoading, loadResume } = useResume()
  const { apiCall } = useAuth()
  const { toast } = useToast()

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState(30)
  const [publicationData, setPublicationData] = useState<any>(null)

  // Fetch analytics data
  const fetchAnalytics = async (days = 30) => {
    try {
      setRefreshing(true)
      
      // Try to get detailed analytics first
      const detailedResponse = await apiCall(`/resumes/${id}/publication-analytics?days=${days}`)
      
      if (detailedResponse.success) {
        // Use detailed analytics if available
        setAnalyticsData({
          ...detailedResponse.data,
          dateRange: days
        })
      } else {
        // Fall back to simple analytics from publication status
        console.log('Detailed analytics not available, using simple analytics')
        const publicationResponse = await apiCall(`/resumes/${id}/publication-status`)
        
        if (publicationResponse.success && publicationResponse.data.publication?.analytics) {
          const simpleAnalytics = publicationResponse.data.publication.analytics
          setAnalyticsData({
            summary: {
              totalViews: simpleAnalytics.totalViews || 0,
              uniqueVisitors: simpleAnalytics.uniqueVisitors || 0,
              avgSessionDuration: 0,
              topCountries: [],
              deviceTypes: [],
              referrers: []
            },
            dailyAnalytics: [],
            geographicData: [],
            dateRange: days
          })
        } else {
          // No analytics data available
          setAnalyticsData({
            summary: {
              totalViews: 0,
              uniqueVisitors: 0,
              avgSessionDuration: 0,
              topCountries: [],
              deviceTypes: [],
              referrers: []
            },
            dailyAnalytics: [],
            geographicData: [],
            dateRange: days
          })
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch publication status
  const fetchPublicationStatus = async () => {
    try {
      const data = await apiCall(`/resumes/${id}/publication-status`)
      if (data.success) {
        setPublicationData(data.data.publication)
      }
    } catch (error) {
      console.error('Error fetching publication status:', error)
    }
  }

  useEffect(() => {
    if (id && typeof id === 'string') {
      // Load resume data first if not already loaded
      if (!resumeData) {
        loadResume(id)
      }
      fetchPublicationStatus()
      fetchAnalytics(dateRange)
    }
  }, [id, resumeData, loadResume])



  // Handle date range change
  const handleDateRangeChange = (days: number) => {
    setDateRange(days)
    fetchAnalytics(days)
  }

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`
    } else {
      return `${Math.round(seconds / 3600)}h`
    }
  }

  // Get device icon
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      case 'desktop':
        return <Monitor className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  // Count device types
  const getDeviceStats = () => {
    if (!analyticsData?.summary.deviceTypes || analyticsData.summary.deviceTypes.length === 0) return []
    
    const deviceCounts = analyticsData.summary.deviceTypes.reduce((acc: any, device: string) => {
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {})

    return Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      count: count as number,
      percentage: Math.round(((count as number) / analyticsData.summary.deviceTypes.length) * 100)
    }))
  }

  // Get top countries
  const getTopCountries = () => {
    if (!analyticsData?.geographicData || analyticsData.geographicData.length === 0) return []
    return analyticsData.geographicData.slice(0, 5)
  }

  // Prepare chart data
  const getChartData = () => {
    if (!analyticsData?.dailyAnalytics || analyticsData.dailyAnalytics.length === 0) return []
    
    return analyticsData.dailyAnalytics.slice(-7).map(day => ({
      ...day,
      date: new Date(day.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }))
  }

  // Go back to resume builder
  const handleGoBack = () => {
    router.push('/resume-builder')
  }

  const isPublished = publicationData?.isPublished
  
  // Generate the correct published URL based on environment
  const getPublishedUrl = () => {
    if (!isPublished || !publicationData?.subdomain) return null
    
    // Check if we're in development or production
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    
    if (isLocalhost) {
      // In development, use localhost with port
      return `${publicationData.subdomain}.localhost:8080`
    } else {
      // In production, use the proper domain without www
      const baseDomain = hostname.replace(/^www\./, '') // Remove www. if present
      return `${publicationData.subdomain}.${baseDomain}`
    }
  }
  
  const publishedUrl = getPublishedUrl()

  if (loading) {
    return (
      <SimpleSidebar title={`Resume Analytics${resumeData?.title ? ` - ${resumeData.title}` : ''}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SimpleSidebar>
    )
  }

  return (
    <SimpleSidebar title={`Resume Analytics${resumeData?.title ? ` - ${resumeData.title}` : ''}`}>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="mb-4">
              <div
                onClick={handleGoBack}
                className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors inline-block"
              >
                <ArrowLeft className="h-6 w-6" />
              </div>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Resume Analytics
            </h1>
            <p className="text-muted-foreground">
              Detailed insights about your resume's performance and visitor engagement
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnalytics(dateRange)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {isPublished && publishedUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`http://${publishedUrl}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live
              </Button>
            )}
          </div>
        </div>

        {/* Publication Status Alert */}
        {!isPublished && (
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Your resume is not published yet. Analytics will be available once you publish your resume.{' '}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => router.push(`/resume-builder/${id}/steps/publish`)}
              >
                Publish now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Date Range Selector */}
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={dateRange === days ? "default" : "outline"}
              size="sm"
              onClick={() => handleDateRangeChange(days)}
            >
              Last {days} days
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Panel */}
          <div className="lg:col-span-1">
            <ResumeNavigation currentStep="analytics" />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {analyticsData && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                          <p className="text-2xl font-bold">{formatNumber(analyticsData.summary.totalViews)}</p>
                        </div>
                        <Eye className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                          <p className="text-2xl font-bold">{formatNumber(analyticsData.summary.uniqueVisitors)}</p>
                        </div>
                        <Users className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg. Session</p>
                          <p className="text-2xl font-bold">{formatDuration(analyticsData.summary.avgSessionDuration)}</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Countries</p>
                          <p className="text-2xl font-bold">{analyticsData.geographicData.length}</p>
                        </div>
                        <Globe className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Analytics Status */}
                {analyticsData.summary.totalViews === 0 && isPublished && (
                  <Alert>
                    <BarChart3 className="h-4 w-4" />
                    <AlertDescription>
                      No analytics data available yet. Visit your published resume to start collecting analytics data.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Daily Analytics Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Daily Analytics
                    </CardTitle>
                    <CardDescription>
                      Views and unique visitors over the last 7 days with trend analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getChartData().length > 0 ? (
                      <div className="space-y-6">
                        {/* Chart */}
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={getChartData()}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickLine={{ stroke: '#e5e7eb' }}
                              />
                              <YAxis 
                                tick={{ fontSize: 12 }}
                                tickLine={{ stroke: '#e5e7eb' }}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                labelStyle={{ color: '#374151', fontWeight: 'medium' }}
                              />
                              <Bar 
                                dataKey="views" 
                                fill="#3b82f6" 
                                name="Views"
                                radius={[4, 4, 0, 0]}
                                opacity={0.8}
                              />
                              <Bar 
                                dataKey="uniqueVisitors" 
                                fill="#10b981" 
                                name="Unique Visitors"
                                radius={[4, 4, 0, 0]}
                                opacity={0.8}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Legend */}
                        <div className="flex justify-center gap-6">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span className="text-sm text-muted-foreground">Views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span className="text-sm text-muted-foreground">Unique Visitors</span>
                          </div>
                        </div>
                        
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              {getChartData().reduce((sum, day) => sum + day.views, 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Views (7 days)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              {getChartData().reduce((sum, day) => sum + day.uniqueVisitors, 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Visitors (7 days)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">
                              {Math.round(getChartData().reduce((sum, day) => sum + day.views, 0) / 7)}
                            </div>
                            <div className="text-xs text-muted-foreground">Avg. Daily Views</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No daily data available yet. Visit your published resume to start collecting detailed analytics.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Geographic Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Top Countries
                      </CardTitle>
                      <CardDescription>
                        Where your visitors are coming from
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {getTopCountries().length > 0 ? (
                        <div className="space-y-3">
                          {getTopCountries().map((country, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                  {country.countryCode ? 
                                    String.fromCodePoint(...country.countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0))) 
                                    : '🌍'
                                  }
                                </span>
                                <span className="font-medium">{country.country || 'Unknown'}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{country.visitors}</div>
                                <div className="text-xs text-muted-foreground">visitors</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No geographic data available yet. Visit your published resume to start collecting location data.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Device Types */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Device Types
                      </CardTitle>
                      <CardDescription>
                        How visitors access your resume
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {getDeviceStats().length > 0 ? (
                        <div className="space-y-3">
                          {getDeviceStats().map((device, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getDeviceIcon(device.device)}
                                <span className="font-medium capitalize">{device.device}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{device.count}</span>
                                <Badge variant="secondary">{device.percentage}%</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No device data available yet. Visit your published resume to start collecting device analytics.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Referrers */}
                {analyticsData.summary.referrers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        Traffic Sources
                      </CardTitle>
                      <CardDescription>
                        Where your visitors are coming from
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analyticsData.summary.referrers
                          .filter(ref => ref && ref !== '')
                          .slice(0, 10)
                          .map((referrer, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{referrer}</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </SimpleSidebar>
  )
}

export default function AnalyticsPage() {
  return (
    <ResumeProvider>
      <AnalyticsForm />
    </ResumeProvider>
  )
}
