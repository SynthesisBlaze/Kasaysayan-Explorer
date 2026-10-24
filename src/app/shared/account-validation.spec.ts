import { validateRegistration, validateSignIn } from './account-validation';

describe('validateSignIn', () => {
  it('accepts a valid email and password', () => {
    expect(validateSignIn('name@example.com', 'secret1')).toBe('');
  });

  it('asks for both fields', () => {
    expect(validateSignIn('', 'secret1')).toBe('Enter your email and password.');
    expect(validateSignIn('name@example.com', '')).toBe('Enter your email and password.');
  });

  it('rejects a malformed email and a short password', () => {
    expect(validateSignIn('not-an-email', 'secret1')).toContain('valid email');
    expect(validateSignIn('name@example.com', '12345')).toContain('Password must be');
  });
});

describe('validateRegistration', () => {
  it('accepts matching passwords', () => {
    expect(validateRegistration('Juan', 'name@example.com', 'secret1', 'secret1')).toBe('');
  });

  it('rejects passwords that do not match', () => {
    expect(validateRegistration('Juan', 'name@example.com', 'secret1', 'secret2'))
      .toBe('The passwords do not match.');
  });

  it('rejects a mismatch that differs only by case', () => {
    expect(validateRegistration('Juan', 'name@example.com', 'Secret1', 'secret1'))
      .toBe('The passwords do not match.');
  });

  it('requires a name', () => {
    expect(validateRegistration('   ', 'name@example.com', 'secret1', 'secret1')).toBe('Enter your name.');
  });

  it('reports a bad email before comparing passwords', () => {
    expect(validateRegistration('Juan', 'nope', 'secret1', 'other')).toContain('valid email');
  });
});
