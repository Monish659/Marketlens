import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const displayName = name || email.split('@')[0];

    // STEP 1: Create auth user ONLY
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: { data: { name: displayName } }
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Signup failed' }, { status: 400 });
    }

    // STEP 2: Try to create database record but DON'T FAIL if it errors
    try {
      await supabaseAdmin
        .from('users')
        .insert({ id: data.user.id, email, name: displayName })
        .select()
        .single();
    } catch (e) {
      console.warn('DB record creation failed (non-fatal):', e);
    }

    // STEP 3: Always return success with user data
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: displayName
      },
      session: data.session || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
