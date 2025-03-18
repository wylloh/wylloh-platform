import CryptoJS from 'crypto-js';

/**
 * Utility functions for content encryption/decryption
 * Used to secure content on IPFS while allowing authorized playback
 */

/**
 * Generate a random content encryption key
 * @returns A secure random encryption key
 */
export function generateContentKey(): string {
  // Create a random 256-bit key (32 bytes)
  const randomWordArray = CryptoJS.lib.WordArray.random(32);
  return randomWordArray.toString(CryptoJS.enc.Base64);
}

/**
 * Encrypt content with a symmetric key
 * @param content The content to encrypt (typically file data as ArrayBuffer or string)
 * @param contentKey The symmetric key to use for encryption
 * @returns Encrypted content as a string
 */
export function encryptContent(content: ArrayBuffer | string, contentKey: string): string {
  // If content is ArrayBuffer, convert to Base64 string first
  let contentStr: string;
  if (content instanceof ArrayBuffer) {
    contentStr = arrayBufferToBase64(content);
  } else {
    contentStr = content;
  }
  
  // Encrypt using AES
  const encrypted = CryptoJS.AES.encrypt(contentStr, contentKey).toString();
  return encrypted;
}

/**
 * Decrypt content using a symmetric key
 * @param encryptedContent The encrypted content as a string
 * @param contentKey The symmetric key used for decryption
 * @returns Decrypted content as string
 */
export function decryptContent(encryptedContent: string, contentKey: string): string {
  const decrypted = CryptoJS.AES.decrypt(encryptedContent, contentKey);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Encrypt a content key with a user's public key
 * This allows secure key sharing via blockchain
 * @param contentKey The symmetric content key
 * @param publicKey The public key to encrypt with (typically derived from wallet)
 * @returns Encrypted key that only the holder of the private key can decrypt
 */
export async function encryptContentKey(contentKey: string, publicKey: string): Promise<string> {
  // In production, use asymmetric encryption like RSA or ECIES
  // For this prototype, we'll use a placeholder approach
  
  // Simple encryption for demo - in production use proper asymmetric encryption
  return CryptoJS.AES.encrypt(contentKey, publicKey).toString();
}

/**
 * Decrypt a content key using the user's private key
 * @param encryptedKey The encrypted content key
 * @param privateKey The private key for decryption (derived from wallet)
 * @returns The decrypted content key
 */
export async function decryptContentKey(encryptedKey: string, privateKey: string): Promise<string> {
  // In production, use proper asymmetric decryption
  // This is a simplified placeholder
  
  const decrypted = CryptoJS.AES.decrypt(encryptedKey, privateKey);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Convert ArrayBuffer to Base64 string (for encryption)
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode.apply(null, 
    Array.from(new Uint8Array(buffer)));
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer (after decryption)
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt a file before uploading to IPFS
 * @param file The file to encrypt
 * @param contentKey The encryption key (if not provided, a new one is generated)
 * @returns Promise with the encrypted file and the key used
 */
export async function encryptFile(
  file: File, 
  contentKey?: string
): Promise<{ encryptedFile: File, contentKey: string }> {
  // Generate a key if not provided
  const key = contentKey || generateContentKey();
  
  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();
  
  // Encrypt the file content
  const encryptedContent = encryptContent(fileBuffer, key);
  
  // Create a new file with encrypted content
  const encryptedFile = new File(
    [encryptedContent], 
    `${file.name}.encrypted`, 
    { type: 'application/encrypted' }
  );
  
  return {
    encryptedFile,
    contentKey: key
  };
}

/**
 * Decrypt a file after downloading from IPFS
 * @param encryptedFile The encrypted file
 * @param contentKey The decryption key
 * @returns Promise with the decrypted file
 */
export async function decryptFile(
  encryptedFile: File | Blob,
  contentKey: string
): Promise<File> {
  // Read the encrypted file as text
  const encryptedContent = await readFileAsText(encryptedFile);
  
  // Decrypt the content
  const decryptedContent = decryptContent(encryptedContent, contentKey);
  
  // Determine original filename by removing .encrypted extension
  const fileName = encryptedFile instanceof File 
    ? encryptedFile.name.replace('.encrypted', '') 
    : 'decrypted-file';
  
  // Create a new file with decrypted content
  // For binary files, we need to convert base64 back to ArrayBuffer
  const binaryContent = base64ToArrayBuffer(decryptedContent);
  
  return new File(
    [binaryContent], 
    fileName, 
    { type: 'application/octet-stream' }
  );
}

/**
 * Helper function to read a file as text
 */
async function readFileAsText(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
} 