/**
 * Data validation utilities for robust data handling
 */

// Validation schemas
export const validationSchemas = {
  employee: {
    name: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { pattern: /^[\d\s\-\+\(\)]+$/, minLength: 10 },
    salary: { required: true, min: 0, type: 'number' }
  },
  
  attendance: {
    employee_id: { required: true, type: 'number' },
    date: { required: true, type: 'date' }
  },
  
  profile: {
    fullName: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phoneNumber: { pattern: /^[\d\s\-\+\(\)]+$/, minLength: 10 }
  }
};

// Validate a single field
export function validateField(value, rules) {
  const errors = [];

  if (rules.required && (!value || String(value).trim() === '')) {
    errors.push('This field is required');
    return errors;
  }

  if (!value) return errors; // Skip other validations if not required and empty

  const stringValue = String(value).trim();

  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push(`Must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push(`Must be no more than ${rules.maxLength} characters`);
  }

  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push('Invalid format');
  }

  if (rules.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push('Must be a valid number');
    } else {
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push(`Must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push(`Must be no more than ${rules.max}`);
      }
    }
  }

  if (rules.type === 'date') {
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) {
      errors.push('Must be a valid date');
    }
  }

  return errors;
}

// Validate an entire object against a schema
export function validateObject(data, schema) {
  const errors = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(schema)) {
    const fieldErrors = validateField(data[field], rules);
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      isValid = false;
    }
  }

  return { isValid, errors };
}

// Sanitize data to prevent XSS and other issues
export function sanitizeData(data) {
  if (typeof data === 'string') {
    return data.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  
  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  
  return data;
}

// Format data for display
export const formatters = {
  currency: (value, currency = 'INR') => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(value);
  },

  date: (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString();
  },

  datetime: (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString();
  },

  phone: (value) => {
    if (!value) return 'N/A';
    // Format phone number (basic formatting)
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return value;
  },

  truncate: (value, length = 50) => {
    if (!value) return 'N/A';
    const str = String(value);
    return str.length > length ? `${str.slice(0, length)}...` : str;
  }
}

// Safe data access with fallbacks
export function safeGet(obj, path, defaultValue = null) {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Check if data is empty or invalid
export function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}
