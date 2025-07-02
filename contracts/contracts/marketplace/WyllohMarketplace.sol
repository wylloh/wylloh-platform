// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/IRoyaltyDistributor.sol";

/**
 * @title WyllohMarketplace
 * @dev Marketplace for trading film tokens with USDC and MATIC support
 * Supports both native MATIC payments and USDC token transfers for maximum flexibility
 */
contract WyllohMarketplace is AccessControl, ReentrancyGuard {
    using SafeMath for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // USDC token contract on Polygon mainnet
    IERC20 public immutable USDC;
    address public constant USDC_POLYGON = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    
    // Platform settings
    uint256 public platformFeePercentage = 250; // 2.5%
    address public feeRecipient;
    IRoyaltyDistributor public royaltyDistributor;

    // Payment method enumeration
    enum PaymentMethod { MATIC, USDC }

    struct Listing {
        address seller;
        address tokenContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 pricePerToken;
        PaymentMethod paymentMethod; // New: specify payment currency
        uint256 createdAt;
        bool active;
    }

    struct Offer {
        address buyer;
        address tokenContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 pricePerToken;
        PaymentMethod paymentMethod; // New: specify payment currency
        uint256 expiresAt;
        bool active;
    }
} 