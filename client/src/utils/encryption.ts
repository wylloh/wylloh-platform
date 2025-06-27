import CryptoJS from 'crypto-js';

/**
 * Utility functions for content encryption/decryption
 * Used to secure content on IPFS while allowing authorized playback
 */

/**
 * Access level types for content permissions
 */
export enum AccessLevel {
  // No access
  NONE = 0,
  // Can view content only
  VIEW = 10,
  // Can download content
  DOWNLOAD = 20,
  // Can edit metadata
  EDIT_METADATA = 30,
  // Full control (owner)
  FULL_CONTROL = 100
}

// Interface for encrypted access rights
export interface EncryptedAccessRight {
  userId: string; // User identifier (wallet address)
  contentId: string; // Content identifier
  encryptedKey: string; // Encrypted content key
  accessLevel: AccessLevel; // User's access level
  expiresAt?: number; // Optional expiration timestamp
  keyVersion: number; // Key version for rotation support
  signature?: string; // Signature for verification
}

/**
 * Generate a random content encryption key
 * @returns A secure random encryption key
 */
export async function generateContentKey(): Promise<string> {
  // Create a buffer for the key
  const keyBuffer = new Uint8Array(32); // 256 bits
  
  // Fill with cryptographically secure random values
  window.crypto.getRandomValues(keyBuffer);
  
  // Convert to base64 for storage
  return Buffer.from(keyBuffer).toString('base64');
}

/**
 * Generate a deterministic key from master key and version
 * Used for key rotation without re-encrypting content
 * @param masterKey The master content key
 * @param version The key version
 * @returns A derived key for the specific version
 */
export async function deriveKeyForVersion(masterKey: string, version: number): Promise<string> {
  // Convert master key to buffer
  const masterKeyBuffer = Buffer.from(masterKey, 'base64');
  
  // Create version as byte array
  const versionBuffer = new Uint8Array(4);
  new DataView(versionBuffer.buffer).setUint32(0, version, false);
  
  // Use HKDF (HMAC-based Key Derivation Function) to derive a new key
  // First import the master key
  const masterKeyImport = await window.crypto.subtle.importKey(
    'raw',
    masterKeyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Use the master key to sign the version
  const signature = await window.crypto.subtle.sign(
    'HMAC',
    masterKeyImport,
    versionBuffer
  );
  
  // Use the first 32 bytes as the derived key
  const derivedKey = new Uint8Array(signature).slice(0, 32);
  
  return Buffer.from(derivedKey).toString('base64');
}

/**
 * Encrypt content with a symmetric key
 * @param content The content to encrypt (typically file data as ArrayBuffer or string)
 * @param contentKey The symmetric key to use for encryption
 * @param performance Whether to optimize for performance (uses AES-CTR instead of GCM)
 * @returns Encrypted content as a string
 */
export async function encryptContent(
  content: ArrayBuffer | string,
  contentKey: string,
  performance: boolean = false
): Promise<string> {
  // Convert content to ArrayBuffer if it's a string
  let contentBuffer: ArrayBuffer;
  if (typeof content === 'string') {
    const encoder = new TextEncoder();
    contentBuffer = encoder.encode(content).buffer as ArrayBuffer;
  } else {
    contentBuffer = content;
  }

  // Import the key
  const keyBuffer = Buffer.from(contentKey, 'base64');
  
  // Choose algorithm based on performance needs
  const algorithm = performance ? 'AES-CTR' : 'AES-GCM';
  
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: algorithm, length: 256 },
    false,
    ['encrypt']
  );

  // Generate IV (12 bytes for GCM, 16 bytes for CTR)
  const ivLength = performance ? 16 : 12;
  const iv = window.crypto.getRandomValues(new Uint8Array(ivLength));

  // Encrypt with appropriate parameters
  const encryptParams = performance 
    ? { name: 'AES-CTR', counter: iv, length: 128 }
    : { name: 'AES-GCM', iv };
    
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    encryptParams,
    key,
    contentBuffer
  );

  // Add algorithm identifier (1 byte: 0 for GCM, 1 for CTR)
  const algoIdentifier = new Uint8Array(1);
  algoIdentifier[0] = performance ? 1 : 0;
  
  // Combine algorithm, IV and encrypted data
  const result = new Uint8Array(1 + iv.length + encryptedBuffer.byteLength);
  result.set(algoIdentifier, 0);
  result.set(iv, 1);
  result.set(new Uint8Array(encryptedBuffer), 1 + iv.length);

  return Buffer.from(result).toString('base64');
}

