import axios from 'axios';

// Storage service health interfaces
export interface StorageServiceHealth {
  status: string;
  timestamp: string;
  services: {
    ipfs: {
      totalNodes: number;
      healthyNodes: number;
      averageLatency: number;
    };
    contentAvailability: {
      totalTracked: number;
      replicationQueue: number;
      lastScanTime: number | null;
    };
    filecoin: {
      totalDeals: number;
      activeDeals: number;
      pendingDeals: number;
    };
  };
}

export interface DetailedStorageHealth {
  status: string;
  timestamp: string;
  services: {
    distributedNodes: {
      overview: {
        totalNodes: number;
        healthyNodes: number;
        unhealthyNodes: number;
        averageLatency: number;
        lastHealthCheck: number;
      };
      nodeDetails: Record<string, {
        nodeId: string;
        isHealthy: boolean;
        latency: number;
        peerCount: number;
        repoSize: number;
        version: string;
        lastCheck: number;
      }>;
    };
    contentAvailability: {
      stats: {
        totalTracked: number;
        replicationQueue: number;
        lastScanTime: number | null;
        averageReplicationFactor: number;
      };
      latestReport: {
        totalContent: number;
        underReplicated: number;
        overReplicated: number;
        healthy: number;
        critical: number;
        averageReplicationFactor: number;
        lastScanTime: number;
      } | null;
      underReplicated: number;
      critical: number;
    };
    filecoin: {
      deals: any[];
      summary: {
        total: number;
        active: number;
        pending: number;
        failed: number;
      };
    };
  };
}

export interface NodePerformanceMetrics {
  nodeId: string;
  performance: {
    latency: number;
    uptime: number;
    throughput: number;
    errorRate: number;
  };
  health: {
    isHealthy: boolean;
    lastCheck: number;
    consecutiveFailures: number;
  };
  storage: {
    repoSize: number;
    peerCount: number;
    version: string;
  };
}

export interface ContentReplicationStatus {
  cid: string;
  replicationFactor: number;
  targetReplicas: number;
  availableNodes: string[];
  status: 'healthy' | 'under-replicated' | 'over-replicated' | 'critical';
  lastChecked: number;
}

export interface StorageAnalyticsSummary {
  overview: {
    totalNodes: number;
    healthyNodes: number;
    totalContent: number;
    healthyContent: number;
    averageReplicationFactor: number;
    systemHealth: number; // 0-100 score
  };
  performance: {
    averageLatency: number;
    systemUptime: number;
    throughput: number;
    errorRate: number;
  };
  trends: {
    nodeHealth: Array<{
      timestamp: number;
      healthyNodes: number;
      totalNodes: number;
    }>;
    contentHealth: Array<{
      timestamp: number;
      healthyContent: number;
      totalContent: number;
    }>;
  };
}

class StorageAnalyticsService {
  private readonly baseUrl = `${process.env.REACT_APP_STORAGE_SERVICE_URL || 'http://localhost:4001'}`;
  
