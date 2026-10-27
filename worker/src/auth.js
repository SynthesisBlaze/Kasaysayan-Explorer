import { createRemoteJWKSet, jwtVerify } from 'jose'
import { AssistantError } from './assistant.js'

const firebaseKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
  { timeoutDuration: 5000, cacheMaxAge: 3600000 }
)

export async function verifyFirebaseToken(token, projectId, keys = firebaseKeys) {
  if (!projectId) {
    throw new AssistantError('not-configured', 'The assistant is not configured yet.', 503)
  }
  try {
    const { payload } = await jwtVerify(token, keys, {
      algorithms: ['RS256'],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      requiredClaims: ['exp', 'iat', 'sub', 'auth_time']
    })
    const now = Math.floor(Date.now() / 1000)
    const provider = payload.firebase?.sign_in_provider
    if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128 ||
        typeof payload.iat !== 'number' || payload.iat > now ||
        typeof payload.auth_time !== 'number' || payload.auth_time > now ||
        typeof provider !== 'string' || !provider || provider === 'anonymous') {
      throw new AssistantError('unauthenticated', 'Sign in to your account to use the history assistant.', 401)
    }
    return payload.sub
  } catch (error) {
    if (error instanceof AssistantError) {
      throw error
    }
    if (/^ERR_(JWT|JWS|JOSE)_/.test(String(error?.code)) || error?.code === 'ERR_JWKS_NO_MATCHING_KEY') {
      throw new AssistantError('unauthenticated', 'Your session is invalid or expired. Please sign in again.', 401)
    }
    // Network/key-server failures must fail closed, not bypass signature verification.
    throw new AssistantError('unavailable', 'Account verification is temporarily unavailable. Please try again later.', 503)
  }
}
