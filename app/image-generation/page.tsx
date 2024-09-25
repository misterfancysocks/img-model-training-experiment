'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
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
}

export default function ImageGenerationPage() {
  const [loraModels, setLoraModels] = useState<LoraModel[]>([]);
  const [selectedLora, setSelectedLora] = useState<LoraModel | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [numImages, setNumImages] = useState<number>(1);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [userGeneratedImages, setUserGeneratedImages] = useState<UserGeneratedImage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView()

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
          setUserGeneratedImages([]);
          setPage(1);
          setHasMore(true);
          fetchUserGeneratedImages(newUserId, 1);
        } else {
          console.log('Clearing user generated images due to null user ID');
          setUserGeneratedImages([]);
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
        setUserGeneratedImages(prev => [...prev, ...data]);
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
          signedUrl: img.url,
          fullUrl: img.fullUrl,
          width: img.width,
          height: img.height,
          content_type: img.content_type,
          timestamp: Date.now(),
          bucket: img.bucket,
          path: img.path
        }));
        setGeneratedImages(prevImages => [...newImages, ...prevImages]);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <p className="text-center mb-4">Current User ID: {selectedUserId || 'None'}</p>
      
      <div className="container mx-auto p-4 pb-24">
        <h1 className="text-4xl font-bold text-center my-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          LoRA Image Generator
        </h1>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {[...generatedImages, ...userGeneratedImages].sort((a, b) => {
              const aTime = 'timestamp' in a ? a.timestamp : 0;
              const bTime = 'timestamp' in b ? b.timestamp : 0;
              return bTime - aTime;
            }).map((image, index) => (
              <motion.div
                key={`${image.signedUrl || image.fullUrl}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden bg-gray-800 border-gray-700">
                  <CardContent className="p-0">
                    <img 
                      src={image.signedUrl || image.fullUrl} 
                      alt={`Generated image ${index + 1}`} 
                      className="w-full h-auto" 
                      loading="lazy"
                    />
                    {'userInput' in image && (
                      <div className="p-2 text-sm">
                        <p><strong>Prompt:</strong> {image.userInput}</p>
                        <p><strong>Seed:</strong> {image.seed}</p>
                      </div>
                    )}
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
        className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 shadow-lg"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto flex flex-col sm:flex-row gap-4 items-center">
          <Select 
            onValueChange={(value) => {
              const model = loraModels.find(lora => lora.id.toString() === value)
              setSelectedLora(model || null)
              console.log('Selected LoRA model:', model)
            }} 
            value={selectedLora ? selectedLora.id.toString() : ""}
          >
            <SelectTrigger className="w-full sm:w-[200px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select LoRA model" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              {loraModels.map(model => (
                <SelectItem key={model.id} value={model.id.toString()}>
                  {model.firstName} {model.lastName} ({model.trigger})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Enter your prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-grow bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />

          <Select 
            onValueChange={(value) => setNumImages(parseInt(value))}
            value={numImages.toString()}
          >
            <SelectTrigger className="w-full sm:w-[100px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Num" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
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
            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Images"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}