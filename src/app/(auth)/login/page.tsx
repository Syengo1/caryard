"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/admin"
  const urlError = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw new Error(error.message)

      window.location.href = redirectTo
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred.")
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-none bg-transparent sm:border sm:shadow-sm sm:bg-card">
      <CardHeader className="px-0 sm:px-6">
        <CardTitle className="text-2xl font-heading">Staff Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the admin dashboard.
        </CardDescription>
        {urlError === "unauthorized" && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mt-4 border border-destructive/20 font-medium">
            Access denied. You must be an active staff member to view this page.
          </div>
        )}
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@motamotors.co.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          {formError && (
            <p className="text-sm text-destructive font-medium">{formError}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex justify-center items-center h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}