/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#include "wylloh/ipfs/IPFSContent.h"
#include "wylloh/ipfs/IPFSContentJob.h"
#include "wylloh/ipfs/IPFSSettings.h"
#include "wylloh/ipfs/IPFSCache.h"
#include "utils/log.h"
#include "utils/StringUtils.h"
#include "filesystem/File.h"
#include "filesystem/Directory.h"
#include "ServiceBroker.h"
#include "FileItem.h"
#include "URL.h"
#include "jobs/JobManager.h"
#include "filesystem/CurlFile.h"
#include <algorithm>

namespace WYLLOH {
namespace IPFS {

// Implementation of CIPFSContentJob
CIPFSContentJob::CIPFSContentJob(const std::string& cid, IPFSContentCallback callback, bool pin)
  : m_cid(cid),
    m_callback(callback),
    m_pin(pin)
{
  m_completedEvent.Reset();
}

CIPFSContentJob::~CIPFSContentJob()
{
}

bool CIPFSContentJob::DoWork()
{
  // Get instance of IPFS content service
  CIPFSContent& contentService = CIPFSContent::GetInstance();
  
  // Get content synchronously
  m_result = contentService.GetContentSync(m_cid, 0);
  
  // Set event to indicate completion
  m_completedEvent.Set();
  
  // Call callback if provided
  if (m_callback)
    m_callback(m_result);
    
  return m_result.success;
}

bool CIPFSContentJob::Wait(unsigned int timeout)
{
  return m_completedEvent.Wait(timeout);
}

// Implementation of CIPFSContent
CIPFSContent& CIPFSContent::GetInstance()
{
  static CIPFSContent instance;
  return instance;
}

CIPFSContent::CIPFSContent()
  : m_initialized(false)
{
}

CIPFSContent::~CIPFSContent()
{
  Shutdown();
}

bool CIPFSContent::Initialize()
{
  CSingleLock lock(m_criticalSection);
  
  if (m_initialized)
    return true;
    
  CLog::Log(LOGINFO, "WYLLOH: Initializing IPFS Content Service");
  
  // Initialize settings
  if (!CIPFSSettings::GetInstance().Initialize())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to initialize IPFS settings");
    return false;
  }
  
  // Initialize cache
  if (!CIPFSCache::GetInstance().Initialize())
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to initialize IPFS cache");
    return false;
  }
  
  m_initialized = true;
  return true;
}

void CIPFSContent::Shutdown()
{
  CSingleLock lock(m_criticalSection);
  
  if (!m_initialized)
    return;
    
  CLog::Log(LOGINFO, "WYLLOH: Shutting down IPFS Content Service");
  
  // Shutdown cache
  CIPFSCache::GetInstance().Shutdown();
  
  // Shutdown settings
  CIPFSSettings::GetInstance().Shutdown();
  
  m_initialized = false;
}

bool CIPFSContent::GetContent(const std::string& cid, IPFSContentCallback callback, bool pin)
{
  if (cid.empty())
    return false;
    
  // Normalize CID
  std::string normalizedCid = cid;
  if (StringUtils::StartsWith(normalizedCid, "ipfs://"))
    normalizedCid = normalizedCid.substr(7);
    
  // Check if content is cached
  if (CIPFSCache::GetInstance().IsCached(normalizedCid))
  {
    // Get cached path
    std::string cachedPath = CIPFSCache::GetInstance().GetCachedPath(normalizedCid);
    
    // Create result
    IPFSContentResult result;
    result.success = true;
    result.localPath = cachedPath;
    
    // Get file size
    XFILE::CFile file;
    if (file.Open(cachedPath))
    {
      result.size = file.GetLength();
      file.Close();
    }
    
    // Pin content if requested
    if (pin && !CIPFSCache::GetInstance().PinContent(normalizedCid))
    {
      CLog::Log(LOGWARNING, "WYLLOH: Failed to pin cached content: %s", normalizedCid.c_str());
    }
    
    // Call callback on main thread
    if (callback)
      callback(result);
      
    return true;
  }
  
  // Queue job to download content
  CIPFSContentJob* job = new CIPFSContentJob(normalizedCid, callback, pin);
  bool jobAdded = CJobManager::GetInstance().AddJob(job, nullptr);
  
  if (!jobAdded)
  {
    CLog::Log(LOGERROR, "WYLLOH: Failed to queue IPFS content job for CID: %s", normalizedCid.c_str());
    delete job;
    return false;
  }
  
  return true;
}

