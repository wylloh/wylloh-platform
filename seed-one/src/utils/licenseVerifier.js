/**
 * License Verifier Module
 * 
 * Handles verification of content licenses and token ownership
 * to ensure users have the appropriate rights to access content.
 */

const axios = require('axios');
const { logger } = require('./logger');
const config = require('../config');

/**
 * Verify that a user has a valid license for content
 * 
 * @param {Object} walletConnection - The wallet connection instance
 * @param {string} contentId - The content ID to verify
 * @param {string} tokenId - The token ID for verification
 * @returns {Promise<boolean>} True if license is valid, false otherwise
 */
async function verifyContentLicense(walletConnection, contentId, tokenId) {
    try {
        if (!walletConnection || !walletConnection.address) {
            logger.warn('No wallet connection available for license verification');
            return false;
        }

        // First verify token ownership
        const hasToken = await walletConnection.hasToken(tokenId);
        if (!hasToken) {
            logger.warn(`Token ownership verification failed for token: ${tokenId}`);
            return false;
        }

        // Then verify token-content association
        const verificationResult = await verifyTokenContentAssociation(contentId, tokenId);
        if (!verificationResult) {
            logger.warn(`Token-content association verification failed for content: ${contentId}`);
            return false;
        }

        // Verify token rights
        const hasRights = await verifyTokenRights(walletConnection, tokenId);
        if (!hasRights) {
            logger.warn(`Token rights verification failed for token: ${tokenId}`);
            return false;
        }

        logger.info(`License verification succeeded for token: ${tokenId}`);
        return true;
    } catch (error) {
        logger.error(`Error verifying content license: ${error.message}`);
        return false;
    }
}

/**
 * Verify that a token is associated with specific content
 * 
 * @param {string} contentId - The content ID
 * @param {string} tokenId - The token ID
 * @returns {Promise<boolean>} True if association is valid
 */
async function verifyTokenContentAssociation(contentId, tokenId) {
    try {
        // In a real implementation, this would make an API call to verify the association
        // For demo purposes, we'll simulate a successful verification
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For demo, return true (we could implement actual verification logic here)
        return true;
    } catch (error) {
        logger.error(`Error verifying token-content association: ${error.message}`);
        return false;
    }
}

/**
 * Verify token rights for playback
 * 
 * @param {Object} walletConnection - The wallet connection instance
 * @param {string} tokenId - The token ID to verify
 * @returns {Promise<boolean>} True if the token has necessary rights
 */
async function verifyTokenRights(walletConnection, tokenId) {
    try {
        // Check if the token has the proper rights level for content playback
        const contractAddress = config.blockchain.tokenContractAddress;
        
        // 1 is the rights type for basic viewing
        const hasViewingRights = await walletConnection.hasToken(contractAddress, tokenId);
        
        return hasViewingRights;
    } catch (error) {
        logger.error(`Error verifying token rights: ${error.message}`);
        return false;
    }
}

/**
 * Get the rights level for a token
 * 
 * @param {Object} walletConnection - The wallet connection instance
 * @param {string} tokenId - The token ID
 * @returns {Promise<Object>} Object with rights information
 */
async function getTokenRights(walletConnection, tokenId) {
    try {
        // In a real implementation, this would call the smart contract to get rights
        // For demo purposes, we'll return a default rights object
        
        return {
            personal: true,            // Personal viewing
            publicPerformance: false,  // Public performance rights
            commercial: false,         // Commercial use rights
            distribution: false,       // Distribution rights
        };
    } catch (error) {
        logger.error(`Error getting token rights: ${error.message}`);
        return {
            personal: false,
            publicPerformance: false,
            commercial: false,
            distribution: false,
        };
    }
}

module.exports = {
    verifyContentLicense,
    verifyTokenContentAssociation,
    verifyTokenRights,
    getTokenRights
};