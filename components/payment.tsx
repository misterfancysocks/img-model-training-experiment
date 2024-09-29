"use client"

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Icons } from "@/components/ui/icons"
export default function PaymentPage() {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    if (!stripe || !elements) {
      setLoading(false)
      return
    }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    })

    if (stripeError) {
      setError(stripeError.message)
      setLoading(false)
      return
    }

    // Here you would typically send the paymentMethod.id to your server
    // to complete the payment. For this example, we'll just simulate success.
    console.log('Payment successful:', paymentMethod)
    setLoading(false)
    // Redirect to a success page or show a success message
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950 to-black text-orange-50 py-12">
      <main className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto bg-black/80 backdrop-blur-md border-orange-500 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-300">Complete Your Purchase</CardTitle>
            <CardDescription className="text-orange-200">Secure payment via Stripe</CardDescription>
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
                  <Label htmlFor="card-element" className="text-orange-200">Card Details</Label>
                  <div className="bg-orange-900/30 border border-orange-700 rounded-md p-3">
                    <CardElement options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#fff',
                          '::placeholder': {
                            color: '#ffa500',
                          },
                        },
                      },
                    }} />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required />
                  <Label htmlFor="terms" className="text-sm text-orange-200">
                    I agree to the <a href="#" className="text-orange-400 hover:underline">Terms of Service</a> and <a href="#" className="text-orange-400 hover:underline">Privacy Policy</a>
                  </Label>
                </div>

                {error && <p className="text-red-500">{error}</p>}

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
            <p className="text-xs text-orange-300">Your payment is securely processed by Stripe. We do not store your card details.</p>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}