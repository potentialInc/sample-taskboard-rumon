# Google OAuth Setup Instructions

## Package Installation

Install the required Google OAuth packages:

```bash
cd backend
npm install passport-google-oauth20
npm install --save-dev @types/passport-google-oauth20
```

## Environment Variables

Add the following variables to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

## Module Registration

The GoogleStrategy and GoogleOAuthGuard need to be registered in `auth.module.ts`:

```typescript
import { GoogleStrategy } from '@core/guards/google-oauth.strategy';
import { GoogleOAuthGuard } from '@core/guards/google-oauth.guard';

@Module({
  providers: [
    AuthService,
    GoogleStrategy,  // Add this
    GoogleOAuthGuard, // Add this
    // ... other providers
  ],
})
export class AuthModule {}
```

## Usage

### Frontend Integration

1. **Initiate OAuth Flow:**
   ```javascript
   // Redirect user to Google OAuth
   window.location.href = 'http://localhost:3000/auth/google';
   ```

2. **Handle Callback:**
   The user will be redirected to `/auth/google/callback` with authentication tokens set as httpOnly cookies.

### API Endpoints

- **GET /auth/google** - Initiates Google OAuth flow
- **GET /auth/google/callback** - Handles Google OAuth callback

### Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@gmail.com",
      "role": "member",
      "isActive": true
    }
  },
  "timestamp": "2026-02-16T..."
}
```

Note: `token` and `refreshToken` are automatically set as httpOnly cookies and not returned in the response body for security.

## Security Features

- ✅ httpOnly cookies for tokens (XSS protection)
- ✅ Secure cookies in production
- ✅ SameSite protection
- ✅ Separate cookie paths for access and refresh tokens
- ✅ Automatic user creation on first login
- ✅ Google ID linking to existing accounts

## PRD Compliance

Implements PRD Section 3.2.2 Authentication:
- Google OAuth integration
- Secure token storage
- Automatic user registration
- Profile photo sync from Google
