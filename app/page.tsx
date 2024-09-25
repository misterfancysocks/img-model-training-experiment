import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { Ghost } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 to-black text-orange-100">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 font-heading text-orange-100">
            Halloween Costume Generator
          </h1>
          <p className="text-xl text-orange-200">
            Generate spooky and fun costume images with AI
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Link href="/upload-and-crop" className="block">
            <Button className="w-full h-32 text-xl font-bold bg-orange-500 hover:bg-orange-600 text-white">
              <Ghost className="mr-2 h-6 w-6" />
              Upload and Crop
            </Button>
          </Link>
          <Link href="/pre-processing" className="block">
            <Button className="w-full h-32 text-xl font-bold bg-orange-500 hover:bg-orange-600 text-white">
              Pre-processing
            </Button>
          </Link>
          <Link href="/lora-training" className="block">
            <Button className="w-full h-32 text-xl font-bold bg-orange-500 hover:bg-orange-600 text-white">
              LoRA Training
            </Button>
          </Link>
          <Link href="/image-generation" className="block">
            <Button className="w-full h-32 text-xl font-bold bg-orange-500 hover:bg-orange-600 text-white">
              Image Generation
            </Button>
          </Link>
        </div>

        <footer className="mt-16 text-center text-orange-200">
          <p>&copy; 2024 Halloween Costume Generator. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
