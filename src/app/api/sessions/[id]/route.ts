import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractUserFromHeaders } from '@/lib/auth-adapter';
import { decryptSensitiveText, encryptSensitiveText } from '@/lib/crypto-safe';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = extractUserFromHeaders(request);

    if (!headers.email && !headers.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userEmail = headers.email || `user_${headers.id}@marketlens.local`;

    // Find user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('analysis_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

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
    console.error('Error in session GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { sessionName, analysisState, uiState, prompt } = await request.json();
    const headers = extractUserFromHeaders(request);

    if (!headers.email && !headers.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userEmail = headers.email || `user_${headers.id}@marketlens.local`;

    // Find user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update session
    const updateData: any = {};
    if (sessionName) updateData.session_name = sessionName;
    if (analysisState) updateData.analysis_state = analysisState;
    if (uiState) updateData.ui_state = uiState;
    if (typeof prompt === 'string') updateData.prompt = encryptSensitiveText(prompt);

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('analysis_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (sessionError) {
      console.error('Error updating session:', sessionError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

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
    console.error('Error in session PUT API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = extractUserFromHeaders(request);

    if (!headers.email && !headers.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userEmail = headers.email || `user_${headers.id}@marketlens.local`;

    // Find user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete session
    const { error: deleteError } = await supabaseAdmin
      .from('analysis_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting session:', deleteError);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Error in session DELETE API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
