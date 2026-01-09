/**
 * Utility functions for formatting data
 */

/**
 * Formats a phone number to Brazilian format with country code
 * @param phone - Raw phone number
 * @returns Formatted phone number with +55 prefix
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
};

/**
 * Formats a number as Brazilian currency
 * @param value - Numeric value
 * @returns Formatted currency string (R$ X.XX)
 */
export const formatCurrency = (value: number): string => {
  return `R$ ${Number(value).toFixed(2)}`;
};

/**
 * Formats a date string to Brazilian format
 * @param date - ISO date string
 * @returns Formatted date (DD/MM/YYYY)
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

/**
 * Formats phone for display with mask
 * @param phone - Raw phone number
 * @returns Formatted phone (XX) XXXXX-XXXX
 */
export const formatPhoneDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};