IPFSContentResult CIPFSContent::GetContentSync(const std::string& cid, unsigned int timeoutMs)
{
  if (cid.empty())
  {
    IPFSContentResult result;
    result.success = false;
    result.error = "Empty CID";
    return result;
  }
  
  // Normalize CID
  std::string normalizedCid = cid;
  if (StringUtils::StartsWith(normalizedCid, "ipfs://"))
    normalizedCid = normalizedCid.substr(7);
    
  // Initialize if needed
  if (!m_initialized)
    Initialize();
    
  // Check if content is cached
  if (CIPFSCache::GetInstance().IsCached(normalizedCid))
  {
    // Get cached path
    std::string cachedPath = CIPFSCache::GetInstance().GetCachedPath(normalizedCid);
    
    // Create result
    IPFSContentResult result;
    result.success = true;
    result.localPath = cachedPath;
    
    // Get file size
    XFILE::CFile file;
    if (file.Open(cachedPath))
    {
      result.size = file.GetLength();
      file.Close();
    }
    
    return result;
  }
  
  // Generate temporary file path
  std::string tempPath = CIPFSSettings::GetInstance().GetCachePath() + "/temp/" + normalizedCid;
  
  // Create temp directory if it doesn't exist
  std::string tempDir = CIPFSSettings::GetInstance().GetCachePath() + "/temp";
  if (!XFILE::CDirectory::Exists(tempDir) && !XFILE::CDirectory::Create(tempDir))
  {
    IPFSContentResult result;
    result.success = false;
    result.error = "Failed to create temp directory";
    return result;
  }
  
  // Get timeout
  unsigned int actualTimeout = timeoutMs;
  if (actualTimeout == 0)
    actualTimeout = CIPFSSettings::GetInstance().GetRequestTimeoutMs();
    
  // Download content
  IPFSContentResult result = DownloadContent(normalizedCid, tempPath, actualTimeout);
  
  if (result.success)
  {
    // Add to cache
    if (!CIPFSCache::GetInstance().CacheContent(normalizedCid, tempPath, result.size, false))
    {
      CLog::Log(LOGWARNING, "WYLLOH: Failed to cache content: %s", normalizedCid.c_str());
      // We'll still return the downloaded file
    }
    else
    {
      // Update path to cached file
      result.localPath = CIPFSCache::GetInstance().GetCachedPath(normalizedCid);
    }
  }
  
  // Delete temp file
  if (XFILE::CFile::Exists(tempPath))
    XFILE::CFile::Delete(tempPath);
    
  return result;
}

IPFSContentResult CIPFSContent::DownloadContent(const std::string& cid, const std::string& destinationPath, unsigned int timeoutMs)
{
  IPFSContentResult result;
  
  // Get gateways
  std::vector<std::string> gateways = CIPFSSettings::GetInstance().GetGateways();
  if (gateways.empty())
  {
    result.success = false;
    result.error = "No IPFS gateways configured";
    return result;
  }
  
  // Get primary gateway first
  std::string primaryGateway = CIPFSSettings::GetInstance().GetPrimaryGateway();
  if (!primaryGateway.empty() && std::find(gateways.begin(), gateways.end(), primaryGateway) == gateways.end())
    gateways.insert(gateways.begin(), primaryGateway);
    
  // Try each gateway
  for (const auto& gateway : gateways)
  {
    // Build gateway URL
    std::string url = BuildGatewayUrl(cid, gateway);
    
    CLog::Log(LOGINFO, "WYLLOH: Downloading IPFS content from %s", url.c_str());
    
    // Download file
    XFILE::CCurlFile curl;
    curl.SetTimeout(timeoutMs / 1000); // CURLFile timeout is in seconds
    
    if (!curl.Download(url, destinationPath))
    {
      CLog::Log(LOGWARNING, "WYLLOH: Failed to download IPFS content from %s", url.c_str());
      continue;
    }
    
    // File downloaded successfully
    CLog::Log(LOGINFO, "WYLLOH: Successfully downloaded IPFS content from %s", url.c_str());
    
    // Check file size
    XFILE::CFile file;
    if (file.Open(destinationPath))
    {
      result.size = file.GetLength();
      file.Close();
    }
    
    // Set result
    result.success = true;
    result.localPath = destinationPath;
    
    return result;
  }
  
  // All gateways failed
  result.success = false;
  result.error = "Failed to download content from any gateway";
  return result;
}

std::string CIPFSContent::BuildGatewayUrl(const std::string& cid, const std::string& gateway)
{
  // Normalize gateway URL
  std::string normalizedGateway = gateway;
  if (!StringUtils::EndsWith(normalizedGateway, "/"))
    normalizedGateway += "/";
    
  // Normalize CID
  std::string normalizedCid = cid;
  if (StringUtils::StartsWith(normalizedCid, "ipfs://"))
    normalizedCid = normalizedCid.substr(7);
    
  // Build URL
  return normalizedGateway + normalizedCid;
}

} // namespace IPFS
} // namespace WYLLOH 