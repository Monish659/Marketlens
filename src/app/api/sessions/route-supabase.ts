import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userEmail = request.headers.get('x-user-email');
    const userId = request.headers.get('x-user-id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!userEmail && !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Find user in Supabase
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail || `user_${userId}@marketlens.local`)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // Create user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: userEmail || `user_${userId}@marketlens.local`,
          name: userEmail?.split('@')[0] || `User ${userId}`
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      user = newUser;
    }

    // Get sessions for this project and user
    const { data: sessions, error: sessionsError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Format to match old MongoDB API
    const formattedSessions = sessions?.map(session => ({
      _id: session.id,
      projectId: session.project_id,
      sessionName: session.session_name,
      prompt: session.prompt,
      analysisState: session.analysis_state,
      uiState: session.ui_state,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      sessions: formattedSessions
    });

  } catch (error) {
    console.error('Error in sessions GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, sessionName, prompt, analysisState, uiState } = await request.json();
    const userEmail = request.headers.get('x-user-email');
    const userId = request.headers.get('x-user-id');

    if (!projectId || !sessionName || !prompt) {
      return NextResponse.json({ 
        error: 'Project ID, session name, and prompt are required' 
      }, { status: 400 });
    }

    if (!userEmail && !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Find or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail || `user_${userId}@marketlens.local`)
      .single();

    if (userError && userError.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: userEmail || `user_${userId}@marketlens.local`,
          name: userEmail?.split('@')[0] || `User ${userId}`
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      user = newUser;
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
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
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    console.log('✅ Created session for user:', user.email, 'Session:', session.session_name);

    // Format to match old API
    const formattedSession = {
      _id: session.id,
      projectId: session.project_id,
      sessionName: session.session_name,
      prompt: session.prompt,
      analysisState: session.analysis_state,
      uiState: session.ui_state,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    };

    return NextResponse.json({
      success: true,
      session: formattedSession
    });

  } catch (error) {
    console.error('Error in create session API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
