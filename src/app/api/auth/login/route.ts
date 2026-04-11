import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Find or create user in our users table
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist in users table, create them
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || authData.user.email!.split('@')[0]
        })
        .select()
        .single();

      if (createError) {
        console.error('💥 Error creating user record:', createError);
        
        // If user already exists (duplicate key error), fetch them instead
        if (createError.code === '23505') {
          console.log('⚠️ User already exists, fetching existing record');
          const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', authData.user.email!)
            .single();
          
          if (!fetchError && existingUser) {
            user = existingUser;
            console.log('✅ Found existing user record:', user.email);
          } else {
            console.error('💥 Failed to fetch existing user:', fetchError);
            return NextResponse.json({ error: 'Failed to create or fetch user record' }, { status: 500 });
          }
        } else {
          console.error('💥 Unknown error creating user:', createError);
          return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
        }
      } else {
        user = newUser;
        console.log('✅ Created new user record:', user.email);
      }
    }

    console.log('✅ User authenticated:', authData.user.email, 'User record:', user?.email || 'none');

    // Return format that matches what the frontend expects from Auth0
    const responseData = {
      access_token: authData.session.access_token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        sub: authData.user.id,
        user_id: authData.user.id,
        email: authData.user.email,
        name: user.name,
        picture: authData.user.user_metadata?.avatar_url || `https://avatar.vercel.sh/${authData.user.email}`,
        email_verified: authData.user.email_confirmed_at !== null
      }
    };

    console.log('✅ User logged in successfully:', authData.user.email);

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
