import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, getUser } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    
    // Get all sessions for the project (user isolation handled by RLS)
    const { data: sessions, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || []
    })

  } catch (error) {
    console.error('Error in sessions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { projectId, sessionName, prompt, analysisState, uiState } = await request.json()

    if (!projectId || !sessionName || !prompt) {
      return NextResponse.json({ 
        error: 'Project ID, session name, and prompt are required' 
      }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    
    const { data: session, error } = await supabase
      .from('analysis_sessions')
      .insert({
        project_id: projectId,
        user_id: user.id,
        session_name: sessionName,
        prompt: prompt,
        analysis_state: analysisState || {},
        ui_state: uiState || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    console.log('✅ Created session for user:', user.email, 'Session:', session.session_name)

    return NextResponse.json({
      success: true,
      session
    })

  } catch (error) {
    console.error('Error in create session API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
