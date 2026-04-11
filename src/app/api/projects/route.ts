import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractUserFromHeaders } from '@/lib/auth-adapter';

export async function GET(request: NextRequest) {
  try {
    const headers = extractUserFromHeaders(request);
    console.log('🔍 [PROJECTS-GET] Headers:', headers);
    
    if (!headers.email && !headers.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userEmail = headers.email || `user_${headers.id}@marketlens.local`;
    console.log('👤 [PROJECTS-GET] Looking for user with email:', userEmail);

    // Find user in Supabase by email or create if doesn't exist
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    console.log('👤 [PROJECTS-GET] User lookup result:', { user: user?.email, error: userError?.code });

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: headers.email || `user_${headers.id}@marketlens.local`,
          name: headers.email?.split('@')[0] || `User ${headers.id}`
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      user = newUser;
    } else if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 });
    }

    console.log('👤 [PROJECTS-GET] Final user for projects query:', user?.email, 'ID:', user?.id);

    if (!user) {
      console.error('💥 [PROJECTS-GET] User is still null after lookup/creation');
      return NextResponse.json({ error: 'Failed to identify user' }, { status: 500 });
    }

    // Get user's projects with session counts
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        analysis_sessions(count)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Format response to match old API
    const formattedProjects = projects?.map(project => ({
      _id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      simulationCount: project.analysis_sessions?.[0]?.count || 0
    })) || [];

    return NextResponse.json({
      projects: formattedProjects
    });

  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const headers = extractUserFromHeaders(request);
    const { name, description } = await request.json();
    
    console.log('🔍 [PROJECTS-POST] Headers:', headers);
    console.log('📝 [PROJECTS-POST] Creating project:', { name, description });

    if (!headers.email && !headers.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const userEmail = headers.email || `user_${headers.id}@marketlens.local`;
    console.log('👤 [PROJECTS-POST] Looking for user with email:', userEmail);

    // Find or create user
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    console.log('👤 [PROJECTS-POST] User lookup result:', { user: user?.email, error: userError?.code });

    if (userError && userError.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: headers.email || `user_${headers.id}@marketlens.local`,
          name: headers.email?.split('@')[0] || `User ${headers.id}`
        })
        .select()
        .single();

      if (createError) {
        console.error('💥 [PROJECTS-POST] Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      console.log('✅ [PROJECTS-POST] Created new user:', newUser.email);
      user = newUser;
    } else if (userError) {
      console.error('💥 [PROJECTS-POST] Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 });
    }

    console.log('👤 [PROJECTS-POST] Final user for project creation:', user?.email, 'ID:', user?.id);

    if (!user || !user.id) {
      console.error('💥 [PROJECTS-POST] User is null or missing ID');
      return NextResponse.json({ error: 'Failed to identify user' }, { status: 500 });
    }

    // Create project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    console.log('✅ Created project for user:', user.email, 'Project:', project.name);

    // Format response to match old API
    const formattedProject = {
      _id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    };

    return NextResponse.json({
      success: true,
      project: formattedProject
    });

  } catch (error) {
    console.error('Error in create project API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
