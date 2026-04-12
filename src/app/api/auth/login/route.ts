import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with Supabase Auth
    console.log('📝 Starting login for:', email);
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Auth login failed:', authError);
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!authData.user || !authData.session) {
      console.error('❌ No user or session from auth login');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    const userId = authData.user.id;
    const userEmail = authData.user.email!;
    console.log('✅ Auth login successful:', userId, userEmail);

    // Get or create user record
    let user: any = null;
    let userFound = false;

    try {
      console.log('📌 Fetching user record...');
      const { data: foundUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist - create them
        console.log('📌 User not in database - creating...');
        const { data: createdUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            name: authData.user.user_metadata?.name || userEmail.split('@')[0]
          })
          .select()
          .single();

        if (!createError && createdUser) {
          user = createdUser;
          userFound = true;
          console.log('✅ User created:', user.email);
        } else if (createError?.code === '23505') {
          // Duplicate - fetch it
          console.log('📌 Duplicate detected - fetching...');
          const { data: dupUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          user = dupUser || null;
          if (user) userFound = true;
        } else {
          console.warn('⚠️ Could not create user:', createError?.message);
        }
      } else if (fetchError) {
        console.warn('⚠️ Fetch error:', fetchError.message);
      } else if (foundUser) {
        user = foundUser;
        userFound = true;
        console.log('✅ User found:', user.email);
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
    }

    // Return response - user ALWAYS authenticated even if db record missing
    const response = {
      access_token: authData.session.access_token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        sub: userId,
        user_id: userId,
        email: userEmail,
        name: user?.name || authData.user.user_metadata?.name || userEmail.split('@')[0],
        picture: authData.user.user_metadata?.avatar_url || `https://avatar.vercel.sh/${userEmail}`,
        email_verified: authData.user.email_confirmed_at !== null
      }
    };

    console.log('✅ LOGIN COMPLETE - User:', userEmail, 'DB Found:', userFound);
    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('❌ LOGIN FATAL ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
