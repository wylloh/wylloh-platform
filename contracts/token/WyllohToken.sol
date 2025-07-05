// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/**
 * @title WyllohToken
 * @dev Implementation of the Wylloh media license token using ERC1155
 * Supports royalties (ERC2981), token stacking, and bundle management
 */
contract WyllohToken is 
    Initializable,
    ERC1155Upgradeable,
    ERC1155BurnableUpgradeable,
    ERC1155SupplyUpgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    using StringsUpgradeable for uint256;

    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    // Token metadata URI storage
    mapping(uint256 => string) private _tokenURIs;
    
    // Token content metadata
    struct ContentMetadata {
        string contentId;     // Unique identifier for the content
        string contentHash;   // Hash of the content for verification
        string contentType;   // Type of content (movie, series, etc.)
        address creator;      // Address of the content creator
    }
    
    mapping(uint256 => ContentMetadata) private _contentMetadata;
    
    // Rights configuration by token quantity
    struct RightsThreshold {
        uint256 quantity;     // Token quantity needed
        uint8 rightsType;     // Type of rights (personal, commercial, etc.)
        bool enabled;         // Whether this threshold is active
    }
    
    // Mapping from token ID to array of rights thresholds
    mapping(uint256 => RightsThreshold[]) private _rightsThresholds;

    // Bundle management
    struct Bundle {
        uint256[] tokenIds;   // Array of token IDs in the bundle
        uint256[] amounts;    // Corresponding amounts for each token
        bool active;          // Whether the bundle is active
    }

    mapping(uint256 => Bundle) private _bundles;
    uint256 private _nextBundleId;

    // Stacking management
    struct Stack {
        uint256 tokenId;      // Token ID being stacked
        uint256 amount;       // Amount being stacked
        uint256 unlockTime;   // When the stack unlocks
    }

    mapping(address => mapping(uint256 => Stack)) private _stacks;
    
    // Events
    event TokenCreated(uint256 indexed tokenId, address indexed creator, string contentId);
    event RightsThresholdSet(uint256 indexed tokenId, uint256 quantity, uint8 rightsType);
    event BundleCreated(uint256 indexed bundleId, uint256[] tokenIds, uint256[] amounts);
    event BundleUnbundled(uint256 indexed bundleId, address indexed owner);
    event TokensStacked(address indexed account, uint256 indexed tokenId, uint256 amount, uint256 unlockTime);
    event TokensUnstacked(address indexed account, uint256 indexed tokenId, uint256 amount);
    
    // Default rights thresholds (initialized in constructor)
    RightsThreshold[] private defaultThresholds;

    // Rights types
    uint8 private constant PERSONAL_VIEWING = 1;
    uint8 private constant PRIVATE_SCREENING = 2;
    uint8 private constant SMALL_VENUE = 3;
    uint8 private constant REGIONAL_STREAMING = 4;
    uint8 private constant THEATRICAL = 5;
    uint8 private constant NATIONAL_DISTRIBUTION = 6;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract
     * @param uri_ Base URI for token metadata
     */
    function initialize(string memory uri_) public initializer {
        __ERC1155_init(uri_);
        __ERC1155Burnable_init();
        __ERC1155Supply_init();
        __ERC2981_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        
        // Initialize default rights thresholds
        defaultThresholds.push(RightsThreshold(1, 1, true));      // Personal viewing
        defaultThresholds.push(RightsThreshold(30, 2, true));     // Private screening
        defaultThresholds.push(RightsThreshold(250, 3, true));    // Small venue
        defaultThresholds.push(RightsThreshold(1000, 4, true));   // Regional streaming
        defaultThresholds.push(RightsThreshold(5000, 5, true));   // Theatrical
        defaultThresholds.push(RightsThreshold(25000, 6, true));  // National distribution
    }

    /**
     * @dev Creates a new token
     * @param to Recipient of the initial token batch
     * @param id Token ID to create
     * @param amount Initial amount to mint
     * @param contentId Unique identifier for the content
     * @param contentHash Hash of the content for verification
     * @param contentType Type of content (movie, series, etc.)
     * @param tokenURI URI for token metadata
     * @param royaltyRecipient Address to receive royalties
     * @param royaltyPercentage Royalty percentage (in basis points, e.g. 250 = 2.5%)
     */
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
    ) public onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, "");
        
        _contentMetadata[id] = ContentMetadata({
            contentId: contentId,
            contentHash: contentHash,
            contentType: contentType,
            creator: msg.sender
        });
        
        _setTokenURI(id, tokenURI);
        _setTokenRoyalty(id, royaltyRecipient, royaltyPercentage);
        
        emit TokenCreated(id, msg.sender, contentId);
    }

    /**
     * @dev Creates a new bundle of tokens
     * @param tokenIds Array of token IDs to include in the bundle
     * @param amounts Array of amounts for each token
     * @return bundleId The ID of the newly created bundle
     */
    function createBundle(
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) public returns (uint256 bundleId) {
        require(tokenIds.length == amounts.length, "Arrays must be same length");
        require(tokenIds.length > 0, "Bundle cannot be empty");

        bundleId = _nextBundleId++;
        _bundles[bundleId] = Bundle({
            tokenIds: tokenIds,
            amounts: amounts,
            active: true
        });

        emit BundleCreated(bundleId, tokenIds, amounts);
        return bundleId;
    }

    /**
     * @dev Unbundles a token bundle
     * @param bundleId The ID of the bundle to unbundle
     */
    function unbundle(uint256 bundleId) public {
        Bundle storage bundle = _bundles[bundleId];
        require(bundle.active, "Bundle not active");

        // Transfer all tokens in the bundle to the caller
        for (uint256 i = 0; i < bundle.tokenIds.length; i++) {
            _safeTransferFrom(
                address(this),
                msg.sender,
                bundle.tokenIds[i],
                bundle.amounts[i],
                ""
            );
        }

        bundle.active = false;
        emit BundleUnbundled(bundleId, msg.sender);
    }

    /**
     * @dev Stacks tokens for a specified duration
     * @param tokenId The token ID to stack
     * @param amount The amount to stack
     * @param duration The duration to stack for (in seconds)
     */
    function stackTokens(
        uint256 tokenId,
        uint256 amount,
        uint256 duration
    ) public {
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");

        // Transfer tokens to this contract
        _safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        // Create or update stack
        _stacks[msg.sender][tokenId] = Stack({
            tokenId: tokenId,
            amount: amount,
            unlockTime: block.timestamp + duration
        });

        emit TokensStacked(msg.sender, tokenId, amount, block.timestamp + duration);
    }

    /**
     * @dev Unstacks tokens after the lock period
     * @param tokenId The token ID to unstack
     */
    function unstackTokens(uint256 tokenId) public {
        Stack storage stack = _stacks[msg.sender][tokenId];
        require(stack.amount > 0, "No tokens stacked");
        require(block.timestamp >= stack.unlockTime, "Tokens still locked");

        uint256 amount = stack.amount;
        stack.amount = 0;

        // Transfer tokens back to the user
        _safeTransferFrom(address(this), msg.sender, tokenId, amount, "");

        emit TokensUnstacked(msg.sender, tokenId, amount);
    }

    /**
     * @dev Gets the stack information for a user and token
     * @param account The account to check
     * @param tokenId The token ID to check
     * @return Stack information
     */
    function getStack(address account, uint256 tokenId) public view returns (Stack memory) {
        return _stacks[account][tokenId];
    }

    /**
     * @dev Gets the bundle information
     * @param bundleId The bundle ID to check
     * @return Bundle information
     */
    function getBundle(uint256 bundleId) public view returns (Bundle memory) {
        return _bundles[bundleId];
    }
    
    /**
     * @dev Sets rights thresholds for a token
     * @param tokenId Token ID to set rights for
     * @param quantities Array of token quantities for each rights threshold
     * @param rightsTypes Array of rights types corresponding to each quantity
     */
    function setRightsThresholds(
        uint256 tokenId,
        uint256[] memory quantities,
        uint8[] memory rightsTypes
    ) public onlyRole(ADMIN_ROLE) {
        require(quantities.length == rightsTypes.length, "Arrays must be same length");
        delete _rightsThresholds[tokenId];
        
        for (uint256 i = 0; i < quantities.length; i++) {
            _rightsThresholds[tokenId].push(RightsThreshold({
                quantity: quantities[i],
                rightsType: rightsTypes[i],
                enabled: true
            }));
            
            emit RightsThresholdSet(tokenId, quantities[i], rightsTypes[i]);
        }
    }
    
    /**
     * @dev Checks if an address has rights of a specific type for a token
     * @param account Address to check
     * @param tokenId Token ID to check
     * @param rightsType Rights type to check for
     * @return bool Whether the account has the specified rights
     */
    function hasRights(address account, uint256 tokenId, uint8 rightsType) public view returns (bool) {
        uint256 balance = balanceOf(account, tokenId);
        
        for (uint256 i = 0; i < _rightsThresholds[tokenId].length; i++) {
            RightsThreshold memory threshold = _rightsThresholds[tokenId][i];
            if (threshold.enabled && 
                threshold.rightsType == rightsType && 
                balance >= threshold.quantity) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Gets the content metadata for a token
     * @param tokenId Token ID to get metadata for
     * @return ContentMetadata struct with content information
     */
    function getContentMetadata(uint256 tokenId) public view returns (ContentMetadata memory) {
        return _contentMetadata[tokenId];
    }
    
    /**
     * @dev Gets the URI for a token
     * @param tokenId Token ID to get URI for
     * @return string URI for token metadata
     */
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];
        
        // If there is no token-specific URI, return the base URI
        string memory base = super.uri(tokenId);
        if (bytes(tokenURI).length == 0) {
            return string(abi.encodePacked(base, tokenId.toString()));
        }
        
        return tokenURI;
    }
    
    /**
     * @dev Sets the URI for a token
     * @param tokenId Token ID to set URI for
     * @param tokenURI New URI for the token
     */
    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal {
        _tokenURIs[tokenId] = tokenURI;
    }
    
    /**
     * @dev Updates the URI for a token (admin only)
     * @param tokenId Token ID to update URI for
     * @param newUri New URI for the token
     */
    function setTokenURI(uint256 tokenId, string memory newUri) public onlyRole(ADMIN_ROLE) {
        _setTokenURI(tokenId, newUri);
    }
    
    /**
     * @dev Returns the rights thresholds for a token
     * @param tokenId Token ID to check
     * @return Array of RightsThreshold structs
     */
    function getRightsThresholds(uint256 tokenId) public view returns (RightsThreshold[] memory) {
        return _rightsThresholds[tokenId];
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
    ) internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    
    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view override(
        ERC1155Upgradeable,
        ERC2981Upgradeable,
        AccessControlUpgradeable
    ) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Function that should revert when msg.sender is not authorized to upgrade the contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}