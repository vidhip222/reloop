"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SheetTrigger, SheetContent, Sheet } from "@/components/ui/sheet"
import { Home, Package, ShoppingCart, LineChart, Settings, Menu, LogOut } from "lucide-react"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { signOut } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function Header() {
  const { toast } = useToast()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      })
      router.push("/login")
    } catch (error) {
      toast({
        title: "Sign Out Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="flex h-16 w-full items-center justify-between gap-4 border-b bg-white px-4 md:px-6 dark:bg-gray-950">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="lg:hidden bg-transparent" size="icon" variant="outline">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <Link className="mr-6 flex items-center" href="#">
            <Package className="h-6 w-6" />
            <span className="sr-only">ReLoop</span>
          </Link>
          <div className="grid gap-2 py-6">
            <Link
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="/dashboard"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="/purchase-orders"
            >
              <ShoppingCart className="h-4 w-4" />
              Purchase Orders
            </Link>
            <Link
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="/returns-manager"
            >
              <Package className="h-4 w-4" />
              Returns Manager
            </Link>
            <Link
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="/buyer-intelligence"
            >
              <LineChart className="h-4 w-4" />
              Buyer Intelligence
            </Link>
            <Link
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="/settings"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <Button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              variant="ghost"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Link className="hidden items-center gap-2 font-semibold lg:flex" href="#">
        <Package className="h-6 w-6" />
        <span className="">ReLoop</span>
      </Link>
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          className="text-gray-500 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50"
          href="/dashboard"
        >
          Dashboard
        </Link>
        <Link
          className="text-gray-500 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50"
          href="/purchase-orders"
        >
          Purchase Orders
        </Link>
        <Link
          className="text-gray-500 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50"
          href="/returns-manager"
        >
          Returns Manager
        </Link>
        <Link
          className="text-gray-500 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50"
          href="/buyer-intelligence"
        >
          Buyer Intelligence
        </Link>
        <Link
          className="text-gray-500 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50"
          href="/settings"
        >
          Settings
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        <ModeToggle />
        <Button onClick={handleSignOut} variant="ghost" size="icon">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sign Out</span>
        </Button>
      </div>
    </header>
  )
}
