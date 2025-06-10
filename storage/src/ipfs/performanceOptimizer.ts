// Simplified Performance Optimizer for Helia migration
export class PerformanceOptimizer {
  async initialize(): Promise<void> {
    console.log('Performance optimizer initialized in simplified mode');
  }

  async shutdown(): Promise<void> {
    console.log('Performance optimizer shut down');
  }
}

export const performanceOptimizer = new PerformanceOptimizer(); 