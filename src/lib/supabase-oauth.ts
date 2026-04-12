"use client";

import { createClient, type Session } from "@supabase/supabase-js";

type LegacyUser = {
  sub: string;
  user_id: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
};

let browserSupabaseClient: ReturnType<typeof createClient> | null = null;

function getBrowserSupabaseClient() {
  if (!browserSupabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase public environment variables");
    }

    browserSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserSupabaseClient;
}

function buildLegacyUser(session: Session): LegacyUser {
  const user = session.user;
  const email = user.email || "";
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email.split("@")[0] ||
    "User";
  const picture =
    user.user_metadata?.avatar_url || `https://avatar.vercel.sh/${email || user.id}`;

  return {
    sub: user.id,
    user_id: user.id,
    email,
    name,
    picture,
    email_verified: !!user.email_confirmed_at,
  };
}

export async function startGoogleOAuth() {
  const supabase = getBrowserSupabaseClient();
  const envRedirectBase =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    '';
  const redirectBase = envRedirectBase.trim() || window.location.origin;
  const redirectTo = `${redirectBase.replace(/\/$/, '')}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    throw error;
  }

  // Fallback in case browser redirect is blocked.
  if (data?.url) {
    window.location.href = data.url;
  }
}

export async function completeOAuthSignIn(code: string | null) {
  const supabase = getBrowserSupabaseClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  const session = data.session;
  if (!session) {
    throw new Error("No session found after OAuth callback");
  }

  const legacyUser = buildLegacyUser(session);
  const legacyTokens = {
    access_token: session.access_token,
    token_type: "Bearer",
    expires_in: session.expires_in || 3600,
    sub: legacyUser.sub,
    user_id: legacyUser.user_id,
    email: legacyUser.email,
    name: legacyUser.name,
    user: legacyUser,
  };

  localStorage.setItem("auth_tokens", JSON.stringify(legacyTokens));
  localStorage.setItem("user_data", JSON.stringify(legacyUser));

  return { user: legacyUser };
}
