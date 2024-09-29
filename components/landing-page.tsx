"use client";

import { Button } from "@/components/ui/button";
import { Ghost, Upload, Wand2 } from "lucide-react";
import Image from "next/image";
import { TryItNowButton } from "@/components/try-it-now-button";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 to-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col justify-start">
            <HeroSection />
          </div>
          <div className="pt-8 lg:pt-0">
            <HeroImage />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <div className="flex flex-col justify-start space-y-6">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl">
          Conjure Your Perfect Halloween Costume
          <span className="text-orange-500"> with AI Magic!</span>
        </h1>
        <p className="text-xl text-gray-300">
          Transform your look with our AI-powered costume generator. Upload a photo, let our AI work its magic, and discover your spooktacular new appearance!
        </p>
      </div>
      <div className="space-y-4 sm:flex sm:space-x-4 sm:space-y-0">
        <TryItNowButton />
        <Button 
          variant="secondary" 
          className="w-full sm:w-auto border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
        >
          Learn More
        </Button>
      </div>
      <div className="pt-4 grid gap-4 sm:grid-cols-3">
        <FeatureItem icon={<Upload className="h-6 w-6 text-orange-500" />} text="Upload Photos" />
        <FeatureItem icon={<Wand2 className="h-6 w-6 text-orange-500" />} text="Train AI" />
        <FeatureItem icon={<Ghost className="h-6 w-6 text-orange-500" />} text="Generate Costumes" />
      </div>
    </div>
  );
}

function HeroImage() {
  const images = [
    { src: '/baseline.png', alt: 'Baseline Costume' },
    { src: '/astronaut.png', alt: 'Astronaut Costume' },
    { src: '/princess.png', alt: 'Princess Costume' },
    { src: '/green_lady.png', alt: 'Villain Costume' },
  ]; // Ensure this array is properly closed

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-[1/2.5]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover rounded-lg shadow-2xl"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center space-x-3">
      {icon}
      <span>{text}</span>
    </div>
  );
}
