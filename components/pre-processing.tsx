"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import path from 'path';

type Shoot = {
  id: number;
  name: string;
  costume: string;
};

type ImageData = {
  id: number;
  fileName: string;
  originalUrl: string;
  croppedUrl?: string;
  noBackgroundUrl?: string;
};

const PreProcessing = () => {
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [selectedShoot, setSelectedShoot] = useState<number | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingImages, setProcessingImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchShoots = async () => {
      try {
        const response = await fetch('/api/get-shoots');
        if (!response.ok) throw new Error('Failed to fetch shoots');
        const data = await response.json();
        setShoots(data);
      } catch (error) {
        console.error('Error fetching shoots:', error);
        toast({
          title: "Error",
          description: "Failed to fetch shoots. Please try again.",
          variant: "destructive",
        });
      }
    };
    fetchShoots();
  }, []);

  const fetchShootDetails = async (shootId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/get-shoot-details?id=${shootId}`);
      if (!response.ok) throw new Error('Failed to fetch shoot details');
      const data = await response.json();
      
      // Check for preprocessed images
      const updatedImages = await Promise.all(data.images.map(async (image: ImageData) => {
        const baseFileName = path.basename(image.croppedUrl || image.originalUrl);
        const preprocessedPath = `/assets/bg-removed/${shootId}/nobg_${baseFileName}`;
        const preprocessedExists = await checkImageExists(preprocessedPath);
        
        if (preprocessedExists) {
          return { ...image, noBackgroundUrl: preprocessedPath };
        }
        
        return image;
      }));
      
      setImages(updatedImages);
    } catch (error) {
      console.error('Error fetching shoot details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shoot details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkImageExists = async (imagePath: string): Promise<boolean> => {
    try {
      const response = await fetch(imagePath, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleShootSelect = (value: string) => {
    const shootId = parseInt(value, 10);
    setSelectedShoot(shootId);
    fetchShootDetails(shootId);
  };

  const getBase64FromUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleRemoveBackground = async () => {
    if (!selectedShoot) return;

    const imagesToProcess = images.filter(img => !img.noBackgroundUrl);
    setProcessingImages(new Set(imagesToProcess.map(img => img.id)));

    try {
      const imagePromises = imagesToProcess.map(async (image) => {
        const imageUrl = image.croppedUrl || image.originalUrl;
        const base64Data = await getBase64FromUrl(imageUrl);
        const base64Image = base64Data.split(',')[1];

        return {
          imageBase64: base64Image,
          imageUrl: imageUrl,
          id: image.id
        };
      });

      const processedImages = await Promise.all(imagePromises);

      const response = await fetch('/api/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: processedImages,
          shootId: selectedShoot.toString(),
          provider: 'fal'  // or 'replicate', depending on your preference
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { outputUrls: string[], error?: string };
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.outputUrls || !Array.isArray(result.outputUrls)) {
        throw new Error('Invalid output URLs received from the server');
      }

      // Update the images state with the new background-removed URLs
      setImages(prevImages => prevImages.map(img => {
        const outputUrl = result.outputUrls.find(url => {
          const processedImageName = url.split('/').pop();
          const originalImageName = (img.croppedUrl || img.originalUrl).split('/').pop();
          return processedImageName?.includes(`nobg_${originalImageName}`);
        });
        return outputUrl ? { ...img, noBackgroundUrl: outputUrl } : img;
      }));

      console.log('\x1b[36mpre-processing.tsx>handleRemoveBackground>result:\x1b[0m');
      console.log(result);

      toast({
        title: "Success",
        description: `Background removed for ${result.outputUrls.length} images`,
      });

    } catch (error) {
      console.error('Error removing background:', error);
      toast({
        title: "Error",
        description: `Failed to remove background: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setProcessingImages(new Set());
    }
  };

  const handleSave = async () => {
    if (!selectedShoot) return;

    try {
      const preprocessedImages = images.filter(img => img.noBackgroundUrl);
      
      for (const img of preprocessedImages) {
        const beforeFileName = img.croppedUrl ? path.basename(img.croppedUrl) : path.basename(img.originalUrl);
        const afterFileName = path.basename(img.noBackgroundUrl as string);
        
        const response = await fetch('/api/save-preprocessed-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shootId: selectedShoot,
            imageId: img.id,
            beforeFileName,
            afterFileName,
            preprocessedUrl: img.noBackgroundUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save preprocessed image: ${img.fileName}`);
        }
      }

      toast({
        title: "Success",
        description: `${preprocessedImages.length} preprocessed images have been saved.`,
      });
    } catch (error) {
      console.error('Error saving preprocessed images:', error);
      toast({
        title: "Error",
        description: `Failed to save preprocessed images: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const getImageUrl = (image: ImageData) => {
    if (image.noBackgroundUrl) return image.noBackgroundUrl;
    return image.croppedUrl || image.originalUrl;
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 p-4 border-r">
        <h2 className="text-xl font-bold mb-4">Select Shoot</h2>
        <Select onValueChange={handleShootSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a shoot" />
          </SelectTrigger>
          <SelectContent>
            {shoots.map((shoot) => (
              <SelectItem key={shoot.id} value={shoot.id.toString()}>
                {shoot.name} - {shoot.costume}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-3/4 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {images.map((image) => (
                <Dialog key={image.id}>
                  <DialogTrigger asChild>
                    <div className="relative aspect-square cursor-pointer">
                      <Image
                        src={getImageUrl(image)}
                        alt={image.fileName}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                      />
                      {processingImages.has(image.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                      <Image
                        src={getImageUrl(image)}
                        alt={image.fileName}
                        layout="fill"
                        objectFit="contain"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <Button 
                onClick={handleRemoveBackground} 
                disabled={!selectedShoot || processingImages.size > 0}
              >
                {processingImages.size > 0 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Remove Background'
                )}
              </Button>
              <Button onClick={handleSave} disabled={!selectedShoot}>Save</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PreProcessing;