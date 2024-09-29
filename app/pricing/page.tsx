"use client"

import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Ghost, DollarSign, Plus } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 to-black text-orange-50">
      <main className="container mx-auto px-4 py-16">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-8 flex items-center justify-center text-orange-100"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Ghost className="mr-4 h-12 w-12" />
          Pricing
        </motion.h1>

        <div className="max-w-3xl mx-auto">
          <Card className="bg-black/70 backdrop-blur-md border-none shadow-xl mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-orange-300">Halloween Costume AI Images</CardTitle>
              <CardDescription className="text-orange-200">Transform yourself with AI-generated costume images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-orange-800/30 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-6 w-6 mr-2 text-orange-400" />
                  <span className="text-xl font-semibold">$30</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">50 images</p>
                  <p className="text-sm text-orange-300">for 1 person</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-800/30 rounded-lg">
                <div className="flex items-center">
                  <Plus className="h-6 w-6 mr-2 text-orange-400" />
                  <span className="text-xl font-semibold">$15</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">Each additional 50 images</p>
                  <p className="text-sm text-orange-300">per person</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button className="bg-orange-600 hover:bg-orange-500 text-orange-100">
                Get Started
              </Button>
            </CardFooter>
          </Card>

          <div className="text-center text-orange-200 space-y-4">
            <h2 className="text-2xl font-semibold">Why Choose Our AI Costume Images?</h2>
            <ul className="list-disc list-inside text-left max-w-md mx-auto">
              <li>Unique, personalized costume ideas</li>
              <li>High-quality, realistic images</li>
              <li>Instant results - no waiting for shipping</li>
              <li>Try on multiple costumes without leaving home</li>
              <li>Perfect for inspiration or virtual Halloween parties</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}