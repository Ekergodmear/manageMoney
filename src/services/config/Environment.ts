export type Environment = 'development' | 'production' | 'test';

/**
 * Single entry for Vite env — workspace không đọc import.meta.env trực tiếp.
 */
export function resolveEnvironment(): Environment {
  const mode = import.meta.env.MODE;
  if (mode === 'test') {
    return 'test';
  }
  if (import.meta.env.PROD) {
    return 'production';
  }
  return 'development';
}

export function isDevelopment(environment: Environment): boolean {
  return environment === 'development';
}

export function isProduction(environment: Environment): boolean {
  return environment === 'production';
}

export function isTest(environment: Environment): boolean {
  return environment === 'test';
}
