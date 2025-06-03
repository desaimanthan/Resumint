'use client'

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X } from 'lucide-react'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropperProps {
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
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropper({ src, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1)) // 1:1 aspect ratio for profile pictures
  }, [])

  const handleCropComplete = useCallback(async () => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      // Create canvas for cropping
      const image = imgRef.current
      const canvas = previewCanvasRef.current
      const crop = completedCrop

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('No 2d context')
      }

      // Set canvas size to 256x256 (our target size)
      const targetSize = 256
      canvas.width = targetSize
      canvas.height = targetSize

      // Calculate the crop area in natural image coordinates
      const cropX = crop.x * scaleX
      const cropY = crop.y * scaleY
      const cropWidth = crop.width * scaleX
      const cropHeight = crop.height * scaleY

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply transformations
      ctx.save()

      // Move to center for rotation
      ctx.translate(targetSize / 2, targetSize / 2)
      ctx.rotate((rotate * Math.PI) / 180)
      ctx.scale(scale, scale)
      ctx.translate(-targetSize / 2, -targetSize / 2)

      // Draw the cropped image scaled to 256x256
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetSize,
        targetSize
      )

      ctx.restore()

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob)
          }
        },
        'image/jpeg',
        0.9 // High quality
      )
    }
  }, [completedCrop, scale, rotate, onCropComplete])

  const resetTransforms = () => {
    setScale(1)
    setRotate(0)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ZoomIn className="h-5 w-5" />
          Crop Profile Picture
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Adjust your image with zoom, rotation, and cropping. Final image will be 256x256 pixels.
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
                transform: `scale(${scale}) rotate(${rotate}deg)`,
                maxWidth: '100%',
                maxHeight: '400px'
              }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Zoom Control */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              Zoom: {Math.round(scale * 100)}%
            </Label>
            <Slider
              value={[scale]}
              onValueChange={(value: number[]) => setScale(value[0])}
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Rotation: {rotate}°
            </Label>
            <Slider
              value={[rotate]}
              onValueChange={(value: number[]) => setRotate(value[0])}
              min={-180}
              max={180}
              step={1}
              className="w-full"
            />
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={resetTransforms}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Zoom & Rotation
          </Button>
        </div>

        {/* Preview Canvas (hidden) */}
        <canvas
          ref={previewCanvasRef}
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
