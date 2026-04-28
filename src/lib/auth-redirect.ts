const DEFAULT_REDIRECT_PATH = '/dashboard';

export function sanitizeRedirectPath(
  input: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT_PATH
) {
  if (!input) {
    return fallback;
  }

  if (!input.startsWith('/')) {
    return fallback;
  }

  if (input.startsWith('//')) {
    return fallback;
  }

  try {
    const normalized = new URL(input, 'http://localhost');
    const pathname = normalized.pathname || '/';

    if (!pathname.startsWith('/')) {
      return fallback;
    }

    return `${pathname}${normalized.search}${normalized.hash}`;
  } catch {
    return fallback;
  }
}
