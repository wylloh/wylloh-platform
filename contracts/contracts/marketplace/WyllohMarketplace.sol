// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../../interfaces/IRoyaltyDistributor.sol";
import "../token/WyllohFilmRegistry.sol";

/**
 * @title WyllohMarketplace
 * @dev Marketplace for trading film tokens with USDC and MATIC support
 * Optimized for WyllohFilmRegistry integration with backwards compatibility
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
    
    // MAIN WYLLOH REGISTRY (Optimized Integration)
    WyllohFilmRegistry public immutable wyllohRegistry;
    
    // Payment method enumeration
    enum PaymentMethod { MATIC, USDC }

    struct Listing {
        address seller;
        address tokenContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 pricePerToken;
        PaymentMethod paymentMethod;
        uint256 createdAt;
        bool active;
    }

    struct Offer {
        address buyer;
        address tokenContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 pricePerToken;
        PaymentMethod paymentMethod;
        uint256 expiresAt;
        bool active;
    }

    // Marketplace state
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer) public offers;
    uint256 public nextListingId = 1;
    uint256 public nextOfferId = 1;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerToken,
        PaymentMethod paymentMethod
    );
    
    event ListingPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 quantity,
        uint256 totalPrice,
        PaymentMethod paymentMethod
    );
    
    event OfferCreated(
        uint256 indexed offerId,
        address indexed buyer,
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerToken,
        PaymentMethod paymentMethod
    );
    
    event OfferAccepted(
        uint256 indexed offerId,
        address indexed seller,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPrice,
        PaymentMethod paymentMethod
    );

    constructor(
        address _wyllohRegistry,
        address _feeRecipient,
        address _royaltyDistributor
    ) {
        require(_wyllohRegistry != address(0), "Invalid registry address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        wyllohRegistry = WyllohFilmRegistry(_wyllohRegistry);
        USDC = IERC20(USDC_POLYGON);
        feeRecipient = _feeRecipient;
        royaltyDistributor = IRoyaltyDistributor(_royaltyDistributor);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Create listing specifically for WyllohFilmRegistry tokens (optimized path)
     * @param tokenId Film token ID from WyllohFilmRegistry
     * @param quantity Number of tokens to sell
     * @param pricePerToken Price per token in USDC
     * @return listingId The created listing ID
     */
    function createWyllohFilmListing(
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerToken
    ) external nonReentrant returns (uint256) {
        require(quantity > 0, "Invalid quantity");
        require(pricePerToken > 0, "Invalid price");
        require(wyllohRegistry.balanceOf(msg.sender, tokenId) >= quantity, "Insufficient balance");
        require(wyllohRegistry.isApprovedForAll(msg.sender, address(this)), "Not approved");
        
        // Transfer tokens to marketplace
        wyllohRegistry.safeTransferFrom(msg.sender, address(this), tokenId, quantity, "");
        
        // Create listing
        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenContract: address(wyllohRegistry),
            tokenId: tokenId,
            quantity: quantity,
            pricePerToken: pricePerToken,
            paymentMethod: PaymentMethod.USDC,
            createdAt: block.timestamp,
            active: true
        });
        
        emit ListingCreated(
            listingId,
            msg.sender,
            address(wyllohRegistry),
            tokenId,
            quantity,
            pricePerToken,
            PaymentMethod.USDC
        );
        
        return listingId;
    }

    /**
     * @dev Purchase WyllohFilmRegistry tokens from a listing (optimized path)
     * @param listingId The listing to purchase from
     * @param quantity Number of tokens to purchase
     */
    function purchaseWyllohFilmListing(
        uint256 listingId,
        uint256 quantity
    ) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.tokenContract == address(wyllohRegistry), "Not a Wylloh film listing");
        require(quantity <= listing.quantity, "Insufficient quantity");
        
        uint256 totalPrice = listing.pricePerToken.mul(quantity);
        uint256 platformFee = totalPrice.mul(platformFeePercentage).div(10000);
        uint256 sellerAmount = totalPrice.sub(platformFee);
        
        // Transfer USDC payment
        require(USDC.transferFrom(msg.sender, listing.seller, sellerAmount), "Payment failed");
        require(USDC.transferFrom(msg.sender, feeRecipient, platformFee), "Fee transfer failed");
        
        // Transfer tokens to buyer
        wyllohRegistry.safeTransferFrom(address(this), msg.sender, listing.tokenId, quantity, "");
        
        // Update listing
        listing.quantity = listing.quantity.sub(quantity);
        if (listing.quantity == 0) {
            listing.active = false;
        }
        
        emit ListingPurchased(
            listingId,
            msg.sender,
            listing.seller,
            quantity,
            totalPrice,
            PaymentMethod.USDC
        );
    }

    /**
     * @dev Get film information for a listing (convenience function)
     * @param listingId The listing ID
     * @return filmId The film identifier
     * @return title The film title
     * @return creator The film creator
     * @return maxSupply Maximum token supply
     * @return isActive Whether the film is active
     */
    function getFilmInfo(uint256 listingId) external view returns (
        string memory filmId,
        string memory title,
        address creator,
        uint256 maxSupply,
        bool isActive
    ) {
        Listing storage listing = listings[listingId];
        if (listing.tokenContract == address(wyllohRegistry)) {
            return wyllohRegistry.films(listing.tokenId);
        }
        return ("", "", address(0), 0, false);
    }

    /**
     * @dev Admin function to set platform fee
     * @param newFeePercentage New fee percentage (basis points)
     */
    function setPlatformFee(uint256 newFeePercentage) external onlyRole(ADMIN_ROLE) {
        require(newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = newFeePercentage;
    }

    /**
     * @dev Admin function to set fee recipient
     * @param newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external onlyRole(ADMIN_ROLE) {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @dev Admin function to set royalty distributor
     * @param newRoyaltyDistributor New royalty distributor address
     */
    function setRoyaltyDistributor(address newRoyaltyDistributor) external onlyRole(ADMIN_ROLE) {
        require(newRoyaltyDistributor != address(0), "Invalid address");
        royaltyDistributor = IRoyaltyDistributor(newRoyaltyDistributor);
    }

    /**
     * @dev Emergency function to cancel a listing (admin only)
     * @param listingId The listing to cancel
     */
    function emergencyCancelListing(uint256 listingId) external onlyRole(ADMIN_ROLE) {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        
        // Return tokens to seller
        IERC1155(listing.tokenContract).safeTransferFrom(
            address(this),
            listing.seller,
            listing.tokenId,
            listing.quantity,
            ""
        );
        
        listing.active = false;
    }
} 