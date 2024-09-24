'use client'

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LoraModel {
  id: number;
  personId: number;
  url: string;
  trainedOn: string;
  service: string;
  model: string;
  modelVersion: string;
  firstName: string;
  lastName: string;
  trigger: string;
}

interface GenerateImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
  prompt: string;
}

const IMAGE_SIZE_OPTIONS = [
  { label: 'Square HD (512x512)', value: 'square_hd' },
  { label: 'Square (512x512)', value: 'square' },
  { label: 'Portrait 4:3 (768x1024)', value: 'portrait_4_3' },
  { label: 'Portrait 16:9 (896x504)', value: 'portrait_16_9' },
  { label: 'Landscape 4:3 (1024x768)', value: 'landscape_4_3' },
  { label: 'Landscape 16:9 (1280x720)', value: 'landscape_16_9' },
]

export default function ImageGenerationPage() {
  const [loraModels, setLoraModels] = useState<LoraModel[]>([]);
  const [selectedLora, setSelectedLora] = useState<LoraModel | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [numImages, setNumImages] = useState<number>(1);
  const [imageSize, setImageSize] = useState<string>("portrait_4_3");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { toast } = useToast()

  useEffect(() => {
    const fetchLoraModels = async () => {
      try {
        const response = await fetch('/api/get-lora-models')
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
  }, [toast])

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
    setGeneratedImages([])

    try {
      const requestBody = {
        loraId: selectedLora.id,
        prompt,
        num_images: numImages,
        image_size: imageSize,
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
        const imageUrls = data.images.map(img => img.url)
        setGeneratedImages(imageUrls)
        toast({
          title: "Success",
          description: `${imageUrls.length} image(s) generated successfully!`,
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
            {generatedImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden bg-gray-800 border-gray-700">
                  <CardContent className="p-0">
                    <img src={image} alt={`Generated image ${index + 1}`} className="w-full h-auto" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        <div ref={useRef<HTMLDivElement>(null)} />
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
                  {model.model} - {model.firstName} {model.lastName} ({model.trigger})
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
            onValueChange={(value) => setImageSize(value)} 
            value={imageSize}
          >
            <SelectTrigger className="w-full sm:w-[150px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Image Size" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              {IMAGE_SIZE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            onValueChange={(value) => setNumImages(parseInt(value))}
            value={numImages.toString()}
          >
            <SelectTrigger className="w-full sm:w-[100px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Num" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              {[1, 2, 3, 4, 5].map(num => (
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