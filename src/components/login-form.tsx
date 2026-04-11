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
import { AgentLoading } from "@/components/agent-loading"
import { startGoogleOAuth } from "@/lib/supabase-oauth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showLoading, setShowLoading] = useState(false)

  // Check for existing authentication on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user_data')
    const tokens = localStorage.getItem('auth_tokens')
    
    if (userData && tokens) {
      setShowLoading(true)
      console.log('🔐 User already authenticated:', JSON.parse(userData))
    }
  }, [])

  const handleLoadingComplete = () => {
    const userData = localStorage.getItem('user_data')
    if (userData) {
      // Redirect to projects page after loading animation completes
      window.location.href = '/projects'
    }
    setShowLoading(false)
  }

  // If user is already authenticated, redirect to projects
  if (user) {
    window.location.href = '/projects'
    return null
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // Clear any stale state before redirecting to Google OAuth
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('user_data')
      await startGoogleOAuth()
    } catch (error) {
      console.error('❌ Google login error:', error)
      alert('Google login failed. Check Supabase Google provider settings and try again.')
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📧 Attempting email login with:', { email })
    
    if (!email || !password) {
      console.error('❌ Email and password are required')
      return
    }
    
    // Clear any old/invalid tokens before attempting login
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('user_data');
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ Login successful:', data.user)
        
        // Store tokens in localStorage for session management
        // Store the entire response as auth_tokens (contains access_token, etc.)
        localStorage.setItem('auth_tokens', JSON.stringify(data))
        localStorage.setItem('user_data', JSON.stringify(data.user))
        
        // Clear form
        setEmail('')
        setPassword('')
        
        // Show loading animation before redirecting to projects
        setShowLoading(true)
      } else {
        console.error('❌ Login failed:', data.error)
        alert(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      alert('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = () => {
    console.log('📝 Redirecting to signup page...')
    window.location.href = '/signup'
  }

  // Show loading animation if needed
  if (showLoading) {
    return <AgentLoading onComplete={handleLoadingComplete} />
  }

  return (
    <div className={cn("flex w-full max-w-sm mx-auto flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-mono">Welcome back</CardTitle>
          <CardDescription className="font-mono">
            Login with your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4 font-mono">
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full cursor-pointer"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </div>
              <div className="after:border-border font-mono relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
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
                    {/* <a
                      href="#"
                      className="ml-auto font-mono text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a> */}
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full font-mono cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </div>
              <div className="text-center font-mono text-sm">
                Don&apos;t have an account?{" "}
                <button 
                  type="button"
                  onClick={handleSignup}
                  className="underline underline-offset-4 cursor-pointer bg-transparent border-none p-0"
                >
                  Sign up
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground font-mono *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
