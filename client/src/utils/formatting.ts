/**
 * Format file size into human-readable format
 * @param bytes Size in bytes
 * @returns Formatted string with appropriate unit
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  /**
   * Format date from ISO string to localized date string
   * @param dateString ISO date string
   * @returns Localized date string
   */
  export const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  /**
   * Format datetime from ISO string to localized date and time string
   * @param dateString ISO date string
   * @returns Localized date and time string
   */
  export const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  /**
   * Format a currency value
   * @param value The numeric value
   * @param currency The currency code (e.g., 'USD', 'USDC', 'ETH')
   * @param decimals Number of decimal places
   * @returns Formatted currency string
   */
  export const formatCurrency = (value: number, currency: string = 'USDC', decimals: number = 2): string => {
    // For USDC, display like traditional currency with $ symbol
    if (currency === 'USDC') {
      return `$${value.toFixed(decimals)}`;
    }
    
    // For crypto currencies, use more decimal places
    if (['ETH', 'MATIC', 'BTC'].includes(currency)) {
      return `${value.toFixed(4)} ${currency}`;
    }
    
    // For fiat currencies, use the Intl.NumberFormat
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals
    }).format(value);
  };
  
  /**
   * Truncate a string to a specified length and add ellipsis
   * @param str String to truncate
   * @param maxLength Maximum length
   * @returns Truncated string
   */
  export const truncateString = (str: string, maxLength: number = 50): string => {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    
    return str.substring(0, maxLength) + '...';
  };
  
  /**
   * Format an address for display (truncate middle)
   * @param address The blockchain address to format
   * @param startChars Number of characters to show at start
   * @param endChars Number of characters to show at end
   * @returns Formatted address
   */
  export const formatAddress = (address: string, startChars: number = 6, endChars: number = 4): string => {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;
    
    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
  };
  
  /**
   * Convert camelCase or snake_case to Title Case
   * @param str String to convert
   * @returns Title case string
   */
  export const toTitleCase = (str: string): string => {
    if (!str) return '';
    
    // Handle camelCase
    const spacedStr = str.replace(/([A-Z])/g, ' $1').trim();
    
    // Handle snake_case
    const spacedFromSnake = spacedStr.replace(/_/g, ' ');
    
    // Convert to title case
    return spacedFromSnake
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  /**
   * Format a file extension from a filename
   * @param filename The filename
   * @returns Uppercase file extension
   */
  export const formatFileExtension = (filename: string): string => {
    if (!filename) return '';
    
    const parts = filename.split('.');
    if (parts.length <= 1) return '';
    
    return parts[parts.length - 1].toUpperCase();
  };
  
  /**
   * Format a number with commas for thousands
   * @param value The number to format
   * @returns Formatted number string
   */
  export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat().format(value);
  };
  
  /**
   * Format a percentage value
   * @param value The decimal value (0-1)
   * @returns Percentage string
   */
  export const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  /**
   * Get placeholder image URL for a specific size
   * @param width Width in pixels
   * @param height Height in pixels
   * @returns Placeholder image URL
   */
  export const getPlaceholderImage = (width: number = 400, height: number = 300): string => {
    return `/api/placeholder/${width}/${height}`;
  };