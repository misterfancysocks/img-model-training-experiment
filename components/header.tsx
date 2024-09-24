'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Costumes App
        </Link>
        <ul className="flex space-x-4">
          <li>
            <Link
              href="/upload-and-crop"
              className={`hover:text-gray-300 ${
                pathname === '/upload-and-crop' ? 'underline' : ''
              }`}
            >
              Upload & Crop
            </Link>
          </li>
          <li>
            <Link
              href="/pre-processing"
              className={`hover:text-gray-300 ${
                pathname === '/pre-processing' ? 'underline' : ''
              }`}
            >
              Pre-processing
            </Link>
          </li>
          <li>
            <Link
              href="/lora-training"
              className={`hover:text-gray-300 ${
                pathname === '/lora-training' ? 'underline' : ''
              }`}
            >
              LoRA Training
            </Link>
          </li>
          <li>
            <Link
              href="/image-generation"
              className={`hover:text-gray-300 ${
                pathname === '/image-generation' ? 'underline' : ''
              }`}
            >
              Image Generation
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;