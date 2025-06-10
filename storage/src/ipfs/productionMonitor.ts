// Simplified Production Monitor for Helia migration
export class ProductionMonitor {
  async initialize(): Promise<void> {
    console.log('Production monitor initialized in simplified mode');
  }

  async shutdown(): Promise<void> {
    console.log('Production monitor shut down');
  }
}

export const productionMonitor = new ProductionMonitor(); 