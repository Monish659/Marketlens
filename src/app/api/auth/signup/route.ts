import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Sign up with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim()
        }
      }
    });

    if (authError) {
      console.error('Supabase signup error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Signup failed' },
        { status: 400 }
      );
    }

    console.log('🔐 Auth user created:', authData.user.id, authData.user.email);

    // Create or fetch user record
    let user = null;
    const defaultName = name.trim() || authData.user.email!.split('@')[0];

    try {
      // Try to fetch existing user first
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!fetchError && existingUser) {
        user = existingUser;
        console.log('✅ User already exists:', user.email);
      } else if (fetchError?.code === 'PGRST116') {
        // User doesn't exist, create them
        console.log('📝 Creating new user record...');
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert([{
            id: authData.user.id,
            email: authData.user.email!,
            name: defaultName
          }])
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating user:', createError);
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
        console.error('❌ Unexpected fetch error:', fetchError);
      }
    } catch (error) {
      console.error('❌ Error in user creation logic:', error);
    }

    if (!user) {
      console.warn('⚠️ User record not created but auth succeeded - using auth data');
    }

    console.log('✅ User signed up successfully:', authData.user.email);

    // Return format that matches what the frontend expects
    const responseData = {
      success: true,
      message: authData.session ? 'Account created and logged in!' : 'Account created! Please check your email to verify.',
      user: {
        sub: authData.user.id,
        user_id: authData.user.id,
        email: authData.user.email,
        name: user?.name || defaultName,
        picture: `https://avatar.vercel.sh/${authData.user.email}`,
        email_verified: authData.user.email_confirmed_at !== null
      },
      // Include session if user is automatically logged in
      ...(authData.session && {
        access_token: authData.session.access_token,
        token_type: 'Bearer',
        expires_in: 86400
      })
    };

    console.log('📤 Signup response:', responseData.success);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
