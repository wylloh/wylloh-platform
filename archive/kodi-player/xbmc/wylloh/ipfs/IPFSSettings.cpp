/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/ipfs/IPFSSettings.h"
#include "utils/log.h"
#include "utils/StringUtils.h"
#include "utils/JSONVariantParser.h"
#include "utils/JSONVariantWriter.h"
#include "filesystem/File.h"
#include "filesystem/Directory.h"
#include "ServiceBroker.h"
#include "settings/Settings.h"
#include "settings/SettingsComponent.h"
#include <algorithm>

namespace WYLLOH {
namespace IPFS {

// Default settings
const std::vector<std::string> DEFAULT_GATEWAYS = {
  "https://ipfs.io/ipfs/",
  "https://gateway.ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/"
};
const std::string DEFAULT_PRIMARY_GATEWAY = "https://ipfs.io/ipfs/";
const int DEFAULT_TIMEOUT_MS = 30000;  // 30 seconds
const int DEFAULT_CACHE_MAX_SIZE_MB = 1024;  // 1 GB
const int DEFAULT_CACHE_EXPIRY_HOURS = 72;  // 3 days
const bool DEFAULT_ENABLE_PINNING = false;

CIPFSSettings& CIPFSSettings::GetInstance()
{
  static CIPFSSettings instance;
  return instance;
}

CIPFSSettings::CIPFSSettings()
  : m_gateways(DEFAULT_GATEWAYS),
    m_primaryGateway(DEFAULT_PRIMARY_GATEWAY),
    m_timeoutMs(DEFAULT_TIMEOUT_MS),
    m_cacheMaxSizeMB(DEFAULT_CACHE_MAX_SIZE_MB),
    m_cacheExpiryHours(DEFAULT_CACHE_EXPIRY_HOURS),
    m_enablePinning(DEFAULT_ENABLE_PINNING),
    m_initialized(false)
{
  // Set default cache path
  m_cachePath = CServiceBroker::GetAppParams()->GetAppPath() + "wylloh-config/ipfs-cache";
}

CIPFSSettings::~CIPFSSettings()
{
  Shutdown();
}

bool CIPFSSettings::Initialize()
{
  CSingleLock lock(m_criticalSection);
  
  if (m_initialized)
    return true;
    
  CLog::Log(LOGINFO, "WYLLOH: Initializing IPFS Settings");
  
  // Create cache directory if it doesn't exist
  if (!XFILE::CDirectory::Exists(m_cachePath) && !XFILE::CDirectory::Create(m_cachePath))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create IPFS cache directory: %s", m_cachePath.c_str());
    // Not a fatal error, we'll continue with initialization
  }
  
  // Load settings from disk
  LoadSettings();
  
  // Register for settings changes
  CServiceBroker::GetSettingsComponent()->GetSettings()->RegisterCallback(this, "wylloh.ipfs");
  
