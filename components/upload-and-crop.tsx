"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Crop as CropIcon, Wand2, RotateCcw, Trash2, RotateCw } from "lucide-react";
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface PersonData {
  id?: number;
  firstName: string;
  lastName: string;
  ethnicity: 'white' | 'latino' | 'black' | 'asian';
  gender: 'male' | 'female';
  age: number;
}

interface ShootData {
  id?: number;
  name: string;
  costumeGender: 'male' | 'female' | 'neither';
  costume: string;
  backdrop?: string;
}

interface ImageData {
  original: string; // This is the base64 string for the original image, ex. 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...'
  cropped?: string; // This is the base64 string for the cropped image, ex. 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...'
  fileName: string; // This is the original file name of the image, ex. 'my-photo.jpg'
  uploadedUrl?: string; // This will be set after uploading to the server. This appears to be used in handleDelete to identify which file to delete.
}

export function UploadAndCrop(): JSX.Element {
  const [images, setImages] = useState<ImageData[]>([]);
  const [personData, setPersonData] = useState<PersonData>({
    firstName: '',
    lastName: '',
    ethnicity: 'white',
    gender: 'male',
    age: 0
  });
  const [shootData, setShootData] = useState<ShootData>({
    name: '',
    costume: '',
    costumeGender: 'male'
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentCropIndex, setCurrentCropIndex] = useState<number | null>(null);
  const [shootError, setShootError] = useState<string | null>(null);
  const [shoots, setShoots] = useState<ShootData[]>([]);
  const [selectedShootId, setSelectedShootId] = useState<string>('new');
  const [tempCrop, setTempCrop] = useState<Crop>();

  // Triggers the hidden file input when the upload button is clicked
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  // Handles file upload, creates base64 strings for preview, and updates the images state
  // Here we remove all spaces in the file name.
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const files = event.target.files;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const modifiedFileName = `${file.name.replace(/ /g, '')}`;
        console.log('\x1b[36mupload-and-crop.tsx>handleFileUpload>modifiedFileName:\x1b[0m');
        console.log(modifiedFileName);

        setImages(prevImages => [...prevImages, {
          original: base64String,
          fileName: modifiedFileName,
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    event.target.value = ''; // Reset input to allow uploading the same file again
  }

  // Fetches existing shoots from the server
  const fetchShoots = async () => {
    try {
      const response = await fetch('/api/get-shoots');
      if (response.ok) {
        const data = await response.json();
        setShoots(data);
      } else {
        const errorData = await response.json();
        setShootError(errorData.error || 'Failed to fetch shoots');
      }
    } catch (error) {
      console.error('Error fetching shoots:', error);
      setShootError('An error occurred while fetching shoots');
    }
  }

  // Fetch shoots on component mount
  useEffect(() => {
    fetchShoots();
  }, []);

  // Handles the completion of a crop operation
  const handleCropComplete = useCallback((pixelCrop: PixelCrop) => {
    if (currentCropIndex !== null && imgRef.current && pixelCrop.width && pixelCrop.height) {
      // Create a canvas to draw the cropped image
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = pixelCrop.width * scaleX;
      canvas.height = pixelCrop.height * scaleY;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Draw the cropped portion of the image onto the canvas
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

        // Convert the canvas to a base64 string
        const base64Cropped = canvas.toDataURL('image/jpeg');
        // Update the images state with the cropped version
        setImages(prev =>
          prev.map((img, index) =>
            index === currentCropIndex
              ? { ...img, cropped: base64Cropped }
              : img
          )
        );
        // Reset crop-related states
        setCurrentCropIndex(null);
        setCrop(undefined);
        setTempCrop(undefined);
      }
    }
  }, [currentCropIndex]);

  // Reverts a cropped image to its original state
  const handleRevert = (index: number) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { original: img.original, fileName: img.fileName } : img
    ));
  }

  // Handles form submission, including saving or updating shoot data
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Log the header in cyan
      console.log('\x1b[36mupload-and-crop.tsx handleSubmit()\x1b[0m');

      // Helper function to safely truncate strings or URLs
      const truncate = (str: string, length: number) => {
        if (str.startsWith('data:')) {
          // It's a base64 string, truncate after the comma
          const base64Part = str.split(',')[1];
          return base64Part ? base64Part.substring(0, length) + '...' : 'Invalid base64';
        } else if (str.startsWith('blob:')) {
          // It's a blob URL, return as is
          return str;
        } else {
          // It's a regular string, truncate normally
          return str.substring(0, length) + '...';
        }
      };

      // Prepare image data for logging
      const imagesToLog = images.map((img) => ({
        fileName: img.fileName,
        originalImg: truncate(img.original, 30),
        croppedImg: img.cropped ? truncate(img.cropped, 30) : undefined,
      }));

      // Log the truncated image data
      console.log('Images to save:', JSON.stringify(imagesToLog, null, 2));

      // Prepare the full image data for submission
      const fullImagesToSave = images.map((img) => ({
        fileName: img.fileName,
        originalImg: img.original,
        croppedImg: img.cropped,
      }));

      // Determine the endpoint based on whether it's a new shoot or an update
      const endpoint = selectedShootId === 'new' ? '/api/save-shoot' : `/api/update-shoot/${selectedShootId}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          person: personData,
          shoot: shootData,
          images: fullImagesToSave
        }),
      });

      // Handle response and errors
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save data');
        } else {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('Saved data:', result);
      // Reset form and provide feedback
      setPersonData({
        firstName: '',
        lastName: '',
        ethnicity: 'white',
        gender: 'male',
        age: 0
      });
      setShootData({
        name: '',
        costume: '',
        costumeGender: 'male'
      });
      setImages([]);
      setSelectedShootId('new');
      fetchShoots(); // Refresh the shoots list
      // Add a success message here
    } catch (error) {
      console.error('Error saving data:', error);
      setShootError(error instanceof Error ? error.message : 'An error occurred while saving the data');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Fetches an image and converts it to a base64 string
  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Handles selection of an existing shoot or creation of a new one
  const handleShootSelect = async (value: string) => {
    setSelectedShootId(value);
    if (value === 'new') {
      // Reset form for new shoot
      setPersonData({
        firstName: '',
        lastName: '',
        ethnicity: 'white',
        gender: 'male',
        age: 0
      });
      setShootData({ name: '', costume: '', costumeGender: 'male' });
      setImages([]);
    } else {
      try {
        // Fetch and populate form with existing shoot data
        const response = await fetch(`/api/get-shoot-details?id=${value}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch shoot details');
        }
        const data = await response.json();
        setPersonData(data.person);
        setShootData(data.shoot);
        setImages(data.images.map((img: any) => ({
          original: img.originalUrl,
          cropped: img.croppedUrl,
          fileName: img.fileName
        })));
      } catch (error) {
        console.error('Error fetching shoot details:', error);
        setShootError('An error occurred while fetching shoot details');
        // Reset the selected shoot to 'new' if there's an error
        setSelectedShootId('new');
      }
    }
  };

  // Updates the crop state as the user adjusts the crop area
  const handleCropChange = (newCrop: Crop) => {
    setTempCrop(newCrop);
  };

  // New function to handle crop confirmation
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

  // Handles deletion of an image, including server-side deletion if applicable
  const handleDelete = async (index: number) => {
    const imageToDelete = images[index];
    if (selectedShootId !== 'new' && imageToDelete.uploadedUrl) {
      try {
        const response = await fetch('/api/delete-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            shootId: selectedShootId, 
            imageUrl: imageToDelete.uploadedUrl 
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

    // Remove the image from the local state
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  // Handles rotation of an image
  const handleRotate = (index: number) => {
    setImages(prev => prev.map((img, i) => {
      if (i === index) {
        // Create a canvas to perform the rotation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.src = img.cropped || img.original;
        image.onload = () => {
          // Set canvas dimensions to fit the rotated image
          canvas.width = image.height;
          canvas.height = image.width;
          // Perform the rotation
          ctx?.translate(canvas.width / 2, canvas.height / 2);
          ctx?.rotate(90 * Math.PI / 180);
          ctx?.drawImage(image, -image.width / 2, -image.height / 2);
          // Convert the rotated image to a data URL
          const rotatedImage = canvas.toDataURL('image/jpeg');
          // Update the images state with the rotated image
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
                <SelectValue placeholder="Select ethnicity" />
              </SelectTrigger>
              <SelectContent>
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
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={personData.age}
              onChange={(e) => setPersonData({...personData, age: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">Shoot Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="shootSelect">Select Existing Shoot (Optional)</Label>
            <Select
              value={selectedShootId}
              onValueChange={handleShootSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a shoot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Create New Shoot</SelectItem>
                {shoots.map(shoot => (
                  <SelectItem key={shoot.id} value={shoot.id?.toString() || ''}>
                    {shoot.name} - {shoot.costume}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="costume">Costume</Label>
            <Input
              id="costume"
              value={shootData.costume}
              onChange={(e) => setShootData({...shootData, costume: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="costumeGender">Costume Gender</Label>
            <Select
              value={shootData.costumeGender}
              onValueChange={(value) => setShootData({...shootData, costumeGender: value as ShootData['costumeGender']})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select costume gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="neither">Neither</SelectItem>
              </SelectContent>
            </Select>
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
                  variant="outline" 
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
            disabled={isSubmitting}
          >
            <Wand2 className="mr-2 h-4 w-4" /> 
            {isSubmitting ? 'Processing...' : 'Submit'}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}