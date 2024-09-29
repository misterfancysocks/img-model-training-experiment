import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Upload, Brain, Ghost, Wand2, Image, Shield } from 'lucide-react'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950 to-black text-orange-50">
      <header className="relative h-96 overflow-hidden">
        <img
          src="/placeholder.svg?height=400&width=800"
          alt="Halloween AI-generated costumes"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center text-center p-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-orange-100">Unleash the Magic: Transform Yourself with Our Spooky Technology!</h1>
          <p className="text-xl max-w-2xl text-orange-50">
            Ever wondered how you'd look as a witch, vampire, or ghost? Our cutting-edge AI crafts realistic Halloween images of you or your children, bringing your costume dreams to life!
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 space-y-16">
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center text-orange-100">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Upload Your Photos", icon: Upload, description: "Start by uploading a few photos of yourself or your child. Our system uses these to create a custom AI model unique to you." },
              { title: "We Generate a Custom AI Model", icon: Brain, description: "Our advanced AI technology builds a personalized model based on your photos, ensuring the generated images are realistic and true to you." },
              { title: "Choose Your Spooky Costumes", icon: Ghost, description: "Select from a wide range of spooky costumes and themes. Whether it's a classic ghost or a mythical creature, the choice is yours!" },
              { title: "Our Spooky Technology Works Its Magic", icon: Wand2, description: "Sit back as our 'spooky technology' brings your chosen costumes to life, creating perfect Halloween images with you at the center!" },
              { title: "Receive and Enjoy Your Images", icon: Image, description: "Your personalized Halloween images are ready! Download them, share with friends, or use them to plan the ultimate costume." },
            ].map((step, index) => (
              <Card key={index} className="bg-orange-950 border-orange-400">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-100">
                    <step.icon className="mr-2 h-6 w-6" />
                    Step {index + 1}: {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-50">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-orange-950 p-8 rounded-lg border border-orange-400">
          <h2 className="text-3xl font-bold mb-4 text-orange-100 flex items-center">
            <Shield className="mr-2 h-8 w-8" />
            Your Privacy Is Our Priority
          </h2>
          <ul className="space-y-2 mb-4 text-orange-50">
            <li>• We respect your privacy and are committed to protecting your personal data.</li>
            <li>• Your photos and generated images are 100% yours.</li>
            <li>• We will never use your data for anything else, and we will never sell or share it with third parties.</li>
          </ul>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Secure Storage", description: "All your data is securely stored using advanced encryption." },
              { title: "Exclusive Access", description: "Only you have access to your images and personal AI model." },
              { title: "Data Deletion", description: "You can request deletion of your data at any time." },
            ].map((item, index) => (
              <Card key={index} className="bg-black border-orange-400">
                <CardHeader>
                  <CardTitle className="text-orange-100">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-50">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-orange-50">
            For more information, please read our{" "}
            <Link href="/privacy-policy" className="text-orange-300 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-orange-100">Ready to see the magic?</h2>
          <div className="space-x-4">
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-black font-bold">
              <Link href="/order-creation">Get Started Now</Link>
            </Button>
            <Button asChild variant="secondary" className="border-orange-400 text-orange-100 hover:bg-orange-900 hover:text-orange-50">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-4 text-orange-100">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-orange-400">
              <AccordionTrigger className="text-orange-100 hover:text-orange-200">How do you use my photos?</AccordionTrigger>
              <AccordionContent className="text-orange-50">
                Your photos are used solely to create a custom AI model for generating your Halloween images. They are not used for any other purpose.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-orange-400">
              <AccordionTrigger className="text-orange-100 hover:text-orange-200">Is my data safe?</AccordionTrigger>
              <AccordionContent className="text-orange-50">
                Yes, we use top-tier security measures to protect your data. Your privacy is of utmost importance to us.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>
    </div>
  )
}