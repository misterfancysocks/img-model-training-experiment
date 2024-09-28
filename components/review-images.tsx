'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Ghost, RotateCw, Crop as CropIcon, Trash2, ArrowRight } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface ImageState {
  id: number
  originalUrl: string
  croppedUrl: string | null
}

export default function ReviewImages({ personId }: { personId: string }) {
  const router = useRouter()
  const [images, setImages] = useState<ImageState[]>([])
  const [cropImageId, setCropImageId] = useState<number | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const { toast } = useToast()

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/get-user-images?personId=${personId}`)
        if (!response.ok) throw new Error('Failed to fetch images')
        const data = await response.json()
        setImages(data.images as ImageState[])
        console.log('\x1b[36m Fetched images successfully \x1b[0m', data.images)
      } catch (error) {
        console.error('Error fetching images:', error)
        toast({
          title: "Error",
          description: "Failed to fetch images.",
          variant: "destructive",
        });
      }
    }
    fetchImages()
  }, [personId, toast])

  const handleRotate = async (id: number) => {
    const imageToRotate = images.find((img: ImageState) => img.id === id)
    if (imageToRotate) {
      try {
        const rotatedImage = await rotateImage(imageToRotate.originalUrl, 90)
        setImages(images.map((img: ImageState) => 
          img.id === id ? { ...img, originalUrl: rotatedImage } : img
        ))
        toast({
          title: "Success",
          description: "Image rotated successfully.",
          variant: "default",
        });
      } catch (error) {
        console.error('Error rotating image:', error)
        toast({
          title: "Error",
          description: "Failed to rotate image.",
          variant: "destructive",
        });
      }
    }
  }

  const rotateImage = (imageSrc: string, angle: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = "anonymous"
      image.src = imageSrc
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject('No canvas context')
          return
        }

        // Calculate new canvas size
        const radians = angle * (Math.PI / 180)
        const sin = Math.abs(Math.sin(radians))
        const cos = Math.abs(Math.cos(radians))
        canvas.width = image.width * cos + image.height * sin
        canvas.height = image.width * sin + image.height * cos

        // Translate and rotate
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(radians)
        ctx.drawImage(image, -image.width / 2, -image.height / 2)

        resolve(canvas.toDataURL('image/jpeg'))
      }
      image.onerror = () => reject('Failed to load image')
    })
  }

  const handleCropComplete = async (crop: Crop) => {
    if (cropImageId !== null && crop.width && crop.height) {
      const imageToCrop = images.find(img => img.id === cropImageId)
      if (imageToCrop) {
        try {
          const croppedImage = await getCroppedImg(imageToCrop.originalUrl, crop)
          
          // Prepare payload
          const payload = {
            personId: personId,
            imageId: imageToCrop.id,
            croppedImage: {
              fileName: `${imageToCrop.id}-cropped.jpg`,
              original: croppedImage,
            },
          }

          console.log('\x1b[36m Sending cropped image payload: \x1b[0m', payload)

          // Send cropped image to the server
          const uploadResponse = await fetch('/api/upload-user-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json()
            throw new Error(errorData.error || 'Failed to upload cropped image')
          }

          const result = await uploadResponse.json()
          console.log(`\x1b[36m Cropped image ${cropImageId} uploaded successfully \x1b[0m`, result)

          // Update local state with the new cropped URL
          setImages(images.map((img: ImageState) => 
            img.id === cropImageId ? { ...img, croppedUrl: result.uploadedImage.croppedUrl } : img
          ))

          toast({
            title: "Success",
            description: "Image cropped and uploaded successfully.",
            variant: "default",
          });
        } catch (error) {
          console.error('Error uploading cropped image:', error)
          toast({
            title: "Error",
            description: "Failed to upload cropped image.",
            variant: "destructive",
          });
        }
      }
    }
    setCropImageId(null)
  }

  const getCroppedImg = (imageSrc: string, crop: Crop): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = "anonymous"
      image.src = imageSrc
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject('No canvas context')
          return
        }

        // Set canvas size to the crop size
        canvas.width = crop.width
        canvas.height = crop.height

        ctx.drawImage(
          image,
          crop.x ?? 0,
          crop.y ?? 0,
          crop.width ?? 0,
          crop.height ?? 0,
          0,
          0,
          crop.width ?? 0,
          crop.height ?? 0
        )

        resolve(canvas.toDataURL('image/jpeg'))
      }
      image.onerror = () => reject('Failed to load image')
    })
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/delete-user-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: personId, imageId: id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete image')
      }

      setImages(images.filter(img => img.id !== id))
      toast({
        title: "Deleted",
        description: "Image deleted successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error('Error deleting image:', error)
      toast({
        title: "Error",
        description: "Failed to delete image.",
        variant: "destructive",
      })
    }
  }

  const handleCreateModel = async () => {
    try {
      const response = await fetch(`/api/get-user-images?personId=${personId}`)
      if (!response.ok) throw new Error('Failed to fetch images for model creation')
      const data = await response.json()
      
      const processedImages = data.images.map((img: ImageState) => ({
        id: img.id,
        url: img.croppedUrl || img.originalUrl,
      }))
      
      console.log("Creating AI model with processed images:", processedImages)
      // TODO: Send processedImages to the server or handle as needed
      router.push(`/profile/${personId}/generating-model`)
    } catch (error) {
      console.error('Error creating AI model:', error)
      toast({
        title: "Error",
        description: "Failed to create AI model.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 to-black text-orange-50">
      <main className="container mx-auto px-4 py-16">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-8 flex items-center text-orange-100"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Ghost className="mr-4 h-12 w-12" />
          Review and Edit Photos
        </motion.h1>

        <Card className="bg-black/70 backdrop-blur-md border-none shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-300">Your Uploaded Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image: ImageState) => (
                <div key={image.id} className="relative rounded-lg overflow-hidden">
                  <img
                    src={image.originalUrl}
                    alt={`Photo ${image.id}`}
                    className="w-full h-full object-cover aspect-square"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent h-24 pointer-events-none"></div>
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                    <Button
                      onClick={() => handleRotate(image.id)}
                      size="sm"
                      className="bg-orange-700 hover:bg-orange-600 text-white"
                    >
                      <RotateCw className="h-4 w-4 mr-1" />
                      Rotate
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setCropImageId(image.id)}
                          size="sm"
                          className="bg-orange-700 hover:bg-orange-600 text-white"
                        >
                          <CropIcon className="h-4 w-4 mr-1" />
                          Crop
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black/90 border-orange-500">
                        <DialogHeader>
                          <DialogTitle className="text-orange-300">Crop Image</DialogTitle>
                        </DialogHeader>
                        <ReactCrop
                          crop={crop}
                          onChange={c => setCrop(c)}
                          onComplete={handleCropComplete}
                        >
                          <img
                            src={image.croppedUrl || image.originalUrl}
                            alt={`Crop Photo ${image.id}`}
                          />
                        </ReactCrop>
                      </DialogContent>
                    </Dialog>
                    <Button
                      onClick={() => handleDelete(image.id)}
                      size="sm"
                      className="bg-red-700 hover:bg-red-600 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-orange-200 text-sm max-w-md mx-auto">
            Next, we'll process your photos and create a personalized AI model for generating your Halloween costumes.
          </p>
          <Button 
            onClick={handleCreateModel}
            className="bg-orange-600 hover:bg-orange-500 text-orange-100 text-lg px-8 py-3"
          >
            Create Your AI Model <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </main>
    </div>
  )
}