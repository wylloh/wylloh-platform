// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../royalty/RoyaltyDistributor.sol";

/**
 * @title WyllohMarketplace
 * @dev Manages the marketplace for Wylloh license tokens
 */
contract WyllohMarketplace is AccessControl, ReentrancyGuard, ERC1155Holder {
    using SafeMath for uint256;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");

    // Marketplace fee configuration
    uint256 public platformFeePercentage = 250; // 2.5% in basis points (1/100 of a percent)
    address public feeRecipient;
    
    // Royalty distributor contract
    RoyaltyDistributor public royaltyDistributor;

    // Listing structure
    struct Listing {
        address seller;
        address tokenContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 pricePerToken;
        uint256 createdAt;
        bool active;
    }

    // Offer structure
    struct Offer {
        address buyer;
        address tokenContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 pricePerToken;
        uint256 expiresAt;
        bool active;
    }

    // Listing management
    mapping(uint256 => Listing) private _listings;
    uint256 private _nextListingId = 1;

    // Offer management
    mapping(uint256 => Offer) private _offers;
    uint256 private _nextOfferId = 1;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerToken
    );
    
    event ListingUpdated(
        uint256 indexed listingId,
        uint256 quantity,
        uint256 pricePerToken
    );
    
    event ListingCancelled(uint256 indexed listingId);
    
    event ListingSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 quantity,
        uint256 totalPrice
    );
    
    event OfferCreated(
        uint256 indexed offerId,
        address indexed buyer,
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerToken,
        uint256 expiresAt
    );
    
    event OfferAccepted(
        uint256 indexed offerId,
        address indexed seller,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPrice
    );
    
    event OfferRejected(uint256 indexed offerId);
    
    event OfferCancelled(uint256 indexed offerId);
    
    event PlatformFeeUpdated(uint256 feePercentage);
    
    event FeeRecipientUpdated(address feeRecipient);

    /**
     * @dev Constructor
     * @param _royaltyDistributor Address of the royalty distributor contract
     * @param _feeRecipient Address that receives platform fees
     */
    constructor(
        address _royaltyDistributor,
        address _feeRecipient
    ) {
        require(_royaltyDistributor != address(0), "WyllohMarketplace: Invalid royalty distributor");
        require(_feeRecipient != address(0), "WyllohMarketplace: Invalid fee recipient");
        
        royaltyDistributor = RoyaltyDistributor(_royaltyDistributor);
        feeRecipient = _feeRecipient;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(FEE_MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev Create a new listing
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param quantity Number of tokens to sell
     * @param pricePerToken Price per token in ETH
     * @return listingId The ID of the created listing
     */
    function createListing(
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerToken
    ) external nonReentrant returns (uint256) {
        require(tokenContract != address(0), "WyllohMarketplace: Invalid token contract");
        require(quantity > 0, "WyllohMarketplace: Quantity must be greater than zero");
        require(pricePerToken > 0, "WyllohMarketplace: Price must be greater than zero");
        
        IERC1155 token = IERC1155(tokenContract);
        require(token.balanceOf(msg.sender, tokenId) >= quantity, "WyllohMarketplace: Insufficient token balance");
        require(token.isApprovedForAll(msg.sender, address(this)), "WyllohMarketplace: Contract not approved for token");
        
        // Transfer tokens to the marketplace
        token.safeTransferFrom(msg.sender, address(this), tokenId, quantity, "");
        
        // Create the listing
        uint256 listingId = _nextListingId++;
        _listings[listingId] = Listing({
            seller: msg.sender,
            tokenContract: tokenContract,
            tokenId: tokenId,
            quantity: quantity,
            pricePerToken: pricePerToken,
            createdAt: block.timestamp,
            active: true
        });
        
        emit ListingCreated(
            listingId,
            msg.sender,
            tokenContract,
            tokenId,
            quantity,
            pricePerToken
        );
        
        return listingId;
    }

    /**
     * @dev Update an existing listing
     * @param listingId Listing ID
     * @param quantity New quantity (0 to keep current)
     * @param pricePerToken New price per token (0 to keep current)
     */
    function updateListing(
        uint256 listingId,
        uint256 quantity,
        uint256 pricePerToken
    ) external nonReentrant {
        require(_listings[listingId].active, "WyllohMarketplace: Listing not active");
        require(_listings[listingId].seller == msg.sender, "WyllohMarketplace: Not listing owner");
        
        // If quantity increases, transfer additional tokens
        if (quantity > 0 && quantity > _listings[listingId].quantity) {
            uint256 additionalQuantity = quantity.sub(_listings[listingId].quantity);
            
            IERC1155 token = IERC1155(_listings[listingId].tokenContract);
            require(token.balanceOf(msg.sender, _listings[listingId].tokenId) >= additionalQuantity, "WyllohMarketplace: Insufficient token balance");
            
            token.safeTransferFrom(
                msg.sender,
                address(this),
                _listings[listingId].tokenId,
                additionalQuantity,
                ""
            );
            
            _listings[listingId].quantity = quantity;
        }
        
        // If quantity decreases, return tokens to seller
        if (quantity > 0 && quantity < _listings[listingId].quantity) {
            uint256 tokensToReturn = _listings[listingId].quantity.sub(quantity);
            
            IERC1155 token = IERC1155(_listings[listingId].tokenContract);
            token.safeTransferFrom(
                address(this),
                msg.sender,
                _listings[listingId].tokenId,
                tokensToReturn,
                ""
            );
            
            _listings[listingId].quantity = quantity;
        }
        
        // Update price if specified
        if (pricePerToken > 0) {
            _listings[listingId].pricePerToken = pricePerToken;
        }
        
        emit ListingUpdated(listingId, _listings[listingId].quantity, _listings[listingId].pricePerToken);
    }

    /**
     * @dev Cancel a listing
     * @param listingId Listing ID
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        require(_listings[listingId].active, "WyllohMarketplace: Listing not active");
        require(_listings[listingId].seller == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "WyllohMarketplace: Not authorized");
        
        // Mark listing as inactive
        _listings[listingId].active = false;
        
        // Return tokens to seller
        IERC1155 token = IERC1155(_listings[listingId].tokenContract);
        token.safeTransferFrom(
            address(this),
            _listings[listingId].seller,
            _listings[listingId].tokenId,
            _listings[listingId].quantity,
            ""
        );
        
        emit ListingCancelled(listingId);
    }

    /**
     * @dev Buy tokens from a listing
     * @param listingId Listing ID
     * @param quantity Number of tokens to buy
     */
    function buyListing(uint256 listingId, uint256 quantity) external payable nonReentrant {
        require(_listings[listingId].active, "WyllohMarketplace: Listing not active");
        require(quantity > 0 && quantity <= _listings[listingId].quantity, "WyllohMarketplace: Invalid quantity");
        
        Listing storage listing = _listings[listingId];
        
        // Calculate total price
        uint256 totalPrice = listing.pricePerToken.mul(quantity);
        require(msg.value >= totalPrice, "WyllohMarketplace: Insufficient funds");
        
        // Calculate platform fee
        uint256 platformFee = totalPrice.mul(platformFeePercentage).div(10000);
        uint256 sellerAmount = totalPrice.sub(platformFee);
        
        // Transfer tokens to buyer
        IERC1155 token = IERC1155(listing.tokenContract);
        token.safeTransferFrom(address(this), msg.sender, listing.tokenId, quantity, "");
        
        // Update listing quantity
        listing.quantity = listing.quantity.sub(quantity);
        if (listing.quantity == 0) {
            listing.active = false;
        }
        
        // Distribute royalties if configured
        address royaltyDistributorAddress = address(royaltyDistributor);
        if (royaltyDistributorAddress != address(0)) {
            // Transfer the royalty amount to the distributor
            (bool success, ) = royaltyDistributorAddress.call{value: sellerAmount}(
                abi.encodeWithSignature(
                    "distributeRoyalties(address,uint256)",
                    listing.tokenContract,
                    listing.tokenId
                )
            );
            
            // If royalty distribution fails, send directly to seller
            if (!success) {
                (bool sent, ) = payable(listing.seller).call{value: sellerAmount}("");
                require(sent, "WyllohMarketplace: Failed to send funds to seller");
            }
        } else {
            // No royalty distributor, send directly to seller
            (bool sent, ) = payable(listing.seller).call{value: sellerAmount}("");
            require(sent, "WyllohMarketplace: Failed to send funds to seller");
        }
        
        // Send platform fee
        (bool feeSent, ) = payable(feeRecipient).call{value: platformFee}("");
        require(feeSent, "WyllohMarketplace: Failed to send platform fee");
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            uint256 refundAmount = msg.value.sub(totalPrice);
            (bool refunded, ) = payable(msg.sender).call{value: refundAmount}("");
            require(refunded, "WyllohMarketplace: Failed to refund excess payment");
        }
        
        emit ListingSold(listingId, msg.sender, listing.seller, quantity, totalPrice);
    }

    /**
     * @dev Create an offer for tokens
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param quantity Number of tokens
     * @param pricePerToken Offered price per token
     * @param expirationDays Number of days until offer expires
     * @return offerId The ID of the created offer
     */
    function createOffer(
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerToken,
        uint256 expirationDays
    ) external payable nonReentrant returns (uint256) {
        require(tokenContract != address(0), "WyllohMarketplace: Invalid token contract");
        require(quantity > 0, "WyllohMarketplace: Quantity must be greater than zero");
        require(pricePerToken > 0, "WyllohMarketplace: Price must be greater than zero");
        require(expirationDays > 0, "WyllohMarketplace: Invalid expiration period");
        
        uint256 totalPrice = pricePerToken.mul(quantity);
        require(msg.value >= totalPrice, "WyllohMarketplace: Insufficient funds");
        
        // Create offer
        uint256 offerId = _nextOfferId++;
        uint256 expiresAt = block.timestamp + (expirationDays * 1 days);
        
        _offers[offerId] = Offer({
            buyer: msg.sender,
            tokenContract: tokenContract,
            tokenId: tokenId,
            quantity: quantity,
            pricePerToken: pricePerToken,
            expiresAt: expiresAt,
            active: true
        });
        
        emit OfferCreated(
            offerId,
            msg.sender,
            tokenContract,
            tokenId,
            quantity,
            pricePerToken,
            expiresAt
        );
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            uint256 refundAmount = msg.value.sub(totalPrice);
            (bool refunded, ) = payable(msg.sender).call{value: refundAmount}("");
            require(refunded, "WyllohMarketplace: Failed to refund excess payment");
        }
        
        return offerId;
    }

    /**
     * @dev Accept an offer
     * @param offerId Offer ID
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        require(_offers[offerId].active, "WyllohMarketplace: Offer not active");
        require(block.timestamp < _offers[offerId].expiresAt, "WyllohMarketplace: Offer expired");
        
        Offer storage offer = _offers[offerId];
        
        // Verify seller has enough tokens and has approved the marketplace
        IERC1155 token = IERC1155(offer.tokenContract);
        require(token.balanceOf(msg.sender, offer.tokenId) >= offer.quantity, "WyllohMarketplace: Insufficient token balance");
        require(token.isApprovedForAll(msg.sender, address(this)), "WyllohMarketplace: Contract not approved for token");
        
        // Calculate total price and fees
        uint256 totalPrice = offer.pricePerToken.mul(offer.quantity);
        uint256 platformFee = totalPrice.mul(platformFeePercentage).div(10000);
        uint256 sellerAmount = totalPrice.sub(platformFee);
        
        // Transfer tokens to buyer
        token.safeTransferFrom(msg.sender, offer.buyer, offer.tokenId, offer.quantity, "");
        
        // Deactivate offer
        offer.active = false;
        
        // Distribute royalties if configured
        address royaltyDistributorAddress = address(royaltyDistributor);
        if (royaltyDistributorAddress != address(0)) {
            // Transfer the royalty amount to the distributor
            (bool success, ) = royaltyDistributorAddress.call{value: sellerAmount}(
                abi.encodeWithSignature(
                    "distributeRoyalties(address,uint256)",
                    offer.tokenContract,
                    offer.tokenId
                )
            );
            
            // If royalty distribution fails, send directly to seller
            if (!success) {
                (bool sent, ) = payable(msg.sender).call{value: sellerAmount}("");
                require(sent, "WyllohMarketplace: Failed to send funds to seller");
            }
        } else {
            // No royalty distributor, send directly to seller
            (bool sent, ) = payable(msg.sender).call{value: sellerAmount}("");
            require(sent, "WyllohMarketplace: Failed to send funds to seller");
        }
        
        // Send platform fee
        (bool feeSent, ) = payable(feeRecipient).call{value: platformFee}("");
        require(feeSent, "WyllohMarketplace: Failed to send platform fee");
        
        emit OfferAccepted(offerId, msg.sender, offer.buyer, offer.quantity, totalPrice);
    }

    /**
     * @dev Reject an offer
     * @param offerId Offer ID
     */
    function rejectOffer(uint256 offerId) external nonReentrant {
        require(_offers[offerId].active, "WyllohMarketplace: Offer not active");
        require(block.timestamp < _offers[offerId].expiresAt, "WyllohMarketplace: Offer expired");
        
        Offer storage offer = _offers[offerId];
        
        // Only token owners can reject offers
        IERC1155 token = IERC1155(offer.tokenContract);
        require(token.balanceOf(msg.sender, offer.tokenId) >= offer.quantity, "WyllohMarketplace: Not token owner");
        
        // Deactivate offer
        offer.active = false;
        
        // Refund buyer
        uint256 refundAmount = offer.pricePerToken.mul(offer.quantity);
        (bool refunded, ) = payable(offer.buyer).call{value: refundAmount}("");
        require(refunded, "WyllohMarketplace: Failed to refund buyer");
        
        emit OfferRejected(offerId);
    }

    /**
     * @dev Cancel an offer (buyer only)
     * @param offerId Offer ID
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        require(_offers[offerId].active, "WyllohMarketplace: Offer not active");
        require(_offers[offerId].buyer == msg.sender, "WyllohMarketplace: Not offer creator");
        
        // Deactivate offer
        _offers[offerId].active = false;
        
        // Refund buyer
        uint256 refundAmount = _offers[offerId].pricePerToken.mul(_offers[offerId].quantity);
        (bool refunded, ) = payable(msg.sender).call{value: refundAmount}("");
        require(refunded, "WyllohMarketplace: Failed to refund buyer");
        
        emit OfferCancelled(offerId);
    }

    /**
     * @dev Clean up expired offers and refund buyers
     * @param offerIds Array of offer IDs to clean up
     */
    function cleanupExpiredOffers(uint256[] calldata offerIds) external nonReentrant {
        for (uint256 i = 0; i < offerIds.length; i++) {
            uint256 offerId = offerIds[i];
            
            if (_offers[offerId].active && block.timestamp >= _offers[offerId].expiresAt) {
                // Deactivate offer
                _offers[offerId].active = false;
                
                // Refund buyer
                uint256 refundAmount = _offers[offerId].pricePerToken.mul(_offers[offerId].quantity);
                (bool refunded, ) = payable(_offers[offerId].buyer).call{value: refundAmount}("");
                
                // Don't revert if a single refund fails
                if (refunded) {
                    emit OfferCancelled(offerId);
                }
            }
        }
    }

    /**
     * @dev Set the platform fee percentage
     * @param newFeePercentage New fee percentage (in basis points)
     */
    function setPlatformFeePercentage(uint256 newFeePercentage) external onlyRole(FEE_MANAGER_ROLE) {
        require(newFeePercentage <= 3000, "WyllohMarketplace: Fee too high"); // Max 30%
        platformFeePercentage = newFeePercentage;
        emit PlatformFeeUpdated(newFeePercentage);
    }

    /**
     * @dev Set the fee recipient address
     * @param newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external onlyRole(FEE_MANAGER_ROLE) {
        require(newFeeRecipient != address(0), "WyllohMarketplace: Invalid fee recipient");
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(newFeeRecipient);
    }

    /**
     * @dev Set the royalty distributor contract
     * @param newRoyaltyDistributor New royalty distributor address
     */
    function setRoyaltyDistributor(address newRoyaltyDistributor) external onlyRole(ADMIN_ROLE) {
        require(newRoyaltyDistributor != address(0), "WyllohMarketplace: Invalid royalty distributor");
        royaltyDistributor = RoyaltyDistributor(newRoyaltyDistributor);
    }

    /**
     * @dev Get listing details
     * @param listingId Listing ID
     * @return seller Seller address
     * @return tokenContract Token contract address
     * @return tokenId Token ID
     * @return quantity Quantity available
     * @return pricePerToken Price per token
     * @return active Whether the listing is active
     */
    function getListing(uint256 listingId) external view returns (
        address seller,
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerToken,
        bool active
    ) {
        Listing storage listing = _listings[listingId];
        return (
            listing.seller,
            listing.tokenContract,
            listing.tokenId,
            listing.quantity,
            listing.pricePerToken,
            listing.active
        );
    }

    /**
     * @dev Get offer details
     * @param offerId Offer ID
     * @return buyer Buyer address
     * @return tokenContract Token contract address
     * @return tokenId Token ID
     * @return quantity Quantity offered
     * @return pricePerToken Price per token
     * @return expiresAt Expiration timestamp
     * @return active Whether the offer is active
     */
    function getOffer(uint256 offerId) external view returns (
        address buyer,
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerToken,
        uint256 expiresAt,
        bool active
    ) {
        Offer storage offer = _offers[offerId];
        return (
            offer.buyer,
            offer.tokenContract,
            offer.tokenId,
            offer.quantity,
            offer.pricePerToken,
            offer.expiresAt,
            offer.active
        );
    }
}