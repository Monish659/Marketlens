import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractUserFromHeaders } from '@/lib/auth-adapter';
import { decryptSensitiveText, encryptSensitiveText } from '@/lib/crypto-safe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const headers = extractUserFromHeaders(request);

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!headers.email && !headers.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userEmail = headers.email || `user_${headers.id}@marketlens.local`;

    // Find user in Supabase
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // Create user if doesn't exist
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: userEmail,
          name: userEmail.split('@')[0] || `User ${headers.id}`
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
    const { data: sessions, error: sessionsError } = await supabaseAdmin
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
      prompt: decryptSensitiveText(session.prompt || ''),
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
    const headers = extractUserFromHeaders(request);

    if (!projectId || !sessionName) {
      return NextResponse.json({ 
        error: 'Project ID and session name are required' 
      }, { status: 400 });
    }

    if (!headers.email && !headers.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userEmail = headers.email || `user_${headers.id}@marketlens.local`;

    // Find or create user
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError && userError.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: userEmail,
          name: userEmail.split('@')[0] || `User ${headers.id}`
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
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('analysis_sessions')
      .insert({
        project_id: projectId,
        user_id: user.id,
        session_name: sessionName,
        prompt: encryptSensitiveText(prompt ?? ''),
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
      prompt: decryptSensitiveText(session.prompt || ''),
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
