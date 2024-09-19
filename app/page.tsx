import Link from 'next/link';
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-orange-900 to-black text-white">
      <div className="w-64 p-6 bg-black bg-opacity-50">
        <h1 className="text-3xl font-bold mb-8">Costumes App</h1>
        <div className="space-y-4">
          <Link href="/upload-and-crop">
            <Button className="w-full">Upload and Crop</Button>
          </Link>
          <Link href="/pre-processing">
            <Button className="w-full">Pre-processing</Button>
          </Link>
        </div>
      </div>
      <div className="flex-grow p-6">
        <h2 className="text-2xl font-bold mb-4">Welcome to Costumes App</h2>
        <p>Select an option from the sidebar to get started.</p>
      </div>
    </div>
  );
}
