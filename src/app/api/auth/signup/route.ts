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

    // The trigger handle_new_user() will automatically create the user record
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch the user record created by the trigger
    let user = null;
    try {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('⚠️ Error fetching user record:', userError);
        // If trigger didn't work, create manually
        if (userError.code === 'PGRST116') {
          console.log('📝 Trigger may not have fired, creating user manually');
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email!,
              name: name.trim()
            })
            .select()
            .single();

          if (!createError) {
            user = newUser;
          } else if (createError.code === '23505') {
            // User exists, fetch it
            const { data: existingUser } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('id', authData.user.id)
              .single();
            user = existingUser;
          }
        }
      } else {
        user = userData;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
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
        name: user?.name || name.trim(),
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
