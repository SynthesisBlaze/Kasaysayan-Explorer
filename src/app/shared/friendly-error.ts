/**
 * Turns any thrown value into a short message that is safe to show to users.
 * Technical details (error codes, database paths, stack traces) are never returned;
 * log the original error to the console instead.
 */
const MESSAGES_BY_CODE: Record<string, string> = {
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/wrong-password': 'The email or password is incorrect.',
  'auth/user-not-found': 'The email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Cannot connect right now. Check your internet connection and try again.',
  'permission-denied': 'You do not have permission to do that.',
  'PERMISSION_DENIED': 'You do not have permission to do that.',
  'unavailable': 'Cannot connect right now. Check your internet connection and try again.'
};

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function toFriendlyMessage(error: unknown, fallback: string = GENERIC_ERROR_MESSAGE): string {
  const code = extractCode(error);
  if (code) {
    const key = Object.keys(MESSAGES_BY_CODE).find(known => code === known || code.endsWith(`/${known}`));
    if (key) {
      return MESSAGES_BY_CODE[key];
    }
  }
  const text = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (/permission[_ -]?denied/i.test(text)) {
    return MESSAGES_BY_CODE['permission-denied'];
  }
  if (/network|offline|failed to fetch/i.test(text)) {
    return MESSAGES_BY_CODE['unavailable'];
  }
  return fallback;
}

function extractCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : '';
  }
  return '';
}
