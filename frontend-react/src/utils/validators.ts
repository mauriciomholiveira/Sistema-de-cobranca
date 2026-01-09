/**
 * Validation utility functions
 */

/**
 * Validates Brazilian phone number
 * @param phone - Phone number to validate
 * @returns True if valid
 */
export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

/**
 * Validates if a value is a positive number
 * @param value - Value to validate
 * @returns True if valid positive number
 */
export const validatePositiveNumber = (value: number): boolean => {
  return !isNaN(value) && value > 0;
};

/**
 * Validates if a string is not empty
 * @param value - String to validate
 * @returns True if not empty
 */
export const validateNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validates email format
 * @param email - Email to validate
 * @returns True if valid email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
