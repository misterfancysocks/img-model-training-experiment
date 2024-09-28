'use client'

import { useState, useEffect, useCallback } from 'react'
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
  uuid: string
  sanitizedFileName: string
  originalGcsObjectUrl: string
  modifiedGcsObjectUrl: string | null
  signedOriginalUrl: string
  signedModifiedUrl: string | null
  localModifications: {
    rotation: number
    crop: Crop | null
  }
}

export default function ReviewImages({ personId }: { personId: string | null }) {
  const router = useRouter()
  const [images, setImages] = useState<ImageState[]>([])
  const [cropImageId, setCropImageId] = useState<number | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const { toast } = useToast()

  const fetchImages = useCallback(async () => {
    if (!personId) {
      console.error('No personId provided to ReviewImages component');
      return;
    }

    try {
      const response = await fetch(`/api/get-user-images?personId=${personId}`)
      if (!response.ok) throw new Error('Failed to fetch images')
      const data = await response.json()
      setImages(data.images.map((img: any) => ({
        ...img,
        localModifications: { rotation: 0, crop: null }
      })))
      console.log('\x1b[36m Fetched images successfully \x1b[0m', data.images)
    } catch (error) {
      console.error('Error fetching images:', error)
      toast({
        title: "Error",
        description: "Failed to fetch images.",
        variant: "destructive",
      });
    }
  }, [personId, toast])

  useEffect(() => {
    if (personId) {
      fetchImages()
    }
  }, [fetchImages, personId])

  const handleRotate = useCallback((id: number) => {
    setImages(prevImages => prevImages.map(img => {
      if (img.id === id) {
        const newRotation = (img.localModifications.rotation + 90) % 360;
        console.log(`Rotating image ${id} to ${newRotation} degrees`);
        return { ...img, localModifications: { ...img.localModifications, rotation: newRotation } };
      }
      return img;
    }));
  }, []);

  const handleCropComplete = useCallback((crop: Crop) => {
    if (cropImageId !== null) {
      console.log(`Applying crop to image ${cropImageId}:`, crop);
      setImages(prevImages => prevImages.map(img => 
        img.id === cropImageId
          ? { ...img, localModifications: { ...img.localModifications, crop } }
          : img
      ));
    }
    setCropImageId(null);
  }, [cropImageId]);

  const handleCropReset = useCallback((id: number) => {
    setImages(prevImages => prevImages.map(img => 
      img.id === id
        ? { ...img, localModifications: { ...img.localModifications, crop: null } }
        : img
    ))
    setCrop(undefined)
  }, [])

  const handleDelete = useCallback((id: number) => {
    console.log(`Marking image ${id} for deletion`);
    setImages(prevImages => prevImages.filter(img => img.id !== id));
  }, [])

  const handleCreateModel = useCallback(async () => {
    try {
      const imagesToSend = images.map(img => {
        const imageData: {
          id: number;
          uuid: string;
          rotation?: number;
          crop?: Crop | null;
          deleted?: boolean;
        } = {
          id: img.id,
          uuid: img.uuid,
        };

        // Include rotation if it's not 0
        if (img.localModifications.rotation !== 0) {
          imageData.rotation = img.localModifications.rotation;
        }

        // Include crop if it's not null
        if (img.localModifications.crop !== null) {
          imageData.crop = img.localModifications.crop;
        }

        // Set deleted flag if the image is not in the current state
        // (assuming deleted images are removed from the 'images' array)
        if (!images.some(currentImg => currentImg.id === img.id)) {
          imageData.deleted = true;
        }

        return imageData;
      });

      console.log('Images to be sent to server:', imagesToSend);

      const response = await fetch('/api/upload-user-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, images: imagesToSend }),
      });

      if (!response.ok) {
        throw new Error('Failed to update images');
      }

      console.log("Images updated successfully");
      console.log("Creating AI model");
      router.push(`/profile/${personId}/generating-model`);
    } catch (error) {
      console.error('Error updating images and creating AI model:', error);
      toast({
        title: "Error",
        description: "Failed to update images and create AI model.",
        variant: "destructive",
      });
    }
  }, [images, personId, router, toast])

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
                    src={image.signedModifiedUrl || image.signedOriginalUrl}
                    alt={`Photo ${image.id}`}
                    className="w-full h-full object-cover aspect-square"
                    style={{
                      transform: `rotate(${image.localModifications.rotation}deg)`,
                      ...(image.localModifications.crop && {
                        clipPath: `inset(${image.localModifications.crop.y}px ${image.localModifications.crop.width}px ${image.localModifications.crop.height}px ${image.localModifications.crop.x}px)`,
                      }),
                    }}
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
                          onClick={() => {
                            setCropImageId(image.id)
                            handleCropReset(image.id)
                          }}
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
                            src={image.signedModifiedUrl || image.signedOriginalUrl}
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