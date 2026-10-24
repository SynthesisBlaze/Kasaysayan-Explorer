import { GENERIC_ERROR_MESSAGE, toFriendlyMessage } from './friendly-error';

describe('toFriendlyMessage', () => {
  it('maps wrong-credential errors to a plain message without technical details', () => {
    const error = { code: 'auth/invalid-credential', message: 'Firebase: Error (auth/invalid-credential).' };
    const message = toFriendlyMessage(error);
    expect(message).toBe('The email or password is incorrect.');
    expect(message).not.toContain('Firebase');
    expect(message).not.toContain('auth/');
  });

  it('maps database permission errors', () => {
    expect(toFriendlyMessage(new Error('PERMISSION_DENIED: Permission denied')))
      .toBe('You do not have permission to do that.');
  });

  it('maps network errors', () => {
    expect(toFriendlyMessage({ code: 'auth/network-request-failed' }))
      .toContain('Check your internet connection');
  });

  it('hides unknown errors behind a generic message', () => {
    const message = toFriendlyMessage(new Error('TypeError: x is undefined at app.js:42'));
    expect(message).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('uses the supplied fallback for unknown errors', () => {
    expect(toFriendlyMessage(null, 'Could not save.')).toBe('Could not save.');
  });
});
