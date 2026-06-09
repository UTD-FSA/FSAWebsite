'use client'

import { useState, useRef, useEffect } from 'react'
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  COVER_PHOTO_ASPECT_RATIO,
  COVER_PHOTO_MIN_WIDTH,
  COVER_PHOTO_MIN_HEIGHT,
} from '@/lib/constants'

export default function CoverPhotoCropper({
  file,
  onConfirm,
  onCancel,
}: {
  file: File | null
  onConfirm: (croppedBlob: Blob) => void
  onCancel: () => void
}) {
  const [imgSrc, setImgSrc] = useState<string>('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!file) {
      setImgSrc('')
      setCrop(undefined)
      setCompletedCrop(undefined)
      setError(null)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => setImgSrc(e.target?.result as string)
    reader.readAsDataURL(file)
    return () => reader.abort()
  }, [file])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, COVER_PHOTO_ASPECT_RATIO, width, height),
      width,
      height,
    )
    setCrop(initialCrop)
  }

  function handleConfirm() {
    if (!completedCrop || !imgRef.current) {
      setError('Please adjust the crop area before confirming.')
      return
    }
    setError(null)

    const canvas = document.createElement('canvas')
    canvas.width = COVER_PHOTO_MIN_WIDTH
    canvas.height = COVER_PHOTO_MIN_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      COVER_PHOTO_MIN_WIDTH,
      COVER_PHOTO_MIN_HEIGHT,
    )

    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob)
    }, 'image/jpeg', 0.92)
  }

  if (!file) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Crop Cover Photo</h2>
        <p className="text-sm text-gray-500 mb-4">
          Drag to reposition. Use the handles to resize the crop area.
        </p>

        {imgSrc && (
          <div className="mb-4">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={COVER_PHOTO_ASPECT_RATIO}
              keepSelection
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{ maxHeight: '60vh', width: '100%' }}
              />
            </ReactCrop>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Use This Crop
          </button>
        </div>
      </div>
    </div>
  )
}
