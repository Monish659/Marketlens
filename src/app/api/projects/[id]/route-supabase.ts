import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userEmail = request.headers.get('x-user-email');
    const userId = request.headers.get('x-user-id');

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
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get project
    const { data: project, error: projectError } = await supabase
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
