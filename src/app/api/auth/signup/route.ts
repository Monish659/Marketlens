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

    const nameValue = (name && name.trim()) || email.split('@')[0];

    // Sign up with Supabase Auth
    console.log('📝 Starting signup for:', email);
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: { name: nameValue }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth signup');
      return NextResponse.json({ error: 'Signup failed - no user returned' }, { status: 400 });
    }

    const userId = authData.user.id;
    const userEmail = authData.user.email!;
    console.log('✅ Auth user created:', userId, userEmail);

    // Create user record in database - NO TRIGGERS, DIRECT INSERT ONLY
    let user: any = null;
    let userCreated = false;

    try {
      console.log('📌 Attempting to create user record in database...');
      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          name: nameValue
        })
        .select()
        .single();

      if (insertError) {
        console.error('⚠️ Insert error:', insertError.code, insertError.message);
        
        // If duplicate key error, user already exists - fetch it
        if (insertError.code === '23505') {
          console.log('📌 Duplicate detected - user may already exist, fetching...');
          const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (!fetchError && existingUser) {
            user = existingUser;
            console.log('✅ Found existing user:', user.email);
            userCreated = true;
          } else {
            console.warn('⚠️ Could not fetch existing user after 23505 error');
          }
        }
        // For any other error, we'll continue anyway - user is authenticated
      } else if (insertedUser) {
        user = insertedUser;
        userCreated = true;
        console.log('✅ User record created:', user.email);
      }
    } catch (dbError) {
      console.error('❌ Database operation error:', dbError);
      // Continue - user is still authenticated in auth.users
    }

    // Return response - user ALWAYS has auth even if db record creation fails
    const response = {
      success: true,
      message: 'Account created successfully!',
      user: {
        sub: userId,
        user_id: userId,
        email: userEmail,
        name: user?.name || nameValue,
        picture: `https://avatar.vercel.sh/${userEmail}`,
        email_verified: authData.user.email_confirmed_at !== null
      },
      // Include session if available
      ...(authData.session && {
        access_token: authData.session.access_token,
        token_type: 'Bearer',
        expires_in: 86400
      })
    };

    console.log('✅ SIGNUP COMPLETE - User:', userEmail, 'DB Created:', userCreated);
    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('❌ SIGNUP FATAL ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
