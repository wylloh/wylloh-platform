// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../interfaces/IWyllohVerified.sol";

/**
 * @title WyllohFilmRegistry
 * @dev SCALABLE master contract for ALL films on Wylloh platform
 * Each film = unique Token ID with individual pricing, supply, and rights
 * Token ID 1 = The Cocoanuts (1929), Token ID 2 = Next film, etc.
 * Supports thousands of films in a single contract for maximum efficiency
 */
contract WyllohFilmRegistry is 
    ERC1155,
    ERC1155Burnable,
    ERC1155Supply,
    ERC2981,
    AccessControl,
    ReentrancyGuard,
    IWyllohVerified
{
    using Strings for uint256;

    // Role definitions
    bytes32 public constant FILM_CREATOR_ROLE = keccak256("FILM_CREATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PRICE_MANAGER_ROLE = keccak256("PRICE_MANAGER_ROLE");
    
    // USDC token contract (Polygon mainnet)
    IERC20 public constant USDC = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
    
    // Film registry state
    uint256 public nextTokenId = 1; // Token ID 1 = The Cocoanuts
    mapping(uint256 => FilmInfo) public films;
    mapping(string => uint256) public filmIdToTokenId; // "the-cocoanuts-1929" -> 1
    
    // Film metadata structure
    struct FilmInfo {
        string filmId;        // "the-cocoanuts-1929"
        string title;         // "The Cocoanuts"
        address creator;      // Filmmaker's address
        uint256 maxSupply;    // 1,000,000 tokens
        uint256 pricePerToken; // $4.99 in USDC (with 6 decimals = 4990000)
        bool isActive;        // Can be purchased
        uint256 createdAt;    // Block timestamp
        RightsThreshold[] rightsThresholds; // Stackable unlock rights
        string metadataURI;   // Token metadata URI
    }
    
    // Rights thresholds - token quantities that unlock different rights
    struct RightsThreshold {
        uint256 quantity;     // Number of tokens needed
        string rightsLevel;   // Description of rights unlocked
        uint256 priceMultiplier; // Price multiplier for this tier (100 = 1x, 200 = 2x)
        bool enabled;         // Whether this threshold is active
    }
    
    // Token stacking for rights accumulation
    struct UserStack {
        uint256 stakedAmount;
        uint256 unlockTime;
        string currentRightsLevel;
    }
    
    mapping(address => mapping(uint256 => UserStack)) public userStacks; // user -> tokenId -> stack
    
    // Platform economics
    uint256 public platformFeePercentage = 250; // 2.5% (250 basis points)
    address public platformTreasury;
    
    // Events
    event FilmCreated(
        uint256 indexed tokenId,
        string filmId,
        string title,
        address indexed creator,
        uint256 maxSupply,
        uint256 pricePerToken
    );
    
    event FilmPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPrice,
        string rightsLevel
    );
    
    event TokensStacked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 unlockTime,
        string rightsLevel
    );
    
    event TokensUnstacked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount
    );
    
    event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);
    
    constructor(address _platformTreasury) ERC1155("https://api.wylloh.com/films/{id}") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(FILM_CREATOR_ROLE, msg.sender);
        _grantRole(PRICE_MANAGER_ROLE, msg.sender);
        
        platformTreasury = _platformTreasury;
    }

    /**
     * @dev Create a new film with unique token ID (Pro users only)
     * @param filmId Unique identifier for the film
     * @param title Film title
     * @param creator Address of the film creator
     * @param maxSupply Maximum number of tokens (e.g., 1,000,000)
     * @param pricePerToken Price per token in USDC (6 decimals, e.g., 4990000 = $4.99)
     * @param rightsThresholds Array of rights thresholds for stacking
     * @param metadataURI URI for film metadata
     * @return tokenId The assigned token ID for this film
     */
    function createFilm(
        string memory filmId,
        string memory title,
        address creator,
        uint256 maxSupply,
        uint256 pricePerToken,
        RightsThreshold[] memory rightsThresholds,
        string memory metadataURI
    ) external onlyRole(FILM_CREATOR_ROLE) nonReentrant returns (uint256 tokenId) {
        require(bytes(filmId).length > 0, "Invalid film ID");
        require(bytes(title).length > 0, "Invalid title");
        require(creator != address(0), "Invalid creator");
        require(maxSupply > 0, "Invalid max supply");
        require(pricePerToken > 0, "Invalid price");
        require(filmIdToTokenId[filmId] == 0, "Film ID already exists");
        
        tokenId = nextTokenId++;
        
        // Create film info
        FilmInfo storage film = films[tokenId];
        film.filmId = filmId;
        film.title = title;
        film.creator = creator;
        film.maxSupply = maxSupply;
        film.pricePerToken = pricePerToken;
        film.isActive = true;
        film.createdAt = block.timestamp;
        film.metadataURI = metadataURI;
        
        // Set up rights thresholds
        for (uint256 i = 0; i < rightsThresholds.length; i++) {
            film.rightsThresholds.push(rightsThresholds[i]);
        }
        
        // Register film ID mapping
        filmIdToTokenId[filmId] = tokenId;
        
        emit FilmCreated(tokenId, filmId, title, creator, maxSupply, pricePerToken);
        
        return tokenId;
    }

    /**
     * @dev Purchase film tokens with USDC
     * @param tokenId The film token ID to purchase
     * @param quantity Number of tokens to purchase
     */
    function purchaseFilmTokens(uint256 tokenId, uint256 quantity) external nonReentrant {
        require(quantity > 0, "Quantity must be greater than 0");
        require(films[tokenId].isActive, "Film not active");
        require(
            totalSupply(tokenId) + quantity <= films[tokenId].maxSupply,
            "Exceeds max supply"
        );
        
        FilmInfo storage film = films[tokenId];
        uint256 totalPrice = quantity * film.pricePerToken;
        
        // Calculate platform fee
        uint256 platformFee = (totalPrice * platformFeePercentage) / 10000;
        uint256 creatorPayment = totalPrice - platformFee;
        
        // Transfer USDC from buyer
        require(
            USDC.transferFrom(msg.sender, address(this), totalPrice),
            "USDC transfer failed"
        );
        
        // Distribute payments
        require(USDC.transfer(film.creator, creatorPayment), "Creator payment failed");
        require(USDC.transfer(platformTreasury, platformFee), "Platform fee failed");
        
        // Mint tokens to buyer
        _mint(msg.sender, tokenId, quantity, "");
        
        // Determine rights level based on quantity
        string memory rightsLevel = _getRightsLevel(tokenId, quantity);
        
        emit FilmPurchased(tokenId, msg.sender, quantity, totalPrice, rightsLevel);
    }

    /**
     * @dev Stack tokens to unlock higher rights (users accumulate tokens for higher rights)
     * @param tokenId The film token ID
     * @param amount Number of tokens to stack
     * @param duration Duration to stack tokens (in seconds)
     */
    function stackTokens(uint256 tokenId, uint256 amount, uint256 duration) external {
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Invalid duration");
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient token balance");
        
        // Transfer tokens to contract for stacking
        _safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        
        UserStack storage userStack = userStacks[msg.sender][tokenId];
        userStack.stakedAmount += amount;
        userStack.unlockTime = block.timestamp + duration;
        
        // Determine rights level based on stacked amount
        string memory rightsLevel = _getRightsLevel(tokenId, userStack.stakedAmount);
        userStack.currentRightsLevel = rightsLevel;
        
        emit TokensStacked(msg.sender, tokenId, amount, userStack.unlockTime, rightsLevel);
    }

    /**
     * @dev Unstack tokens (after unlock time)
     * @param tokenId The film token ID
     * @param amount Number of tokens to unstack
     */
    function unstackTokens(uint256 tokenId, uint256 amount) external {
        UserStack storage userStack = userStacks[msg.sender][tokenId];
        require(userStack.stakedAmount >= amount, "Insufficient staked tokens");
        require(block.timestamp >= userStack.unlockTime, "Tokens still locked");
        
        userStack.stakedAmount -= amount;
        
        // Update rights level
        string memory rightsLevel = _getRightsLevel(tokenId, userStack.stakedAmount);
        userStack.currentRightsLevel = rightsLevel;
        
        // Return tokens to user
        _safeTransferFrom(address(this), msg.sender, tokenId, amount, "");
        
        emit TokensUnstacked(msg.sender, tokenId, amount);
    }

    /**
     * @dev Get rights level based on token quantity for a specific film
     * @param tokenId The film token ID
     * @param quantity Number of tokens
     * @return Rights level string
     */
    function _getRightsLevel(uint256 tokenId, uint256 quantity) internal view returns (string memory) {
        if (quantity == 0) return "No Rights";
        
        FilmInfo storage film = films[tokenId];
        string memory currentLevel = "Basic Viewing"; // Default
        
        for (uint256 i = 0; i < film.rightsThresholds.length; i++) {
            if (film.rightsThresholds[i].enabled && quantity >= film.rightsThresholds[i].quantity) {
                currentLevel = film.rightsThresholds[i].rightsLevel;
            }
        }
        
        return currentLevel;
    }

    /**
     * @dev Get user's current rights level for a specific film
     * @param user User address
     * @param tokenId The film token ID
     * @return Rights level string
     */
    function getUserRightsLevel(address user, uint256 tokenId) external view returns (string memory) {
        uint256 totalTokens = balanceOf(user, tokenId) + userStacks[user][tokenId].stakedAmount;
        return _getRightsLevel(tokenId, totalTokens);
    }

    /**
     * @dev Get film information by token ID
     * @param tokenId The film token ID
     * @return Film information struct
     */
    function getFilmInfo(uint256 tokenId) external view returns (FilmInfo memory) {
        return films[tokenId];
    }

    /**
     * @dev Get token ID by film ID
     * @param filmId The film identifier (e.g., "the-cocoanuts-1929")
     * @return Token ID
     */
    function getTokenIdByFilmId(string memory filmId) external view returns (uint256) {
        return filmIdToTokenId[filmId];
    }

    /**
     * @dev Update film price (price managers only)
     * @param tokenId The film token ID
     * @param newPrice New price per token in USDC
     */
    function updateFilmPrice(uint256 tokenId, uint256 newPrice) external onlyRole(PRICE_MANAGER_ROLE) {
        require(films[tokenId].creator != address(0), "Film does not exist");
        require(newPrice > 0, "Invalid price");
        
        films[tokenId].pricePerToken = newPrice;
        emit PriceUpdated(tokenId, newPrice);
    }

    /**
     * @dev Get token URI for metadata
     * @param tokenId Token ID
     * @return Token metadata URI
     */
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        require(films[tokenId].creator != address(0), "Film does not exist");
        return films[tokenId].metadataURI;
    }

    // IWyllohVerified implementation
    function isWyllohVerified() external pure override returns (bool) {
        return true;
    }
    
    function contentType() external pure override returns (string memory) {
        return "film-registry";
    }
    
    function qualityLevel() external pure override returns (uint8) {
        return 100; // Registry itself is highest quality
    }
    
    function getWyllohVerificationSignature(uint256 tokenId) external view override returns (bytes memory) {
        return abi.encodePacked("wylloh:film:", films[tokenId].filmId, ":verified");
    }
    
    function isTokenVerified(uint256 tokenId) external view override returns (bool) {
        return films[tokenId].creator != address(0); // Film exists = verified
    }
    
    function tokenOrigin(uint256) external pure override returns (string memory) {
        return "wylloh-registry";
    }

    /**
     * @dev Hook that is called before any token transfer
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view override(
        ERC1155,
        ERC2981,
        AccessControl
    ) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * Purchase tokens directly from the registry (simplified purchase flow)
     * @param tokenId Film token ID to purchase
     * @param quantity Number of tokens to purchase
     */
    function purchaseTokens(uint256 tokenId, uint256 quantity) external payable nonReentrant {
        require(tokenId > 0 && tokenId < nextTokenId, "Invalid token ID");
        require(quantity > 0, "Quantity must be greater than 0");
        
        FilmInfo storage film = films[tokenId];
        require(film.creator != address(0), "Film does not exist");
        
        // Calculate total price in wei (for demo, using MATIC instead of USDC)
        uint256 totalPrice = film.pricePerToken * quantity;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Check if enough tokens are available
        uint256 currentSupply = totalSupply(tokenId);
        require(currentSupply + quantity <= film.maxSupply, "Insufficient tokens available");
        
        // Mint tokens to buyer
        _mint(msg.sender, tokenId, quantity, "");
        
        // Handle royalty distribution
        uint256 platformFee = (totalPrice * 500) / 10000; // 5% platform fee
        uint256 creatorAmount = totalPrice - platformFee;
        
        // Transfer to creator
        payable(film.creator).transfer(creatorAmount);
        
        // Transfer platform fee to treasury (if set)
        if (platformFee > 0) {
            // For now, keep platform fee in contract
            // In production, transfer to treasury contract
        }
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit TokensPurchased(msg.sender, tokenId, quantity, totalPrice);
    }
    
    /**
     * Get available tokens for purchase
     * @param tokenId Film token ID
     * @return Available token count
     */
    function getAvailableTokens(uint256 tokenId) external view returns (uint256) {
        require(tokenId > 0 && tokenId < nextTokenId, "Invalid token ID");
        FilmInfo storage film = films[tokenId];
        uint256 currentSupply = totalSupply(tokenId);
        return film.maxSupply - currentSupply;
    }
    
    /**
     * Get token price
     * @param tokenId Film token ID
     * @return Price per token in wei
     */
    function getTokenPrice(uint256 tokenId) external view returns (uint256) {
        require(tokenId > 0 && tokenId < nextTokenId, "Invalid token ID");
        return films[tokenId].pricePerToken;
    }
    
    event TokensPurchased(address indexed buyer, uint256 indexed tokenId, uint256 quantity, uint256 totalPrice);
} 