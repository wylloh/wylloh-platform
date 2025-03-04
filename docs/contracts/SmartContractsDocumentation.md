# Wylloh Smart Contracts Documentation

## Overview

The Wylloh platform utilizes a suite of smart contracts deployed on the Polygon blockchain to manage content licensing, rights enforcement, and marketplace functionality. These contracts work together to enable the tokenization of media content, flexible rights management, and transparent royalty distribution.

## Contract Architecture

The smart contract architecture consists of four main components:

1. **WyllohToken**: The core token contract that implements the ERC-1155 standard for multi-token management with extensions for royalties and content metadata.

2. **WyllohMarketplace**: Manages the buying and selling of token licenses, including listings, offers, and transactions.

3. **RightsManager**: Handles the configuration and verification of different rights tiers associated with token ownership.

4. **RoyaltyDistributor**: Manages the collection and distribution of royalties to content creators and other stakeholders.

### Contract Interaction Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ WyllohToken │◄────►│ RightsManager│◄────►│RoyaltyDistributor│
└──────┬──────┘      └─────────────┘      └─────────────┘
       │                                         ▲
       │                                         │
       ▼                                         │
┌─────────────┐                                  │
│WyllohMarketplace│───────────────────────────────┘
└─────────────┘
```

## WyllohToken Contract

### Purpose
The WyllohToken contract is responsible for creating, managing, and tracking token ownership for content licenses on the Wylloh platform.

### Key Features

#### Token Creation and Metadata
```solidity
function create(
    address to,
    uint256 id,
    uint256 amount,
    string memory contentId,
    string memory contentHash,
    string memory contentType,
    string memory tokenURI,
    address royaltyRecipient,
    uint96 royaltyPercentage
) public onlyRole(MINTER_ROLE)
```

This function creates new tokens with associated content metadata, including:
- Content ID: Unique identifier for the content
- Content Hash: Cryptographic hash of the content for verification
- Content Type: Type of content (movie, series, etc.)
- TokenURI: URI for token metadata (following metadata standards)

#### Rights Management
```solidity
function setRightsThresholds(
    uint256 tokenId,
    uint256[] memory quantities,
    uint8[] memory rightsTypes
) public onlyRole(ADMIN_ROLE)
```

This function configures the rights thresholds for a token, determining what rights are granted based on the number of tokens owned.

```solidity
function hasRights(address account, uint256 tokenId, uint8 rightsType) public view returns (bool)
```

This function checks if an address has specific rights for a token based on their token balance and the configured thresholds.

#### Content Metadata
```solidity
struct ContentMetadata {
    string contentId;     // Unique identifier for the content
    string contentHash;   // Hash of the content for verification
    string contentType;   // Type of content (movie, series, etc.)
    address creator;      // Address of the content creator
}
```

This structure stores essential metadata about the content associated with each token.

#### Royalty Support
The contract implements the ERC2981 standard for royalty support, allowing royalties to be set and retrieved for each token.

## WyllohMarketplace Contract

### Purpose
The WyllohMarketplace contract manages the buying and selling of tokens, including listings, offers, and transactions.

### Key Features

#### Platform Fee Structure
The marketplace charges a fee on every transaction, including both initial sales and secondary market trades:

```solidity
uint256 public platformFeePercentage = 250; // 2.5% in basis points (1/100 of a percent)
address public feeRecipient;
```

This fee is calculated as a percentage of the total transaction value and is deducted from the seller's proceeds. The fee applies to:
- Initial token sales through the marketplace
- Secondary market transactions between users
- Accepted offers

For example, if a token sells for 1 MATIC, the platform fee would be 0.025 MATIC, and the seller would receive 0.975 MATIC (minus any royalties).

#### Listing Management

```solidity
function createListing(
    address tokenContract,
    uint256 tokenId,
    uint256 quantity,
    uint256 pricePerToken
) external nonReentrant returns (uint256)
```

This function creates a new listing for tokens, transferring them to the marketplace contract for escrow until sold or the listing is canceled.

Listings can have the following statuses:
- `active`: Listing is active and tokens can be purchased
- `sold`: All tokens in the listing have been sold
- `cancelled`: Listing was cancelled by the seller
- `expired`: Listing has reached its expiration date

```solidity
function updateListing(
    uint256 listingId,
    uint256 quantity,
    uint256 pricePerToken
) external nonReentrant
```

This function allows sellers to update the quantity or price of an existing listing.

```solidity
function cancelListing(uint256 listingId) external nonReentrant
```

This function allows sellers to cancel a listing and retrieve their tokens.

#### Buying Process

```solidity
function buyListing(uint256 listingId, uint256 quantity) external payable nonReentrant
```

This function allows users to purchase tokens from a listing. The process includes:
1. Verification of sufficient funds
2. Calculation of platform fee (2.5%)
3. Transfer of tokens to the buyer
4. Distribution of royalties through the RoyaltyDistributor (if configured)
5. Transfer of remaining funds to the seller
6. Refund of excess payment (if any)

#### Offer System

```solidity
function createOffer(
    address tokenContract,
    uint256 tokenId,
    uint256 quantity,
    uint256 pricePerToken,
    uint256 expirationDays
) external payable nonReentrant returns (uint256)
```

This function allows users to make offers for tokens, including:
- Specifying the desired quantity
- Setting the price per token
- Setting an expiration period

```solidity
function acceptOffer(uint256 offerId) external nonReentrant
```

This function allows token owners to accept offers, transferring tokens to the buyer and receiving payment.

```solidity
function rejectOffer(uint256 offerId) external nonReentrant
```

This function allows token owners to reject offers, refunding the buyer.

## RightsManager Contract

### Purpose
The RightsManager contract manages the rights associated with token ownership, defining what rights are granted based on token quantity.

### Key Features

#### Rights Types
The contract defines several standard rights types:
```solidity
enum RightsType {
    PERSONAL_VIEWING,
    SMALL_VENUE,
    STREAMING_PLATFORM,
    THEATRICAL_EXHIBITION,
    NATIONAL_DISTRIBUTION,
    CUSTOM
}
```

#### Rights Thresholds
```solidity
struct RightsThreshold {
    uint256 quantity;
    RightsType rightsType;
    bool enabled;
    string description;
    string additionalMetadata;
}
```

This structure defines the thresholds for different rights, including:
- Quantity: Number of tokens required
- Rights Type: Type of rights granted
- Enabled: Whether this threshold is active
- Description: Human-readable description of the rights
- Additional Metadata: Additional information about the rights

#### Custom Rights
```solidity
function createCustomRightsDefinition(
    string memory name,
    string memory description,
    string memory additionalMetadata
) public onlyRole(RIGHTS_MANAGER_ROLE) returns (uint256)
```

This function allows for the creation of custom rights definitions beyond the standard types.

#### Rights Verification
```solidity
function hasRights(
    address tokenContract,
    uint256 tokenId,
    address account,
    RightsType rightsType
) public view returns (bool)
```

This function checks if a user has specific rights for a token, which is used during content playback to verify access rights.

## RoyaltyDistributor Contract

### Purpose
The RoyaltyDistributor contract manages the collection and distribution of royalties for token sales.

### Key Features

#### Royalty Distribution
```solidity
function distributeRoyalties(
    address tokenContract,
    uint256 tokenId
) public payable
```

This function distributes royalties for a token sale. It accepts payment and distributes it to the configured royalty recipients based on their shares.

#### Royalty Recipients
```solidity
struct RoyaltyRecipient {
    address recipientAddress;
    uint256 sharePercentage; // Basis points (1/100 of a percent, so 10000 = 100%)
}
```

This structure defines a royalty recipient, including:
- Recipient Address: Address to receive royalties
- Share Percentage: Percentage of royalties in basis points

#### Royalty Management
```solidity
function addRoyaltyRecipient(
    address tokenContract,
    uint256 tokenId,
    address recipient,
    uint256 sharePercentage
) public onlyRole(ROYALTY_MANAGER_ROLE)
```

This function adds a royalty recipient for a token.

```solidity
function updateRoyaltyRecipient(
    address tokenContract,
    uint256 tokenId,
    uint256 index,
    uint256 sharePercentage
) public onlyRole(ROYALTY_MANAGER_ROLE)
```

This function updates a royalty recipient's share.

```solidity
function removeRoyaltyRecipient(
    address tokenContract,
    uint256 tokenId,
    uint256 index
) public onlyRole(ROYALTY_MANAGER_ROLE)
```

This function removes a royalty recipient.

## Security Considerations

### Access Control
The contracts use OpenZeppelin's AccessControl to manage permissions, with the following roles:
- DEFAULT_ADMIN_ROLE: Can manage all aspects of the contracts
- MINTER_ROLE: Can create new tokens
- RIGHTS_MANAGER_ROLE: Can manage rights thresholds
- FEE_MANAGER_ROLE: Can update marketplace fees
- ROYALTY_MANAGER_ROLE: Can manage royalty recipients

### Reentrancy Protection
The marketplace contract uses OpenZeppelin's ReentrancyGuard to prevent reentrancy attacks during token transfers and payments.

### Secure Token Transfers
Token transfers are handled securely using the ERC1155 safeTransferFrom method, which verifies that the recipient can handle the tokens.

### Fee Limitations
The marketplace contract includes a maximum fee limit to prevent excessive fees:
```solidity
require(newFeePercentage <= 3000, "WyllohMarketplace: Fee too high"); // Max 30%
```

## Usage Examples

### Tokenizing Content
1. Content is uploaded to IPFS
2. Content metadata is stored
3. WyllohToken.create() is called to mint tokens
4. Rights thresholds are set using setRightsThresholds()

### Listing Content for Sale
1. Seller approves marketplace contract to transfer tokens
2. Seller calls WyllohMarketplace.createListing()
3. Tokens are transferred to marketplace contract

### Purchasing Content
1. Buyer sends MATIC to WyllohMarketplace.buyListing()
2. Platform fee is deducted
3. Royalties are distributed through RoyaltyDistributor
4. Remaining funds are sent to seller
5. Tokens are transferred to buyer

### Verifying Content Rights
1. Seed One player retrieves user's tokens
2. For each token, it calls hasRights() to verify access
3. Content is played if sufficient rights are verified

## Error Handling

The contracts include comprehensive error handling with descriptive error messages, including:
- Input validation checks
- Balance verification for token operations
- Authentication and authorization checks
- Transaction failure handling

## Contract Upgradeability

The current contracts are not upgradeable. If updates are required, new versions would need to be deployed with migration mechanisms.

## Conclusion

The Wylloh platform's smart contracts provide a robust foundation for tokenized media licensing, with flexible rights management, transparent royalty distribution, and a fully-featured marketplace. The 2.5% marketplace fee on all transactions (including secondary sales) helps ensure the platform's sustainability while enabling creators to benefit from both initial sales and ongoing royalties.