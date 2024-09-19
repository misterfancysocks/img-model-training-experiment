"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Types (you might want to move these to a separate file)
type Shoot = {
  id: number;
  name: string;
};

type ImageData = {
  id: number;
  fileName: string;
  url: string;
};

const PreProcessing = () => {
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [selectedShoot, setSelectedShoot] = useState<number | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);

  useEffect(() => {
    // Fetch shoots from the server
    // This is a placeholder, replace with actual API call
    const fetchShoots = async () => {
      // const response = await fetch('/api/shoots');
      // const data = await response.json();
      // setShoots(data);
    };
    fetchShoots();
  }, []);

  useEffect(() => {
    // Fetch images for the selected shoot
    // This is a placeholder, replace with actual API call
    const fetchImages = async () => {
      if (selectedShoot) {
        // const response = await fetch(`/api/images?shootId=${selectedShoot}`);
        // const data = await response.json();
        // setImages(data);
      }
    };
    fetchImages();
  }, [selectedShoot]);

  const handleRemoveBackground = async () => {
    // Placeholder for background removal logic
    console.log('Removing background...');
    // Implement the API call to fal.ai here
  };

  const handleSave = async () => {
    // Placeholder for save logic
    console.log('Saving preprocessed images...');
    // Implement the save functionality here
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 p-4 border-r">
        <h2 className="text-xl font-bold mb-4">Select Shoot</h2>
        <Select onValueChange={(value) => setSelectedShoot(Number(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select a shoot" />
          </SelectTrigger>
          <SelectContent>
            {shoots.map((shoot) => (
              <SelectItem key={shoot.id} value={shoot.id.toString()}>
                {shoot.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-3/4 p-4">
        <div className="grid grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative h-40">
              <Image
                src={image.url}
                alt={image.fileName}
                layout="fill"
                objectFit="cover"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between">
          <Button onClick={handleRemoveBackground}>Remove Background</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default PreProcessing;