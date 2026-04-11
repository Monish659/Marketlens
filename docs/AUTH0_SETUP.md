# Auth0 Setup Guide

## 1. Create Environment Variables

Create a `.env.local` file in your project root with:

```bash
NEXT_PUBLIC_AUTH0_DOMAIN=your-auth0-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-auth0-client-id
```

Replace with your actual Auth0 credentials from your Auth0 dashboard.

## 2. Auth0 Dashboard Configuration

In your Auth0 application settings, configure:

### Application URIs
- **Allowed Callback URLs**: `http://localhost:3000`
- **Allowed Logout URLs**: `http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:3000`

### For Production
Add your production domain to all the above settings.

## 3. Social Connections (Optional)

If you want to use Google/Apple login:

1. Go to Auth0 Dashboard > Authentication > Social
2. Enable Google OAuth 2.0 connection
3. Enable Apple connection (requires Apple Developer account)
4. Configure the connection settings with your provider credentials

## 4. Test Your Setup

1. Start your development server: `npm run dev`
2. Navigate to `/login` or `/signup`
3. Try logging in with the configured methods

## 5. Troubleshooting

### Common Issues:
- **Environment variables not loaded**: Restart your dev server after adding `.env.local`
- **Callback URL mismatch**: Ensure Auth0 dashboard URLs match your local/production domains
- **Social login not working**: Check that social connections are enabled and configured in Auth0 dashboard

### Debug Steps:
1. Check browser console for Auth0 errors
2. Verify environment variables are loaded: `console.log(process.env.NEXT_PUBLIC_AUTH0_DOMAIN)`
3. Check Auth0 logs in the dashboard for authentication attempts

## 6. Current Implementation

Your forms now properly integrate with Auth0:
- ✅ LoginForm: Handles social login, email login, and authenticated state
- ✅ SignUpForm: Handles social signup, email signup, and authenticated state  
- ✅ Auth0Provider: Properly configured with error handling
- ✅ Environment variable validation

Both forms will redirect to Auth0's Universal Login page for authentication.
