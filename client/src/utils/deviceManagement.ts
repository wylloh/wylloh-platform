import { ethers } from 'ethers';
import { encryptContentKeyForUser, decryptContentKey, AccessLevel } from './encryption';

interface DeviceInfo {
  deviceId: string;
  publicKey: string;
  lastActive: Date;
  boundAt: Date;
}

interface KeyRotationInfo {
  contentId: string;
  oldKey: string;
  newKey: string;
  rotationDate: Date;
}

/**
 * Generate a unique device ID
 */
export function generateDeviceId(): string {
  return ethers.utils.keccak256(
    ethers.utils.randomBytes(32)
  ).slice(2);
}

/**
 * Get or create device info
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const storedInfo = localStorage.getItem('deviceInfo');
  if (storedInfo) {
    return JSON.parse(storedInfo);
  }

  // Generate new device info
  const deviceId = generateDeviceId();
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );

  const publicKey = await window.crypto.subtle.exportKey(
    'spki',
    keyPair.publicKey
  );

  const deviceInfo: DeviceInfo = {
    deviceId,
    publicKey: Buffer.from(publicKey).toString('base64'),
    lastActive: new Date(),
    boundAt: new Date()
  };

  localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
  return deviceInfo;
}

/**
 * Bind a device to content
 */
export async function bindDeviceToContent(
  contentId: string,
  contentKey: string
): Promise<void> {
  const deviceInfo = await getDeviceInfo();
  
  // Encrypt content key for this device
  const encryptedKey = await encryptContentKeyForUser(
    contentId,
    contentKey,
    deviceInfo.deviceId,
    deviceInfo.publicKey,
    AccessLevel.VIEW
  );

  // Store encrypted key
  const deviceKeys = JSON.parse(
    localStorage.getItem('deviceKeys') || '{}'
  );
  deviceKeys[contentId] = encryptedKey;
  localStorage.setItem('deviceKeys', JSON.stringify(deviceKeys));
}

/**
 * Get content key for device
 */
export async function getContentKeyForDevice(
  contentId: string
): Promise<string | null> {
  const deviceKeys = JSON.parse(
    localStorage.getItem('deviceKeys') || '{}'
  );
  
  const encryptedKey = deviceKeys[contentId];
  if (!encryptedKey) return null;

  const deviceInfo = await getDeviceInfo();
  return decryptContentKey(encryptedKey, deviceInfo.publicKey);
}

/**
 * Rotate content key
 */
export async function rotateContentKey(
  contentId: string,
  oldKey: string,
  newKey: string
): Promise<void> {
  const rotationInfo: KeyRotationInfo = {
    contentId,
    oldKey,
    newKey,
    rotationDate: new Date()
  };

  // Store rotation info
  const rotations = JSON.parse(
    localStorage.getItem('keyRotations') || '{}'
  );
  rotations[contentId] = rotationInfo;
  localStorage.setItem('keyRotations', JSON.stringify(rotations));

  // Re-bind device with new key
  await bindDeviceToContent(contentId, newKey);
}

/**
 * Get bound devices for content
 */
export async function getBoundDevices(
  contentId: string
): Promise<DeviceInfo[]> {
  const boundDevices = JSON.parse(
    localStorage.getItem('boundDevices') || '{}'
  );
  return boundDevices[contentId] || [];
}

/**
 * Unbind device from content
 */
export async function unbindDevice(
  contentId: string,
  deviceId: string
): Promise<void> {
  const boundDevices = JSON.parse(
    localStorage.getItem('boundDevices') || '{}'
  );
  
  if (boundDevices[contentId]) {
    boundDevices[contentId] = boundDevices[contentId].filter(
      (d: DeviceInfo) => d.deviceId !== deviceId
    );
    localStorage.setItem('boundDevices', JSON.stringify(boundDevices));
  }
}

/**
 * Check if device is bound to content
 */
export async function isDeviceBound(
  contentId: string
): Promise<boolean> {
  const deviceInfo = await getDeviceInfo();
  const boundDevices = await getBoundDevices(contentId);
  return boundDevices.some(d => d.deviceId === deviceInfo.deviceId);
} 