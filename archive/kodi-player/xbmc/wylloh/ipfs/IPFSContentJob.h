/*
 *  Copyright (C) 2023-2025 Wylloh Team
 *  This file is part of Wylloh Player - https://wylloh.com
 */

#pragma once

#include "IPFSContent.h"
#include "utils/Job.h"
#include "threads/Event.h"

namespace WYLLOH {
namespace IPFS {

/**
 * @class CIPFSContentJob
 * @brief Background job for downloading IPFS content
 */
class CIPFSContentJob : public CJob
{
public:
  /**
   * Constructor
   * 
   * @param cid IPFS content identifier
   * @param callback Function to call when content is retrieved
   * @param pin Whether to pin the content
   */
  CIPFSContentJob(const std::string& cid, IPFSContentCallback callback, bool pin);
  
  /**
   * Destructor
   */
  ~CIPFSContentJob() override;
  
  /**
   * Job implementation
   */
  bool DoWork() override;
  
  /**
   * Wait for job to complete
   * 
   * @param timeout Timeout in milliseconds (0 for infinite)
   * @return True if job completed, false if timeout
   */
  bool Wait(unsigned int timeout = 0);
  
  /**
   * Get the result of the job
   * 
   * @return Content result
   */
  const IPFSContentResult& GetResult() const { return m_result; }
  
private:
  std::string m_cid;
  IPFSContentCallback m_callback;
  bool m_pin;
  CEvent m_completedEvent;
  IPFSContentResult m_result;
};

} // namespace IPFS
} // namespace WYLLOH 