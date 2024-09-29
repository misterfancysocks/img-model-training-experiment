"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Icons } from "@/components/ui/icons"
import { useToast } from "@/hooks/use-toast"

export default function PaymentPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    // Simulate payment processing
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Payment Successful",
        description: "Your order has been processed.",
        duration: 5000,
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950 to-black text-orange-50 py-12">
      <main className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto bg-black/80 backdrop-blur-md border-orange-500 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-300">Complete Your Purchase</CardTitle>
            <CardDescription className="text-orange-200">Secure payment processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-orange-900/50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-orange-200">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Person Profile Processing (1)</span>
                    <span>$15.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>50 Image Bundle (1)</span>
                    <span>$20.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-orange-300 pt-2 border-t border-orange-700">
                    <span>Total</span>
                    <span>$35.00</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-orange-200">Email</Label>
                  <Input id="email" type="email" required className="bg-orange-900/30 border-orange-700 text-orange-100" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-number" className="text-orange-200">Card Number</Label>
                  <Input id="card-number" placeholder="1234 5678 9012 3456" required className="bg-orange-900/30 border-orange-700 text-orange-100" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-orange-200">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" required className="bg-orange-900/30 border-orange-700 text-orange-100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc" className="text-orange-200">CVC</Label>
                    <Input id="cvc" placeholder="123" required className="bg-orange-900/30 border-orange-700 text-orange-100" />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required />
                  <Label htmlFor="terms" className="text-sm text-orange-200">
                    I agree to the <a href="#" className="text-orange-400 hover:underline">Terms of Service</a> and <a href="#" className="text-orange-400 hover:underline">Privacy Policy</a>
                  </Label>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-orange-100">
                  {loading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Complete Purchase'
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-orange-300">Your payment is securely processed. We do not store your card details.</p>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}