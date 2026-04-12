import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractUserFromHeaders } from '@/lib/auth-adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = extractUserFromHeaders(request);
    
    console.log('🔍 [PROJECT-DETAIL] Headers:', headers);
    console.log('📋 [PROJECT-DETAIL] Fetching project ID:', id);

    if (!headers.email && !headers.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userEmail = headers.email || `user_${headers.id}@marketlens.local`;
    console.log('👤 [PROJECT-DETAIL] Looking for user with email:', userEmail);

    // Find user in Supabase
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    console.log('👤 [PROJECT-DETAIL] User lookup result:', { user: user?.email, error: userError?.code });

    if (userError && userError.code === 'PGRST116') {
      // Create user if doesn't exist
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: userEmail || `user_${headers.id}@marketlens.local`,
          name: userEmail?.split('@')[0] || `User ${headers.id}`
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      user = newUser;
    } else if (userError) {
      console.error('💥 [PROJECT-DETAIL] Error finding user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('👤 [PROJECT-DETAIL] Final user for project fetch:', user?.email, 'ID:', user?.id);

    if (!user || !user.id) {
      console.error('💥 [PROJECT-DETAIL] User is null or missing ID');
      return NextResponse.json({ error: 'Failed to identify user' }, { status: 500 });
    }

    // Get project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Format to match old API
    const formattedProject = {
      _id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    };

    return NextResponse.json({ 
      project: formattedProject 
    });

  } catch (error) {
    console.error('Error in project detail API:', error);
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

    // Find user in Supabase
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // Create user if doesn't exist so auth mapping remains consistent
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: userEmail || `user_${headers.id}@marketlens.local`,
          name: userEmail?.split('@')[0] || `User ${headers.id}`
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: 'Failed to identify user' }, { status: 500 });
      }
      user = newUser;
    } else if (userError) {
      return NextResponse.json({ error: 'Failed to identify user' }, { status: 500 });
    }

    if (!user?.id) {
      return NextResponse.json({ error: 'Failed to identify user' }, { status: 500 });
    }

    // Scope delete by both project id and user id (tenant isolation).
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in project delete API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
