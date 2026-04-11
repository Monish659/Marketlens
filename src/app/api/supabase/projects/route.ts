import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, getUser } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createSupabaseServerClient()
    
    // Get all projects for the current user
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        analysis_sessions(count)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Add session count to each project
    const projectsWithCounts = projects?.map(project => ({
      ...project,
      sessionCount: project.analysis_sessions?.[0]?.count || 0
    })) || []

    return NextResponse.json({
      success: true,
      projects: projectsWithCounts
    })

  } catch (error) {
    console.error('Error in projects API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    console.log('✅ Created project for user:', user.email, 'Project:', project.name)

    return NextResponse.json({
      success: true,
      project
    })

  } catch (error) {
    console.error('Error in create project API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