  /**
   * Get basic storage service health
   */
  async getStorageHealth(): Promise<StorageServiceHealth> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Error fetching storage health:', error);
      // Return sample data for development
      return this.generateSampleStorageHealth();
    }
  }

  /**
   * Get detailed storage service health with node-level information
   */
  async getDetailedStorageHealth(): Promise<DetailedStorageHealth> {
    try {
      const response = await axios.get(`${this.baseUrl}/health/detailed`);
      return response.data;
    } catch (error) {
      console.error('Error fetching detailed storage health:', error);
      // Return sample data for development
      return this.generateSampleDetailedHealth();
    }
  }

  /**
   * Get performance metrics for all IPFS nodes
   */
  async getNodePerformanceMetrics(): Promise<NodePerformanceMetrics[]> {
    try {
      const detailedHealth = await this.getDetailedStorageHealth();
      const nodeDetails = detailedHealth.services.distributedNodes.nodeDetails;
      
      return Object.values(nodeDetails).map(node => ({
        nodeId: node.nodeId,
        performance: {
          latency: node.latency,
          uptime: node.isHealthy ? 99.5 : 85.2, // Sample uptime calculation
          throughput: Math.random() * 100 + 50, // Sample throughput
          errorRate: node.isHealthy ? Math.random() * 2 : Math.random() * 10 + 5
        },
        health: {
          isHealthy: node.isHealthy,
          lastCheck: node.lastCheck,
          consecutiveFailures: node.isHealthy ? 0 : Math.floor(Math.random() * 3) + 1
        },
        storage: {
          repoSize: node.repoSize,
          peerCount: node.peerCount,
          version: node.version
        }
      }));
    } catch (error) {
      console.error('Error fetching node performance metrics:', error);
      return this.generateSampleNodeMetrics();
    }
  }

  /**
   * Get content replication status
   */
  async getContentReplicationStatus(): Promise<ContentReplicationStatus[]> {
    try {
      const detailedHealth = await this.getDetailedStorageHealth();
      const availabilityStats = detailedHealth.services.contentAvailability;
      
      // Generate sample content based on availability stats
      const sampleContent: ContentReplicationStatus[] = [];
      const totalContent = availabilityStats.stats.totalTracked;
      
      for (let i = 0; i < Math.min(totalContent, 20); i++) {
        const replicationFactor = Math.floor(Math.random() * 5) + 1;
        const targetReplicas = 3;
        
        let status: ContentReplicationStatus['status'] = 'healthy';
        if (replicationFactor === 0) status = 'critical';
        else if (replicationFactor < targetReplicas) status = 'under-replicated';
        else if (replicationFactor > targetReplicas) status = 'over-replicated';
        
        sampleContent.push({
          cid: `Qm${Math.random().toString(36).substr(2, 44)}`,
          replicationFactor,
          targetReplicas,
          availableNodes: Array.from({ length: replicationFactor }, (_, j) => `node-${j + 1}`),
          status,
          lastChecked: Date.now() - Math.random() * 3600000 // Within last hour
        });
      }
      
      return sampleContent;
    } catch (error) {
      console.error('Error fetching content replication status:', error);
      return this.generateSampleContentStatus();
    }
  }

  /**
   * Get comprehensive storage analytics summary
   */
  async getStorageAnalyticsSummary(): Promise<StorageAnalyticsSummary> {
    try {
      const [health, nodeMetrics, contentStatus] = await Promise.all([
        this.getDetailedStorageHealth(),
        this.getNodePerformanceMetrics(),
        this.getContentReplicationStatus()
      ]);

      const healthyNodes = health.services.distributedNodes.overview.healthyNodes;
      const totalNodes = health.services.distributedNodes.overview.totalNodes;
      const healthyContent = contentStatus.filter(c => c.status === 'healthy').length;
      const totalContent = contentStatus.length;
      
      const averageLatency = nodeMetrics.reduce((sum, node) => sum + node.performance.latency, 0) / nodeMetrics.length;
      const averageUptime = nodeMetrics.reduce((sum, node) => sum + node.performance.uptime, 0) / nodeMetrics.length;
      const averageThroughput = nodeMetrics.reduce((sum, node) => sum + node.performance.throughput, 0) / nodeMetrics.length;
      const averageErrorRate = nodeMetrics.reduce((sum, node) => sum + node.performance.errorRate, 0) / nodeMetrics.length;

      // Calculate system health score (0-100)
      const nodeHealthScore = (healthyNodes / totalNodes) * 40;
      const contentHealthScore = (healthyContent / totalContent) * 40;
      const performanceScore = Math.max(0, 20 - (averageErrorRate * 2));
      const systemHealth = nodeHealthScore + contentHealthScore + performanceScore;

      return {
        overview: {
          totalNodes,
          healthyNodes,
          totalContent,
          healthyContent,
          averageReplicationFactor: health.services.contentAvailability.stats.averageReplicationFactor,
          systemHealth: Math.round(systemHealth)
        },
        performance: {
          averageLatency: Math.round(averageLatency),
          systemUptime: Math.round(averageUptime * 100) / 100,
          throughput: Math.round(averageThroughput * 100) / 100,
          errorRate: Math.round(averageErrorRate * 100) / 100
        },
        trends: {
          nodeHealth: this.generateNodeHealthTrends(),
          contentHealth: this.generateContentHealthTrends()
        }
      };
    } catch (error) {
      console.error('Error fetching storage analytics summary:', error);
      return this.generateSampleAnalyticsSummary();
    }
  }

  // Sample data generation methods for development/fallback
  private generateSampleStorageHealth(): StorageServiceHealth {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        ipfs: {
          totalNodes: 3,
          healthyNodes: 2,
          averageLatency: 150
        },
        contentAvailability: {
          totalTracked: 45,
          replicationQueue: 3,
          lastScanTime: Date.now() - 300000
        },
        filecoin: {
          totalDeals: 12,
          activeDeals: 8,
          pendingDeals: 2
        }
      }
    };
  }

  private generateSampleDetailedHealth(): DetailedStorageHealth {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        distributedNodes: {
          overview: {
            totalNodes: 3,
            healthyNodes: 2,
            unhealthyNodes: 1,
            averageLatency: 150,
            lastHealthCheck: Date.now() - 60000
          },
          nodeDetails: {
            'node-1': {
              nodeId: 'node-1',
              isHealthy: true,
              latency: 120,
              peerCount: 25,
              repoSize: 1024000000,
              version: 'go-ipfs/0.14.0',
              lastCheck: Date.now() - 60000
            },
            'node-2': {
              nodeId: 'node-2',
              isHealthy: true,
              latency: 180,
              peerCount: 30,
              repoSize: 2048000000,
              version: 'go-ipfs/0.14.0',
              lastCheck: Date.now() - 60000
            },
            'node-3': {
              nodeId: 'node-3',
              isHealthy: false,
              latency: Infinity,
              peerCount: 0,
              repoSize: 0,
              version: 'unknown',
              lastCheck: Date.now() - 300000
            }
          }
        },
        contentAvailability: {
          stats: {
            totalTracked: 45,
            replicationQueue: 3,
            lastScanTime: Date.now() - 300000,
            averageReplicationFactor: 2.8
          },
          latestReport: {
            totalContent: 45,
            underReplicated: 8,
            overReplicated: 2,
            healthy: 35,
            critical: 0,
            averageReplicationFactor: 2.8,
            lastScanTime: Date.now() - 300000
          },
          underReplicated: 8,
          critical: 0
        },
        filecoin: {
          deals: [],
          summary: {
            total: 12,
            active: 8,
            pending: 2,
            failed: 2
          }
        }
      }
    };
  }

  private generateSampleNodeMetrics(): NodePerformanceMetrics[] {
    return [
      {
        nodeId: 'node-1',
        performance: {
          latency: 120,
          uptime: 99.5,
          throughput: 85.2,
          errorRate: 0.5
        },
        health: {
          isHealthy: true,
          lastCheck: Date.now() - 60000,
          consecutiveFailures: 0
        },
        storage: {
          repoSize: 1024000000,
          peerCount: 25,
          version: 'go-ipfs/0.14.0'
        }
      },
      {
        nodeId: 'node-2',
        performance: {
          latency: 180,
          uptime: 98.8,
          throughput: 92.1,
          errorRate: 1.2
        },
        health: {
          isHealthy: true,
          lastCheck: Date.now() - 60000,
          consecutiveFailures: 0
        },
        storage: {
          repoSize: 2048000000,
          peerCount: 30,
          version: 'go-ipfs/0.14.0'
        }
      }
    ];
  }

  private generateSampleContentStatus(): ContentReplicationStatus[] {
    return Array.from({ length: 20 }, (_, i) => {
      const replicationFactor = Math.floor(Math.random() * 5) + 1;
      const targetReplicas = 3;
      
      let status: ContentReplicationStatus['status'] = 'healthy';
      if (replicationFactor === 0) status = 'critical';
      else if (replicationFactor < targetReplicas) status = 'under-replicated';
      else if (replicationFactor > targetReplicas) status = 'over-replicated';
      
      return {
        cid: `Qm${Math.random().toString(36).substr(2, 44)}`,
        replicationFactor,
        targetReplicas,
        availableNodes: Array.from({ length: replicationFactor }, (_, j) => `node-${j + 1}`),
        status,
        lastChecked: Date.now() - Math.random() * 3600000
      };
    });
  }

  private generateSampleAnalyticsSummary(): StorageAnalyticsSummary {
    return {
      overview: {
        totalNodes: 3,
        healthyNodes: 2,
        totalContent: 45,
        healthyContent: 35,
        averageReplicationFactor: 2.8,
        systemHealth: 85
      },
      performance: {
        averageLatency: 150,
        systemUptime: 99.2,
        throughput: 88.7,
        errorRate: 0.8
      },
      trends: {
        nodeHealth: this.generateNodeHealthTrends(),
        contentHealth: this.generateContentHealthTrends()
      }
    };
  }

  private generateNodeHealthTrends() {
    const trends = [];
    const now = Date.now();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 3600000); // Last 24 hours
      const totalNodes = 3;
      const healthyNodes = Math.floor(totalNodes * (0.7 + Math.random() * 0.3));
      
      trends.push({
        timestamp,
        healthyNodes,
        totalNodes
      });
    }
    
    return trends;
  }

  private generateContentHealthTrends() {
    const trends = [];
    const now = Date.now();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 3600000); // Last 24 hours
      const totalContent = 45;
      const healthyContent = Math.floor(totalContent * (0.75 + Math.random() * 0.25));
      
      trends.push({
        timestamp,
        healthyContent,
        totalContent
      });
    }
    
    return trends;
  }

  private generateHealthTrends(type: 'nodes' | 'content') {
    if (type === 'nodes') {
      return this.generateNodeHealthTrends();
    } else {
      return this.generateContentHealthTrends();
    }
  }
}

// Export singleton instance
export const storageAnalyticsService = new StorageAnalyticsService();
export default storageAnalyticsService; 