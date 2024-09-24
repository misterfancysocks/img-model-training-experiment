import Link from 'next/link';
import { LoraTraining } from '@/components/lora-training';

export default function LoraTrainingPage() {
  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">LoRA Training</h1>
        <Link href="/lora-training" className="text-blue-500 hover:text-blue-700">
          Go to LoRA Training
        </Link>
      </header>
      <LoraTraining />
    </div>
  );
}