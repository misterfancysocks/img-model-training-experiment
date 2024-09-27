"use client"

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ghost, Upload, ArrowRight, X, Plus, Minus } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export default function PersonProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    birthdate: "1990-10-31",
    gender: "male",
    ethnicity: "caucasian",
    costumeIdeas: ["", ""],
    photos: [] as File[]
  })
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setProfile({ ...profile, [name]: value })
  }

  const handleCostumeIdeaChange = (index: number, value: string) => {
    const newCostumeIdeas = [...profile.costumeIdeas]
    newCostumeIdeas[index] = value
    setProfile({ ...profile, costumeIdeas: newCostumeIdeas })
  }

  const addCostumeIdea = () => {
    if (profile.costumeIdeas.length < 3) {
      setProfile({ ...profile, costumeIdeas: [...profile.costumeIdeas, ""] })
    }
  }

  const removeCostumeIdea = () => {
    if (profile.costumeIdeas.length > 2) {
      const newCostumeIdeas = [...profile.costumeIdeas]
      newCostumeIdeas.pop()
      setProfile({ ...profile, costumeIdeas: newCostumeIdeas })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    let files: FileList | null
    if ('dataTransfer' in e) {
      files = e.dataTransfer.files
    } else if ('target' in e) {
      files = e.target.files
    } else {
      return
    }
    if (files) {
      setProfile({ ...profile, photos: [...profile.photos, ...Array.from(files)] })
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...profile.photos]
    newPhotos.splice(index, 1)
    setProfile({ ...profile, photos: newPhotos })
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result)
        else reject('Failed to convert file to Base64')
      }
      reader.onerror = error => reject(error)
    })
  }

  const handleSubmit = async () => {
    if (profile.photos.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one photo.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert photos to Base64
      const convertedPhotos = await Promise.all(
        profile.photos.map(async (file) => ({
          fileName: file.name.replace(/ /g, '_'),
          original: await convertFileToBase64(file),
          cropped: null, // Cropping is handled on a different page
        }))
      );

      const payload = {
        personData: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthdate: profile.birthdate,
          gender: profile.gender,
          ethnicity: profile.ethnicity,
        },
        images: convertedPhotos, // Changed from 'photos' to 'images'
      };

      console.log('\x1b[36m person-setup.tsx handleSubmit() payload\x1b[0m', payload);
      
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
      
      // Navigate to the review photos page
      router.push(`/profile/${params.id}/review-images`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred while uploading images',
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 to-black text-orange-50">
      <main className="container mx-auto px-4 py-16">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-8 flex items-center text-orange-100"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Ghost className="mr-4 h-12 w-12" />
          Person Profile
        </motion.h1>

        <Card className="bg-black/70 backdrop-blur-md border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-300">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-orange-200">First Name</Label>
                <Input 
                  id="firstName" 
                  name="firstName" 
                  value={profile.firstName} 
                  onChange={handleInputChange}
                  className="bg-black/50 border-orange-700 focus:border-orange-500 text-orange-100 placeholder-orange-300/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-orange-200">Last Name</Label>
                <Input 
                  id="lastName" 
                  name="lastName" 
                  value={profile.lastName} 
                  onChange={handleInputChange}
                  className="bg-black/50 border-orange-700 focus:border-orange-500 text-orange-100 placeholder-orange-300/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate" className="text-orange-200">Birthdate</Label>
                <Input 
                  id="birthdate" 
                  name="birthdate" 
                  type="date" 
                  value={profile.birthdate} 
                  onChange={handleInputChange}
                  className="bg-black/50 border-orange-700 focus:border-orange-500 text-orange-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-orange-200">Gender</Label>
                <RadioGroup 
                  value={profile.gender} 
                  onValueChange={(value) => handleSelectChange('gender', value)}
                  className="flex space-x-4"
                >
                  {["male", "female", "other"].map((gender) => (
                    <div key={gender} className="flex items-center space-x-2">
                      <RadioGroupItem value={gender} id={gender} className="border-orange-500 text-orange-500" />
                      <Label htmlFor={gender} className="capitalize text-orange-100">{gender}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ethnicity" className="text-orange-200">Ethnicity</Label>
                <Select 
                  value={profile.ethnicity} 
                  onValueChange={(value) => handleSelectChange('ethnicity', value)}
                >
                  <SelectTrigger className="bg-black/50 border-orange-700 focus:border-orange-500 text-orange-100">
                    <SelectValue placeholder="Select ethnicity" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-orange-700">
                    {["caucasian", "african", "asian", "hispanic", "other"].map((ethnicity) => (
                      <SelectItem key={ethnicity} value={ethnicity} className="capitalize text-orange-100">{ethnicity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-orange-200">Costume Ideas</Label>
                <div className="space-y-2">
                  {profile.costumeIdeas.map((idea, index) => (
                    <Input
                      key={index}
                      value={idea}
                      onChange={(e) => handleCostumeIdeaChange(index, e.target.value)}
                      placeholder={`Costume idea ${index + 1}`}
                      className="bg-black/50 border-orange-700 focus:border-orange-500 text-orange-100 placeholder-orange-300/50"
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <Button
                    type="button"
                    onClick={addCostumeIdea}
                    disabled={profile.costumeIdeas.length >= 3}
                    className="bg-orange-700 hover:bg-orange-600 text-orange-100"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Idea
                  </Button>
                  <Button
                    type="button"
                    onClick={removeCostumeIdea}
                    disabled={profile.costumeIdeas.length <= 2}
                    className="bg-orange-700 hover:bg-orange-600 text-orange-100"
                  >
                    <Minus className="mr-2 h-4 w-4" /> Remove Idea
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-orange-200">Upload Photos</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    dragActive ? 'border-orange-400 bg-orange-500/20' : 'border-orange-700'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleFileUpload}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <p className="text-orange-200">
                    Drag and drop your photos here, or{' '}
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-orange-400 hover:text-orange-300 underline"
                    >
                      click to upload
                    </button>
                  </p>
                </div>
                {profile.photos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-orange-200">Uploaded Photos</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {profile.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={URL.createObjectURL(photo)} 
                            alt={`Uploaded photo ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1 right-1 bg-black/50 text-orange-100 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="button" 
                  onClick={handleSubmit} 
                  className="bg-orange-600 hover:bg-orange-500 text-orange-100"
                  disabled={profile.photos.length === 0}
                >
                  Review Uploaded Photos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}