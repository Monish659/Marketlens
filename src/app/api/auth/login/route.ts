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

    console.log('🔐 Auth successful for:', authData.user.email);

    // Find or create user in our users table
    let user: any = null;
    const defaultName = authData.user.user_metadata?.name || authData.user.email!.split('@')[0];

    try {
      // Try to fetch existing user
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!userError && userData) {
        user = userData;
        console.log('✅ User found:', user.email);
      } else if (userError?.code === 'PGRST116') {
        // User doesn't exist, create them
        console.log('📝 User not found, creating...');
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email!,
              name: defaultName
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('❌ Create error:', createError);
          // Try fetching again if duplicate
          if (createError.code === '23505') {
            const { data: dupUser } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('id', authData.user.id)
              .single();
            user = dupUser || null;
          }
        } else {
          user = newUser;
          console.log('✅ User created:', newUser?.email);
        }
      } else {
        console.error('❌ Fetch error:', userError);
      }
    } catch (error) {
      console.error('❌ Error in user lookup/creation:', error);
    }

    // Always allow login even if user record creation failed
    if (!user) {
      console.warn('⚠️ User record not found/created but auth succeeded');
    }

    // Return format that matches what the frontend expects from Auth0
    const responseData = {
      access_token: authData.session.access_token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        sub: authData.user.id,
        user_id: authData.user.id,
        email: authData.user.email,
        name: user?.name || defaultName,
        picture: authData.user.user_metadata?.avatar_url || `https://avatar.vercel.sh/${authData.user.email}`,
        email_verified: authData.user.email_confirmed_at !== null
      }
    };

    console.log('✅ Login successful:', authData.user.email);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
