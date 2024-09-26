"use client";

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Crop as CropIcon, Wand2, Trash2, RotateCw } from "lucide-react";
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useToast } from "@/hooks/use-toast";

interface PersonData {
  id?: number;
  firstName: string;
  lastName: string;
  ethnicity: 'white' | 'latino' | 'black' | 'asian' | 'not_specified';
  gender: 'male' | 'female' | 'not_specified';
  birthdate: string;
}

interface ImageData {
  original: string;
  cropped?: string;
  fileName: string;
}

export const UploadAndCrop: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [personData, setPersonData] = useState<PersonData>({
    firstName: '',
    lastName: '',
    ethnicity: 'not_specified',
    gender: 'not_specified',
    birthdate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentCropIndex, setCurrentCropIndex] = useState<number | null>(null);
  const [shootError, setShootError] = useState<string | null>(null);
  const [tempCrop, setTempCrop] = useState<Crop>();
  const { toast } = useToast();

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const filePromises = Array.from(files).map(file => {
        return new Promise<ImageData>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              original: reader.result as string,
              fileName: file.name.replace(/ /g, '_'),
            });
          };
          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };
          reader.readAsDataURL(file);
        });
      });

      try {
        const newImages = await Promise.all(filePromises);
        setImages(prevImages => [...prevImages, ...newImages]);
      } catch (error) {
        console.error('Error reading files:', error);
        toast({
          title: "Error",
          description: "Failed to read one or more files.",
          variant: "destructive",
        });
      }
    }
  }

  const handleCropComplete = useCallback((pixelCrop: PixelCrop) => {
    if (currentCropIndex !== null && imgRef.current && pixelCrop.width && pixelCrop.height) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = pixelCrop.width * scaleX;
      canvas.height = pixelCrop.height * scaleY;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          imgRef.current,
          pixelCrop.x * scaleX,
          pixelCrop.y * scaleY,
          pixelCrop.width * scaleX,
          pixelCrop.height * scaleY,
          0,
          0,
          pixelCrop.width * scaleX,
          pixelCrop.height * scaleY
        );

        const base64Cropped = canvas.toDataURL('image/jpeg');
        setImages(prev =>
          prev.map((img, index) =>
            index === currentCropIndex
              ? { 
                  ...img, 
                  cropped: base64Cropped,
                  fileName: img.fileName 
                }
              : img
          )
        );
        setCurrentCropIndex(null);
        setCrop(undefined);
        setTempCrop(undefined);
      }
    }
  }, [currentCropIndex]);

  const handleRevert = (index: number) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { original: img.original, fileName: img.fileName } : img
    ));
  }

  const isFormValid = () => {
    return (
      personData.firstName.trim() !== '' &&
      personData.lastName.trim() !== '' &&
      personData.ethnicity !== 'not_specified' &&
      personData.gender !== 'not_specified' &&
      personData.birthdate !== '' &&
      images.length > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Error",
        description: "Please fill in all fields and upload at least one image.",
        variant: "destructive",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('\x1b[36mupload-and-crop.tsx handleSubmit()\x1b[0m');

      const payload = {
        personData,
        images: images.map(img => ({
          fileName: img.fileName,
          original: img.original,
          cropped: img.cropped || null,
        }))
      };
      console.log('\x1b[36mupload-and-crop.tsx handleSubmit() payload\x1b[0m', payload);
      
      const response = await fetch('/api/upload-user-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload images');
      }

      const result = await response.json();
      console.log('Uploaded images:', result);
      
      setPersonData(prevData => ({
        ...prevData,
        id: result.personId
      }));

      toast({
        title: "Success",
        description: "Images uploaded successfully!",
      });

      // Reset form after successful submission
      setPersonData({
        firstName: '',
        lastName: '',
        ethnicity: 'not_specified',
        gender: 'not_specified',
        birthdate: '',
      });
      setImages([]);
    } catch (error) {
      console.error('Error uploading images:', error);
      setShootError(error instanceof Error ? error.message : 'An error occurred while uploading images');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred while uploading images',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCropChange = (newCrop: Crop) => {
    setTempCrop(newCrop);
  };

  const handleCropConfirm = () => {
    if (currentCropIndex !== null && imgRef.current && tempCrop) {
      const pixelCrop: PixelCrop = {
        x: Math.round(tempCrop.x),
        y: Math.round(tempCrop.y),
        width: Math.round(tempCrop.width),
        height: Math.round(tempCrop.height),
        unit: 'px'
      };
      handleCropComplete(pixelCrop);
    }
  };

  const handleDelete = async (index: number) => {
    const imageToDelete = images[index];
    if (personData.id) {
      try {
        const response = await fetch('/api/delete-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            personId: personData.id, 
            fileName: imageToDelete.fileName 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete image from server');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        setShootError('Failed to delete image. Please try again.');
        return;
      }
    }

    setImages(prev => prev.filter((_, i) => i !== index));
  }

  const handleRotate = (index: number) => {
    setImages(prev => prev.map((img, i) => {
      if (i === index) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.src = img.cropped || img.original;
        image.onload = () => {
          canvas.width = image.height;
          canvas.height = image.width;
          ctx?.translate(canvas.width / 2, canvas.height / 2);
          ctx?.rotate(90 * Math.PI / 180);
          ctx?.drawImage(image, -image.width / 2, -image.height / 2);
          const rotatedImage = canvas.toDataURL('image/jpeg');
          setImages(prev => prev.map((img, idx) => 
            idx === index ? { ...img, cropped: rotatedImage } : img
          ));
        };
      }
      return img;
    }));
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-orange-900 to-black text-white p-8">
      <div className="w-1/3 pr-8">
        <h2 className="text-2xl font-bold mb-4">Person Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={personData.firstName}
              onChange={(e) => setPersonData({...personData, firstName: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={personData.lastName}
              onChange={(e) => setPersonData({...personData, lastName: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="ethnicity">Ethnicity</Label>
            <Select
              value={personData.ethnicity}
              onValueChange={(value) => setPersonData({...personData, ethnicity: value as PersonData['ethnicity']})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_specified">Select one</SelectItem>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="latino">Latino</SelectItem>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="asian">Asian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={personData.gender}
              onValueChange={(value) => setPersonData({...personData, gender: value as PersonData['gender']})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_specified">Select one</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="birthdate">Birthdate</Label>
            <Input
              id="birthdate"
              type="date"
              value={personData.birthdate}
              onChange={(e) => setPersonData({...personData, birthdate: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="w-2/3">
        <h1 className="text-4xl font-bold mb-8">Upload Your Photos</h1>
        {shootError && (
          <p className="text-red-500 mb-4">{shootError}</p>
        )}
        <div className="mb-8">
          <Button
            onClick={handleUploadClick} 
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Upload className="mr-2 h-4 w-4" /> Upload Photos
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            multiple 
            accept="image/*" 
            className="hidden"
          />
        </div>
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          layout
        >
          <AnimatePresence>
            {images.map((image, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
                className="relative"
              >
                <img
                  src={image.cropped || image.original} 
                  alt={`Uploaded image ${index + 1}`} 
                  className="rounded-lg object-cover w-full h-48"
                />
                <div className="absolute bottom-2 right-2 flex space-x-2">
                  <Button 
                    onClick={() => handleDelete(index)}
                    className="bg-red-500 hover:bg-red-600"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => handleRotate(index)}
                    className="bg-blue-500 hover:bg-blue-600"
                    size="sm"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => setCurrentCropIndex(index)}
                    className="bg-orange-500 hover:bg-orange-600"
                    size="sm"
                  >
                    <CropIcon className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {currentCropIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <div className="bg-white p-4 rounded-lg w-full max-w-4xl flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
              <h2 className="text-black text-xl mb-4">Crop Image</h2>
              <div className="flex-grow relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ReactCrop
                    crop={tempCrop}
                    onChange={handleCropChange}
                  >
                    <img 
                      ref={imgRef}
                      src={images[currentCropIndex].original} 
                      alt="Crop preview" 
                      className="max-w-full max-h-full object-contain"
                      style={{ maxHeight: 'calc(100vh - 10rem)' }}
                    />
                  </ReactCrop>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => {
                    setCurrentCropIndex(null);
                    setTempCrop(undefined);
                  }} 
                  variant="secondary"
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCropConfirm}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Crop
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            onClick={handleSubmit} 
            className="bg-purple-600 hover:bg-purple-700"
            disabled={isSubmitting || !isFormValid()}
          >
            <Wand2 className="mr-2 h-4 w-4" /> 
            {isSubmitting ? 'Processing...' : 'Submit'}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}