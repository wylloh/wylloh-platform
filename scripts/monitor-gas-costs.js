#!/usr/bin/env node

// Gas Cost Monitoring Script for Wylloh Platform
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '',
  adminWallet: process.env.ADMIN_WALLET_ADDRESS || '0x7FA50da5a8f998c9184E344279b205DE699Aa672',
  monitoringInterval: 5 * 60 * 1000, // 5 minutes
  alertThresholds: {
    highGasPrice: ethers.utils.parseUnits('100', 'gwei'), // 100 gwei
    lowAdminBalance: ethers.utils.parseEther('1'), // 1 MATIC
    dailyGasSpendLimit: ethers.utils.parseEther('10') // 10 MATIC per day
  }
};

class GasMonitor {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    this.metrics = {
      gasPrice: '0',
      adminBalance: '0',
      dailyGasSpend: '0',
      totalTransactions: 0,
      lastUpdate: new Date().toISOString()
    };
  }

  async initialize() {
    console.log('🔍 Initializing gas monitoring for Wylloh Platform...');
    console.log(`📊 Admin wallet: ${config.adminWallet}`);
    console.log(`⛽ RPC URL: ${config.rpcUrl}`);
    console.log(`📋 Monitoring interval: ${config.monitoringInterval / 1000}s`);
    
    // Test connection
    try {
      const network = await this.provider.getNetwork();
      console.log(`✅ Connected to network: ${network.name} (${network.chainId})`);
    } catch (error) {
      console.error('❌ Failed to connect to network:', error.message);
      process.exit(1);
    }
  }

  async checkGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      
      this.metrics.gasPrice = ethers.utils.formatUnits(gasPrice, 'gwei');
      
      // Check if gas price exceeds threshold
      if (gasPrice.gt(config.alertThresholds.highGasPrice)) {
        console.warn(`🚨 HIGH GAS PRICE ALERT: ${this.metrics.gasPrice} gwei`);
        this.sendAlert('HIGH_GAS_PRICE', this.metrics.gasPrice);
      } else {
        console.log(`⛽ Current gas price: ${this.metrics.gasPrice} gwei`);
      }
      
      return gasPrice;
    } catch (error) {
      console.error('❌ Error checking gas price:', error.message);
      return null;
    }
  }

  async checkAdminBalance() {
    try {
      const balance = await this.provider.getBalance(config.adminWallet);
      this.metrics.adminBalance = ethers.utils.formatEther(balance);
      
      // Check if admin balance is too low
      if (balance.lt(config.alertThresholds.lowAdminBalance)) {
        console.warn(`🚨 LOW ADMIN BALANCE ALERT: ${this.metrics.adminBalance} MATIC`);
        this.sendAlert('LOW_ADMIN_BALANCE', this.metrics.adminBalance);
      } else {
        console.log(`💰 Admin balance: ${this.metrics.adminBalance} MATIC`);
      }
      
      return balance;
    } catch (error) {
      console.error('❌ Error checking admin balance:', error.message);
      return null;
    }
  }

  async estimateTransactionCosts() {
    try {
      const gasPrice = await this.checkGasPrice();
      if (!gasPrice) return null;

      // Estimate costs for common operations
      const estimates = {
        createFilm: gasPrice.mul(300000), // ~300k gas for creating a film
        purchaseToken: gasPrice.mul(150000), // ~150k gas for purchasing tokens
        transfer: gasPrice.mul(21000) // ~21k gas for simple transfer
      };

      console.log('📊 Estimated transaction costs:');
      console.log(`  Create Film: ${ethers.utils.formatEther(estimates.createFilm)} MATIC`);
      console.log(`  Purchase Token: ${ethers.utils.formatEther(estimates.purchaseToken)} MATIC`);
      console.log(`  Transfer: ${ethers.utils.formatEther(estimates.transfer)} MATIC`);

      return estimates;
    } catch (error) {
      console.error('❌ Error estimating transaction costs:', error.message);
      return null;
    }
  }

  async saveMetrics() {
    try {
      const metricsFile = path.join(__dirname, '..', 'logs', 'gas-metrics.json');
      const metricsDir = path.dirname(metricsFile);
      
      // Ensure logs directory exists
      if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
      }
      
      // Load existing metrics
      let allMetrics = [];
      if (fs.existsSync(metricsFile)) {
        allMetrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      }
      
      // Add current metrics
      allMetrics.push(this.metrics);
      
      // Keep only last 24 hours of data (assuming 5min intervals = 288 records)
      if (allMetrics.length > 288) {
        allMetrics = allMetrics.slice(-288);
      }
      
      // Save metrics
      fs.writeFileSync(metricsFile, JSON.stringify(allMetrics, null, 2));
      console.log(`📝 Metrics saved to ${metricsFile}`);
      
    } catch (error) {
      console.error('❌ Error saving metrics:', error.message);
    }
  }

  sendAlert(type, value) {
    const alert = {
      type,
      value,
      timestamp: new Date().toISOString(),
      adminWallet: config.adminWallet
    };
    
    // Log alert (in production, this would send to monitoring service)
    console.log(`🚨 ALERT: ${JSON.stringify(alert, null, 2)}`);
    
    // Save alert to file
    const alertFile = path.join(__dirname, '..', 'logs', 'gas-alerts.json');
    try {
      let alerts = [];
      if (fs.existsSync(alertFile)) {
        alerts = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
      }
      alerts.push(alert);
      fs.writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
    } catch (error) {
      console.error('❌ Error saving alert:', error.message);
    }
  }

  async runMonitoringCycle() {
    console.log(`\n🔄 Running monitoring cycle at ${new Date().toISOString()}`);
    
    // Check gas prices
    await this.checkGasPrice();
    
    // Check admin balance  
    await this.checkAdminBalance();
    
    // Estimate transaction costs
    await this.estimateTransactionCosts();
    
    // Update metrics timestamp
    this.metrics.lastUpdate = new Date().toISOString();
    
    // Save metrics
    await this.saveMetrics();
    
    console.log('✅ Monitoring cycle completed\n');
  }

  async start() {
    await this.initialize();
    
    // Run initial check
    await this.runMonitoringCycle();
    
    // Schedule regular monitoring
    setInterval(async () => {
      await this.runMonitoringCycle();
    }, config.monitoringInterval);
    
    console.log('🚀 Gas monitoring started successfully');
    console.log('Press Ctrl+C to stop monitoring');
  }
}

// Main execution
if (require.main === module) {
  const monitor = new GasMonitor();
  monitor.start().catch(error => {
    console.error('❌ Monitor failed:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gas monitor...');
    process.exit(0);
  });
}

module.exports = GasMonitor; 