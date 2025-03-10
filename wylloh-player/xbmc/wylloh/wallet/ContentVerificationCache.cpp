/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/wallet/ContentVerificationCache.h"
#include "utils/log.h"
#include "utils/StringUtils.h"
#include "utils/JSONVariantParser.h"
#include "utils/JSONVariantWriter.h"
#include "filesystem/File.h"
#include "filesystem/Directory.h"
#include "ServiceBroker.h"
#include <algorithm>

namespace WYLLOH {
namespace WALLET {

CContentVerificationCache& CContentVerificationCache::GetInstance()
{
  static CContentVerificationCache instance;
  return instance;
}

CContentVerificationCache::CContentVerificationCache()
  : m_initialized(false),
    m_lastSaveTime(0)
{
}

CContentVerificationCache::~CContentVerificationCache()
{
  Shutdown();
}

bool CContentVerificationCache::Initialize()
{
  CSingleLock lock(m_criticalSection);
  
  if (m_initialized)
    return true;
    
  CLog::Log(LOGINFO, "WYLLOH: Initializing ContentVerificationCache");
  
  // Create cache directory if it doesn't exist
  std::string cachePath = CServiceBroker::GetAppParams()->GetAppPath() + "wylloh-config/verification-cache";
  if (!XFILE::CDirectory::Exists(cachePath) && !XFILE::CDirectory::Create(cachePath))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create verification cache directory: %s", cachePath.c_str());
    return false;
  }
  
  // Load cache from disk
  LoadCacheFromDisk();
  
  // Clear expired entries
  ClearExpiredEntries();
  
