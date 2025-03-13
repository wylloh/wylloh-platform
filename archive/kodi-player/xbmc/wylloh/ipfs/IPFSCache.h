/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#pragma once

#include <string>
#include <map>
#include <vector>
#include "threads/CriticalSection.h"

namespace WYLLOH {
namespace IPFS {

struct CacheEntry
{
  std::string cid;
  std::string localPath;
  time_t timestamp;
  time_t expiryTime;
  uint64_t size;
  bool pinned;
};

/**
 * @class CIPFSCache
 * @brief Manages caching of IPFS content
 */
class CIPFSCache
{
public:
  static CIPFSCache& GetInstance();
  
  bool Initialize();
  void Shutdown();
  
  /**
   * Check if a CID is in the cache and not expired
   * 
   * @param cid IPFS content identifier
   * @return true if the content is cached and valid, false otherwise
   */
  bool IsCached(const std::string& cid) const;
  
  /**
   * Get the local path for a cached CID
   * 
   * @param cid IPFS content identifier
   * @return Local file path for the cached content, or empty if not cached
   */
  std::string GetCachedPath(const std::string& cid) const;
  
  /**
   * Add content to the cache
   * 
   * @param cid IPFS content identifier
   * @param sourcePath Path to the downloaded content
   * @param size Content size in bytes
   * @param pinned Whether the content should be pinned (not expire)
   * @return true if successful, false otherwise
   */
  bool CacheContent(const std::string& cid, const std::string& sourcePath, uint64_t size, bool pinned = false);
  
  /**
   * Remove content from the cache
   * 
   * @param cid IPFS content identifier
   * @return true if successful, false otherwise
   */
  bool RemoveContent(const std::string& cid);
  
  /**
   * Clear all cache entries
   */
  void ClearCache();
  
  /**
   * Clean up expired entries and enforce cache size limits
   */
  void CleanupCache();
  
  /**
   * Pin content to prevent expiration
   * 
   * @param cid IPFS content identifier
   * @return true if successful, false otherwise
   */
  bool PinContent(const std::string& cid);
  
  /**
   * Unpin content to allow expiration
   * 
   * @param cid IPFS content identifier
   * @return true if successful, false otherwise
   */
  bool UnpinContent(const std::string& cid);
  
  /**
   * Get a list of all cached CIDs
   * 
   * @return Vector of cached CIDs
   */
  std::vector<std::string> GetCachedCIDs() const;
  
  /**
   * Get current cache size in bytes
   * 
   * @return Total size of cached content in bytes
   */
  uint64_t GetCacheSize() const;
  
private:
  CIPFSCache();
  ~CIPFSCache();
  
  bool LoadCacheIndex();
  bool SaveCacheIndex();
  
  std::string GetCachePath(const std::string& cid) const;
  bool EnsureCacheDirectory() const;
  void EnforceCacheSizeLimit();
  
  CCriticalSection m_criticalSection;
  std::map<std::string, CacheEntry> m_cache;
  uint64_t m_totalSize;
  bool m_initialized;
};

} // namespace IPFS
} // namespace WYLLOH 