"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type Person = {
  id: number;
  firstName: string;
  lastName: string;
};

type ImageData = {
  id: number;
  fileName: string;
  originalUrl: string;
  croppedUrl?: string;
  signedOriginalUrl?: string;
  signedCroppedUrl?: string;
};

type PreprocessedImageData = {
  id?: number;
  imageId: number;
  preprocessedUrl: string;
  signedUrl?: string;
  caption?: string;
  llm?: string;
};

const PreProcessing = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [preprocessedImages, setPreprocessedImages] = useState<PreprocessedImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingImages, setProcessingImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const userId = localStorage.getItem('selectedUserId');
        if (!userId) {
          throw new Error('User ID not found');
        }
        const response = await fetch(`/api/get-persons?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch persons');
        const data = await response.json();
        setPersons(data);
      } catch (error) {
        console.error('Error fetching persons:', error);
        toast({
          title: "Error",
          description: "Failed to fetch persons. Please try again.",
          variant: "destructive",
        });
      }
    };
    fetchPersons();
  }, []);

  const fetchPersonDetails = async (personId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/get-person-details?id=${personId}`);
      if (!response.ok) throw new Error('Failed to fetch person details');
      const data = await response.json();
      console.log('Received data from API:', data);
      setImages(data.images);
      setPreprocessedImages(data.preprocessedImages || []);
    } catch (error) {
      console.error('Error fetching person details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch person details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonSelect = (value: string) => {
    const personId = parseInt(value, 10);
    setSelectedPerson(personId);
    fetchPersonDetails(personId);
  };

  const handleRemoveBackground = async () => {
    if (!selectedPerson) return;

    const imagesToProcess = images.filter(img => !preprocessedImages.some(pImg => pImg.imageId === img.id));
    setProcessingImages(new Set(imagesToProcess.map(img => img.id)));

    try {
      const response = await fetch('/api/pre-process-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: imagesToProcess.map(img => ({
            imageUrl: img.croppedUrl || img.originalUrl,
            id: img.id
          })),
          personId: selectedPerson.toString(),
          provider: 'fal'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process images');
      }

      const result = await response.json();
      const newPreprocessedImages = result.outputUrls;

      console.log('New preprocessed images:', newPreprocessedImages);
      setPreprocessedImages(prevImages => {
        const updatedImages = [...prevImages, ...newPreprocessedImages];
        console.log('Updated preprocessed images:', updatedImages);
        return updatedImages;
      });

      toast({
        title: "Success",
        description: `Processed ${newPreprocessedImages.length} images`,
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
    if (!selectedPerson) return;

    try {
      const unsavedImages = preprocessedImages.filter(img => !img.id);
      console.log('Unsaved images:', unsavedImages);
      
      const savedImages = await Promise.all(unsavedImages.map(async (img) => {
        const response = await fetch('/api/save-preprocessed-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personId: selectedPerson,
            imageId: img.imageId,
            preprocessedUrl: img.preprocessedUrl,
            caption: img.caption,
            llm: img.llm,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save preprocessed image: ${img.imageId}`);
        }

        const savedImage = await response.json();
        return savedImage;
      }));

      console.log('Saved images:', savedImages);
      setPreprocessedImages(prevImages => prevImages.map(img => {
        const savedImg = savedImages.find(sImg => sImg.imageId === img.imageId);
        return savedImg ? savedImg : img;
      }));

      toast({
        title: "Success",
        description: `${savedImages.length} preprocessed images have been saved.`,
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
    const preprocessed = preprocessedImages.find(pImg => pImg.imageId === image.id);
    return preprocessed?.signedUrl || 
           image.signedCroppedUrl || 
           image.signedOriginalUrl || 
           image.croppedUrl || 
           image.originalUrl;
  };

  console.log(preprocessedImages)
  return (
    <div className="flex h-screen">
      <div className="w-1/4 p-4 border-r">
        <h2 className="text-xl font-bold mb-4">Select Person</h2>
        <Select onValueChange={handlePersonSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a person" />
          </SelectTrigger>
          <SelectContent>
            {persons.map((person) => (
              <SelectItem key={person.id} value={person.id.toString()}>
                {person.firstName} {person.lastName}
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
                    <div className="relative w-full pt-[100%] cursor-pointer">
                      <Image
                        src={getImageUrl(image)}
                        alt={image.fileName}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain rounded-md"
                        unoptimized
                      />
                      {processingImages.has(image.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <div className="relative w-full pt-[75%]">
                      <Image
                        src={getImageUrl(image)}
                        alt={image.fileName}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain rounded-md"
                        unoptimized
                      />
                    </div>
                    {preprocessedImages.find(pImg => pImg.imageId === image.id)?.caption && (
                      <p className="mt-2">Caption: {preprocessedImages.find(pImg => pImg.imageId === image.id)?.caption}</p>
                    )}
                  </DialogContent>
                </Dialog>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <Button 
                onClick={handleRemoveBackground} 
                disabled={!selectedPerson || processingImages.size > 0}
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
              <Button onClick={handleSave} disabled={!selectedPerson}>Save</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PreProcessing;