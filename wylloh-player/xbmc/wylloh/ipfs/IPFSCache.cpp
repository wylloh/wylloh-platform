/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/ipfs/IPFSCache.h"
#include "wylloh/ipfs/IPFSSettings.h"
#include "utils/log.h"
#include "utils/StringUtils.h"
#include "utils/JSONVariantParser.h"
#include "utils/JSONVariantWriter.h"
#include "filesystem/File.h"
#include "filesystem/Directory.h"
#include "ServiceBroker.h"
#include <algorithm>

namespace WYLLOH {
namespace IPFS {

CIPFSCache& CIPFSCache::GetInstance()
{
  static CIPFSCache instance;
  return instance;
}

CIPFSCache::CIPFSCache()
  : m_totalSize(0),
    m_initialized(false)
{
}

CIPFSCache::~CIPFSCache()
{
  Shutdown();
}

bool CIPFSCache::Initialize()
{
  CSingleLock lock(m_criticalSection);
  
  if (m_initialized)
    return true;
    
  CLog::Log(LOGINFO, "WYLLOH: Initializing IPFS Cache");
  
  // Ensure cache directory exists
  if (!EnsureCacheDirectory())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create IPFS cache directory");
    return false;
  }
  
  // Load cache index
  LoadCacheIndex();
  
  // Cleanup expired entries
  CleanupCache();
  
  m_initialized = true;
  return true;
}

void CIPFSCache::Shutdown()
{
  CSingleLock lock(m_criticalSection);
  
  if (!m_initialized)
    return;
    
  CLog::Log(LOGINFO, "WYLLOH: Shutting down IPFS Cache");
  
  // Save cache index
  SaveCacheIndex();
  
  m_cache.clear();
  m_totalSize = 0;
  m_initialized = false;
}

bool CIPFSCache::IsCached(const std::string& cid) const
{
  CSingleLock lock(m_criticalSection);
  
  // Check if CID is in cache
  auto it = m_cache.find(cid);
  if (it == m_cache.end())
    return false;
    
  // Check if entry is pinned or not expired
  const CacheEntry& entry = it->second;
  if (entry.pinned)
    return true;
    
  // Check if expired
  time_t now = time(nullptr);
  return (now <= entry.expiryTime);
}

std::string CIPFSCache::GetCachedPath(const std::string& cid) const
{
  CSingleLock lock(m_criticalSection);
  
  // Check if CID is in cache
  auto it = m_cache.find(cid);
  if (it == m_cache.end())
    return "";
    
  // Check if entry is pinned or not expired
  const CacheEntry& entry = it->second;
  if (!entry.pinned)
  {
    // Check if expired
    time_t now = time(nullptr);
    if (now > entry.expiryTime)
      return "";
  }
  
  // Check if file exists
  if (!XFILE::CFile::Exists(entry.localPath))
    return "";
    
  return entry.localPath;
}

bool CIPFSCache::CacheContent(const std::string& cid, const std::string& sourcePath, uint64_t size, bool pinned)
{
  if (cid.empty() || sourcePath.empty() || !XFILE::CFile::Exists(sourcePath))
    return false;
    
  CSingleLock lock(m_criticalSection);
  
  // Ensure cache directory exists
  if (!EnsureCacheDirectory())
    return false;
    
  // Generate target path
  std::string targetPath = GetCachePath(cid);
  
  // Copy file to cache
  if (!XFILE::CFile::Copy(sourcePath, targetPath))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to copy file to cache: %s -> %s", sourcePath.c_str(), targetPath.c_str());
    return false;
  }
  
  // Create cache entry
  CacheEntry entry;
  entry.cid = cid;
  entry.localPath = targetPath;
  entry.timestamp = time(nullptr);
  entry.size = size;
  entry.pinned = pinned;
  
  // Calculate expiry time
  int expiryHours = CIPFSSettings::GetInstance().GetCacheExpiryHours();
  entry.expiryTime = entry.timestamp + (expiryHours * 3600);
  
  // Update total size
  auto it = m_cache.find(cid);
  if (it != m_cache.end())
    m_totalSize -= it->second.size;
  m_totalSize += size;
  
  // Add to cache
  m_cache[cid] = entry;
  
  // Enforce cache size limit
  EnforceCacheSizeLimit();
  
  // Save cache index
  SaveCacheIndex();
  
  return true;
}

