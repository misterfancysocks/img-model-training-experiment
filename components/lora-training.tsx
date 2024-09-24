'use client';

import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getShootsWithPreprocessedImages, trainLoraModel } from '@/actions/lora-training-actions';

interface Shoot {
  id: number;
  name: string;
  imageCount: number;
  costume: string;
}

export function LoraTraining() {
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [selectedShoot, setSelectedShoot] = useState<Shoot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchShoots();
  }, []);

  const fetchShoots = async () => {
    try {
      const fetchedShoots = await getShootsWithPreprocessedImages();
      setShoots(fetchedShoots);
    } catch (error) {
      console.error('Error fetching shoots:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shoots. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTrainLora = async () => {
    if (!selectedShoot) return;

    setIsLoading(true);
    try {
      const result = await trainLoraModel(selectedShoot.id);
      console.log('LoRA training result:', result);
      toast({
        title: "Success",
        description: "LoRA model trained successfully!",
      });
    } catch (error) {
      console.error('Error training LoRA model:', error);
      toast({
        title: "Error",
        description: "Failed to train LoRA model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Available Shoots</h2>
        <ul className="space-y-2">
          {shoots.map((shoot) => (
            <li
              key={shoot.id}
              className={`cursor-pointer p-2 rounded ${
                selectedShoot?.id === shoot.id ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedShoot(shoot)}
            >
              {shoot.costume} ({shoot.imageCount} images)
            </li>
          ))}
        </ul>
      </div>
      <div>
        {selectedShoot && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Selected Shoot</h2>
            <p>Name: {selectedShoot.name}</p>
            <p>Number of Images: {selectedShoot.imageCount}</p>
            <Button
              onClick={handleTrainLora}
              disabled={isLoading}
              className="mt-4"
            >
              {isLoading ? 'Training...' : 'Train LoRA'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}