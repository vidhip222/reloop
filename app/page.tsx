"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Recycle, TrendingUp, ShoppingCart, Users, ArrowRight, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("waitlist").insert([{ email }])

      if (error) throw error

      setIsSubmitted(true)
      toast({
        title: "Welcome to ReLoop!",
        description: "You've been added to our waitlist. We'll notify you when we launch.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join waitlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{ backgroundImage: 'url("/placeholder.svg?height=100&width=100")', backgroundSize: "50px 50px" }}
      ></div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Recycle className="h-8 w-8 text-green-600" />
          <span className="text-2xl font-extrabold text-gray-900">ReLoop</span>
        </div>
        <Link href="/auth">
          <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent">
            Sign In
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <Badge className="mb-6 bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1 rounded-full">
          🌍 AI-Powered Retail Recovery
        </Badge>

        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
          Rethink Retail Returns.
          <br />
          <span className="text-green-600">Reduce Waste.</span>
          <br />
          <span className="text-blue-600">Maximize Recovery.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Cut costs, reduce landfill waste, and make the resale economy intelligent, scalable, and profitable with
          AI-powered return classification and supplier intelligence.
        </p>

        {/* Impact Stats */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 max-w-2xl mx-auto shadow-md">
          <p className="text-red-800 font-semibold text-lg">
            📊 2.6M+ tons of returned clothes go to landfill each year
          </p>
          <p className="text-red-600 mt-2 text-base">
            ReLoop diverts them to reuse, resale, and donation—turning waste into opportunity.
          </p>
        </div>

        {/* Waitlist Form */}
        {!isSubmitted ? (
          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-2 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-lg py-2 px-6 rounded-lg shadow-lg"
            >
              {isSubmitting ? "Joining..." : "Join Waitlist"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 text-green-600 mb-8 text-lg font-semibold">
            <CheckCircle className="h-6 w-6" />
            <span>You're on the list! We'll be in touch soon.</span>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-4">
          🌱 Returned goods become affordable essentials for underserved communities
        </p>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">Two Powerful Modules</h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Module 1 */}
          <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors duration-300 shadow-lg hover:shadow-xl rounded-xl">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-7 w-7 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  Module 1
                </Badge>
              </div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Smart Buyer & Supplier Intelligence
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                AI-powered restock prediction and supplier benchmarking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  SKU-level restock prediction with Gemini AI
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Live supplier benchmarking & quality scoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  AI-negotiated PO terms & MOQ optimization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Exception alerts for delays & quality issues
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Module 2 */}
          <Card className="border-2 border-green-200 hover:border-green-300 transition-colors duration-300 shadow-lg hover:shadow-xl rounded-xl">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-7 w-7 text-green-600" />
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  Module 2
                </Badge>
              </div>
              <CardTitle className="text-2xl font-semibold text-gray-900">Returns & Resale Manager</CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Intelligent return classification and automated resale routing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  AI image + metadata return classification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Auto resale routing (eBay, ThredUp, Depop)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Bulk return processing & CSV import
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Fraud detection & refund automation
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Social Impact */}
      <section className="bg-green-700 text-white py-16 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <Users className="h-14 w-14 mx-auto mb-6 text-green-200" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Social Impact at Scale</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Every return processed through ReLoop creates opportunities for underserved communities while reducing
            environmental waste.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-extrabold mb-2 text-green-100">2.6M+</div>
              <div className="text-green-200 text-base">Tons diverted from landfills</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold mb-2 text-green-100">85%</div>
              <div className="text-green-200 text-base">Cost reduction vs traditional returns</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold mb-2 text-green-100">10K+</div>
              <div className="text-green-200 text-base">Items redirected to communities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Recycle className="h-7 w-7 text-green-500" />
            <span className="text-xl font-bold">ReLoop</span>
          </div>
          <p className="text-gray-400 text-sm">© 2025 ReLoop. Making retail returns sustainable and profitable.</p>
        </div>
      </footer>
    </div>
  )
}
