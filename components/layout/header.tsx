"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Settings, HelpCircle, LogOut, User, Package, RotateCcw } from "lucide-react"
import { signOut, getCurrentUser } from "@/lib/auth"

interface HeaderProps {
  userEmail?: string
}

export function Header() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser()
      if (user) {
        setUserEmail(user.email || "User")
      } else {
        setUserEmail(undefined)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-xl font-bold text-blue-600">ReLoop</span>
          </Link>
          <nav className="hidden md:flex space-x-4 ml-6">
            <Button variant="ghost" asChild>
              <Link href="/buyer-intelligence" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Buyer Intelligence</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/returns-manager" className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4" />
                <span>Returns Manager</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <span>Dashboard</span>
              </Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4" />
          </Button>

          {userEmail ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{userEmail}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
