/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/browser/TokenMetadataService.h"
#include "wylloh/WyllohManager.h"
#include "Application.h"
#include "ServiceBroker.h"
#include "utils/log.h"
#include "utils/StringUtils.h"
#include "utils/JSONVariantParser.h"
#include "utils/JSONVariantWriter.h"
#include "filesystem/File.h"
#include "filesystem/Directory.h"
#include "URL.h"
#include "FileItem.h"
#include <algorithm>

namespace WYLLOH {

CTokenMetadataService& CTokenMetadataService::GetInstance()
{
  static CTokenMetadataService instance;
  return instance;
}

CTokenMetadataService::CTokenMetadataService()
  : m_initialized(false)
{
}

CTokenMetadataService::~CTokenMetadataService()
{
  Shutdown();
}

bool CTokenMetadataService::Initialize()
{
  CSingleLock lock(m_criticalSection);
  
  if (m_initialized)
    return true;
    
  CLog::Log(LOGINFO, "WYLLOH: Initializing TokenMetadataService");
  
  // Create cache directory if it doesn't exist
  std::string cachePath = CServiceBroker::GetAppParams()->GetAppPath() + "wylloh-config/token-cache";
  if (!XFILE::CDirectory::Exists(cachePath) && !XFILE::CDirectory::Create(cachePath))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create token cache directory: %s", cachePath.c_str());
    return false;
  }
  
  m_initialized = true;
  return true;
}

void CTokenMetadataService::Shutdown()
{
  CSingleLock lock(m_criticalSection);
  
  if (!m_initialized)
    return;
    
  CLog::Log(LOGINFO, "WYLLOH: Shutting down TokenMetadataService");
  
  m_metadataCache.clear();
  m_initialized = false;
}

bool CTokenMetadataService::GetTokenMetadata(const std::string& tokenId, TokenMetadata& metadata)
{
  if (tokenId.empty())
    return false;
    
  CSingleLock lock(m_criticalSection);
  
  // Check if metadata is in memory cache
  auto it = m_metadataCache.find(tokenId);
  if (it != m_metadataCache.end())
  {
    metadata = it->second;
    return true;
  }
  
  // Try to load from disk cache
  if (LoadTokenMetadataFromCache(tokenId, metadata))
  {
    // Add to memory cache
    m_metadataCache[tokenId] = metadata;
    return true;
  }
  
  // Fetch from API
  if (FetchTokenMetadata(tokenId, metadata))
  {
    // Add to memory cache
    m_metadataCache[tokenId] = metadata;
    
    // Save to disk cache
    SaveTokenMetadataToCache(metadata);
    
    return true;
  }
  
  return false;
}

bool CTokenMetadataService::EnhanceTokenItem(CFileItem& item)
{
  std::string tokenId = item.GetProperty("tokenId").asString();
  if (tokenId.empty())
    return false;
    
  TokenMetadata metadata;
  if (!GetTokenMetadata(tokenId, metadata))
    return false;
    
  // Update item properties with metadata
  item.SetProperty("name", metadata.name);
  item.SetProperty("description", metadata.description);
  item.SetProperty("type", metadata.type);
  item.SetProperty("imageUrl", metadata.imageUrl);
  item.SetProperty("acquiredDate", metadata.acquiredDate);
  
  // Set label and artwork
  if (!metadata.name.empty())
  {
    item.SetLabel(metadata.name);
  }
  
  if (!metadata.imageUrl.empty())
  {
    item.SetArt("thumb", metadata.imageUrl);
  }
  
  // Add attributes as properties
  for (const auto& attr : metadata.attributes)
  {
    item.SetProperty("attr." + attr.first, attr.second);
  }
  
  return true;
}

void CTokenMetadataService::ClearCache()
{
  CSingleLock lock(m_criticalSection);
  
  m_metadataCache.clear();
  
  // Delete all cache files
  std::string cachePath = CServiceBroker::GetAppParams()->GetAppPath() + "wylloh-config/token-cache";
  XFILE::CDirectory::Remove(cachePath, true);
  XFILE::CDirectory::Create(cachePath);
}

bool CTokenMetadataService::FetchTokenMetadata(const std::string& tokenId, TokenMetadata& metadata)
{
  // For now, we'll create some dummy metadata
  // In a real implementation, this would fetch from the API
  
  metadata.tokenId = tokenId;
  metadata.contentId = tokenId; // For now, use tokenId as contentId
  metadata.name = "Token #" + tokenId.substr(0, 8);
  metadata.description = "This is a token for content ID: " + tokenId;
  metadata.type = "Video";
  metadata.imageUrl = "special://xbmc/media/wylloh/tokens/placeholder.svg";
  
  // Generate a random date in the last year
  time_t now = time(nullptr);
  time_t oneYearAgo = now - (365 * 24 * 60 * 60);
  time_t randomTime = oneYearAgo + (rand() % (int)(now - oneYearAgo));
  struct tm* timeinfo = localtime(&randomTime);
  char buffer[80];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d", timeinfo);
  metadata.acquiredDate = buffer;
  
  // Add some dummy attributes
  metadata.attributes["resolution"] = "1920x1080";
  metadata.attributes["duration"] = "01:30:00";
  metadata.attributes["creator"] = "Wylloh Studios";
  
  return true;
}

bool CTokenMetadataService::LoadTokenMetadataFromCache(const std::string& tokenId, TokenMetadata& metadata)
{
  std::string cacheFile = GetCacheFilePath(tokenId);
  
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
    
  // Extract metadata
  metadata.tokenId = json["tokenId"].asString();
  metadata.contentId = json["contentId"].asString();
  metadata.name = json["name"].asString();
  metadata.description = json["description"].asString();
  metadata.type = json["type"].asString();
  metadata.imageUrl = json["imageUrl"].asString();
  metadata.acquiredDate = json["acquiredDate"].asString();
  
  // Extract attributes
  if (json["attributes"].isObject())
  {
    for (auto it = json["attributes"].begin_map(); it != json["attributes"].end_map(); ++it)
    {
      metadata.attributes[it->first] = it->second.asString();
    }
  }
  
  return true;
}

bool CTokenMetadataService::SaveTokenMetadataToCache(const TokenMetadata& metadata)
{
  std::string cacheFile = GetCacheFilePath(metadata.tokenId);
  
  // Create JSON
  CVariant json(CVariant::VariantTypeObject);
  json["tokenId"] = metadata.tokenId;
  json["contentId"] = metadata.contentId;
  json["name"] = metadata.name;
  json["description"] = metadata.description;
  json["type"] = metadata.type;
  json["imageUrl"] = metadata.imageUrl;
  json["acquiredDate"] = metadata.acquiredDate;
  
  // Add attributes
  CVariant attributes(CVariant::VariantTypeObject);
  for (const auto& attr : metadata.attributes)
  {
    attributes[attr.first] = attr.second;
  }
  json["attributes"] = attributes;
  
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

std::string CTokenMetadataService::GetCacheFilePath(const std::string& tokenId) const
{
  std::string cachePath = CServiceBroker::GetAppParams()->GetAppPath() + "wylloh-config/token-cache";
  return cachePath + "/" + tokenId + ".json";
}

} // namespace WYLLOH 