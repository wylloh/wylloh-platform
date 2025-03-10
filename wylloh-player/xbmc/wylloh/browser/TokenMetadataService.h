/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#pragma once

#include <string>
#include <vector>
#include <map>
#include "threads/CriticalSection.h"
#include "FileItem.h"

namespace WYLLOH {

struct TokenMetadata
{
  std::string tokenId;
  std::string contentId;
  std::string name;
  std::string description;
  std::string type;
  std::string imageUrl;
  std::string acquiredDate;
  std::map<std::string, std::string> attributes;
};

class CTokenMetadataService
{
public:
  static CTokenMetadataService& GetInstance();
  
  bool Initialize();
  void Shutdown();
  
  bool GetTokenMetadata(const std::string& tokenId, TokenMetadata& metadata);
  bool EnhanceTokenItem(CFileItem& item);
  
  void ClearCache();
  
private:
  CTokenMetadataService();
  ~CTokenMetadataService();
  
  bool FetchTokenMetadata(const std::string& tokenId, TokenMetadata& metadata);
  bool LoadTokenMetadataFromCache(const std::string& tokenId, TokenMetadata& metadata);
  bool SaveTokenMetadataToCache(const TokenMetadata& metadata);
  
  std::string GetCacheFilePath(const std::string& tokenId) const;
  
  CCriticalSection m_criticalSection;
  std::map<std::string, TokenMetadata> m_metadataCache;
  bool m_initialized;
};

} // namespace WYLLOH 