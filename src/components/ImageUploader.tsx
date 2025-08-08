'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface ImageUploaderProps {
  tourId: string
  onUploadComplete?: () => void
}

interface ImagePreview {
  file: File
  url: string
  id: string
}

export default function ImageUploader({ tourId, onUploadComplete }: ImageUploaderProps) {
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: ImagePreview[] = []
    const maxFiles = 10 // Limit number of files

    if (selectedImages.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images per tour`)
      return
    }

    Array.from(files).forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Images must be smaller than 5MB')
        return
      }

      const id = crypto.randomUUID()
      const url = URL.createObjectURL(file)
      newImages.push({ file, url, id })
    })

    setSelectedImages(prev => [...prev, ...newImages])
    setError(null)
  }

  const removeImage = (imageId: string) => {
    setSelectedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }

  const uploadImages = async () => {
    if (selectedImages.length === 0) {
      setError('Please select at least one image to upload')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccessMessage(null)
    setUploadProgress({})

    const uploadedImages: { imageUrl: string; altText: string }[] = []

    try {
      for (const imagePreview of selectedImages) {
        const { file, id } = imagePreview
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${tourId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        // Update progress
        setUploadProgress(prev => ({ ...prev, [id]: 0 }))

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('tour-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }

        // Update progress
        setUploadProgress(prev => ({ ...prev, [id]: 50 }))

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('tour-images')
          .getPublicUrl(uploadData.path)

        // Update progress
        setUploadProgress(prev => ({ ...prev, [id]: 75 }))

        // Insert record into tour_images table
        const { error: dbError } = await supabase
          .from('tour_images')
          .insert({
            tour_id: tourId,
            image_url: urlData.publicUrl,
            alt_text: file.name.split('.')[0] // Use filename without extension as alt text
          })

        if (dbError) {
          // If database insert fails, try to clean up the uploaded file
          await supabase.storage.from('tour-images').remove([uploadData.path])
          throw new Error(`Failed to save image record: ${dbError.message}`)
        }

        uploadedImages.push({
          imageUrl: urlData.publicUrl,
          altText: file.name.split('.')[0]
        })

        // Complete progress for this image
        setUploadProgress(prev => ({ ...prev, [id]: 100 }))
      }

      setSuccessMessage(`Successfully uploaded ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}!`)
      
      // Clear selected images
      selectedImages.forEach(img => URL.revokeObjectURL(img.url))
      setSelectedImages([])
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Call callback if provided
      onUploadComplete?.()

    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred during upload')
    } finally {
      setIsUploading(false)
      setUploadProgress({})
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Tour Images
        </label>
        
        {/* File Input */}
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            disabled={isUploading}
          />
        </div>
        
        <p className="mt-1 text-xs text-gray-500">
          Select up to 10 images (max 5MB each). Supported formats: JPG, PNG, GIF, WebP
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Previews */}
      {selectedImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Selected Images ({selectedImages.length}/10)</h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {selectedImages.map((imagePreview) => {
              const progress = uploadProgress[imagePreview.id] || 0
              return (
                <div key={imagePreview.id} className="relative group">
                  <div className="relative w-full overflow-hidden rounded-lg bg-gray-200" style={{ paddingTop: '100%' }}>
                    <Image
                      src={imagePreview.url}
                      alt={imagePreview.file.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover object-center group-hover:opacity-75"
                    />
                  </div>
                  
                  {/* Upload Progress */}
                  {isUploading && progress > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <div className="text-white text-xs font-medium">
                        {progress === 100 ? '✓' : `${progress}%`}
                      </div>
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  {!isUploading && (
                    <button
                      onClick={() => removeImage(imagePreview.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      ×
                    </button>
                  )}
                  
                  <p className="mt-1 text-xs text-gray-500 truncate" title={imagePreview.file.name}>
                    {imagePreview.file.name}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedImages.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={uploadImages}
            disabled={isUploading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              `Upload ${selectedImages.length} Image${selectedImages.length > 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}
    </div>
  )
}