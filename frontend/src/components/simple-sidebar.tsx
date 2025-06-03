"use client"

import { Calendar, Home, Inbox, Search, Settings, User, FileText, BarChart3, HelpCircle, LogOut, Menu, PanelLeft, DollarSign, Zap, Mail, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

// All menu items in a single list
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Resume Builder",
    url: "/resume-builder",
    icon: FileText,
  },
  {
    title: "Cover Letter",
    url: "/cover-letter",
    icon: Mail,
  },
  {
    title: "Mock Interview",
    url: "/mock-interview",
    icon: MessageSquare,
  },
  {
    title: "Account",
    url: "/account",
    icon: Settings,
  },
  {
    title: "Help & Support",
    url: "/help",
    icon: HelpCircle,
  },
]

interface SimpleSidebarProps {
  children: React.ReactNode
  title?: string
}

export function SimpleSidebar({ children, title }: SimpleSidebarProps) {
  const { user, logout, apiCall } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showCollapsedLayout, setShowCollapsedLayout] = useState(false)
  const [usageStats, setUsageStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch usage statistics
  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        console.log('Fetching usage stats...')
        const data = await apiCall('/ai/usage-stats')
        console.log('Usage stats data:', data)
        setUsageStats(data.data)
      } catch (error) {
        console.error('Error fetching usage stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageStats()
  }, [user, apiCall])

  // Handle the delayed layout change for smooth animation
  const handleCollapseToggle = () => {
    if (isCollapsed) {
      // Expanding: show expanded layout immediately, then change state
      setShowCollapsedLayout(false)
      setIsCollapsed(false)
    } else {
      // Collapsing: change state first, then show collapsed layout after animation
      setIsCollapsed(true)
      setTimeout(() => {
        setShowCollapsedLayout(true)
      }, 300) // Wait for sidebar width animation to complete
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      })
      router.push('/login')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      })
    }
  }

  const handleShowBilling = () => {
    router.push('/billing')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'} ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center border-b transition-all h-16 ${
            isCollapsed ? 'md:justify-center md:px-2' : 'justify-start px-4'
          } ${isOpen ? 'justify-start px-4' : 'justify-center px-2'}`}>
            <div className={`flex items-center gap-2 ${isOpen ? 'block' : 'hidden'} ${isCollapsed ? 'md:hidden' : 'md:block'}`}>
              <Image
                src="/resumint_logo.png"
                alt="Resumint Logo"
                width={120}
                height={40}
                priority
                className="h-auto"
              />
            </div>
            {/* Show a small icon when collapsed */}
            <div className={`${isOpen ? 'hidden' : 'block'} ${isCollapsed ? 'md:block' : 'md:hidden'}`}>
              <Image
                src="/logo_icon.png"
                alt="Resumint Icon"
                width={32}
                height={32}
                priority
                className="h-8 w-8"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'md:p-2' : 'p-4'} ${isOpen ? 'p-4' : 'p-2'}`}>
            <nav className="space-y-1">
              {items.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  className={`flex items-center gap-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors px-3 py-2 ${
                    showCollapsedLayout ? 'md:justify-center' : 'justify-start'
                  } ${isOpen ? 'justify-start' : 'justify-center'}`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className={`whitespace-nowrap ${isOpen ? 'block' : 'hidden'} ${showCollapsedLayout ? 'md:hidden' : 'md:block'}`}>{item.title}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className={`border-t ${isCollapsed ? 'md:p-2' : 'p-4'} ${isOpen ? 'p-4' : 'p-2'}`}>
            {/* User Info */}
            <div className={`flex items-center gap-3 ${isCollapsed ? 'md:mb-2' : 'mb-3'} ${isOpen ? 'block mb-3' : 'hidden mb-2'} ${isCollapsed ? 'md:hidden' : 'md:block'}`}>
              <Avatar className="h-8 w-8">
                {user?.profilePicture && (
                  <AvatarImage 
                    src={user.profilePicture} 
                    alt={user?.firstName || 'User'}
                  />
                )}
                <AvatarFallback className="text-xs">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{user?.firstName || 'User'}</span>
                <span className="text-xs text-gray-500 truncate">{user?.email}</span>
              </div>
            </div>
            
            {/* Usage Statistics - Always show when expanded */}
            <div className={`${isOpen ? 'block mb-3' : 'hidden mb-2'} ${isCollapsed ? 'md:hidden' : 'md:block'} space-y-2`}>
              {loading ? (
                <div className="text-xs text-gray-500 text-center py-2">
                  Loading usage...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>Tokens Used</span>
                    </div>
                    <span className="font-medium">
                      {usageStats?.totalUsage?.totalTokensUsed?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>Total Cost</span>
                    </div>
                    <span className="font-medium">
                      ${usageStats?.totalUsage?.totalCostUSD?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-7"
                    onClick={handleShowBilling}
                  >
                    Show Billing
                  </Button>
                </>
              )}
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className={`w-full transition-all ${
                showCollapsedLayout ? 'md:justify-center' : 'justify-start'
              } ${isOpen ? 'justify-start' : 'justify-center'}`}
            >
              <LogOut className="h-4 w-4" />
              <span className={`ml-2 whitespace-nowrap ${isOpen ? 'block' : 'hidden'} ${showCollapsedLayout ? 'md:hidden' : 'md:block'}`}>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b px-4 h-16 flex items-center">
          <div className="flex items-center gap-4 w-full">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={handleCollapseToggle}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">{title || 'Dashboard'}</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
