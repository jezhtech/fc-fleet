import CryptoJS from 'crypto-js';

// Secret key for encryption/decryption - in production this should be in environment variables
const ENCRYPTION_SECRET = 'BOOBA_RIDE_SECURE_KEY_2023';

/**
 * Encrypts sensitive data using AES encryption
 * @param data Data to encrypt
 * @returns Encrypted string
 */
export const encrypt = (data: string): string => {
  if (!data) return '';
  return CryptoJS.AES.encrypt(data, ENCRYPTION_SECRET).toString();
};

/**
 * Decrypts encrypted data
 * @param encryptedData Encrypted string to decrypt
 * @returns Decrypted string
 */
export const decrypt = (encryptedData: string): string => {
  if (!encryptedData) return '';
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Encrypts an object with sensitive payment gateway information
 * @param data Object containing payment gateway credentials
 * @returns Object with encrypted values
 */
export const encryptPaymentSettings = (data: Record<string, string>): Record<string, string> => {
  const encryptedData: Record<string, string> = {};
  
  for (const key in data) {
    // Don't encrypt mode or other non-sensitive fields
    if (key === 'mode') {
      encryptedData[key] = data[key];
    } else {
      encryptedData[key] = encrypt(data[key]);
    }
  }
  
  return encryptedData;
};

/**
 * Decrypts an object with encrypted payment gateway information
 * @param data Object containing encrypted payment gateway credentials
 * @returns Object with decrypted values
 */
export const decryptPaymentSettings = (data: Record<string, string>): Record<string, string> => {
  const decryptedData: Record<string, string> = {};
  
  for (const key in data) {
    // Don't decrypt mode or other non-sensitive fields
    if (key === 'mode') {
      decryptedData[key] = data[key];
    } else {
      decryptedData[key] = decrypt(data[key]);
    }
  }
  
  return decryptedData;
}; 
 
 
 
 
 
 
 
 