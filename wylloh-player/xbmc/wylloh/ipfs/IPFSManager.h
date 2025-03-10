#pragma once

#include <string>
#include <vector>
#include <map>
#include <mutex>
#include <memory>
#include "threads/CriticalSection.h"
#include "threads/Timer.h"
#include "settings/lib/ISettingCallback.h"
#include "utils/log.h"
#include "utils/FileUtils.h"
#include "utils/URIUtils.h"
#include "filesystem/CurlFile.h"

namespace WYLLOH
{

// Forward declaration of network participation reward info
struct NetworkRewardInfo
{
  std::string rewardToken;     // Type of token/coin for rewards (FileCoin, WyllohCoin, etc.)
  double totalEarned;          // Total amount earned
  double pendingRewards;       // Rewards waiting to be claimed
  std::string rewardAddress;   // Address where rewards are sent
  time_t lastRewardTime;       // Last time rewards were earned
};

// Forward declaration of network participation statistics
struct NetworkStatistics
{
  uint64_t storageProvided;     // Storage space provided to network in bytes
  uint64_t storageUsed;         // Storage space actually used in bytes
  uint64_t bandwidthProvided;   // Bandwidth provided in bytes
  uint64_t bandwidthUsed;       // Bandwidth used in bytes  
  uint64_t totalUploaded;       // Total data uploaded in bytes
  uint64_t totalDownloaded;     // Total data downloaded in bytes
  int peerCount;                // Number of connected peers
  int contentCount;             // Number of content items stored
  std::string networkStatus;    // Current network participation status
  int healthScore;              // Health score of the node (0-100)
};

class CIPFSManager : public ISettingCallback
{
public:
  static CIPFSManager& GetInstance();
  
  // Initialize the IPFS manager
  bool Initialize();
  
  // Cleanup the IPFS manager
  void Shutdown();
  
  // Retrieve content from IPFS
  bool GetContent(const std::string& cid, std::string& content, bool fromCache = true);
  
  // Retrieve file from IPFS to local path
  bool GetFile(const std::string& cid, const std::string& localPath, bool fromCache = true);
  
  // Pin content to prevent expiration
  bool PinContent(const std::string& cid);
  
  // Unpin content
  bool UnpinContent(const std::string& cid);
  
  // List pinned content
  std::vector<std::string> GetPinnedContent();
  
  // Clear cache
  bool ClearCache();
  
  // Add gateway
  bool AddGateway(const std::string& gateway);
  
  // Remove gateway
  bool RemoveGateway(const std::string& gateway);
  
  // Get list of gateways
  std::vector<std::string> GetGateways();
  
  // Get primary gateway
  std::string GetPrimaryGateway();
  
  // Settings callback
  void OnSettingChanged(const std::shared_ptr<const CSetting>& setting) override;
  
  //------------------------------------------------
  // Network Participation Methods
  //------------------------------------------------
  
  // Start network participation (FileCoin/WyllohCoin mining)
  bool StartNetworkParticipation();
  
  // Stop network participation
  bool StopNetworkParticipation();
  
  // Get network participation status
  std::string GetNetworkParticipationStatus();
  
  // Get network statistics
  NetworkStatistics GetNetworkStatistics();
  
  // Get reward information
  NetworkRewardInfo GetRewardInfo();
  
  // Set storage allocation size
  void SetStorageAllocation(uint64_t sizeInGB);
  
  // Set storage path
  void SetStoragePath(const std::string& path);
  
  // Set bandwidth limit
  void SetBandwidthLimit(int kbps);
  
  // Set reward address
  void SetRewardAddress(const std::string& address);
  
private:
  CIPFSManager();
  ~CIPFSManager();
  
  // Prevent copying
  CIPFSManager(const CIPFSManager&) = delete;
  CIPFSManager& operator=(const CIPFSManager&) = delete;
  
  // Load configuration
  bool LoadConfig();
  
  // Save configuration
  bool SaveConfig();
  
  // Internal method to get content with gateway fallback
  bool GetContentFromGateways(const std::string& cid, std::string& content);
  
  // Generate cache file path for a CID
  std::string GetCacheFilePath(const std::string& cid);
  
  // Check if content is in cache and not expired
  bool IsInCache(const std::string& cid);
  
  // Periodic cache cleanup
  void CleanupCache();
  
  // Gateway management
  std::vector<std::string> m_gateways;
  std::string m_primaryGateway;
  int m_timeout;
  
  // Cache management
  std::string m_cachePath;
  int m_cacheSize;
  int m_cacheExpiry;
  std::map<std::string, time_t> m_cacheEntries;
  
  // Pinning
  bool m_enablePinning;
  std::vector<std::string> m_pinnedContent;
  
  //------------------------------------------------
  // Network Participation Members
  //------------------------------------------------
  bool m_networkParticipationEnabled;
  std::string m_networkStoragePath;
  uint64_t m_networkStorageAllocation;
  int m_networkBandwidthLimit;
  std::string m_networkRewardAddress;
  std::string m_networkStatus;
  NetworkStatistics m_networkStats;
  NetworkRewardInfo m_rewardInfo;
  
  // Thread safety
  CCriticalSection m_critSection;
  
  // Cache cleanup timer
  std::unique_ptr<CTimer> m_cleanupTimer;
  
  // Config file path
  std::string m_configPath;
  
  // Curl for HTTP requests
  XFILE::CCurlFile m_curl;
  
  // Singleton instance
  static CIPFSManager* m_instance;
};

} // namespace WYLLOH 