/**
 * Decrypt content using a symmetric key
 * @param encryptedContent The encrypted content as a string
 * @param contentKey The symmetric key used for decryption
 * @returns Decrypted content as string
 */
export async function decryptContent(
  encryptedContent: string,
  contentKey: string
): Promise<string> {
  // Convert base64 to ArrayBuffer
  const encryptedBuffer = Buffer.from(encryptedContent, 'base64');
  
  // Extract algorithm identifier
  const algoIdentifier = encryptedBuffer[0];
  const isPerformanceMode = algoIdentifier === 1;
  
  // Extract IV and encrypted data with appropriate offsets
  const ivLength = isPerformanceMode ? 16 : 12;
  const iv = encryptedBuffer.slice(1, 1 + ivLength);
  const data = encryptedBuffer.slice(1 + ivLength);

  // Import the key with correct algorithm
  const algorithm = isPerformanceMode ? 'AES-CTR' : 'AES-GCM';
  const keyBuffer = Buffer.from(contentKey, 'base64');
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: algorithm, length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt with appropriate parameters
  const decryptParams = isPerformanceMode
    ? { name: 'AES-CTR', counter: new Uint8Array(iv), length: 128 }
    : { name: 'AES-GCM', iv: new Uint8Array(iv) };
    
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    decryptParams,
    key,
    data
  );

  // Convert to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Encrypt a content key for a specific user and access level
 * @param contentKey The symmetric content key
 * @param publicKey The public key to encrypt with (typically derived from wallet)
 * @param accessLevel The access level to grant
 * @param expiresAt Optional expiration timestamp
 * @returns Encrypted access right object
 */
export async function encryptContentKeyForUser(
  contentId: string,
  contentKey: string,
  userId: string,
  publicKey: string,
  accessLevel: AccessLevel = AccessLevel.VIEW,
  expiresAt?: number,
  keyVersion: number = 1
): Promise<EncryptedAccessRight> {
  // Import the public key
  const publicKeyBuffer = Buffer.from(publicKey, 'base64');
  const key = await window.crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    false,
    ['encrypt']
  );

  // Convert content key to ArrayBuffer
  const contentKeyBuffer = Buffer.from(contentKey, 'base64');

  // Encrypt
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    key,
    contentKeyBuffer
  );

  // Create the access right object
  const accessRight: EncryptedAccessRight = {
    userId,
    contentId,
    encryptedKey: Buffer.from(encryptedBuffer).toString('base64'),
    accessLevel,
    keyVersion,
    expiresAt
  };
  
  return accessRight;
}

/**
 * Decrypt a content key using the user's private key
 * @param encryptedKey The encrypted content key
 * @param privateKey The private key for decryption (derived from wallet)
 * @returns The decrypted content key
 */
export async function decryptContentKey(
  encryptedKey: string,
  privateKey: string
): Promise<string> {
  // Import the private key
  const privateKeyBuffer = Buffer.from(privateKey, 'base64');
  const key = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    false,
    ['decrypt']
  );

  // Convert encrypted key to ArrayBuffer
  const encryptedBuffer = Buffer.from(encryptedKey, 'base64');

  // Decrypt
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP'
    },
    key,
    encryptedBuffer
  );

  return Buffer.from(decryptedBuffer).toString('base64');
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
export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt a file before uploading to IPFS
 * @param file The file to encrypt
 * @param contentKey The encryption key (if not provided, a new one is generated)
 * @param optimizeForPerformance Whether to optimize for performance over security
 * @returns Promise with the encrypted file and the key used
 */
