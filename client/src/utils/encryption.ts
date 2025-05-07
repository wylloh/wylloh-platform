import CryptoJS from 'crypto-js';

/**
 * Utility functions for content encryption/decryption
 * Used to secure content on IPFS while allowing authorized playback
 */

/**
 * Generate a random content encryption key
 * @returns A secure random encryption key
 */
export async function generateContentKey(): Promise<string> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await window.crypto.subtle.exportKey(
    'raw',
    key
  );

  return Buffer.from(exportedKey).toString('base64');
}

/**
 * Encrypt content with a symmetric key
 * @param content The content to encrypt (typically file data as ArrayBuffer or string)
 * @param contentKey The symmetric key to use for encryption
 * @returns Encrypted content as a string
 */
export async function encryptContent(
  content: ArrayBuffer | string,
  contentKey: string
): Promise<string> {
  // Convert content to ArrayBuffer if it's a string
  let contentBuffer: ArrayBuffer;
  if (typeof content === 'string') {
    const encoder = new TextEncoder();
    contentBuffer = encoder.encode(content).buffer;
  } else {
    contentBuffer = content;
  }

  // Import the key
  const keyBuffer = Buffer.from(contentKey, 'base64');
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    contentBuffer
  );

  // Combine IV and encrypted data
  const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedBuffer), iv.length);

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
  
  // Extract IV and encrypted data
  const iv = encryptedBuffer.slice(0, 12);
  const data = encryptedBuffer.slice(12);

  // Import the key
  const keyBuffer = Buffer.from(contentKey, 'base64');
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv)
    },
    key,
    data
  );

  // Convert to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Encrypt a content key with a user's public key
 * This allows secure key sharing via blockchain
 * @param contentKey The symmetric content key
 * @param publicKey The public key to encrypt with (typically derived from wallet)
 * @returns Encrypted key that only the holder of the private key can decrypt
 */
export async function encryptContentKey(
  contentKey: string,
  publicKey: string
): Promise<string> {
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

  return Buffer.from(encryptedBuffer).toString('base64');
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
): Promise<{ encryptedFile: File; contentKey: string }> {
  // Generate a key if not provided
  const key = contentKey || await generateContentKey();

  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // Encrypt the file content
  const encryptedContent = await encryptContent(fileBuffer, key);

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
  try {
    console.log(
      `EncryptionUtils: Decrypting file ${
        encryptedFile instanceof File ? encryptedFile.name : 'blob'
      }`
    );

    // Read the encrypted file as text
    let encryptedContent: string;

    try {
      encryptedContent = await readFileAsText(encryptedFile);
    } catch (readError) {
      console.error('EncryptionUtils: Error reading encrypted file as text:', readError);
      throw new Error('Failed to read encrypted file');
    }

    if (!encryptedContent || encryptedContent.length === 0) {
      console.error('EncryptionUtils: Empty encrypted content');
      throw new Error('Encrypted file is empty or corrupted');
    }

    // Decrypt the content
    let decryptedContent: string;

    try {
      decryptedContent = await decryptContent(encryptedContent, contentKey);
    } catch (decryptError) {
      console.error('EncryptionUtils: Error decrypting content:', decryptError);
      throw new Error('Failed to decrypt file - the encryption key may be invalid');
    }

    if (!decryptedContent || decryptedContent.length === 0) {
      console.error('EncryptionUtils: Empty decrypted content');
      throw new Error('Decryption produced empty content - the file may be corrupted');
    }

    // Determine original filename by removing .encrypted extension
    const fileName =
      encryptedFile instanceof File
        ? encryptedFile.name.replace('.encrypted', '')
        : 'decrypted-file';

    // Create a new file with decrypted content
    // For binary files, we need to convert base64 back to ArrayBuffer
    try {
      const binaryContent = base64ToArrayBuffer(decryptedContent);

      return new File([binaryContent], fileName, {
        type: determineMimeType(fileName)
      });
    } catch (fileCreationError) {
      console.error('EncryptionUtils: Error creating decrypted file:', fileCreationError);
      throw new Error('Failed to create decrypted file');
    }
  } catch (error) {
    console.error('EncryptionUtils: Decryption failed:', error);
    throw error;
  }
}

/**
 * Determine MIME type from filename
 * @param fileName Name of the file
 * @returns Appropriate MIME type
 */
function determineMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'mp4':
    case 'mov':
    case 'm4v':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'avi':
      return 'video/x-msvideo';
    case 'wmv':
      return 'video/x-ms-wmv';
    case 'mpg':
    case 'mpeg':
      return 'video/mpeg';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
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