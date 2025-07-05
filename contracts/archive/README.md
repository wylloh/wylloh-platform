# 🗂️ ARCHIVED CONTRACTS

This directory contains **deprecated contracts** that have been moved here to prevent compilation conflicts and future confusion.

## 📜 DEPRECATION HISTORY

### **Factory System (DEPRECATED - July 5, 2025)**

**Location**: `archive/factory/`

**Deprecated Contracts**:
- `WyllohFilmFactory.sol` - OLD factory-based film creation system
- `WyllohFilmToken.sol` - OLD individual film token contracts  
- `WyllohFilmTokenSimple.sol` - OLD simplified film tokens

**Why Deprecated**:
- Replaced by **Registry-based system** (`WyllohFilmRegistry.sol`)
- Factory system created separate contracts for each film (not scalable)
- Registry system uses single contract with multiple token IDs (scalable)
- Hardhat configuration conflict resolved by moving to archive

**Replacement Architecture**:
- `WyllohFilmRegistry.sol` - Master contract for all films
- `WyllohToken.sol` (ERC1155) - Content licensing tokens
- `WyllohMarketplace.sol` - Integrated marketplace
- `StoragePool.sol` - Storage management
- `RoyaltyDistributor.sol` - Royalty distribution

## ⚠️ IMPORTANT NOTES

1. **Do NOT deploy** contracts from this archive directory
2. **Do NOT reference** these contracts in new development
3. **Use Registry-based system** for all new implementations
4. **Archive preserved** for historical reference only

## 🎯 CURRENT ARCHITECTURE

**Active Contracts** (located in `/contracts/`):
- Registry-based system with integrated marketplace
- Scalable token architecture supporting unlimited films
- Integrated royalty distribution and storage management

**Deployment Date**: July 5, 2025 (Polygon Mainnet)
**First Film**: The Cocoanuts (1929) - Token ID 1

---

**📅 Archived**: July 5, 2025  
**Reason**: Architecture migration to Registry-based system  
**Status**: **DEPRECATED - DO NOT USE** 