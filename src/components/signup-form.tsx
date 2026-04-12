"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from 'react'
import { startGoogleOAuth } from "@/lib/supabase-oauth"

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Check for existing authentication on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user_data')
    const tokens = localStorage.getItem('auth_tokens')
    
    if (userData && tokens) {
      setUser(JSON.parse(userData))
    }
  }, [])

  // If user is already authenticated, show a different UI
  if (user) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-mono">Welcome back!</CardTitle>
            <CardDescription className="font-mono">
              You're already signed in as {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                localStorage.removeItem('user_data')
                localStorage.removeItem('auth_tokens')
                setUser(null)
                window.location.reload()
              }}
              variant="outline" 
              className="w-full font-mono"
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    try {
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('user_data')
      await startGoogleOAuth()
    } catch (error) {
      console.error('❌ Google signup error:', error)
      alert('Google signup failed. Check Supabase Google provider settings and try again.')
      setIsLoading(false)
    }
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (!email || !password) {
      alert('Email and password are required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: email.split('@')[0]
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store user data and token
        localStorage.setItem('user_data', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          sub: data.user.id,
          user_id: data.user.id,
          email_verified: false,
          picture: `https://avatar.vercel.sh/${data.user.email}`
        }))
        
        if (data.session?.access_token) {
          localStorage.setItem('auth_tokens', JSON.stringify({
            access_token: data.session.access_token,
            token_type: 'Bearer'
          }))
        }
        
        alert('✅ Account created! Redirecting...')
        setTimeout(() => window.location.href = '/projects', 1000)
      } else {
        alert('❌ ' + (data.error || 'Signup failed'))
      }
    } catch (error) {
      console.error('Signup error:', error)
      alert('❌ Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = () => {
    window.location.href = '/login'
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-mono">Welcome to MarketLens!</CardTitle>
          <CardDescription className="font-mono">
            Sign up with your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignup}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4 font-mono">
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full cursor-pointer"
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Signup with Google
                </Button>
              </div>
              <div className="after:border-border font-mono relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or signup with
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3 font-mono">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3 font-mono">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="grid gap-3 font-mono">
                  <div className="flex items-center">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                  </div>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full font-mono cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing up...' : 'Sign Up'}
                </Button>
              </div>
              <div className="text-center font-mono text-sm">
                Already have an account?{" "}
                <button 
                  type="button"
                  onClick={handleLogin}
                  className="underline underline-offset-4 cursor-pointer bg-transparent border-none p-0"
                >
                  Login
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
