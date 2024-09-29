"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ghost, ImageIcon, DollarSign } from 'lucide-react'

// Define the props interface
interface OrderCreationProps {
  orderId: string;
}

// Constants for pricing
const PROFILE_COST = 15;
const BUNDLE_COSTS = { '50': 20, '100': 35 };

export default function OrderCreation({ orderId }: OrderCreationProps) {
  const [profiles, setProfiles] = useState(1)
  const [bundles, setBundles] = useState({ '50': 0, '100': 0 })

  const totalCost = (profiles * PROFILE_COST) + 
    (bundles['50'] * BUNDLE_COSTS['50']) + 
    (bundles['100'] * BUNDLE_COSTS['100'])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfiles(Math.max(1, parseInt(e.target.value) || 0))
  }

  const handleBundleChange = (bundleType: '50' | '100', value: string) => {
    setBundles(prev => ({ ...prev, [bundleType]: parseInt(value) || 0 }))
  }

  return (
    <Card className="max-w-2xl mx-auto bg-black/80 backdrop-blur-md border-orange-500 shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl text-orange-300 flex items-center justify-center">
          <Ghost className="mr-2 h-8 w-8" />
          Create Your Halloween Order
        </CardTitle>
        <CardDescription className="text-center text-orange-200">
          Customize your Halloween costume package (Order ID: {orderId})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="profiles" className="text-lg text-orange-300 flex items-center">
            <Ghost className="mr-2 h-5 w-5" />
            Number of Person Profiles
          </Label>
          <Input
            id="profiles"
            type="number"
            min="1"
            value={profiles}
            onChange={handleProfileChange}
            className="bg-orange-900/30 border-orange-700 text-orange-100"
          />
          <p className="text-sm text-orange-200">
            Cost per profile: ${PROFILE_COST.toFixed(2)}
          </p>
        </div>

        <div className="space-y-4">
          <Label className="text-lg text-orange-300 flex items-center">
            <ImageIcon className="mr-2 h-5 w-5" />
            Image Bundles
          </Label>
          {Object.entries(BUNDLE_COSTS).map(([bundleSize, cost]) => (
            <div key={bundleSize} className="flex items-center space-x-4">
              <Select
                value={bundles[bundleSize as '50' | '100'].toString()}
                onValueChange={(value) => handleBundleChange(bundleSize as '50' | '100', value)}
              >
                <SelectTrigger className="w-32 bg-orange-900/30 border-orange-700 text-orange-100">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-orange-200">
                {bundleSize} Image Bundle (${cost.toFixed(2)} each)
              </span>
            </div>
          ))}
        </div>

        <Card className="bg-orange-900/50 border-orange-700">
          <CardHeader>
            <CardTitle className="text-xl text-orange-300 flex items-center justify-between">
              <span>Order Summary</span>
              <DollarSign className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Person Profiles ({profiles})</span>
              <span>${(profiles * PROFILE_COST).toFixed(2)}</span>
            </div>
            {Object.entries(bundles).map(([bundleSize, quantity]) => (
              quantity > 0 && (
                <div key={bundleSize} className="flex justify-between">
                  <span>{bundleSize} Image Bundles ({quantity})</span>
                  <span>${(quantity * BUNDLE_COSTS[bundleSize as '50' | '100']).toFixed(2)}</span>
                </div>
              )
            ))}
            <div className="flex justify-between font-bold text-orange-300 pt-2 border-t border-orange-700">
              <span>Total</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-orange-600 hover:bg-orange-500 text-orange-100">
          Proceed to Checkout
        </Button>
      </CardFooter>
    </Card>
  )
}