bool CIPFSCache::RemoveContent(const std::string& cid)
{
  CSingleLock lock(m_criticalSection);
  
  // Check if CID is in cache
  auto it = m_cache.find(cid);
  if (it == m_cache.end())
    return false;
    
  const CacheEntry& entry = it->second;
  
  // Delete file
  if (XFILE::CFile::Exists(entry.localPath) && !XFILE::CFile::Delete(entry.localPath))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to delete cached file: %s", entry.localPath.c_str());
    return false;
  }
  
  // Update total size
  m_totalSize -= entry.size;
  
  // Remove from cache
  m_cache.erase(it);
  
  // Save cache index
  SaveCacheIndex();
  
  return true;
}

void CIPFSCache::ClearCache()
{
  CSingleLock lock(m_criticalSection);
  
  // Delete all cached files
  for (const auto& pair : m_cache)
  {
    const CacheEntry& entry = pair.second;
    if (XFILE::CFile::Exists(entry.localPath))
      XFILE::CFile::Delete(entry.localPath);
  }
  
  // Clear cache
  m_cache.clear();
  m_totalSize = 0;
  
  // Save cache index
  SaveCacheIndex();
}

void CIPFSCache::CleanupCache()
{
  CSingleLock lock(m_criticalSection);
  
  time_t now = time(nullptr);
  
  // Remove expired entries
  auto it = m_cache.begin();
  while (it != m_cache.end())
  {
    const CacheEntry& entry = it->second;
    
    // Skip pinned entries
    if (entry.pinned)
    {
      ++it;
      continue;
    }
    
    // Check if expired
    if (now > entry.expiryTime)
    {
      // Delete file
      if (XFILE::CFile::Exists(entry.localPath))
        XFILE::CFile::Delete(entry.localPath);
        
      // Update total size
      m_totalSize -= entry.size;
      
      // Remove from cache
      it = m_cache.erase(it);
    }
    else
    {
      ++it;
    }
  }
  
  // Enforce cache size limit
  EnforceCacheSizeLimit();
  
  // Save cache index
  SaveCacheIndex();
}

bool CIPFSCache::PinContent(const std::string& cid)
{
  CSingleLock lock(m_criticalSection);
  
  // Check if CID is in cache
  auto it = m_cache.find(cid);
  if (it == m_cache.end())
    return false;
    
  // Pin entry
  it->second.pinned = true;
  
  // Save cache index
  SaveCacheIndex();
  
  return true;
}

bool CIPFSCache::UnpinContent(const std::string& cid)
{
  CSingleLock lock(m_criticalSection);
  
  // Check if CID is in cache
  auto it = m_cache.find(cid);
  if (it == m_cache.end())
    return false;
    
  // Unpin entry
  it->second.pinned = false;
  
  // Update expiry time
  int expiryHours = CIPFSSettings::GetInstance().GetCacheExpiryHours();
  it->second.expiryTime = time(nullptr) + (expiryHours * 3600);
  
  // Save cache index
  SaveCacheIndex();
  
  return true;
}

std::vector<std::string> CIPFSCache::GetCachedCIDs() const
{
  CSingleLock lock(m_criticalSection);
  
  std::vector<std::string> cids;
  cids.reserve(m_cache.size());
  
  for (const auto& pair : m_cache)
    cids.push_back(pair.first);
    
  return cids;
}

uint64_t CIPFSCache::GetCacheSize() const
{
  CSingleLock lock(m_criticalSection);
  return m_totalSize;
}

bool CIPFSCache::LoadCacheIndex()
{
  // Get cache index path
  std::string cacheIndexPath = CIPFSSettings::GetInstance().GetCachePath() + "/cache-index.json";
  
  // Check if cache index exists
  if (!XFILE::CFile::Exists(cacheIndexPath))
    return false;
    
  // Read cache index
  XFILE::CFile file;
  if (!file.Open(cacheIndexPath))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to open IPFS cache index: %s", cacheIndexPath.c_str());
    return false;
  }
  
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
  {
    CLog::Log(LOGERROR, "WYLLOH: Empty IPFS cache index: %s", cacheIndexPath.c_str());
    return false;
  }
  
  // Parse JSON
  CVariant json;
  if (!CJSONVariantParser::Parse(content, json) || !json.isObject())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to parse IPFS cache index: %s", cacheIndexPath.c_str());
    return false;
  }
  
  // Extract entries
  if (!json.isMember("entries") || !json["entries"].isArray())
  {
    CLog::Log(LOGERROR, "WYLLOH: Invalid IPFS cache index: %s", cacheIndexPath.c_str());
    return false;
  }
  
  // Clear existing cache
  m_cache.clear();
  m_totalSize = 0;
  
  // Add entries from JSON
  for (auto it = json["entries"].begin_array(); it != json["entries"].end_array(); ++it)
  {
    if (!it->isObject())
      continue;
      
    CacheEntry entry;
    entry.cid = (*it)["cid"].asString();
    entry.localPath = (*it)["local_path"].asString();
    entry.timestamp = (*it)["timestamp"].asInteger();
    entry.expiryTime = (*it)["expiry_time"].asInteger();
    entry.size = (*it)["size"].asUnsignedInteger();
    entry.pinned = (*it)["pinned"].asBoolean();
    
    // Check if file exists
    if (!XFILE::CFile::Exists(entry.localPath))
      continue;
      
    // Add to cache
    m_cache[entry.cid] = entry;
    m_totalSize += entry.size;
  }
  
  return true;
}

