'use client'

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Crop as CropIcon } from 'lucide-react'
import 'react-image-crop/dist/ReactCrop.css'

interface SimpleImageCropperProps {
  src: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
}

// Helper function to create a crop centered on the image
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function SimpleImageCropper({ src, onCropComplete, onCancel }: SimpleImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1)) // 1:1 aspect ratio for profile pictures
  }, [])

  const handleCropComplete = useCallback(async () => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      canvasRef.current
    ) {
      const image = imgRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        console.error('No 2d context')
        return
      }

      // Set canvas size to 256x256 (our target size)
      const targetSize = 256
      canvas.width = targetSize
      canvas.height = targetSize

      // Calculate scale factors
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      // Calculate crop area in natural image coordinates
      const sourceX = completedCrop.x * scaleX
      const sourceY = completedCrop.y * scaleY
      const sourceWidth = completedCrop.width * scaleX
      const sourceHeight = completedCrop.height * scaleY

      // Clear canvas
      ctx.clearRect(0, 0, targetSize, targetSize)

      // Draw the cropped and resized image
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetSize,
        targetSize
      )

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Cropped image blob created:', blob.size, 'bytes')
            onCropComplete(blob)
          }
        },
        'image/jpeg',
        0.9 // High quality
      )
    }
  }, [completedCrop, onCropComplete])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CropIcon className="h-5 w-5" />
          Crop Profile Picture
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag to select the area you want to use as your profile picture. Final image will be 256x256 pixels.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Cropper */}
        <div className="flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1} // Square aspect ratio
            minWidth={50}
            minHeight={50}
            className="max-w-full"
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={src}
              style={{ 
                maxWidth: '100%',
                maxHeight: '500px',
                display: 'block'
              }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        {/* Preview Canvas (hidden) */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleCropComplete}
            disabled={!completedCrop?.width || !completedCrop?.height}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
