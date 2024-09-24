"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import path from 'path';
import { captionImageAction } from '@/actions/img-caption-actions';

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
  caption?: string;
  llm?: string;
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

    const imagesToProcess = images.filter(img => !img.noBackgroundUrl || !img.caption);
    setProcessingImages(new Set(imagesToProcess.map(img => img.id)));

    try {
      const imagePromises = imagesToProcess.map(async (image) => {
        const imageUrl = image.croppedUrl || image.originalUrl;
        const base64Data = await getBase64FromUrl(imageUrl);
        const base64Image = base64Data.split(',')[1];

        // Create a full URL for captioning
        const fullImageUrl = new URL(imageUrl, window.location.origin).href;

        // Run background removal and captioning in parallel
        const [bgRemovalResult, captionResult] = await Promise.all([
          fetch('/api/remove-background', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: [{ imageBase64: base64Image, imageUrl, id: image.id }],
              shootId: selectedShoot.toString(),
              provider: 'fal'
            }),
          }).then(res => res.json()),
          captionImageAction(fullImageUrl, selectedShoot)
        ]);
        console.log('\x1b[36mpre-processing.tsx>handleRemoveBackground>captionResult.model:\x1b[0m', captionResult.model);

        return {
          ...image,
          noBackgroundUrl: bgRemovalResult.outputUrls[0],
          caption: captionResult.caption,
          llm: captionResult.model
        };

      });

      const processedImages = await Promise.all(imagePromises);

      setImages(prevImages => prevImages.map(img => {
        const processedImg = processedImages.find(pImg => pImg.id === img.id);
        return processedImg || img;
      }));

      console.log('\x1b[36mpre-processing.tsx>handleRemoveBackground>result:\x1b[0m');
      console.log(processedImages);

      toast({
        title: "Success",
        description: `Processed ${processedImages.length} images`,
      });

    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        title: "Error",
        description: `Failed to process images: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        
        console.log('\x1b[36mpre-processing.tsx>handleSave>img.llm:\x1b[0m', img.llm);
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
            caption: img.caption,
            llm: img.llm,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save preprocessed image: ${img.fileName}`);
        }
      }

      // Refresh the images state to reflect the saved changes
      await fetchShootDetails(selectedShoot);

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
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover rounded-md"
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
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover rounded-md"
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