bool CIPFSCache::SaveCacheIndex()
{
  // Get cache index path
  std::string cacheIndexPath = CIPFSSettings::GetInstance().GetCachePath() + "/cache-index.json";
  
  // Create JSON
  CVariant json(CVariant::VariantTypeObject);
  CVariant entriesArray(CVariant::VariantTypeArray);
  
  // Add entries to JSON
  for (const auto& pair : m_cache)
  {
    const CacheEntry& entry = pair.second;
    
    CVariant entryJson(CVariant::VariantTypeObject);
    entryJson["cid"] = entry.cid;
    entryJson["local_path"] = entry.localPath;
    entryJson["timestamp"] = (int64_t)entry.timestamp;
    entryJson["expiry_time"] = (int64_t)entry.expiryTime;
    entryJson["size"] = (uint64_t)entry.size;
    entryJson["pinned"] = entry.pinned;
    
    entriesArray.push_back(entryJson);
  }
  
  json["entries"] = entriesArray;
  
  // Convert to JSON string
  std::string jsonStr;
  if (!CJSONVariantWriter::Write(json, jsonStr, true))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to serialize IPFS cache index");
    return false;
  }
  
  // Write to file
  XFILE::CFile file;
  if (!file.OpenForWrite(cacheIndexPath, true))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to open IPFS cache index for writing: %s", cacheIndexPath.c_str());
    return false;
  }
  
  ssize_t written = file.Write(jsonStr.c_str(), jsonStr.size());
  file.Close();
  
  return (written == (ssize_t)jsonStr.size());
}

std::string CIPFSCache::GetCachePath(const std::string& cid) const
{
  // Normalize CID
  std::string normalizedCid = cid;
  
  // Remove IPFS prefix if present
  if (StringUtils::StartsWith(normalizedCid, "ipfs://"))
    normalizedCid = normalizedCid.substr(7);
    
  // Get cache directory
  std::string cacheDir = CIPFSSettings::GetInstance().GetCachePath();
  
  // Create path
  return cacheDir + "/" + normalizedCid;
}

bool CIPFSCache::EnsureCacheDirectory() const
{
  // Get cache directory
  std::string cacheDir = CIPFSSettings::GetInstance().GetCachePath();
  
  // Check if directory exists
  if (XFILE::CDirectory::Exists(cacheDir))
    return true;
    
  // Create directory
  return XFILE::CDirectory::Create(cacheDir);
}

void CIPFSCache::EnforceCacheSizeLimit()
{
  // Get cache size limit
  uint64_t maxSizeBytes = (uint64_t)CIPFSSettings::GetInstance().GetCacheMaxSizeMB() * 1024 * 1024;
  
  // Check if we're under the limit
  if (m_totalSize <= maxSizeBytes)
    return;
    
  // Create a list of unpinned entries sorted by timestamp (oldest first)
  std::vector<std::pair<std::string, CacheEntry>> entries;
  for (const auto& pair : m_cache)
  {
    if (!pair.second.pinned)
      entries.push_back(pair);
  }
  
  // Sort by timestamp
  std::sort(entries.begin(), entries.end(), 
    [](const std::pair<std::string, CacheEntry>& a, const std::pair<std::string, CacheEntry>& b) {
      return a.second.timestamp < b.second.timestamp;
    });
    
  // Remove entries until we're under the limit
  for (const auto& pair : entries)
  {
    if (m_totalSize <= maxSizeBytes)
      break;
      
    const std::string& cid = pair.first;
    const CacheEntry& entry = pair.second;
    
    // Delete file
    if (XFILE::CFile::Exists(entry.localPath))
      XFILE::CFile::Delete(entry.localPath);
      
    // Update total size
    m_totalSize -= entry.size;
    
    // Remove from cache
    m_cache.erase(cid);
  }
}

} // namespace IPFS
} // namespace WYLLOH 