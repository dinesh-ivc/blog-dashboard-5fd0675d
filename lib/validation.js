/**
 * Validation utilities for user input
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function isValidPassword(password) {
  if (!password || password.length < 6) {
    return {
      valid: false,
      error: 'Password must be at least 6 characters long'
    };
  }
  return { valid: true };
}

/**
 * Validate user registration data
 * @param {Object} data - Registration data
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateRegistration(data) {
  const { name, email, password, role } = data;

  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Name must be less than 100 characters' };
  }

  if (!email || !isValidEmail(email)) {
    return { valid: false, error: 'Valid email is required' };
  }

  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }

  const validRoles = ['admin', 'author', 'reader'];
  if (role && !validRoles.includes(role)) {
    return { valid: false, error: 'Invalid role specified' };
  }

  return { valid: true };
}

/**
 * Validate user login data
 * @param {Object} data - Login data
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateLogin(data) {
  const { email, password } = data;

  if (!email || !isValidEmail(email)) {
    return { valid: false, error: 'Valid email is required' };
  }

  if (!password || password.length === 0) {
    return { valid: false, error: 'Password is required' };
  }

  return { valid: true };
}

/**
 * Validate post data
 * @param {Object} data - Post data
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validatePost(data) {
  const { title, content, excerpt, status } = data;

  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }

  if (title.length > 200) {
    return { valid: false, error: 'Title must be less than 200 characters' };
  }

  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Content is required' };
  }

  if (excerpt && excerpt.length > 300) {
    return { valid: false, error: 'Excerpt must be less than 300 characters' };
  }

  const validStatuses = ['draft', 'published'];
  if (status && !validStatuses.includes(status)) {
    return { valid: false, error: 'Invalid status. Must be "draft" or "published"' };
  }

  return { valid: true };
}

/**
 * Validate category data
 * @param {Object} data - Category data
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateCategory(data) {
  const { name, description } = data;

  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Category name is required' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Category name must be less than 100 characters' };
  }

  if (description && description.length > 500) {
    return { valid: false, error: 'Description must be less than 500 characters' };
  }

  return { valid: true };
}

/**
 * Validate tag data
 * @param {Object} data - Tag data
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateTag(data) {
  const { name } = data;

  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Tag name is required' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Tag name must be less than 50 characters' };
  }

  return { valid: true };
}

/**
 * Validate comment data
 * @param {Object} data - Comment data
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateComment(data) {
  const { content } = data;

  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Comment content is required' };
  }

  if (content.length > 1000) {
    return { valid: false, error: 'Comment must be less than 1000 characters' };
  }

  return { valid: true };
}

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  
  // Basic sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL format
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}