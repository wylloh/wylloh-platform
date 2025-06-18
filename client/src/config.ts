// Updated for subdomain-based routing
export const API_BASE_URL = 'https://api.wylloh.com';
export const STORAGE_BASE_URL = 'https://storage.wylloh.com';
export const IPFS_BASE_URL = 'https://ipfs.wylloh.com';

// Development fallbacks (when running locally)
const isDevelopment = process.env.NODE_ENV === 'development';

export const ENDPOINTS = {
  API: isDevelopment ? 'http://localhost:3001' : API_BASE_URL,
  STORAGE: isDevelopment ? 'http://localhost:3002' : STORAGE_BASE_URL,
  IPFS: isDevelopment ? 'http://localhost:8080' : IPFS_BASE_URL,
};
