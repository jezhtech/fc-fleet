/**
 * Currency utilities for the application
 */

export const CURRENCY = {
  code: 'AED',
  symbol: 'AED', // Using AED text symbol instead of Arabic dirham symbol
  name: 'UAE Dirham'
};

/**
 * Format a number as AED currency
 * @param amount - The amount to format
 * @param includeSymbol - Whether to include the AED symbol (defaults to true)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, includeSymbol: boolean = true): string => {
  if (isNaN(amount)) return includeSymbol ? `${CURRENCY.symbol} 0.00` : '0.00';
  
  const formattedAmount = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return includeSymbol ? `${CURRENCY.symbol} ${formattedAmount}` : formattedAmount;
};

/**
 * Parse a string with currency symbol to a number
 * @param amountString - The string amount to parse
 * @returns Parsed number or NaN if invalid
 */
export const parseCurrencyToNumber = (amountString: string): number => {
  if (!amountString) return 0;
  
  // Remove currency symbol, commas and whitespace
  const cleanedString = amountString
    .replace(/[^\d.-]/g, '')
    .trim();
  
  return parseFloat(cleanedString);
}; 
 