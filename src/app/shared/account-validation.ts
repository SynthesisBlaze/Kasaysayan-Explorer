/**
 * Form checks for the Account page. Each function returns an empty string when
 * the input is fine, or a short message to show the user.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_MAX = 254;
export const NAME_MAX = 60;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 128;

export function validateSignIn(email: string, password: string): string {
  const trimmed = email.trim();
  if (!trimmed || !password) {
    return 'Enter your email and password.';
  }
  if (trimmed.length > EMAIL_MAX || !EMAIL_PATTERN.test(trimmed)) {
    return 'Enter a valid email address, for example name@example.com.';
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters.`;
  }
  return '';
}

export function validateRegistration(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): string {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return 'Enter your name.';
  }
  if (trimmedName.length > NAME_MAX) {
    return `Name must be ${NAME_MAX} characters or fewer.`;
  }

  const credentialsProblem = validateSignIn(email, password);
  if (credentialsProblem) {
    return credentialsProblem;
  }

  if (password !== confirmPassword) {
    return 'The passwords do not match.';
  }
  return '';
}