  m_initialized = true;
  return true;
}

void CContentVerificationCache::Shutdown()
{
  CSingleLock lock(m_criticalSection);
  
  if (!m_initialized)
    return;
    
  CLog::Log(LOGINFO, "WYLLOH: Shutting down ContentVerificationCache");
  
  // Save cache to disk
  SaveCacheToDisk();
  
  m_cache.clear();
  m_initialized = false;
}

bool CContentVerificationCache::IsContentOwned(const std::string& contentId, const std::string& walletAddress, bool& isOwned)
{
  if (contentId.empty() || walletAddress.empty())
    return false;
    
  CSingleLock lock(m_criticalSection);
  
  // Get cache key
  std::string cacheKey = GetCacheKey(contentId, walletAddress);
  
  // Check if entry exists in cache
  auto it = m_cache.find(cacheKey);
  if (it == m_cache.end())
    return false;
    
  // Check if entry has expired
  time_t now = time(nullptr);
  if (now > it->second.expiryTime)
  {
    // Entry has expired, remove it
    m_cache.erase(it);
    return false;
  }
  
  // Entry is valid, return ownership status
  isOwned = it->second.isOwned;
  return true;
}

void CContentVerificationCache::SetContentOwnership(const std::string& contentId, const std::string& walletAddress, bool isOwned, unsigned int cacheTimeSeconds)
{
  if (contentId.empty() || walletAddress.empty())
    return;
    
  CSingleLock lock(m_criticalSection);
  
  // Get cache key
  std::string cacheKey = GetCacheKey(contentId, walletAddress);
  
  // Create or update cache entry
  VerificationCacheEntry entry;
  entry.contentId = contentId;
  entry.walletAddress = walletAddress;
  entry.isOwned = isOwned;
  entry.timestamp = time(nullptr);
  entry.expiryTime = entry.timestamp + cacheTimeSeconds;
  
  m_cache[cacheKey] = entry;
  
  // Save cache to disk periodically
  time_t now = time(nullptr);
  if (now - m_lastSaveTime > 300) // Save every 5 minutes
  {
    SaveCacheToDisk();
    m_lastSaveTime = now;
  }
}

void CContentVerificationCache::ClearCache()
{
  CSingleLock lock(m_criticalSection);
  
  m_cache.clear();
  
  // Delete cache file
  std::string cacheFile = GetCacheFilePath();
  XFILE::CFile::Delete(cacheFile);
}

void CContentVerificationCache::ClearExpiredEntries()
{
  CSingleLock lock(m_criticalSection);
  
  time_t now = time(nullptr);
  
  // Remove expired entries
  auto it = m_cache.begin();
  while (it != m_cache.end())
  {
    if (now > it->second.expiryTime)
    {
      it = m_cache.erase(it);
    }
    else
    {
      ++it;
    }
  }
}

bool CContentVerificationCache::LoadCacheFromDisk()
{
  std::string cacheFile = GetCacheFilePath();
  
  // Check if cache file exists
  if (!XFILE::CFile::Exists(cacheFile))
    return false;
    
  // Read cache file
  XFILE::CFile file;
  if (!file.Open(cacheFile))
    return false;
    
  // Read file content
  std::string content;
  char buffer[1024];
  ssize_t bytesRead;
  while ((bytesRead = file.Read(buffer, sizeof(buffer))) > 0)
  {
    content.append(buffer, bytesRead);
  }
  file.Close();
  
  if (content.empty())
    return false;
    
  // Parse JSON
  CVariant json;
  if (!CJSONVariantParser::Parse(content, json) || !json.isObject())
    return false;
    
  // Extract cache entries
  if (!json["entries"].isArray())
    return false;
    
  // Clear existing cache
  m_cache.clear();
  
  // Add entries from JSON
  for (auto it = json["entries"].begin_array(); it != json["entries"].end_array(); ++it)
  {
    if (!it->isObject())
      continue;
      
    VerificationCacheEntry entry;
    entry.contentId = (*it)["contentId"].asString();
    entry.walletAddress = (*it)["walletAddress"].asString();
    entry.isOwned = (*it)["isOwned"].asBoolean();
    entry.timestamp = (*it)["timestamp"].asInteger();
    entry.expiryTime = (*it)["expiryTime"].asInteger();
    
    // Add to cache
    std::string cacheKey = GetCacheKey(entry.contentId, entry.walletAddress);
    m_cache[cacheKey] = entry;
  }
  
  return true;
}

bool CContentVerificationCache::SaveCacheToDisk()
{
  std::string cacheFile = GetCacheFilePath();
  
  // Create JSON
  CVariant json(CVariant::VariantTypeObject);
  CVariant entries(CVariant::VariantTypeArray);
  
  // Add entries to JSON
  for (const auto& pair : m_cache)
  {
    const VerificationCacheEntry& entry = pair.second;
    
    CVariant entryJson(CVariant::VariantTypeObject);
    entryJson["contentId"] = entry.contentId;
    entryJson["walletAddress"] = entry.walletAddress;
    entryJson["isOwned"] = entry.isOwned;
    entryJson["timestamp"] = (int64_t)entry.timestamp;
    entryJson["expiryTime"] = (int64_t)entry.expiryTime;
    
    entries.push_back(entryJson);
  }
  
  json["entries"] = entries;
  
  // Convert to JSON string
  std::string jsonStr;
  if (!CJSONVariantWriter::Write(json, jsonStr, true))
    return false;
    
  // Write to file
  XFILE::CFile file;
  if (!file.OpenForWrite(cacheFile, true))
    return false;
    
  ssize_t written = file.Write(jsonStr.c_str(), jsonStr.size());
  file.Close();
  
  return (written == (ssize_t)jsonStr.size());
}

std::string CContentVerificationCache::GetCacheKey(const std::string& contentId, const std::string& walletAddress) const
{
  return contentId + ":" + walletAddress;
}

std::string CContentVerificationCache::GetCacheFilePath() const
{
  std::string cachePath = CServiceBroker::GetAppParams()->GetAppPath() + "wylloh-config/verification-cache";
  return cachePath + "/verification_cache.json";
}

}  // namespace WALLET
}  // namespace WYLLOH 