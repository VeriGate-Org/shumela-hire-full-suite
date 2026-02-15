/**
 * Currency formatting utilities for South African Rand (ZAR)
 */

export const formatCurrency = (
  amount: number,
  currency: string = 'ZAR',
  locale: string = 'en-ZA',
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    ...options
  }).format(amount);
};

export const formatCurrencyRange = (
  min?: number,
  max?: number,
  currency: string = 'ZAR',
  locale: string = 'en-ZA'
): string => {
  if (!min && !max) return 'Not specified';
  if (min && max) {
    return `${formatCurrency(min, currency, locale)} - ${formatCurrency(max, currency, locale)}`;
  }
  if (min) return `From ${formatCurrency(min, currency, locale)}`;
  if (max) return `Up to ${formatCurrency(max, currency, locale)}`;
  return 'Not specified';
};

export const formatCurrencyCompact = (
  amount: number,
  currency: string = 'ZAR',
  locale: string = 'en-ZA'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount);
};

/**
 * Format currency amount with custom symbol (for backward compatibility)
 */
export const formatCurrencySimple = (
  amount: number,
  symbol: string = 'R'
): string => {
  return `${symbol}${amount.toLocaleString()}`;
};

/**
 * Parse currency string to number (removes currency symbols and formatting)
 */
export const parseCurrencyAmount = (currencyString: string): number | null => {
  if (!currencyString) return null;
  
  // Remove currency symbols, spaces, and other non-numeric characters except decimal point
  const cleanedString = currencyString.replace(/[^\d.-]/g, '');
  const parsedAmount = parseFloat(cleanedString);
  
  return isNaN(parsedAmount) ? null : parsedAmount;
};

/**
 * Default currency configuration.
 * Change these values to switch the entire app to a different currency.
 */
export const DEFAULT_CURRENCY = {
  code: 'ZAR',
  locale: 'en-ZA',
  symbol: 'R',
  name: 'South African Rand',
} as const;

/** @deprecated Use DEFAULT_CURRENCY instead */
export const ZAR_CONFIG = DEFAULT_CURRENCY;

/**
 * Salary range formatting specifically for job postings
 */
export const formatSalaryRange = (
  min?: number,
  max?: number,
  annual: boolean = true
): string => {
  const suffix = annual ? ' per annum' : '';
  
  if (!min && !max) return `Salary not specified${suffix}`;
  if (min && max) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}${suffix}`;
  }
  if (min) return `From ${formatCurrency(min)}${suffix}`;
  if (max) return `Up to ${formatCurrency(max)}${suffix}`;
  return `Salary not specified${suffix}`;
};
