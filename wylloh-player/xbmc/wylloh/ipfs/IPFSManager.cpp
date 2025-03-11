#include "IPFSManager.h"
#include "profiles/ProfileManager.h"
#include "ServiceBroker.h"
#include "settings/Settings.h"
#include "settings/SettingsComponent.h"
#include "filesystem/File.h"
#include "utils/JSONVariantParser.h"
#include "utils/JSONVariantWriter.h"
#include "utils/StringUtils.h"
#include "utils/Base64.h"
#include "utils/Hash.h"
#include "filesystem/SpecialProtocol.h"
#include "guilib/GUIWindowManager.h"
#include "dialogs/GUIDialogOK.h"
#include "dialogs/GUIDialogSelect.h"
#include "dialogs/GUIDialogKeyboard.h"
#include "guilib/LocalizeStrings.h"

#include <algorithm>
#include <iostream>
#include <fstream>
#include <sstream>
#include <chrono>
#include <ctime>

namespace WYLLOH
{

// Initialize static instance
CIPFSManager* CIPFSManager::m_instance = nullptr;

CIPFSManager& CIPFSManager::GetInstance()
{
  if (!m_instance)
    m_instance = new CIPFSManager();
  return *m_instance;
}

CIPFSManager::CIPFSManager()
  : m_primaryGateway("https://ipfs.io/ipfs/")
  , m_timeout(30000)
  , m_cacheSize(1024)
  , m_cacheExpiry(72)
  , m_enablePinning(false)
  , m_networkParticipationEnabled(false)
  , m_networkStorageAllocation(10) // 10 GB default
  , m_networkBandwidthLimit(1000)  // 1000 KB/s default
  , m_networkStatus("inactive")
{
  // Initialize network statistics
  m_networkStats = {};
  
  // Initialize reward info
  m_rewardInfo = {};
  m_rewardInfo.rewardToken = "WyllohCoin"; // Default to WyllohCoin as the reward token
}

CIPFSManager::~CIPFSManager()
{
  Shutdown();
}

bool CIPFSManager::Initialize()
{
  CSingleLock lock(m_critSection);
  
  // Set up the cache directory
  m_cachePath = CSpecialProtocol::TranslatePath("special://temp/ipfs-cache/");
  if (!XFILE::CDirectory::Exists(m_cachePath))
  {
    if (!XFILE::CDirectory::Create(m_cachePath))
    {
      CLog::Log(LOGERROR, "CIPFSManager: Failed to create cache directory: %s", m_cachePath.c_str());
      return false;
    }
  }
  
  // Set up the config file path
  m_configPath = CSpecialProtocol::TranslatePath("special://userdata/wylloh-config/ipfs.json");
  
  // Load settings from Kodi
  auto settingsComponent = CServiceBroker::GetSettingsComponent();
  if (settingsComponent)
  {
    auto settings = settingsComponent->GetSettings();
    if (settings)
    {
      m_primaryGateway = settings->GetString("wylloh.ipfs.primary_gateway");
      m_timeout = settings->GetInt("wylloh.ipfs.timeout");
      m_cacheSize = settings->GetInt("wylloh.ipfs.cache_size");
      m_cacheExpiry = settings->GetInt("wylloh.ipfs.cache_expiry");
      m_enablePinning = settings->GetBool("wylloh.ipfs.enable_pinning");
      
      // Load network participation settings
      m_networkParticipationEnabled = settings->GetBool("wylloh.network.enable_participation");
      m_networkStorageAllocation = settings->GetInt("wylloh.network.storage_allocation");
      m_networkStoragePath = settings->GetString("wylloh.network.storage_path");
      m_networkBandwidthLimit = settings->GetInt("wylloh.network.bandwidth_limit");
      m_networkRewardAddress = settings->GetString("wylloh.network.reward_address");
      
      // Set reward address in reward info
      m_rewardInfo.rewardAddress = m_networkRewardAddress;
      
      // Register for settings changes
      settings->RegisterCallback(this, "wylloh.ipfs");
      settings->RegisterCallback(this, "wylloh.network");
    }
  }
  
  // Load configuration (gateways and pinned content)
  LoadConfig();
  
  // Set up Curl options
  m_curl.SetTimeout(m_timeout / 1000);
  
  // Set up cache cleanup timer (run every hour)
  m_cleanupTimer = std::make_unique<CTimer>(this, &CIPFSManager::CleanupCache, 3600000);
  m_cleanupTimer->Start();
  
  // Initial cache cleanup to remove expired entries
  CleanupCache();
  
  // Start network participation if enabled
  if (m_networkParticipationEnabled)
  {
    StartNetworkParticipation();
  }
  
  CLog::Log(LOGINFO, "CIPFSManager: Initialized successfully");
  return true;
}

void CIPFSManager::Shutdown()
{
  CSingleLock lock(m_critSection);
  
  // Stop network participation if active
  if (m_networkParticipationEnabled)
  {
    StopNetworkParticipation();
  }
  
  // Save configuration
  SaveConfig();
  
  // Stop cache cleanup timer
  if (m_cleanupTimer)
  {
    m_cleanupTimer->Stop();
    m_cleanupTimer.reset();
  }
  
  // Unregister from settings
  auto settingsComponent = CServiceBroker::GetSettingsComponent();
  if (settingsComponent)
  {
    auto settings = settingsComponent->GetSettings();
    if (settings)
      settings->UnregisterCallback(this);
  }
  
  CLog::Log(LOGINFO, "CIPFSManager: Shut down successfully");
}

bool CIPFSManager::GetContent(const std::string& cid, std::string& content, bool fromCache)
{
  CSingleLock lock(m_critSection);
  
  if (cid.empty())
  {
    CLog::Log(LOGERROR, "CIPFSManager: Empty CID provided");
    return false;
  }
  
  // Check cache first if requested
  if (fromCache && IsInCache(cid))
  {
    std::string cachePath = GetCacheFilePath(cid);
    CLog::Log(LOGDEBUG, "CIPFSManager: Loading content from cache: %s", cachePath.c_str());
    
    std::ifstream file(cachePath, std::ios::binary);
    if (file)
    {
      std::stringstream buffer;
      buffer << file.rdbuf();
      content = buffer.str();
      return true;
    }
  }
  
  // Not in cache or cache bypassed, fetch from gateways
  bool success = GetContentFromGateways(cid, content);
  if (success)
  {
    // Cache the content if we got it successfully
    std::string cachePath = GetCacheFilePath(cid);
    std::ofstream file(cachePath, std::ios::binary);
    if (file)
    {
      file << content;
      
      // Update cache entry map
      time_t now = std::time(nullptr);
      m_cacheEntries[cid] = now;
      
      CLog::Log(LOGDEBUG, "CIPFSManager: Cached content: %s", cachePath.c_str());
    }
    else
    {
      CLog::Log(LOGERROR, "CIPFSManager: Failed to write to cache: %s", cachePath.c_str());
    }
  }
  
  return success;
}

bool CIPFSManager::GetFile(const std::string& cid, const std::string& localPath, bool fromCache)
{
  std::string content;
  if (!GetContent(cid, content, fromCache))
    return false;
  
  // Write the content to the local file
  std::ofstream file(localPath, std::ios::binary);
  if (!file)
  {
    CLog::Log(LOGERROR, "CIPFSManager: Failed to write to file: %s", localPath.c_str());
    return false;
  }
  
  file << content;
  return true;
}

bool CIPFSManager::PinContent(const std::string& cid)
{
  CSingleLock lock(m_critSection);
  
  if (!m_enablePinning)
  {
    CLog::Log(LOGWARNING, "CIPFSManager: Cannot pin content, pinning is disabled");
    return false;
  }
  
  // Check if already pinned
  if (std::find(m_pinnedContent.begin(), m_pinnedContent.end(), cid) != m_pinnedContent.end())
  {
    CLog::Log(LOGDEBUG, "CIPFSManager: Content already pinned: %s", cid.c_str());
    return true;
  }
  
  // Ensure we have the content cached
  std::string content;
  if (!GetContent(cid, content))
  {
    CLog::Log(LOGERROR, "CIPFSManager: Cannot pin content, failed to retrieve: %s", cid.c_str());
    return false;
  }
  
  // Add to pinned list
  m_pinnedContent.push_back(cid);
  SaveConfig();
  
  CLog::Log(LOGINFO, "CIPFSManager: Content pinned: %s", cid.c_str());
  return true;
}

bool CIPFSManager::UnpinContent(const std::string& cid)
{
  CSingleLock lock(m_critSection);
  
  auto it = std::find(m_pinnedContent.begin(), m_pinnedContent.end(), cid);
  if (it == m_pinnedContent.end())
  {
    CLog::Log(LOGWARNING, "CIPFSManager: Content not pinned: %s", cid.c_str());
    return false;
  }
  
  m_pinnedContent.erase(it);
  SaveConfig();
  
  CLog::Log(LOGINFO, "CIPFSManager: Content unpinned: %s", cid.c_str());
  return true;
}

std::vector<std::string> CIPFSManager::GetPinnedContent()
{
  CSingleLock lock(m_critSection);
  return m_pinnedContent;
}

bool CIPFSManager::ClearCache()
{
  CSingleLock lock(m_critSection);
  
  // Don't delete pinned content
  for (auto& entry : m_cacheEntries)
  {
    const std::string& cid = entry.first;
    if (std::find(m_pinnedContent.begin(), m_pinnedContent.end(), cid) != m_pinnedContent.end())
      continue;
    
    std::string path = GetCacheFilePath(cid);
    XFILE::CFile::Delete(path);
  }
  
  // Keep only pinned entries in the map
  auto it = m_cacheEntries.begin();
  while (it != m_cacheEntries.end())
  {
    if (std::find(m_pinnedContent.begin(), m_pinnedContent.end(), it->first) != m_pinnedContent.end())
      ++it;
    else
      it = m_cacheEntries.erase(it);
  }
  
  CLog::Log(LOGINFO, "CIPFSManager: Cache cleared (except pinned content)");
  return true;
}

bool CIPFSManager::AddGateway(const std::string& gateway)
{
  CSingleLock lock(m_critSection);
  
  // Validate gateway URL
  std::string normalizedGateway = gateway;
  if (!StringUtils::EndsWith(normalizedGateway, "/"))
    normalizedGateway += "/";
  
  // Check if already in list
  if (std::find(m_gateways.begin(), m_gateways.end(), normalizedGateway) != m_gateways.end())
  {
    CLog::Log(LOGWARNING, "CIPFSManager: Gateway already exists: %s", normalizedGateway.c_str());
    return false;
  }
  
  m_gateways.push_back(normalizedGateway);
  SaveConfig();
  
  CLog::Log(LOGINFO, "CIPFSManager: Gateway added: %s", normalizedGateway.c_str());
  return true;
}

bool CIPFSManager::RemoveGateway(const std::string& gateway)
{
  CSingleLock lock(m_critSection);
  
  auto it = std::find(m_gateways.begin(), m_gateways.end(), gateway);
  if (it == m_gateways.end())
  {
    CLog::Log(LOGWARNING, "CIPFSManager: Gateway not found: %s", gateway.c_str());
    return false;
  }
  
  m_gateways.erase(it);
  SaveConfig();
  
  CLog::Log(LOGINFO, "CIPFSManager: Gateway removed: %s", gateway.c_str());
  return true;
}

std::vector<std::string> CIPFSManager::GetGateways()
{
  CSingleLock lock(m_critSection);
  return m_gateways;
}

std::string CIPFSManager::GetPrimaryGateway()
{
  CSingleLock lock(m_critSection);
  return m_primaryGateway;
}

void CIPFSManager::OnSettingChanged(const std::shared_ptr<const CSetting>& setting)
{
  if (!setting)
    return;
  
  const std::string& id = setting->GetId();
  
  CSingleLock lock(m_critSection);
  
  if (id == "wylloh.ipfs.primary_gateway")
  {
    m_primaryGateway = std::static_pointer_cast<const CSettingString>(setting)->GetValue();
    CLog::Log(LOGINFO, "CIPFSManager: Primary gateway changed to: %s", m_primaryGateway.c_str());
  }
  else if (id == "wylloh.ipfs.timeout")
  {
    m_timeout = std::static_pointer_cast<const CSettingInt>(setting)->GetValue();
    m_curl.SetTimeout(m_timeout / 1000);
    CLog::Log(LOGINFO, "CIPFSManager: Timeout changed to: %d ms", m_timeout);
  }
  else if (id == "wylloh.ipfs.cache_size")
  {
    m_cacheSize = std::static_pointer_cast<const CSettingInt>(setting)->GetValue();
    CLog::Log(LOGINFO, "CIPFSManager: Cache size changed to: %d MB", m_cacheSize);
  }
  else if (id == "wylloh.ipfs.cache_expiry")
  {
    m_cacheExpiry = std::static_pointer_cast<const CSettingInt>(setting)->GetValue();
    CLog::Log(LOGINFO, "CIPFSManager: Cache expiry changed to: %d hours", m_cacheExpiry);
  }
  else if (id == "wylloh.ipfs.enable_pinning")
  {
    m_enablePinning = std::static_pointer_cast<const CSettingBool>(setting)->GetValue();
    CLog::Log(LOGINFO, "CIPFSManager: Pinning %s", m_enablePinning ? "enabled" : "disabled");
  }
  else if (id == "wylloh.ipfs.manage_gateways")
  {
    // Show gateway management dialog
    ShowGatewayManagementDialog();
  }
  else if (id == "wylloh.ipfs.clear_cache")
  {
    // Clear cache
    if (ClearCache())
    {
      // Show notification
      CGUIDialogOK::ShowAndGetInput(g_localizeStrings.Get(30619), g_localizeStrings.Get(30620));
    }
  }
  else if (id == "wylloh.network.enable_participation")
  {
    bool newValue = std::static_pointer_cast<const CSettingBool>(setting)->GetValue();
    
    // Only take action if the value has changed
    if (newValue != m_networkParticipationEnabled)
    {
      m_networkParticipationEnabled = newValue;
      
      if (m_networkParticipationEnabled)
      {
        // Start network participation
        StartNetworkParticipation();
      }
      else
      {
        // Stop network participation
        StopNetworkParticipation();
      }
    }
  }
  else if (id == "wylloh.network.storage_allocation")
  {
    uint64_t newSize = std::static_pointer_cast<const CSettingInt>(setting)->GetValue();
    SetStorageAllocation(newSize);
  }
  else if (id == "wylloh.network.storage_path")
  {
    std::string newPath = std::static_pointer_cast<const CSettingString>(setting)->GetValue();
    SetStoragePath(newPath);
  }
  else if (id == "wylloh.network.bandwidth_limit")
  {
    int newLimit = std::static_pointer_cast<const CSettingInt>(setting)->GetValue();
    SetBandwidthLimit(newLimit);
  }
  else if (id == "wylloh.network.reward_address")
  {
    std::string newAddress = std::static_pointer_cast<const CSettingString>(setting)->GetValue();
    SetRewardAddress(newAddress);
  }
}

bool CIPFSManager::LoadConfig()
{
  CSingleLock lock(m_critSection);
  
  if (!XFILE::CFile::Exists(m_configPath))
  {
    // If config doesn't exist, create a default one
    m_gateways = {
      "https://ipfs.io/ipfs/",
      "https://gateway.ipfs.io/ipfs/",
      "https://dweb.link/ipfs/"
    };
    return SaveConfig();
  }
  
  std::string jsonContent;
  XFILE::CFile file;
  if (!file.Open(m_configPath))
  {
    CLog::Log(LOGERROR, "CIPFSManager: Failed to open config file: %s", m_configPath.c_str());
    return false;
  }
  
  // Read the file
  char buffer[1024];
  size_t bytesRead;
  while ((bytesRead = file.Read(buffer, sizeof(buffer))) > 0)
    jsonContent.append(buffer, bytesRead);
  
  file.Close();
  
  // Parse JSON
  CVariant json;
  if (!CJSONVariantParser::Parse(jsonContent, json) || !json.isObject())
  {
    CLog::Log(LOGERROR, "CIPFSManager: Failed to parse config JSON");
    return false;
  }
  
  // Load gateways
  m_gateways.clear();
  if (json.isMember("gateways") && json["gateways"].isArray())
  {
    for (auto it = json["gateways"].begin_array(); it != json["gateways"].end_array(); ++it)
    {
      if (it->isString())
        m_gateways.push_back(it->asString());
    }
  }
  
  // Load pinned content
  m_pinnedContent.clear();
  if (json.isMember("pinned") && json["pinned"].isArray())
  {
    for (auto it = json["pinned"].begin_array(); it != json["pinned"].end_array(); ++it)
    {
      if (it->isString())
        m_pinnedContent.push_back(it->asString());
    }
  }
  
  // Load cache entries
  m_cacheEntries.clear();
  if (json.isMember("cache") && json["cache"].isObject())
  {
    for (auto it = json["cache"].begin_map(); it != json["cache"].end_map(); ++it)
    {
      if (it->second.isInteger())
        m_cacheEntries[it->first] = static_cast<time_t>(it->second.asInteger());
    }
  }
  
  CLog::Log(LOGINFO, "CIPFSManager: Loaded configuration from %s", m_configPath.c_str());
  return true;
}

bool CIPFSManager::SaveConfig()
{
  CSingleLock lock(m_critSection);
  
  // Create config directory if it doesn't exist
  std::string configDir = URIUtils::GetDirectory(m_configPath);
  if (!XFILE::CDirectory::Exists(configDir))
  {
    if (!XFILE::CDirectory::Create(configDir))
    {
      CLog::Log(LOGERROR, "CIPFSManager: Failed to create config directory: %s", configDir.c_str());
      return false;
    }
  }
  
  // Build JSON
  CVariant json(CVariant::VariantTypeObject);
  
  // Add gateways
  CVariant gatewaysArray(CVariant::VariantTypeArray);
  for (const auto& gateway : m_gateways)
    gatewaysArray.push_back(gateway);
  json["gateways"] = gatewaysArray;
  
  // Add pinned content
  CVariant pinnedArray(CVariant::VariantTypeArray);
  for (const auto& cid : m_pinnedContent)
    pinnedArray.push_back(cid);
  json["pinned"] = pinnedArray;
  
  // Add cache entries
  CVariant cacheObject(CVariant::VariantTypeObject);
  for (const auto& entry : m_cacheEntries)
    cacheObject[entry.first] = static_cast<int64_t>(entry.second);
  json["cache"] = cacheObject;
  
  // Serialize to JSON
  std::string jsonContent;
  CJSONVariantWriter::Write(json, jsonContent, true);
  
  // Write to file
  XFILE::CFile file;
  if (!file.OpenForWrite(m_configPath, true))
  {
    CLog::Log(LOGERROR, "CIPFSManager: Failed to open config file for writing: %s", m_configPath.c_str());
    return false;
  }
  
  ssize_t written = file.Write(jsonContent.c_str(), jsonContent.size());
  file.Close();
  
  if (written != static_cast<ssize_t>(jsonContent.size()))
  {
    CLog::Log(LOGERROR, "CIPFSManager: Failed to write config file: %s", m_configPath.c_str());
    return false;
  }
  
  CLog::Log(LOGINFO, "CIPFSManager: Saved configuration to %s", m_configPath.c_str());
  return true;
}

bool CIPFSManager::GetContentFromGateways(const std::string& cid, std::string& content)
{
  // Try the primary gateway first
  std::string url = m_primaryGateway;
  if (!StringUtils::EndsWith(url, "/"))
    url += "/";
  url += cid;
  
  CLog::Log(LOGDEBUG, "CIPFSManager: Trying primary gateway: %s", url.c_str());
  
  if (m_curl.Get(url, content))
    return true;
  
  // Try other gateways if primary fails
  for (const auto& gateway : m_gateways)
  {
    if (gateway == m_primaryGateway)
      continue;
    
    url = gateway;
    if (!StringUtils::EndsWith(url, "/"))
      url += "/";
    url += cid;
    
    CLog::Log(LOGDEBUG, "CIPFSManager: Trying fallback gateway: %s", url.c_str());
    
    if (m_curl.Get(url, content))
      return true;
  }
  
  CLog::Log(LOGERROR, "CIPFSManager: Failed to retrieve content from all gateways for CID: %s", cid.c_str());
  return false;
}

std::string CIPFSManager::GetCacheFilePath(const std::string& cid)
{
  // Use a hash of the CID as the filename to ensure it's filesystem-safe
  std::string hashedCid = CDigest::Calculate(CDigest::Type::SHA1, cid);
  return URIUtils::AddFileToFolder(m_cachePath, hashedCid);
}

bool CIPFSManager::IsInCache(const std::string& cid)
{
  // Check if the file exists in cache
  std::string cachePath = GetCacheFilePath(cid);
  if (!XFILE::CFile::Exists(cachePath))
    return false;
  
  // Check if it's in our cache entries map
  auto it = m_cacheEntries.find(cid);
  if (it == m_cacheEntries.end())
  {
    // File exists but not in our map, add it with current time
    time_t now = std::time(nullptr);
    m_cacheEntries[cid] = now;
    return true;
  }
  
  // Check if it's expired (unless it's pinned)
  if (std::find(m_pinnedContent.begin(), m_pinnedContent.end(), cid) != m_pinnedContent.end())
    return true; // Pinned content never expires
  
  time_t cacheTime = it->second;
  time_t now = std::time(nullptr);
  time_t expiryTimeSeconds = static_cast<time_t>(m_cacheExpiry * 3600); // Convert hours to seconds
  
  if ((now - cacheTime) > expiryTimeSeconds)
  {
    // Expired, remove it from cache
    XFILE::CFile::Delete(cachePath);
    m_cacheEntries.erase(it);
    return false;
  }
  
  return true;
}

void CIPFSManager::CleanupCache()
{
  CSingleLock lock(m_critSection);
  CLog::Log(LOGDEBUG, "CIPFSManager: Running cache cleanup");
  
  // Check if any cached files have expired
  time_t now = std::time(nullptr);
  time_t expiryTimeSeconds = static_cast<time_t>(m_cacheExpiry * 3600); // Convert hours to seconds
  
  auto it = m_cacheEntries.begin();
  while (it != m_cacheEntries.end())
  {
    const std::string& cid = it->first;
    time_t cacheTime = it->second;
    
    // Skip pinned content
    if (std::find(m_pinnedContent.begin(), m_pinnedContent.end(), cid) != m_pinnedContent.end())
    {
      ++it;
      continue;
    }
    
    if ((now - cacheTime) > expiryTimeSeconds)
    {
      // Expired, remove the file
      std::string cachePath = GetCacheFilePath(cid);
      XFILE::CFile::Delete(cachePath);
      
      CLog::Log(LOGDEBUG, "CIPFSManager: Removed expired cache entry: %s", cid.c_str());
      
      // Remove from map
      it = m_cacheEntries.erase(it);
    }
    else
    {
      ++it;
    }
  }
  
  // Check total cache size and remove oldest entries if over limit
  if (m_cacheSize > 0)
  {
    // Calculate current size
    int64_t totalSize = 0;
    std::map<std::string, std::pair<time_t, int64_t>> sizeMap; // CID -> (time, size)
    
    for (const auto& entry : m_cacheEntries)
    {
      const std::string& cid = entry.first;
      
      // Skip pinned content
      if (std::find(m_pinnedContent.begin(), m_pinnedContent.end(), cid) != m_pinnedContent.end())
        continue;
      
      std::string cachePath = GetCacheFilePath(cid);
      int64_t size = XFILE::CFile::GetSize(cachePath);
      
      if (size > 0)
      {
        totalSize += size;
        sizeMap[cid] = std::make_pair(entry.second, size);
      }
    }
    
    // Convert m_cacheSize from MB to bytes
    int64_t maxBytes = static_cast<int64_t>(m_cacheSize) * 1024 * 1024;
    
    // If cache is too large, remove oldest entries until under limit
    if (totalSize > maxBytes)
    {
      // Sort by time (oldest first)
      std::vector<std::pair<std::string, time_t>> sortedEntries;
      for (const auto& entry : sizeMap)
        sortedEntries.push_back(std::make_pair(entry.first, entry.second.first));
      
      std::sort(sortedEntries.begin(), sortedEntries.end(), 
                [](const std::pair<std::string, time_t>& a, const std::pair<std::string, time_t>& b) {
                  return a.second < b.second;
                });
      
      // Remove oldest entries until under limit
      for (const auto& entry : sortedEntries)
      {
        const std::string& cid = entry.first;
        int64_t size = sizeMap[cid].second;
        
        // Delete file
        std::string cachePath = GetCacheFilePath(cid);
        XFILE::CFile::Delete(cachePath);
        
        // Remove from cache entries
        m_cacheEntries.erase(cid);
        
        totalSize -= size;
        
        CLog::Log(LOGDEBUG, "CIPFSManager: Removed cache entry due to size limit: %s", cid.c_str());
        
        if (totalSize <= maxBytes)
          break;
      }
    }
  }
  
  // Save config to persist changes
  SaveConfig();
}

void CIPFSManager::ShowGatewayManagementDialog()
{
  // Get current gateways
  std::vector<std::string> gateways = GetGateways();
  
  // Show dialog
  CGUIDialogSelect* pDialog = CServiceBroker::GetGUI()->GetWindowManager().GetWindow<CGUIDialogSelect>(WINDOW_DIALOG_SELECT);
  if (!pDialog)
    return;
  
  pDialog->Reset();
  pDialog->SetHeading(g_localizeStrings.Get(30611)); // "Manage gateways"
  
  // Add "Add gateway" option
  pDialog->Add(g_localizeStrings.Get(30615)); // "Add gateway"
  
  // Add current gateways
  for (const auto& gateway : gateways)
    pDialog->Add(gateway);
  
  pDialog->Open();
  
  int selection = pDialog->GetSelectedItem();
  if (selection < 0)
    return;
  
  if (selection == 0)
  {
    // Add gateway
    std::string newGateway;
    if (CGUIKeyboardFactory::ShowAndGetInput(newGateway, g_localizeStrings.Get(30616), false))
    {
      if (!newGateway.empty())
        AddGateway(newGateway);
    }
  }
  else
  {
    // Manage gateway
    std::string selected = gateways[selection - 1];
    
    // Show options
    pDialog->Reset();
    pDialog->SetHeading(selected);
    pDialog->Add(g_localizeStrings.Get(30617)); // "Remove gateway"
    pDialog->Open();
    
    int action = pDialog->GetSelectedItem();
    if (action == 0)
    {
      // Remove gateway
      RemoveGateway(selected);
    }
  }
}

//------------------------------------------------
// Network Participation Methods
//------------------------------------------------

bool CIPFSManager::StartNetworkParticipation()
{
  CSingleLock lock(m_critSection);
  
  if (m_networkStatus == "active" || m_networkStatus == "starting")
  {
    CLog::Log(LOGINFO, "CIPFSManager: Network participation already active or starting");
    return true;
  }
  
  CLog::Log(LOGINFO, "CIPFSManager: Starting network participation");
  
  // Verify storage path exists
  std::string storagePath = CSpecialProtocol::TranslatePath(m_networkStoragePath);
  if (!XFILE::CDirectory::Exists(storagePath))
  {
    if (!XFILE::CDirectory::Create(storagePath))
    {
      CLog::Log(LOGERROR, "CIPFSManager: Failed to create network storage directory: %s", storagePath.c_str());
      m_networkStatus = "error";
      return false;
    }
  }
  
  // Verify reward address is set if we're in a real network mode
  if (m_networkRewardAddress.empty())
  {
    CLog::Log(LOGWARNING, "CIPFSManager: No reward address set for network participation");
    // We'll continue without a reward address, but log a warning
  }
  
  // Reset network statistics
  m_networkStats = {};
  
  // This is a stub implementation - the real implementation would:
  // 1. Initialize a local IPFS node
  // 2. Configure storage limits
  // 3. Set up bandwidth limits
  // 4. Connect to the FileCoin/WyllohCoin network
  // 5. Start the mining/storage providing process
  
  // For now, we'll just update the status
  m_networkStatus = "starting";
  
  // Update settings status
  auto settingsComponent = CServiceBroker::GetSettingsComponent();
  if (settingsComponent)
  {
    auto settings = settingsComponent->GetSettings();
    if (settings)
    {
      settings->SetString("wylloh.network.status", "starting");
    }
  }
  
  // In a real implementation, we would start a background thread to handle the network participation
  // For now, we'll simulate success after a delay
  m_networkStatus = "active";
  
  // Update settings status again
  if (settingsComponent)
  {
    auto settings = settingsComponent->GetSettings();
    if (settings)
    {
      settings->SetString("wylloh.network.status", "active");
    }
  }
  
  // Set up some mock initial statistics
  m_networkStats.storageProvided = m_networkStorageAllocation * 1024ULL * 1024ULL * 1024ULL; // Convert GB to bytes
  m_networkStats.bandwidthProvided = static_cast<uint64_t>(m_networkBandwidthLimit) * 1024ULL; // Convert KB/s to B/s
  m_networkStats.healthScore = 100;
  m_networkStats.networkStatus = "active";
  
  CLog::Log(LOGINFO, "CIPFSManager: Network participation started successfully");
  return true;
}

bool CIPFSManager::StopNetworkParticipation()
{
  CSingleLock lock(m_critSection);
  
  if (m_networkStatus == "inactive")
  {
    CLog::Log(LOGINFO, "CIPFSManager: Network participation already inactive");
    return true;
  }
  
  CLog::Log(LOGINFO, "CIPFSManager: Stopping network participation");
  
  // This is a stub implementation - the real implementation would:
  // 1. Stop the mining/storage providing process
  // 2. Disconnect from the FileCoin/WyllohCoin network
  // 3. Wait for any pending operations to complete
  // 4. Shut down the local IPFS node
  
  // Update status
  m_networkStatus = "inactive";
  
  // Update settings status
  auto settingsComponent = CServiceBroker::GetSettingsComponent();
  if (settingsComponent)
  {
    auto settings = settingsComponent->GetSettings();
    if (settings)
    {
      settings->SetString("wylloh.network.status", "inactive");
    }
  }
  
  CLog::Log(LOGINFO, "CIPFSManager: Network participation stopped successfully");
  return true;
}

std::string CIPFSManager::GetNetworkParticipationStatus()
{
  CSingleLock lock(m_critSection);
  return m_networkStatus;
}

NetworkStatistics CIPFSManager::GetNetworkStatistics()
{
  CSingleLock lock(m_critSection);
  
  // In a real implementation, we would update these values from the network node
  // For now, we'll just return the current values
  
  return m_networkStats;
}

NetworkRewardInfo CIPFSManager::GetRewardInfo()
{
  CSingleLock lock(m_critSection);
  
  // In a real implementation, we would fetch the latest reward information
  // For now, we'll just return the current values
  
  return m_rewardInfo;
}

void CIPFSManager::SetStorageAllocation(uint64_t sizeInGB)
{
  CSingleLock lock(m_critSection);
  
  m_networkStorageAllocation = sizeInGB;
  
  // Update provided storage in stats
  m_networkStats.storageProvided = m_networkStorageAllocation * 1024ULL * 1024ULL * 1024ULL; // Convert GB to bytes
  
  CLog::Log(LOGINFO, "CIPFSManager: Network storage allocation set to %llu GB", m_networkStorageAllocation);
  
  // In a real implementation, we would update the storage allocation in the network node configuration
}

void CIPFSManager::SetStoragePath(const std::string& path)
{
  CSingleLock lock(m_critSection);
  
  m_networkStoragePath = path;
  
  CLog::Log(LOGINFO, "CIPFSManager: Network storage path set to %s", m_networkStoragePath.c_str());
  
  // In a real implementation, we would update the storage path in the network node configuration
  // and potentially migrate existing stored data
}

void CIPFSManager::SetBandwidthLimit(int kbps)
{
  CSingleLock lock(m_critSection);
  
  m_networkBandwidthLimit = kbps;
  
  // Update provided bandwidth in stats
  m_networkStats.bandwidthProvided = static_cast<uint64_t>(m_networkBandwidthLimit) * 1024ULL; // Convert KB/s to B/s
  
  CLog::Log(LOGINFO, "CIPFSManager: Network bandwidth limit set to %d KB/s", m_networkBandwidthLimit);
  
  // In a real implementation, we would update the bandwidth limit in the network node configuration
}

void CIPFSManager::SetRewardAddress(const std::string& address)
{
  CSingleLock lock(m_critSection);
  
  m_networkRewardAddress = address;
  
  // Update settings
  auto settingsComponent = CServiceBroker::GetSettingsComponent();
  if (settingsComponent)
  {
    auto settings = settingsComponent->GetSettings();
    if (settings)
    {
      settings->SetString("wylloh.network.reward_address", address);
    }
  }
  
  SaveConfig();
}

void CIPFSManager::SetPrimaryGateway(const std::string& gateway)
{
  CSingleLock lock(m_critSection);
  
  m_primaryGateway = gateway;
  
  // Make sure it's in the gateways list
  if (std::find(m_gateways.begin(), m_gateways.end(), gateway) == m_gateways.end())
  {
    m_gateways.insert(m_gateways.begin(), gateway);
  }
  
  // Update settings
  auto settingsComponent = CServiceBroker::GetSettingsComponent();
  if (settingsComponent)
  {
    auto settings = settingsComponent->GetSettings();
    if (settings)
    {
      settings->SetString("wylloh.ipfs.primary_gateway", gateway);
    }
  }
  
  CLog::Log(LOGINFO, "IPFS: Primary gateway set to %s", gateway.c_str());
  SaveConfig();
}

void CIPFSManager::SetOfflineMode(bool offline)
{
  CSingleLock lock(m_critSection);
  
  // In offline mode, we disable auto-gateway discovery and network participation
  if (offline)
  {
    // Disable network participation
    if (m_networkParticipationEnabled)
    {
      StopNetworkParticipation();
      m_networkParticipationEnabled = false;
    }
    
    // Update settings
    auto settingsComponent = CServiceBroker::GetSettingsComponent();
    if (settingsComponent)
    {
      auto settings = settingsComponent->GetSettings();
      if (settings)
      {
        settings->SetBool("wylloh.network.enable_participation", false);
        settings->SetBool("wylloh.ipfs.disable_gateway_discovery", true);
      }
    }
    
    CLog::Log(LOGINFO, "IPFS: Offline mode enabled");
  }
  else
  {
    // Update settings
    auto settingsComponent = CServiceBroker::GetSettingsComponent();
    if (settingsComponent)
    {
      auto settings = settingsComponent->GetSettings();
      if (settings)
      {
        settings->SetBool("wylloh.ipfs.disable_gateway_discovery", false);
      }
    }
    
    CLog::Log(LOGINFO, "IPFS: Offline mode disabled");
  }
  
  SaveConfig();
}

} // namespace WYLLOH 