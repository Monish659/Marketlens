"use client";

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dashboard } from "@/components/dashboard"
import { AgentLoading } from "@/components/agent-loading"

function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const userData = localStorage.getItem('user_data')
    const tokens = localStorage.getItem('auth_tokens')
    
    if (!userData || !tokens) {
      // No authentication found, redirect to login
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // Get project ID from URL params
      const projectParam = searchParams.get('project')
      if (projectParam) {
        setProjectId(projectParam)
        console.log('🔐 User authenticated on dashboard with project:', parsedUser, projectParam)
      } else {
        // No project specified, redirect to projects page
        router.push('/projects')
        return
      }
    } catch (error) {
      console.error('❌ Error parsing user data:', error)
      // Clear invalid data and redirect to login
      localStorage.removeItem('user_data')
      localStorage.removeItem('auth_tokens')
      router.push('/login')
      return
    }

    setIsLoading(false)
  }, [router, searchParams])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono">Loading...</div>
      </div>
    )
  }

  // Show dashboard if user is authenticated and project is selected
  if (user && projectId) {
    return (
      <div className="w-full min-h-screen bg-black">
        <Dashboard user={user} projectId={projectId} />
      </div>
    )
  }

  // This shouldn't happen due to the redirect above, but just in case
  return null
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
