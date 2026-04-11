export async function secureFetch(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const headers = new Headers(init?.headers || {});

  if (typeof window !== 'undefined') {
    try {
      const tokensRaw = localStorage.getItem('auth_tokens');
      const userRaw = localStorage.getItem('user_data');
      const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
      const user = userRaw ? JSON.parse(userRaw) : null;
      const accessToken = tokens?.access_token;
      const email = user?.email || tokens?.email || tokens?.user?.email;
      const userId = user?.sub || tokens?.sub || tokens?.user_id;

      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
      if (email) headers.set('x-user-email', email);
      if (userId) headers.set('x-user-id', userId);
    } catch (error) {
      console.warn('Failed to parse auth tokens for secureFetch:', error);
    }
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