  m_initialized = true;
  return true;
}

void CIPFSSettings::Shutdown()
{
  CSingleLock lock(m_criticalSection);
  
  if (!m_initialized)
    return;
    
  CLog::Log(LOGINFO, "WYLLOH: Shutting down IPFS Settings");
  
  // Save settings to disk
  SaveSettings();
  
  // Unregister settings callback
  CServiceBroker::GetSettingsComponent()->GetSettings()->UnregisterCallback(this);
  
  m_initialized = false;
}

void CIPFSSettings::OnSettingChanged(const std::shared_ptr<const CSetting>& setting)
{
  if (!setting)
    return;
    
  const std::string& settingId = setting->GetId();
  
  if (settingId == "wylloh.ipfs.primary_gateway")
  {
    auto primaryGateway = std::static_pointer_cast<const CSettingString>(setting)->GetValue();
    SetPrimaryGateway(primaryGateway);
  }
  else if (settingId == "wylloh.ipfs.timeout")
  {
    auto timeout = std::static_pointer_cast<const CSettingInt>(setting)->GetValue();
    SetRequestTimeoutMs(timeout);
  }
  else if (settingId == "wylloh.ipfs.cache_size")
  {
    auto cacheSize = std::static_pointer_cast<const CSettingInt>(setting)->GetValue();
    SetCacheMaxSizeMB(cacheSize);
  }
  else if (settingId == "wylloh.ipfs.cache_expiry")
  {
    auto cacheExpiry = std::static_pointer_cast<const CSettingInt>(setting)->GetValue();
    SetCacheExpiryHours(cacheExpiry);
  }
  else if (settingId == "wylloh.ipfs.enable_pinning")
  {
    auto enablePinning = std::static_pointer_cast<const CSettingBool>(setting)->GetValue();
    SetPinningEnabled(enablePinning);
  }
}

void CIPFSSettings::AddGateway(const std::string& gateway)
{
  CSingleLock lock(m_criticalSection);
  
  // Normalize gateway URL
  std::string normalizedGateway = gateway;
  if (!StringUtils::EndsWith(normalizedGateway, "/"))
    normalizedGateway += "/";
    
  // Check if gateway already exists
  auto it = std::find(m_gateways.begin(), m_gateways.end(), normalizedGateway);
  if (it != m_gateways.end())
    return;
    
  m_gateways.push_back(normalizedGateway);
  
  // Update settings
  SaveSettings();
}

void CIPFSSettings::RemoveGateway(const std::string& gateway)
{
  CSingleLock lock(m_criticalSection);
  
  // Normalize gateway URL
  std::string normalizedGateway = gateway;
  if (!StringUtils::EndsWith(normalizedGateway, "/"))
    normalizedGateway += "/";
    
  // Remove gateway
  auto it = std::find(m_gateways.begin(), m_gateways.end(), normalizedGateway);
  if (it != m_gateways.end())
  {
    m_gateways.erase(it);
    
    // If we're removing the primary gateway, set a new one
    if (m_primaryGateway == normalizedGateway && !m_gateways.empty())
      m_primaryGateway = m_gateways[0];
      
    // Update settings
    SaveSettings();
  }
}

void CIPFSSettings::ClearGateways()
{
  CSingleLock lock(m_criticalSection);
  
  m_gateways.clear();
  m_primaryGateway = "";
  
  // Update settings
  SaveSettings();
}

std::string CIPFSSettings::GetPrimaryGateway() const
{
  CSingleLock lock(m_criticalSection);
  
  // If primary gateway is not set or not in the list, return the first gateway
  if (m_primaryGateway.empty() || std::find(m_gateways.begin(), m_gateways.end(), m_primaryGateway) == m_gateways.end())
  {
    return m_gateways.empty() ? "" : m_gateways[0];
  }
  
  return m_primaryGateway;
}

void CIPFSSettings::SetPrimaryGateway(const std::string& gateway)
{
  CSingleLock lock(m_criticalSection);
  
  // Normalize gateway URL
  std::string normalizedGateway = gateway;
  if (!StringUtils::EndsWith(normalizedGateway, "/"))
    normalizedGateway += "/";
    
  // Check if gateway exists
  auto it = std::find(m_gateways.begin(), m_gateways.end(), normalizedGateway);
  if (it == m_gateways.end())
  {
    // Add gateway if it doesn't exist
    m_gateways.push_back(normalizedGateway);
  }
  
  m_primaryGateway = normalizedGateway;
  
  // Update settings
  SaveSettings();
}

void CIPFSSettings::SetRequestTimeoutMs(int timeoutMs)
{
  CSingleLock lock(m_criticalSection);
  
  m_timeoutMs = timeoutMs;
  
  // Update settings
  SaveSettings();
}

void CIPFSSettings::SetCachePath(const std::string& path)
{
  CSingleLock lock(m_criticalSection);
  
  m_cachePath = path;
  
  // Create cache directory if it doesn't exist
  if (!XFILE::CDirectory::Exists(m_cachePath) && !XFILE::CDirectory::Create(m_cachePath))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create IPFS cache directory: %s", m_cachePath.c_str());
  }
  
  // Update settings
  SaveSettings();
}

void CIPFSSettings::SetCacheMaxSizeMB(int maxSizeMB)
{
  CSingleLock lock(m_criticalSection);
  
  m_cacheMaxSizeMB = maxSizeMB;
  
  // Update settings
  SaveSettings();
}

void CIPFSSettings::SetCacheExpiryHours(int hours)
{
  CSingleLock lock(m_criticalSection);
  
  m_cacheExpiryHours = hours;
  
  // Update settings
  SaveSettings();
}

