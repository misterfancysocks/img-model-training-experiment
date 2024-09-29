"use client"

import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Ghost, User, ImageIcon, Clock, Shield, Wand2 } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950 to-black text-orange-50">
      <main className="container mx-auto px-4 py-16">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-8 text-center text-orange-100"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Transform Your Halloween with Personalized AI Costume Images!
        </motion.h1>
        <p className="text-xl text-center mb-12 text-orange-200">
          Affordable, fun, and endless costume possibilities for you and your loved ones.
        </p>

        <div className="max-w-4xl mx-auto space-y-12">
          <Card className="bg-black/80 backdrop-blur-md border-orange-500 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-orange-300 flex items-center">
                <User className="mr-2 h-6 w-6" />
                Start with Your Personalized Profile
              </CardTitle>
              <CardDescription className="text-orange-200">One-time setup fee for each person</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-orange-900/50 rounded-lg">
                <div className="flex items-center mb-4 md:mb-0">
                  <span className="text-3xl font-bold text-orange-100">$15</span>
                  <span className="ml-2 text-orange-200">per person</span>
                </div>
                <ul className="text-sm space-y-1 text-orange-100">
                  <li>• AI processing of uploaded photos</li>
                  <li>• Background removal from images</li>
                  <li>• Generation of captions for images</li>
                  <li>• Creation of a personalized profile</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 backdrop-blur-md border-orange-500 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-orange-300 flex items-center">
                <ImageIcon className="mr-2 h-6 w-6" />
                Choose Your Image Bundle
              </CardTitle>
              <CardDescription className="text-orange-200">High-quality AI-generated costume images</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-orange-500">
                    <TableHead className="text-orange-300">Bundle</TableHead>
                    <TableHead className="text-orange-300">Price</TableHead>
                    <TableHead className="text-orange-300">Ideal For</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-orange-700">
                    <TableCell className="font-medium text-orange-100">50 Images</TableCell>
                    <TableCell className="text-orange-200">$20</TableCell>
                    <TableCell className="text-orange-200">Exploring multiple costumes</TableCell>
                  </TableRow>
                  <TableRow className="border-orange-700">
                    <TableCell className="font-medium text-orange-100">100 Images</TableCell>
                    <TableCell className="text-orange-200">$35</TableCell>
                    <TableCell className="text-orange-200">Extensive costume collections</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <h2 className="text-3xl font-semibold text-center text-orange-300">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: 1, title: "Create a profile", description: "$10 per person", icon: User },
                { step: 2, title: "Purchase a bundle", description: "50 or 100 images", icon: ImageIcon },
                { step: 3, title: "Generate images", description: "Download and enjoy!", icon: Wand2 },
              ].map((item) => (
                <Card key={item.step} className="bg-orange-900/50 border-none">
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-200">
                      <item.icon className="mr-2 h-6 w-6" />
                      Step {item.step}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-orange-100">{item.title}</p>
                    <p className="text-sm text-orange-200">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-3xl font-semibold text-center text-orange-300">Examples of Total Costs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Single User", details: ["Profile Processing: $15", "50 Image Bundle: $20"], total: "$35" },
                { title: "Two Siblings", details: ["Profile Processing: $25", "50 Image Bundle for Each: $40"], total: "$65" },
                { title: "Add More Images", details: ["Already have a profile", "Additional 50 Image Bundle: $20"], total: "$20" },
              ].map((scenario, index) => (
                <Card key={index} className="bg-orange-900/50 border-none">
                  <CardHeader>
                    <CardTitle className="text-orange-200">{scenario.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4 text-orange-100">
                      {scenario.details.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                    <p className="font-bold text-orange-300">Total: {scenario.total}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="bg-black/80 backdrop-blur-md border-orange-500 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-orange-300">Why Choose Our AI Costume Generator?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { text: "Unlimited costume ideas", icon: Ghost },
                  { text: "High-quality, shareable images", icon: ImageIcon },
                  { text: "Easy and fast generation process", icon: Clock },
                  { text: "Secure payment and data protection", icon: Shield },
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center text-orange-100">
                    <benefit.icon className="mr-2 h-5 w-5 text-orange-400" />
                    <span>{benefit.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button className="bg-orange-600 hover:bg-orange-500 text-orange-100 font-bold py-3 px-6 text-lg">
                Get Started Now
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}