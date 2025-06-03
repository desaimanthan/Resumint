'use client'

import { useState, useEffect } from 'react'

interface LocationData {
  city: string
  state: string
  country: string
  countryCode: string
  latitude?: number
  longitude?: number
}

interface GeolocationResult {
  location: LocationData | null
  isLoading: boolean
  error: string | null
}

// Default fallback location data
const DEFAULT_LOCATION: LocationData = {
  city: '',
  state: '',
  country: '',
  countryCode: '',
}

export function useGeolocation(): GeolocationResult {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const getLocationFromIP = async () => {
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch location data`)
        }

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.reason || 'Location service error')
        }

        if (isMounted) {
          setLocation({
            city: data.city || '',
            state: data.region || '',
            country: data.country_name || '',
            countryCode: data.country_code || '',
            latitude: data.latitude,
            longitude: data.longitude
          })
          setError(null)
        }
      } catch (err) {
        if (!isMounted) return
        
        console.warn('IP geolocation failed:', err)
        
        // Try browser geolocation as fallback
        tryBrowserGeolocation()
      }
    }

    const tryBrowserGeolocation = () => {
      if (!navigator.geolocation) {
        handleFinalFallback('Geolocation not supported')
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isMounted) return
          
          try {
            const { latitude, longitude } = position.coords
            
            // Try reverse geocoding with timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)
            
            const reverseResponse = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
              { signal: controller.signal }
            )
            
            clearTimeout(timeoutId)
            
            if (reverseResponse.ok) {
              const reverseData = await reverseResponse.json()
              
              if (isMounted) {
                setLocation({
                  city: reverseData.city || reverseData.locality || '',
                  state: reverseData.principalSubdivision || '',
                  country: reverseData.countryName || '',
                  countryCode: reverseData.countryCode || '',
                  latitude,
                  longitude
                })
                setError(null)
              }
            } else {
              // Use coordinates without address details
              if (isMounted) {
                setLocation({
                  ...DEFAULT_LOCATION,
                  latitude,
                  longitude
                })
                setError(null)
              }
            }
          } catch (reverseErr) {
            console.warn('Reverse geocoding failed:', reverseErr)
            
            // Still provide coordinates even if reverse geocoding fails
            if (isMounted) {
              setLocation({
                ...DEFAULT_LOCATION,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              })
              setError(null)
            }
          } finally {
            if (isMounted) {
              setIsLoading(false)
            }
          }
        },
        (geoError) => {
          if (!isMounted) return
          
          console.warn('Browser geolocation failed:', geoError)
          
          let errorMessage = 'Location access failed'
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMessage = 'Location access denied'
              break
            case geoError.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable'
              break
            case geoError.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          
          handleFinalFallback(errorMessage)
        },
        {
          timeout: 8000,
          enableHighAccuracy: false,
          maximumAge: 300000 // 5 minutes
        }
      )
    }

    const handleFinalFallback = (errorMessage: string) => {
      if (!isMounted) return
      
      // Provide default empty location instead of failing completely
      setLocation(DEFAULT_LOCATION)
      setError(errorMessage)
      setIsLoading(false)
    }

    // Start the location detection process
    getLocationFromIP()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  return { location, isLoading, error }
}

// Alternative hook using browser's geolocation API first
export function useBrowserGeolocation(): GeolocationResult {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const getBrowserLocation = () => {
      if (!navigator.geolocation) {
        if (isMounted) {
          setLocation(DEFAULT_LOCATION)
          setError('Geolocation not supported')
          setIsLoading(false)
        }
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isMounted) return
          
          try {
            const { latitude, longitude } = position.coords
            
            // Try reverse geocoding with timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)
            
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
              { signal: controller.signal }
            )
            
            clearTimeout(timeoutId)
            
            if (response.ok) {
              const data = await response.json()
              
              if (isMounted) {
                setLocation({
                  city: data.city || data.locality || '',
                  state: data.principalSubdivision || '',
                  country: data.countryName || '',
                  countryCode: data.countryCode || '',
                  latitude,
                  longitude
                })
                setError(null)
              }
            } else {
              // Provide coordinates even if reverse geocoding fails
              if (isMounted) {
                setLocation({
                  ...DEFAULT_LOCATION,
                  latitude,
                  longitude
                })
                setError(null)
              }
            }
          } catch (err) {
            console.warn('Reverse geocoding failed:', err)
            
            // Still provide coordinates even if reverse geocoding fails
            if (isMounted) {
              setLocation({
                ...DEFAULT_LOCATION,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              })
              setError(null)
            }
          } finally {
            if (isMounted) {
              setIsLoading(false)
            }
          }
        },
        (geoError) => {
          if (!isMounted) return
          
          console.warn('Browser geolocation failed:', geoError)
          
          let errorMessage = 'Location access failed'
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMessage = 'Location access denied'
              break
            case geoError.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable'
              break
            case geoError.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          
          // Provide default location even on error
          setLocation(DEFAULT_LOCATION)
          setError(errorMessage)
          setIsLoading(false)
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000 // 5 minutes
        }
      )
    }

    getBrowserLocation()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  return { location, isLoading, error }
}
