"use client"

import { Calendar, Home, Inbox, Search, Settings, User, FileText, BarChart3, HelpCircle, LogOut, DollarSign, Zap } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

// Menu items for the main navigation
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
    title: "AI Insights",
    url: "/ai-insights",
    icon: BarChart3,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: Inbox,
  },
  {
    title: "Account",
    url: "/account",
    icon: User,
  },
]

// Secondary menu items
const secondaryItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Help & Support",
    url: "/help",
    icon: HelpCircle,
  },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
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
        const token = localStorage.getItem('token')
        if (!token) {
          console.log('No token found')
          setLoading(false)
          return
        }

        console.log('Fetching usage stats...')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
        const response = await fetch(`${apiUrl}/ai/usage-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Usage stats data:', data)
          setUsageStats(data.data)
        } else {
          const errorData = await response.text()
          console.error('Failed to fetch usage stats:', response.status, errorData)
        }
      } catch (error) {
        console.error('Error fetching usage stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageStats()
  }, [user])

  const handleShowBilling = () => {
    router.push('/billing')
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

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Resumint</span>
            <span className="text-xs text-muted-foreground">AI Resume Builder</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator />
        
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{user?.firstName || 'User'}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </div>
          </SidebarMenuItem>
          
          {/* Usage Statistics - Always show */}
          <SidebarMenuItem>
            <div className="px-2 py-2 space-y-2">
              {loading ? (
                <div className="text-xs text-muted-foreground text-center py-2">
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
                </>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs h-7"
                onClick={handleShowBilling}
              >
                Show Billing
              </Button>
            </div>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
