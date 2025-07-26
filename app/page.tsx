import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { TrendingUp, RefreshCw } from "lucide-react"
import { Header } from "@/components/layout/header"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-4xl w-full grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <TrendingUp className="h-12 w-12 text-blue-600 mb-4" />
            <CardTitle className="text-2xl font-bold mb-2">Smart Buyer & Supplier Intelligence</CardTitle>
            <CardContent className="text-gray-600 mb-6">
              Optimize inventory restocking and supplier management with AI-driven forecasts.
            </CardContent>
            <Button asChild>
              <Link href="/buyer-intelligence">Go to Buyer Intelligence</Link>
            </Button>
          </Card>
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <RefreshCw className="h-12 w-12 text-green-600 mb-4" />
            <CardTitle className="text-2xl font-bold mb-2">Returns & Resale Manager</CardTitle>
            <CardContent className="text-gray-600 mb-6">
              Turn returns into revenue with smart resale and recovery decisions.
            </CardContent>
            <Button asChild>
              <Link href="/returns-manager">Go to Returns Manager</Link>
            </Button>
          </Card>
        </div>
      </main>
      <footer className="w-full border-t bg-white p-4 text-center text-sm text-gray-500">
        © 2025 ReLoop. All rights reserved.
      </footer>
    </div>
  )
}
