"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "@/lib/auth"
import { signUp } from "@/lib/auth"

interface LoginFormData {
  email: string
  password: string
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      let authError = null
      if (isSigningUp) {
        const { error } = await signUp(data.email, data.password)
        authError = error
      } else {
        const { error } = await signIn(data.email, data.password)
        authError = error
      }

      if (authError) {
        setError(authError.message)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">ReLoop</CardTitle>
          <CardDescription>AI-Powered Retail Operations Assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (isSigningUp ? "Signing up..." : "Signing in...") : isSigningUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            {isSigningUp ? (
              <>
                Already have an account?{" "}
                <Button variant="link" onClick={() => setIsSigningUp(false)} className="p-0 h-auto">
                  Sign In
                </Button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <Button variant="link" onClick={() => setIsSigningUp(true)} className="p-0 h-auto">
                  Sign Up
                </Button>
              </>
            )}
          </div>
          <div className="mt-2 text-center text-sm text-gray-600">
            Demo credentials: admin@reloop.com / password123 (Sign up first if not registered)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
