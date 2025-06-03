'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, User, Shield, Clock, Trash2, Camera } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { SimpleImageCropper } from '@/components/simple-image-cropper'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export default function AccountPage() {
  const { user, logout, refreshUser, apiCall } = useAuth()
  const { toast } = useToast()
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: ''
  })

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      })
      // Fetch login history
      fetchLoginHistory()
    }
  }, [user])

  // Fetch login history
  const fetchLoginHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const data = await apiCall('/auth/login-history?limit=5')
      setLoginHistory(data.data.loginHistory || [])
    } catch (error) {
      console.error('Failed to fetch login history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Load more login history
  const loadMoreHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const data = await apiCall('/auth/login-history?limit=20')
      setLoginHistory(data.data.loginHistory || [])
      setShowAllHistory(true)
    } catch (error) {
      console.error('Failed to fetch login history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [deleteForm, setDeleteForm] = useState({
    password: ''
  })
  
  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Login history state
  const [loginHistory, setLoginHistory] = useState<any[]>([])
  const [showAllHistory, setShowAllHistory] = useState(false)

  // Image cropper state
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('')
  const [profilePictureTimestamp, setProfilePictureTimestamp] = useState<number>(Date.now())



  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)

    try {
      const data = await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      })

      // Refresh user data in AuthContext
      await refreshUser()
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)

    try {
      await apiCall('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwordForm),
      })

      toast({
        title: 'Success',
        description: 'Password changed successfully',
      })

      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle avatar file selection
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB for initial upload, will be compressed to 256x256)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Only image files are allowed',
        variant: 'destructive',
      })
      return
    }

    // Create object URL for the image cropper
    const imageUrl = URL.createObjectURL(file)
    setSelectedImageSrc(imageUrl)
    setShowImageCropper(true)

    // Clear the input
    e.target.value = ''
  }

  // Handle cropped image upload
  const handleCroppedImageUpload = async (croppedImageBlob: Blob) => {
    setIsUploadingAvatar(true)
    setShowImageCropper(false)

    try {
      const formData = new FormData()
      formData.append('avatar', croppedImageBlob, 'avatar.jpg')

      const data = await apiCall('/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      // Refresh user data in AuthContext
      await refreshUser()
      
      // Update timestamp to force image refresh
      setProfilePictureTimestamp(Date.now())
      
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload profile picture',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAvatar(false)
      // Clean up object URL
      if (selectedImageSrc) {
        URL.revokeObjectURL(selectedImageSrc)
        setSelectedImageSrc('')
      }
    }
  }

  // Handle cropper cancel
  const handleCropperCancel = () => {
    setShowImageCropper(false)
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc)
      setSelectedImageSrc('')
    }
  }

  // Handle remove profile picture
  const handleRemoveProfilePicture = async () => {
    setIsUploadingAvatar(true)

    try {
      await apiCall('/auth/remove-avatar', {
        method: 'DELETE',
      })

      // Refresh user data in AuthContext
      await refreshUser()
      
      // Update timestamp to force image refresh
      setProfilePictureTimestamp(Date.now())
      
      toast({
        title: 'Success',
        description: 'Profile picture removed successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove profile picture',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)

    try {
      await apiCall('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify(deleteForm),
      })

      toast({
        title: 'Success',
        description: 'Account deleted successfully',
      })

      // Logout and redirect
      await logout()
      window.location.href = '/login'
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete account',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingAccount(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return null
  }

  return (
    <SimpleSidebar title="Account">
      <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Picture Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>
          <CardDescription>
            Upload a profile picture to personalize your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {user.profilePicture && (
                <AvatarImage 
                  src={`${user.profilePicture}?t=${profilePictureTimestamp}`} 
                  alt={user.fullName}
                  onLoad={() => console.log('Profile picture loaded:', user.profilePicture)}
                  onError={(e) => {
                    console.error('Profile picture failed to load:', user.profilePicture, e)
                    console.log('Error details:', e.currentTarget.src)
                  }}
                />
              )}
              <AvatarFallback className="text-lg">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" disabled={isUploadingAvatar} asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingAvatar ? 'Processing...' : user.profilePicture ? 'Change Picture' : 'Upload Picture'}
                    </span>
                  </Button>
                </Label>
                {user.profilePicture && (
                  <Button 
                    variant="outline" 
                    disabled={isUploadingAvatar}
                    onClick={handleRemoveProfilePicture}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileSelect}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">
                JPG, PNG or WebP. Max size 10MB. Final image will be 256x256 pixels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Change your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Login History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Login History
          </CardTitle>
          <CardDescription>
            View your recent account activity and login sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Last Login</span>
              <span className="text-muted-foreground">
                {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Account Created</span>
              <span className="text-muted-foreground">
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>

          {/* Recent Login Sessions */}
          <div className="space-y-3">
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Recent Sessions</span>
              {!showAllHistory && loginHistory.length >= 5 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadMoreHistory}
                  disabled={isLoadingHistory}
                >
                  {isLoadingHistory ? 'Loading...' : 'View All'}
                </Button>
              )}
            </div>
            
            {isLoadingHistory && loginHistory.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading login history...
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No login history available
              </div>
            ) : (
              <div className="space-y-2">
                {loginHistory.map((session, index) => (
                  <div key={session._id || index} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatDate(session.loginTime)}
                        </span>
                        {index === 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>IP: {session.ipAddress}</div>
                        {session.deviceInfo && (
                          <>
                            <div>Browser: {session.deviceInfo.browser}</div>
                            <div>OS: {session.deviceInfo.os}</div>
                            <div>Device: {session.deviceInfo.device}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deleteForm.password}
                  onChange={(e) => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={!deleteForm.password || isDeletingAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
      </div>

      {/* Image Cropper Modal */}
      {showImageCropper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <SimpleImageCropper
            src={selectedImageSrc}
            onCropComplete={handleCroppedImageUpload}
            onCancel={handleCropperCancel}
          />
        </div>
      )}
    </SimpleSidebar>
  )
}
