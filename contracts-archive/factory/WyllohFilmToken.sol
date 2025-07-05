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
import "../../interfaces/IWyllohVerified.sol";

/**
 * @title WyllohFilmToken
 * @dev Individual film contract with millions of identical tokens for stacking
 * Revolutionary model: Same token, different quantities unlock different rights
 */
contract WyllohFilmToken is 
    Initializable,
    ERC1155Upgradeable,
    ERC1155BurnableUpgradeable,
    ERC1155SupplyUpgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    IWyllohVerified
{
    using StringsUpgradeable for uint256;

    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    // Film-specific constants
    uint256 public constant TOKEN_ID = 1; // Single token type per film
    
    // Film metadata
    string public filmId;
    string public title;
    address public creator;
    uint256 public maxSupply;
    string public baseTokenURI;
    
    // Rights thresholds - token quantities that unlock different rights
    struct RightsThreshold {
        uint256 quantity;     // Number of tokens needed
        string rightsLevel;   // Description of rights unlocked
        bool enabled;         // Whether this threshold is active
    }
    
    RightsThreshold[] public rightsThresholds;
    
    // Token stacking for rights accumulation
    struct UserStack {
        uint256 stakedAmount;
        uint256 unlockTime;
        string currentRightsLevel;
    }
    
    mapping(address => UserStack) public userStacks;
    
    // Events
    event FilmTokenInitialized(string filmId, string title, address creator, uint256 maxSupply);
    event TokensStacked(address indexed user, uint256 amount, uint256 unlockTime, string rightsLevel);
    event TokensUnstacked(address indexed user, uint256 amount);
    event RightsThresholdUpdated(uint256 quantity, string rightsLevel, bool enabled);
    event TokensMinted(address indexed to, uint256 amount, uint256 totalSupply);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the film token contract
     * @param _filmId Unique identifier for the film
     * @param _title Film title
     * @param _creator Address of the film creator
     * @param _maxSupply Maximum number of tokens (millions for stacking)
     * @param _rightsThresholds Array of token quantities that unlock different rights
     * @param _baseURI Base URI for token metadata
     */
    function initialize(
        string memory _filmId,
        string memory _title,
        address _creator,
        uint256 _maxSupply,
        uint256[] memory _rightsThresholds,
        string memory _baseURI
    ) external initializer {
        __ERC1155_init(_baseURI);
        __ERC1155Burnable_init();
        __ERC1155Supply_init();
        __ERC2981_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        filmId = _filmId;
        title = _title;
        creator = _creator;
        maxSupply = _maxSupply;
        baseTokenURI = _baseURI;
        
        // Set up default rights thresholds
        _setupDefaultRightsThresholds(_rightsThresholds);
        
        emit FilmTokenInitialized(_filmId, _title, _creator, _maxSupply);
    }
    
    /**
     * @dev Set up default rights thresholds for the film
     * @param quantities Array of token quantities for different rights levels
     */
    function _setupDefaultRightsThresholds(uint256[] memory quantities) internal {
        string[] memory rightsLevels = new string[](4);
        rightsLevels[0] = "Personal Viewing";
        rightsLevels[1] = "Commercial Exhibition + IMF/DCP Access";
        rightsLevels[2] = "Regional Distribution Rights";
        rightsLevels[3] = "National Broadcast Rights";
        
        // Default thresholds: 1, 1000, 10000, 100000
        uint256[] memory defaultQuantities = new uint256[](4);
        defaultQuantities[0] = 1;
        defaultQuantities[1] = 1000;
        defaultQuantities[2] = 10000;
        defaultQuantities[3] = 100000;
        
        uint256[] memory thresholds = quantities.length > 0 ? quantities : defaultQuantities;
        
        for (uint256 i = 0; i < thresholds.length && i < rightsLevels.length; i++) {
            rightsThresholds.push(RightsThreshold({
                quantity: thresholds[i],
                rightsLevel: rightsLevels[i],
                enabled: true
            }));
        }
    }

    /**
     * @dev Mint tokens for the film (admin only)
     * @param to Recipient address
     * @param amount Number of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply(TOKEN_ID) + amount <= maxSupply, "Exceeds max supply");
        
        _mint(to, TOKEN_ID, amount, "");
        emit TokensMinted(to, amount, totalSupply(TOKEN_ID));
    }

    /**
     * @dev Stack tokens to unlock rights (users accumulate tokens for higher rights)
     * @param amount Number of tokens to stack
     * @param duration Duration to stack tokens (in seconds)
     */
    function stackTokens(uint256 amount, uint256 duration) external {
        require(balanceOf(msg.sender, TOKEN_ID) >= amount, "Insufficient token balance");
        require(duration > 0, "Invalid duration");
        
        // Transfer tokens to contract for stacking
        _safeTransferFrom(msg.sender, address(this), TOKEN_ID, amount, "");
        
        UserStack storage userStack = userStacks[msg.sender];
        userStack.stakedAmount += amount;
        userStack.unlockTime = block.timestamp + duration;
        
        // Determine rights level based on stacked amount
        string memory rightsLevel = _getRightsLevel(userStack.stakedAmount);
        userStack.currentRightsLevel = rightsLevel;
        
        emit TokensStacked(msg.sender, amount, userStack.unlockTime, rightsLevel);
    }

    /**
     * @dev Unstack tokens (after unlock time)
     * @param amount Number of tokens to unstack
     */
    function unstackTokens(uint256 amount) external {
        UserStack storage userStack = userStacks[msg.sender];
        require(userStack.stakedAmount >= amount, "Insufficient staked tokens");
        require(block.timestamp >= userStack.unlockTime, "Tokens still locked");
        
        userStack.stakedAmount -= amount;
        
        // Update rights level
        string memory rightsLevel = _getRightsLevel(userStack.stakedAmount);
        userStack.currentRightsLevel = rightsLevel;
        
        // Return tokens to user
        _safeTransferFrom(address(this), msg.sender, TOKEN_ID, amount, "");
        
        emit TokensUnstacked(msg.sender, amount);
    }

    /**
     * @dev Get rights level based on token quantity
     * @param quantity Number of tokens
     * @return Rights level string
     */
    function _getRightsLevel(uint256 quantity) internal view returns (string memory) {
        if (quantity == 0) return "No Rights";
        
        string memory currentLevel = "Personal Viewing"; // Default
        
        for (uint256 i = 0; i < rightsThresholds.length; i++) {
            if (rightsThresholds[i].enabled && quantity >= rightsThresholds[i].quantity) {
                currentLevel = rightsThresholds[i].rightsLevel;
            }
        }
        
        return currentLevel;
    }

    /**
     * @dev Get user's current rights level
     * @param user User address
     * @return Rights level string
     */
    function getUserRightsLevel(address user) external view returns (string memory) {
        uint256 totalTokens = balanceOf(user, TOKEN_ID) + userStacks[user].stakedAmount;
        return _getRightsLevel(totalTokens);
    }

    /**
     * @dev Get all rights thresholds
     * @return Array of rights thresholds
     */
    function getRightsThresholds() external view returns (RightsThreshold[] memory) {
        return rightsThresholds;
    }

    /**
     * @dev Update rights threshold (admin only)
     * @param index Threshold index
     * @param quantity New quantity requirement
     * @param rightsLevel New rights level description
     * @param enabled Whether threshold is enabled
     */
    function updateRightsThreshold(
        uint256 index,
        uint256 quantity,
        string memory rightsLevel,
        bool enabled
    ) external onlyRole(ADMIN_ROLE) {
        require(index < rightsThresholds.length, "Invalid threshold index");
        
        rightsThresholds[index].quantity = quantity;
        rightsThresholds[index].rightsLevel = rightsLevel;
        rightsThresholds[index].enabled = enabled;
        
        emit RightsThresholdUpdated(quantity, rightsLevel, enabled);
    }

    /**
     * @dev Get token URI
     * @param tokenId Token ID (always 1 for film tokens)
     * @return Token metadata URI
     */
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        require(tokenId == TOKEN_ID, "Invalid token ID");
        return string(abi.encodePacked(baseTokenURI, filmId));
    }

    // IWyllohVerified implementation
    function isWyllohVerified() external pure override returns (bool) {
        return true;
    }
    
    function contentType() external pure override returns (string memory) {
        return "film";
    }
    
    function qualityLevel() external pure override returns (uint8) {
        return 95; // High quality film content
    }
    
    function getWyllohVerificationSignature(uint256) external view override returns (bytes memory) {
        return abi.encodePacked("wylloh:film:", filmId, ":verified");
    }
    
    function isTokenVerified(uint256 tokenId) external pure override returns (bool) {
        return tokenId == TOKEN_ID; // Only our single token type is verified
    }
    
    function tokenOrigin(uint256) external pure override returns (string memory) {
        return "wylloh-film";
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