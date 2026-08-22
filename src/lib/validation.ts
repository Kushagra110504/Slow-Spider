/**
 * ProjectVault - Centralized Input Validation & Sanitization Module
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const Validation = {
  /**
   * Validates and normalizes email addresses.
   */
  validateEmail(email: string): ValidationResult {
    const trimmed = email.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Email address is required.' };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed) || trimmed.length > 254) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
    return { isValid: true };
  },

  /**
   * Validates password strength (minimum 8 characters).
   */
  validatePassword(password: string): ValidationResult {
    if (!password || password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long.' };
    }
    if (password.length > 128) {
      return { isValid: false, error: 'Password cannot exceed 128 characters.' };
    }
    return { isValid: true };
  },

  /**
   * Validates project titles and descriptions.
   */
  validateProject(name: string, description?: string): ValidationResult {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { isValid: false, error: 'Project title is required.' };
    }
    if (trimmedName.length > 100) {
      return { isValid: false, error: 'Project title cannot exceed 100 characters.' };
    }
    if (description && description.length > 2000) {
      return { isValid: false, error: 'Project description cannot exceed 2,000 characters.' };
    }
    return { isValid: true };
  },

  /**
   * Validates task titles and estimates.
   */
  validateTask(title: string, description?: string): ValidationResult {
    const trimmed = title.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Task title is required.' };
    }
    if (trimmed.length > 150) {
      return { isValid: false, error: 'Task title cannot exceed 150 characters.' };
    }
    if (description && description.length > 3000) {
      return { isValid: false, error: 'Task description cannot exceed 3,000 characters.' };
    }
    return { isValid: true };
  },

  /**
   * Validates milestone titles.
   */
  validateMilestone(title: string): ValidationResult {
    const trimmed = title.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Milestone title is required.' };
    }
    if (trimmed.length > 150) {
      return { isValid: false, error: 'Milestone title cannot exceed 150 characters.' };
    }
    return { isValid: true };
  },

  /**
   * Strips dangerous script tags and HTML control characters.
   */
  sanitizeText(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();
  }
};
