/**
 * Local API Server Module for Seed One
 * 
 * Creates a local HTTP server that allows the Kodi addon to interact
 * with the wallet and license verification functionality.
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Start the API server
 * 
 * @param {Object} options - Server options
 * @returns {Promise<http.Server>} HTTP server instance
 */
async function startApiServer(options = {}) {
    const app = express();
    const port = options.port || config.server.port;
    const apiKey = options.apiKey || config.server.apiKey;
    
    // Middleware
    app.use(express.json());
    app.use(cors());
    
    // Add security middleware to validate API key
    app.use((req, res, next) => {
        const requestApiKey = req.headers['x-api-key'];
        
        if (!requestApiKey || requestApiKey !== apiKey) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Invalid API key'
            });
        }
        
        next();
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            success: true,
            status: 'ok',
            version: config.app.version,
            timestamp: new Date().toISOString()
        });
    });
    
    // Wallet routes
    app.post('/api/wallet/connect', async (req, res) => {
        try {
            // This function will be injected when the server is started
            if (!app.locals.walletConnection) {
                throw new Error('Wallet connection not initialized');
            }
            
            const result = await app.locals.walletConnection.connect();
            res.json(result);
        } catch (error) {
            logger.error('API server - wallet connect error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
    
    app.post('/api/wallet/disconnect', async (req, res) => {
        try {
            if (!app.locals.walletConnection) {
                throw new Error('Wallet connection not initialized');
            }
            
            const result = await app.locals.walletConnection.disconnect();
            res.json(result);
        } catch (error) {
            logger.error('API server - wallet disconnect error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
    
    app.post('/api/wallet/import', async (req, res) => {
        try {
            if (!app.locals.walletConnection) {
                throw new Error('Wallet connection not initialized');
            }
            
            const { privateKey } = req.body;
            if (!privateKey) {
                return res.status(400).json({
                    success: false,
                    message: 'Private key is required'
                });
            }
            
            const result = await app.locals.walletConnection.importWallet(privateKey);
            res.json(result);
        } catch (error) {
            logger.error('API server - wallet import error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
    
    app.get('/api/wallet/balance', async (req, res) => {
        try {
            if (!app.locals.walletConnection) {
                throw new Error('Wallet connection not initialized');
            }
            
            const balance = await app.locals.walletConnection.getBalance();
            res.json({
                success: true,
                balance
            });
        } catch (error) {
            logger.error('API server - get balance error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
    
    app.get('/api/wallet/tokens', async (req, res) => {
        try {
            if (!app.locals.walletConnection) {
                throw new Error('Wallet connection not initialized');
            }
            
            // In a real implementation, we would fetch tokens from the blockchain
            // For demo purposes, we'll return placeholder tokens
            res.json({
                success: true,
                tokens: [
                    {
                        id: '1',
                        contract: config.blockchain.tokenContractAddress,
                        contentId: '1',
                        rightsLevel: 'basic'
                    },
                    {
                        id: '2',
                        contract: config.blockchain.tokenContractAddress,
                        contentId: '2',
                        rightsLevel: 'commercial'
                    }
                ]
            });
        } catch (error) {
            logger.error('API server - get tokens error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
    
    // Content routes
    app.post('/api/marketplace/purchase', async (req, res) => {
        try {
            if (!app.locals.walletConnection) {
                throw new Error('Wallet connection not initialized');
            }
            
            const { contentId } = req.body;
            if (!contentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Content ID is required'
                });
            }
            
            // In a real implementation, this would interact with the marketplace contract
            // For demo purposes, we'll simulate a successful purchase
            res.json({
                success: true,
                message: 'Purchase successful',
                tokenId: '3',
                transactionHash: '0x' + Math.random().toString(16).substring(2, 34)
            });
        } catch (error) {
            logger.error('API server - purchase error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Start listening
    return new Promise((resolve, reject) => {
        server.listen(port, () => {
            logger.info(`API server started on port ${port}`);
            resolve(server);
        });
        
        server.on('error', (error) => {
            logger.error(`API server error: ${error.message}`);
            reject(error);
        });
        
        // Add close method
        server.close = () => {
            return new Promise((resolve) => {
                logger.info('Closing API server');
                server.close(() => {
                    logger.info('API server closed');
                    resolve();
                });
            });
        };
        
        // Add setWalletConnection method
        server.setWalletConnection = (walletConnection) => {
            app.locals.walletConnection = walletConnection;
            logger.info('Wallet connection set in API server');
        };
    });
}

module.exports = {
    startApiServer
};