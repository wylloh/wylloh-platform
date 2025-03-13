/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#pragma once

#include <string>
#include <map>
#include <vector>
#include <functional>
#include <memory>
#include "threads/CriticalSection.h"
#include "threads/Thread.h"
#include "threads/Event.h"
#include "utils/Job.h"

namespace WYLLOH {
namespace IPFS {

struct IPFSContentResult
{
  bool success = false;
  std::string localPath;
  std::string error;
  uint64_t size = 0;
};

typedef std::function<void(const IPFSContentResult&)> IPFSContentCallback;

/**
 * @class CIPFSContent
 * @brief Service for retrieving IPFS content
 */
class CIPFSContent
{
public:
  static CIPFSContent& GetInstance();
  
  bool Initialize();
  void Shutdown();
  
  /**
   * Get content from IPFS
   * 
   * @param cid IPFS content identifier
   * @param callback Function to call when content is retrieved
   * @param pin Whether to pin the content (prevent cache expiration)
   * @return True if request was successfully queued, false otherwise
   */
  bool GetContent(const std::string& cid, IPFSContentCallback callback, bool pin = false);
  
  /**
   * Get content from IPFS synchronously
   * 
   * @param cid IPFS content identifier
   * @param timeoutMs Timeout in milliseconds (0 for default timeout)
   * @return IPFSContentResult with success/failure and content path
   */
  IPFSContentResult GetContentSync(const std::string& cid, unsigned int timeoutMs = 0);
  
private:
  CIPFSContent();
  ~CIPFSContent();
  
  /**
   * Download content from IPFS gateway
   * 
   * @param cid IPFS content identifier
   * @param destinationPath Path to save the content to
   * @param timeoutMs Timeout in milliseconds
   * @return IPFSContentResult with success/failure and content path
   */
  IPFSContentResult DownloadContent(const std::string& cid, const std::string& destinationPath, unsigned int timeoutMs);
  
  /**
   * Construct a gateway URL for a CID
   * 
   * @param cid IPFS content identifier
   * @param gateway IPFS gateway URL
   * @return Full URL to access the content
   */
  std::string BuildGatewayUrl(const std::string& cid, const std::string& gateway);
  
  CCriticalSection m_criticalSection;
  bool m_initialized;
};

} // namespace IPFS
} // namespace WYLLOH 