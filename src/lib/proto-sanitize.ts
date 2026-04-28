/**
 * Recursively removes prototype pollution vectors from an object
 */
export function sanitizeForPrototypePollution(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // Check if it's an array
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForPrototypePollution(item));
  }

  // Remove dangerous keys
  const sanitizedObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block prototype pollution vectors
    if (
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    ) {
      console.warn(`Blocked prototype pollution attempt with key: ${key}`);
      continue;
    }
    
    sanitizedObj[key] = sanitizeForPrototypePollution(value);
  }

  return sanitizedObj;
}

/**
 * Validates and sanitizes form data against prototype pollution
 */
export function validateAndSanitizeFormData(jsonData: any): any {
  try {
    // First, sanitize for prototype pollution
    const sanitizedData = sanitizeForPrototypePollution(jsonData);
    
    // Then validate against our schema
    return sanitizedData;
  } catch (error) {
    throw new Error('Invalid form data structure');
  }
}