void CIPFSSettings::SetPinningEnabled(bool enabled)
{
  CSingleLock lock(m_criticalSection);
  
  m_enablePinning = enabled;
  
  // Update settings
  SaveSettings();
}

bool CIPFSSettings::LoadSettings()
{
  // Get settings file path
  std::string settingsFile = CServiceBroker::GetAppParams()->GetAppPath() + "wylloh-config/ipfs-settings.json";
  
  // Check if settings file exists
  if (!XFILE::CFile::Exists(settingsFile))
  {
    // Settings file doesn't exist, use defaults
    return false;
  }
  
  // Read settings file
  XFILE::CFile file;
  if (!file.Open(settingsFile))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to open IPFS settings file: %s", settingsFile.c_str());
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
    CLog::Log(LOGERROR, "WYLLOH: Empty IPFS settings file: %s", settingsFile.c_str());
    return false;
  }
  
  // Parse JSON
  CVariant json;
  if (!CJSONVariantParser::Parse(content, json) || !json.isObject())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to parse IPFS settings file: %s", settingsFile.c_str());
    return false;
  }
  
  // Extract settings
  if (json.isMember("gateways") && json["gateways"].isArray())
  {
    m_gateways.clear();
    for (auto it = json["gateways"].begin_array(); it != json["gateways"].end_array(); ++it)
    {
      if (it->isString())
        m_gateways.push_back(it->asString());
    }
  }
  
  if (json.isMember("primary_gateway") && json["primary_gateway"].isString())
    m_primaryGateway = json["primary_gateway"].asString();
    
  if (json.isMember("timeout_ms") && json["timeout_ms"].isInteger())
    m_timeoutMs = json["timeout_ms"].asInteger();
    
  if (json.isMember("cache_path") && json["cache_path"].isString())
    m_cachePath = json["cache_path"].asString();
    
  if (json.isMember("cache_max_size_mb") && json["cache_max_size_mb"].isInteger())
    m_cacheMaxSizeMB = json["cache_max_size_mb"].asInteger();
    
  if (json.isMember("cache_expiry_hours") && json["cache_expiry_hours"].isInteger())
    m_cacheExpiryHours = json["cache_expiry_hours"].asInteger();
    
  if (json.isMember("enable_pinning") && json["enable_pinning"].isBoolean())
    m_enablePinning = json["enable_pinning"].asBoolean();
    
  return true;
}

bool CIPFSSettings::SaveSettings()
{
  // Get settings file path
  std::string settingsFile = CServiceBroker::GetAppParams()->GetAppPath() + "wylloh-config/ipfs-settings.json";
  
  // Create settings directory if it doesn't exist
  std::string settingsDir = CServiceBroker::GetAppParams()->GetAppPath() + "wylloh-config";
  if (!XFILE::CDirectory::Exists(settingsDir) && !XFILE::CDirectory::Create(settingsDir))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to create settings directory: %s", settingsDir.c_str());
    return false;
  }
  
  // Create JSON
  CVariant json(CVariant::VariantTypeObject);
  
  // Gateways
  CVariant gatewaysArray(CVariant::VariantTypeArray);
  for (const auto& gateway : m_gateways)
    gatewaysArray.push_back(gateway);
  json["gateways"] = gatewaysArray;
  
  // Other settings
  json["primary_gateway"] = m_primaryGateway;
  json["timeout_ms"] = m_timeoutMs;
  json["cache_path"] = m_cachePath;
  json["cache_max_size_mb"] = m_cacheMaxSizeMB;
  json["cache_expiry_hours"] = m_cacheExpiryHours;
  json["enable_pinning"] = m_enablePinning;
  
  // Convert to JSON string
  std::string jsonStr;
  if (!CJSONVariantWriter::Write(json, jsonStr, true))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to serialize IPFS settings");
    return false;
  }
  
  // Write to file
  XFILE::CFile file;
  if (!file.OpenForWrite(settingsFile, true))
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to open IPFS settings file for writing: %s", settingsFile.c_str());
    return false;
  }
  
  ssize_t written = file.Write(jsonStr.c_str(), jsonStr.size());
  file.Close();
  
  return (written == (ssize_t)jsonStr.size());
}

} // namespace IPFS
} // namespace WYLLOH 