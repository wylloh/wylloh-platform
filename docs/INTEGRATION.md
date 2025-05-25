# Wylloh Protocol Integration Guide

This guide provides detailed instructions for integrating with the Wylloh protocol, enabling cross-platform movie tokenization and trading.

## Protocol Overview

The Wylloh protocol consists of several key components:

1. **Token Standard**: ERC-1155 based movie tokens
2. **Marketplace Protocol**: Cross-platform trading interface
3. **Royalty System**: EIP-2981 compliant royalty distribution
4. **Lending/Renting**: Time-limited access control
5. **Reputation System**: Cross-platform quality verification

## Smart Contract Integration

### Token Contract

```solidity
interface IWyllohToken {
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external;
    
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external;
    
    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view returns (address receiver, uint256 royaltyAmount);
}
```

### Marketplace Contract

```solidity
interface IWyllohMarketplace {
    function listToken(
        uint256 tokenId,
        uint256 price,
        uint256 amount
    ) external;
    
    function buyToken(
        uint256 tokenId,
        uint256 amount
    ) external payable;
    
    function cancelListing(
        uint256 tokenId
    ) external;
}
```

## Integration Steps

### 1. Setup

1. Install dependencies:
   ```bash
   npm install @wylloh/contracts
   ```

2. Import contracts:
   ```javascript
   import { WyllohToken, WyllohMarketplace } from '@wylloh/contracts';
   ```

### 2. Token Integration

```javascript
// Initialize token contract
const tokenContract = new WyllohToken(tokenAddress);

// Mint new movie token
await tokenContract.mint(
    creatorAddress,
    tokenId,
    amount,
    metadata
);

// Check royalty info
const [receiver, amount] = await tokenContract.royaltyInfo(
    tokenId,
    salePrice
);
```

### 3. Marketplace Integration

```javascript
// Initialize marketplace contract
const marketplace = new WyllohMarketplace(marketplaceAddress);

// List token for sale
await marketplace.listToken(
    tokenId,
    price,
    amount
);

// Buy token
await marketplace.buyToken(
    tokenId,
    amount,
    { value: price }
);
```

### 4. Lending/Renting Integration

```javascript
// Initialize lending contract
const lending = new WyllohLending(lendingAddress);

// Lend token
await lending.lendToken(
    tokenId,
    borrowerAddress,
    duration
);

// Rent token
await lending.rentToken(
    tokenId,
    duration,
    { value: rentalFee }
);
```

## Best Practices

1. **Security**
   - Always verify contract addresses
   - Use secure key management
   - Implement proper access control

2. **Gas Optimization**
   - Batch operations when possible
   - Use appropriate gas limits
   - Consider Polygon network for lower fees

3. **Error Handling**
   - Implement proper error catching
   - Provide user-friendly error messages
   - Log errors for debugging

4. **Testing**
   - Test on Mumbai testnet first
   - Use test accounts for development
   - Verify all contract interactions

## Quality Control

### Content Verification

1. **Studio Verification**
   - Submit verification request
   - Provide proof of rights
   - Wait for verification

2. **Producer Verification**
   - Link existing verified content
   - Provide production credits
   - Build reputation score

### Reputation System

1. **Score Calculation**
   - Content quality metrics
   - User engagement metrics
   - Platform performance metrics

2. **Cross-Platform Integration**
   - Share reputation data
   - Verify content origins
   - Maintain quality standards

## Support

For integration support:
- GitHub Issues: [@wylloh/wylloh-platform](https://github.com/wylloh/wylloh-platform/issues)
- Email: [contact@wylloh.com](mailto:contact@wylloh.com)
- Discord: [Wylloh Protocol](https://discord.gg/wylloh) 