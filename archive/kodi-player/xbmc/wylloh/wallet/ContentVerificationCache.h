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
namespace WALLET {

struct VerificationCacheEntry
{
  std::string contentId;
  std::string walletAddress;
  bool isOwned;
  time_t timestamp;
  time_t expiryTime;
};

class CContentVerificationCache
{
public:
  static CContentVerificationCache& GetInstance();
  
  bool Initialize();
  void Shutdown();
  
  bool IsContentOwned(const std::string& contentId, const std::string& walletAddress, bool& isOwned);
  void SetContentOwnership(const std::string& contentId, const std::string& walletAddress, bool isOwned, unsigned int cacheTimeSeconds = 3600);
  
  void ClearCache();
  void ClearExpiredEntries();
  
private:
  CContentVerificationCache();
  ~CContentVerificationCache();
  
  bool LoadCacheFromDisk();
  bool SaveCacheToDisk();
  
  std::string GetCacheKey(const std::string& contentId, const std::string& walletAddress) const;
  std::string GetCacheFilePath() const;
  
  CCriticalSection m_criticalSection;
  std::map<std::string, VerificationCacheEntry> m_cache;
  bool m_initialized;
  time_t m_lastSaveTime;
};

}  // namespace WALLET
}  // namespace WYLLOH 