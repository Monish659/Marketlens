# User-Specific Database Isolation

This document explains the user-specific database isolation system implemented to ensure each user's data is completely separated from other users.

## Overview

The system creates separate MongoDB databases for each user, ensuring complete data isolation. Each user's Auth0 ID is used to generate a unique database name.

## Implementation Details

### Database Naming Convention

User databases follow this pattern:
```
marketlens_user_{sanitized_auth0_id}
```

For example:
- User with Auth0 ID `auth0|12345` gets database `marketlens_user_12345`
- User with Auth0 ID `google-oauth2|user@example.com` gets database `marketlens_user_google_oauth2_user_example_com`

### Authentication Flow

1. **Request Authentication**: All API routes now require authentication via the `requireAuth()` function
2. **User Extraction**: User information is extracted from JWT tokens in the Authorization header
3. **Database Selection**: Each user gets their own database based on their Auth0 ID

### Updated API Routes

All the following routes now use user-specific databases:

- `/api/ideate` - Ideation/Advisor pass
- `/api/ideate/critic` - Critic pass  
- `/api/ideate/refine` - Refiner pass
- `/api/ideas/[id]` - Get specific idea
- `/api/scout/search` - Search scout data
- `/api/scout/crawl` - Crawl and index pages
- `/api/scout/page/[id]` - Get specific page

## Usage

### Frontend Integration

To use the API routes, the frontend must include an Authorization header with a valid JWT token:

```javascript
const response = await fetch('/api/ideate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ idea: 'My startup idea' })
});
```

### Development Mode

For development, you can use the `x-user-id` header instead of a JWT token:

```javascript
const response = await fetch('/api/ideate', {
  method: 'POST',
  headers: {
    'x-user-id': 'dev_user_123',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ idea: 'My startup idea' })
});
```

## Security Benefits

1. **Complete Data Isolation**: Users cannot access each other's data
2. **Database-Level Separation**: Even if there's a bug in application logic, database isolation prevents cross-user access
3. **Scalable Architecture**: Each user's database can be independently managed, backed up, or migrated

## Database Functions

### Core Functions

- `getUserDb(auth0Id)` - Get database instance for specific user
- `requireAuth(request)` - Authenticate request and extract user info
- `getUserDatabaseName(auth0Id)` - Generate safe database name from Auth0 ID

### Legacy Support

- `getDb()` - Still available for backward compatibility (uses shared database)

## Migration Notes

Existing data in the shared database will need to be migrated to user-specific databases. This can be done by:

1. Identifying the user for each existing record
2. Moving records to the appropriate user database
3. Cleaning up the shared database

## Testing

A test script is available at `scripts/test-user-isolation.js` to verify the isolation is working correctly. Run it with:

```bash
node scripts/test-user-isolation.js
```

## Environment Variables

Ensure these environment variables are set:

- `MONGODB_URI` - MongoDB connection string
- `AUTH0_DOMAIN` - Auth0 domain for JWT verification
- `NODE_ENV` - Set to 'development' to enable x-user-id header support
