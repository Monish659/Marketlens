"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeOAuthSignIn } from "@/lib/supabase-oauth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const oauthError =
          params.get("error_description") || params.get("error");
        if (oauthError) {
          throw new Error(oauthError);
        }

        const code = params.get("code");
        await completeOAuthSignIn(code);
        router.replace("/projects");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Google sign-in failed";
        setError(message);
      }
    };

    void run();
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-mono mb-3">Sign-in Failed</h1>
          <p className="text-sm text-white/70 font-mono mb-6">{error}</p>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="px-4 py-2 bg-white text-black font-mono cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-mono mb-3">Signing You In...</h1>
        <p className="text-sm text-white/70 font-mono">
          Completing Google authentication
        </p>
      </div>
    </main>
  );
}
