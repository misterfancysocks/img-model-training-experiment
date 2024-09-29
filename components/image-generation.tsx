'use client'

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useInView } from 'react-intersection-observer'

interface LoraModel {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  trigger: string;
}

interface GenerateImageResponse {
  images: Array<{
    url: string;
    fullUrl: string;
    bucket: string;
    path: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
  prompt: string;
}

interface GeneratedImage {
  id: string; // Added unique identifier
  signedUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  content_type: string;
  timestamp: number;
  bucket: string;
  path: string;
}

interface UserGeneratedImage {
  id: number;
  fullUrl: string;
  signedUrl: string;
  seed: number;
  userInput: string;
  fullPrompt: string;
  prompt: string;
}

export function ImageGeneration() {
  const [loraModels, setLoraModels] = useState<LoraModel[]>([]);
  const [selectedLora, setSelectedLora] = useState<LoraModel | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [numImages, setNumImages] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView()
  const [allImages, setAllImages] = useState<(GeneratedImage | UserGeneratedImage)[]>([]);

  useEffect(() => {
    const fetchLoraModels = async () => {
      try {
        const userId = localStorage.getItem('selectedUserId');
        if (!userId) {
          console.log('No user selected');
          return;
        }
        const response = await fetch(`/api/get-lora-models?userId=${userId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch LoRA models')
        }
        const data: LoraModel[] = await response.json()
        setLoraModels(data)
        console.log('Fetched LoRA models:', data)
        
        // Automatically select the only model if there's just one
        if (data.length === 1) {
          setSelectedLora(data[0]);
        }
      } catch (error) {
        console.error('Error fetching LoRA models:', error)
        toast({
          title: "Error",
          description: "Failed to fetch LoRA models. Please try again later.",
          variant: "destructive",
        })
      }
    }

    fetchLoraModels()

    const storedUserId = localStorage.getItem('selectedUserId');
    console.log('Stored user ID:', storedUserId);
    if (storedUserId) {
      setSelectedUserId(storedUserId);
      fetchUserGeneratedImages(storedUserId, 1);
    } else {
      console.log('No stored user ID found');
    }
  }, [toast]);

  useEffect(() => {
    if (inView && hasMore && selectedUserId) {
      fetchUserGeneratedImages(selectedUserId, page + 1);
    }
  }, [inView, hasMore, selectedUserId]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedUserId') {
        const newUserId = e.newValue;
        console.log('User ID changed:', newUserId);
        setSelectedUserId(newUserId);
        if (newUserId) {
          setAllImages([]);
          setPage(1);
          setHasMore(true);
          fetchUserGeneratedImages(newUserId, 1);
        } else {
          console.log('Clearing user generated images due to null user ID');
          setAllImages([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchUserGeneratedImages = useCallback(async (userId: string, pageNumber: number) => {
    console.log('Fetching images for user:', userId, 'page:', pageNumber);
    try {
      const response = await fetch(`/api/images/${userId}?page=${pageNumber}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch user generated images');
      }
      const data: UserGeneratedImage[] = await response.json();
      console.log('Fetched user generated images:', data);
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setAllImages(prev => {
          const newImages = data.filter(newImg => !prev.some(existingImg => 
            'id' in existingImg && existingImg.id === newImg.id
          ));
          return [...prev, ...newImages];
        });
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('Error fetching user generated images:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user generated images. Please try again later.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleGenerate = async () => {
    if (!selectedLora) {
      toast({
        title: "No LoRA Selected",
        description: "Please select a LoRA model to generate images.",
        variant: "destructive",
      })
      return
    }

    if (!prompt.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please enter a prompt for image generation.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const requestBody = {
        loraId: selectedLora.id,
        prompt,
        num_images: numImages,
      }

      console.log('Sending request to generate image:', requestBody)

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Image generation failed')
      }

      const data: GenerateImageResponse = await response.json()
      console.log('Received response from generate-image:', data)

      if (data.images && data.images.length > 0) {
        const newImages: GeneratedImage[] = data.images.map(img => ({
          id: `${img.path}-${Date.now()}`, // Assign a unique ID
          signedUrl: img.url,
          fullUrl: img.fullUrl,
          width: img.width,
          height: img.height,
          content_type: img.content_type,
          timestamp: Date.now(),
          bucket: img.bucket,
          path: img.path
        }));
        
        // Update allImages state by adding new images to the beginning
        setAllImages(prevImages => [...newImages, ...prevImages]);
        
        toast({
          title: "Success",
          description: `${newImages.length} image(s) generated successfully!`,
        })
      } else {
        toast({
          title: "No Images",
          description: "No images were generated. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error generating images:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate images.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleGenerate();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 to-black text-orange-100">
      <div className="container mx-auto p-4 pb-24">
        <h1 className="text-4xl font-bold text-center my-8 font-heading text-orange-100">
          Costume Generator
        </h1>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {allImages.sort((a, b) => {
              const aTime = 'timestamp' in a ? a.timestamp : 0;
              const bTime = 'timestamp' in b ? b.timestamp : 0;
              return bTime - aTime;
            }).map((image) => (
              <motion.div
                key={image.id} // Use the unique ID as the key
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="overflow-hidden bg-orange-800 border-orange-800">
                  <CardContent className="p-0">
                    <img
                      src={image.signedUrl || image.fullUrl} 
                      alt={`Generated image`} 
                      className="w-full h-auto" 
                      loading="lazy"

                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {hasMore && (
          <div ref={ref} className="flex justify-center mt-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>

      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-orange-900 to-black p-4 shadow-lg"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto flex flex-col sm:flex-row gap-4 items-center">
          {loraModels.length > 1 ? (
            <Select 
              onValueChange={(value) => {
                const model = loraModels.find(lora => lora.id.toString() === value)
                setSelectedLora(model || null)
                console.log('Selected Model:', model)
              }} 
              value={selectedLora ? selectedLora.id.toString() : ""}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-orange-800 text-orange-100">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="bg-orange-800 text-orange-100">
                {loraModels.map(model => (
                  <SelectItem key={model.id} value={model.id.toString()}>
                    {model.firstName} {model.lastName} ({model.trigger})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          
          <Input
            placeholder="Enter your prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow bg-orange-800 text-orange-100 placeholder-orange-400"
          />

          <Select 
            onValueChange={(value) => setNumImages(parseInt(value))}
            value={numImages.toString()}
          >
            <SelectTrigger className="w-full sm:w-[100px] bg-orange-800 text-orange-100">
              <SelectValue placeholder="Num" />
            </SelectTrigger>
            <SelectContent className="bg-orange-800 text-orange-100">
              {[1, 2, 3, 4].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleGenerate} 
            disabled={!selectedLora || !prompt.trim() || isGenerating}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Generate Images
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}