export async function encryptFile(
  file: File,
  contentKey?: string,
  optimizeForPerformance: boolean = false
): Promise<{ encryptedFile: File; contentKey: string }> {
  // For large files (>10MB), optimize for performance by default
  const performanceOptimize = optimizeForPerformance || file.size > 10 * 1024 * 1024;
  
  // Generate a key if not provided
  const key = contentKey || await generateContentKey();

  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // Encrypt the file content
  const encryptedContent = await encryptContent(fileBuffer, key, performanceOptimize);

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
 * Decrypt an encrypted file using the content key
 * @param encryptedFile The encrypted file blob
 * @param contentKey The decryption key
 * @returns Promise with the decrypted file
 */
export async function decryptFile(
  encryptedFile: File | Blob,
  contentKey: string
): Promise<File> {
  // Performance monitoring
  const startTime = performance.now();
  
  try {
    // Read file as text
    const encryptedContent = await readFileAsText(encryptedFile);
    
    // Decrypt the content
    const decryptedContent = await decryptContent(encryptedContent, contentKey);
    
    // Convert the decrypted content to binary data
    const binaryData = base64ToArrayBuffer(decryptedContent);
    
    // Create a new Blob with the decrypted data
    const decryptedBlob = new Blob([binaryData]);
    
    // Try to determine the original filename and mimetype
    let fileName = 'decrypted-file';
    if (encryptedFile instanceof File && encryptedFile.name.endsWith('.encrypted')) {
      fileName = encryptedFile.name.substring(0, encryptedFile.name.length - 10);
    }
    
    // Try to determine MIME type based on file extension
    const mimeType = determineMimeType(fileName);
    
    // Create a new File object with the decrypted data
    const decryptedFile = new File([decryptedBlob], fileName, { type: mimeType });
    
    // Log performance metrics
    const endTime = performance.now();
    console.log(`File decryption took ${endTime - startTime}ms for ${encryptedFile.size} bytes`);
    
    return decryptedFile;
  } catch (error) {
    console.error('Error decrypting file:', error);
    throw new Error('Failed to decrypt file: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Determine MIME type based on file extension
 * @param fileName The file name
 * @returns The MIME type
 */
function determineMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Common MIME types mapping
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  if (extension && extension in mimeTypes) {
    return mimeTypes[extension];
  }
  
  // Default MIME type
  return 'application/octet-stream';
}

/**
 * Read file as text
 * @param file The file to read
 * @returns Promise with the file content as text
 */
async function readFileAsText(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Create a batch of encrypted keys for multiple users
 * Used for efficient permission granting to multiple users
 * @param contentId Content identifier 
 * @param contentKey The content encryption key
 * @param userAccessRights Map of user IDs to their access level and public key
 * @param keyVersion The key version
 * @returns Array of encrypted access rights
 */
export async function batchEncryptContentKey(
  contentId: string,
  contentKey: string,
  userAccessRights: Map<string, { accessLevel: AccessLevel, publicKey: string, expiresAt?: number }>,
  keyVersion: number = 1
): Promise<EncryptedAccessRight[]> {
  const results: EncryptedAccessRight[] = [];
  
  // Process each user (using Array.from for compatibility)
  for (const [userId, rights] of Array.from(userAccessRights.entries())) {
    try {
      const encryptedRight = await encryptContentKeyForUser(
        contentId,
        contentKey,
        userId,
        rights.publicKey,
        rights.accessLevel,
        rights.expiresAt,
        keyVersion
      );
      
      results.push(encryptedRight);
    } catch (error) {
      console.error(`Error encrypting key for user ${userId}:`, error);
    }
  }
  
  return results;
} 