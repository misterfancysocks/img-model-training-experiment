import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/header';

export const metadata: Metadata = {
  title: "Halloween Costume Generator",
  description: "Generate spooky and fun costume images with AI",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-orange-900 to-black"> {/* Added background gradient */}
        <Header />
        <main className="container mx-auto max-w-full mt-16 px-4 sm:px-6 lg:px-8">{children}</main> {/* Updated to full width and responsive padding */}
        <Toaster />
      </body>
    </html>
  );
}
