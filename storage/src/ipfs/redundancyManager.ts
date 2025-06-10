// Simplified Redundancy Manager for Helia migration
export class RedundancyManager {
  async initialize(): Promise<void> {
    console.log('Redundancy manager initialized in simplified mode');
  }

  async shutdown(): Promise<void> {
    console.log('Redundancy manager shut down');
  }
}

export const redundancyManager = new RedundancyManager(); 