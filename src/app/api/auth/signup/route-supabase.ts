import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const { data: authData, error: authError } = await supabase.auth.signUp({
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

    // Create user record in our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        name: name.trim()
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user record:', userError);
      // Don't fail the signup if user record creation fails
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
        name: name.trim(),
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

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
