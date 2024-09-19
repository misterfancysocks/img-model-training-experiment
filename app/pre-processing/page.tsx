import dynamic from 'next/dynamic';

const PreProcessing = dynamic(() => import('@/components/pre-processing'), { ssr: false });

export default function PreProcessingPage() {
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold my-4">Pre-processing</h1>
      <PreProcessing />
    </div>
  );
}