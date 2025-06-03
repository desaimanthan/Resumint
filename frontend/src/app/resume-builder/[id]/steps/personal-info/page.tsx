'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { ResumeProvider, useResume } from '@/contexts/ResumeContext'
import { ResumeNavigation } from '@/components/resume-navigation'
import { User, MapPin, Phone, Mail, Globe, Github, Linkedin, Camera, ArrowRight, Save, MapPin as LocationIcon, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SimpleImageCropper } from '@/components/simple-image-cropper'
import { useGeolocation } from '@/hooks/use-geolocation'

function PersonalInfoForm() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const {
    resumeData,
    isLoading,
    isDirty,
    lastSaved,
    loadResume,
    updatePersonalInfo,
    saveResume
  } = useResume()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    linkedin: '',
    website: '',
    github: '',
    profilePhoto: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('')
  const [locationPrefilled, setLocationPrefilled] = useState(false)
  
  // Get user's location for auto-prefill
  const { location: detectedLocation, isLoading: isLoadingLocation, error: locationError } = useGeolocation()

  // Load resume data
  useEffect(() => {
    if (id && typeof id === 'string' && !resumeData) {
      loadResume(id)
    }
  }, [id, loadResume, resumeData])

  // Update form when resume data loads
  useEffect(() => {
    if (resumeData?.personalInfo) {
      const { personalInfo } = resumeData
      const location = typeof personalInfo.location === 'object' ? personalInfo.location : { city: '', state: '', country: '' }
      setFormData({
        firstName: personalInfo.firstName || '',
        lastName: personalInfo.lastName || '',
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        city: location.city || '',
        state: location.state || '',
        country: location.country || '',
        linkedin: personalInfo.linkedin || '',
        website: personalInfo.website || '',
        github: personalInfo.github || '',
        profilePhoto: personalInfo.profilePhoto || ''
      })
    }
  }, [resumeData])

  // Auto-prefill location when detected and form is empty
  useEffect(() => {
    if (detectedLocation && !locationPrefilled && resumeData) {
      const location = typeof resumeData.personalInfo.location === 'object' ? resumeData.personalInfo.location : { city: '', state: '', country: '' }
      if (!location.city && !location.state && !location.country) {
      
      const newLocationData = {
        city: detectedLocation.city,
        state: detectedLocation.state,
        country: detectedLocation.country
      }
      
      setFormData(prev => ({
        ...prev,
        city: detectedLocation.city,
        state: detectedLocation.state,
        country: detectedLocation.country
      }))
      
      // Update resume context
      updatePersonalInfo({
        location: newLocationData
      })
      
        setLocationPrefilled(true)
        
        // Show a toast notification
        toast({
          title: 'Location detected',
          description: `We've prefilled your location as ${detectedLocation.city}, ${detectedLocation.state}, ${detectedLocation.country}. You can edit this if needed.`,
        })
      }
    }
  }, [detectedLocation, locationPrefilled, resumeData, updatePersonalInfo, toast])

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Update resume context
    if (field === 'city' || field === 'state' || field === 'country') {
      const currentLocation = typeof resumeData?.personalInfo.location === 'object' 
        ? resumeData.personalInfo.location 
        : { city: '', state: '', country: '' }
      updatePersonalInfo({
        location: {
          city: currentLocation.city || '',
          state: currentLocation.state || '',
          country: currentLocation.country || '',
          [field]: value
        }
      })
    } else {
      updatePersonalInfo({ [field]: value })
    }
  }

  // Handle profile photo upload
  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB)
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

  // Handle cropped image
  const handleCroppedImage = (croppedImageBlob: Blob) => {
    // Convert blob to base64 for storage (in a real app, you'd upload to a server)
    const reader = new FileReader()
    reader.onload = () => {
      const base64String = reader.result as string
      setFormData(prev => ({ ...prev, profilePhoto: base64String }))
      updatePersonalInfo({ profilePhoto: base64String })
    }
    reader.readAsDataURL(croppedImageBlob)
    
    setShowImageCropper(false)
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc)
      setSelectedImageSrc('')
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

  // Remove profile photo
  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, profilePhoto: '' }))
    updatePersonalInfo({ profilePhoto: '' })
  }

  // Save and continue
  const handleSaveAndContinue = async () => {
    setIsSaving(true)
    try {
      await saveResume()
      router.push(`/resume-builder/${id}/steps/work-history`)
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
            <h1 className="text-xl font-bold">Personal Information</h1>
            <p className="text-muted-foreground">
              Let's start with your basic contact information and professional links.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Step 1 of 9
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
            <ResumeNavigation currentStep="personal-info" />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Photo Section */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Photo
            </CardTitle>
            <CardDescription>
              Add a professional headshot to make your resume stand out (optional).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {formData.profilePhoto && (
                  <AvatarImage src={formData.profilePhoto} alt="Profile" />
                )}
                <AvatarFallback className="text-lg">
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        {formData.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                      </span>
                    </Button>
                  </Label>
                  {formData.profilePhoto && (
                    <Button 
                      variant="outline" 
                      onClick={handleRemovePhoto}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileSelect}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or WebP. Max size 10MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Your name and primary contact details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
              {isLoadingLocation && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>
                  <span className="text-xs">Detecting...</span>
                </div>
              )}
              {locationPrefilled && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <LocationIcon className="h-3 w-3" />
                  <span className="text-xs">Auto-filled</span>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Where are you based? This helps employers understand your location.
              {detectedLocation && !locationPrefilled && (
                <span className="text-green-600"> We've detected your location and can auto-fill this for you.</span>
              )}
              {locationError && (
                <span className="text-amber-600"> Location detection failed, please enter manually.</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  placeholder="NY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  placeholder="United States"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Professional Links
            </CardTitle>
            <CardDescription>
              Add links to your professional profiles and portfolio (optional).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedIn">LinkedIn Profile</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="linkedIn"
                  value={formData.linkedin}
                  onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/johndoe"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="portfolio"
                  value={formData.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  placeholder="https://johndoe.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github">GitHub Profile</Label>
              <div className="relative">
                <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="github"
                  value={formData.github}
                  onChange={(e) => handleFieldChange('github', e.target.value)}
                  placeholder="https://github.com/johndoe"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>

          <Button
            onClick={handleSaveAndContinue}
            disabled={isSaving || !formData.firstName || !formData.lastName || !formData.email}
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showImageCropper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <SimpleImageCropper
            src={selectedImageSrc}
            onCropComplete={handleCroppedImage}
            onCancel={handleCropperCancel}
          />
        </div>
      )}
    </SimpleSidebar>
  )
}

export default function PersonalInfoPage() {
  return (
    <ResumeProvider>
      <PersonalInfoForm />
    </ResumeProvider>
  )
}
